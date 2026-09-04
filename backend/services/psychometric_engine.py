"""
India Lens — Psychometric Engine
=================================
8-dimensional adaptive CAT engine using 3PL IRT + Bayesian archetype posterior.

Trait vector θ ∈ [-3.0, +3.0]^8:
  risk, value, autonomy, ai_adapt, openness, diligence, social, security

Adaptive routing:
  Phase 1 — Gateway (8 items, 1 per trait, cold-start)
  Phase 2 — Cluster routing: highest-SE trait drives next item cluster
  Phase 3 — Convergence: all SE < 0.38 OR 40 items answered
  
Archetype posterior:
  P(archetype | θ) ∝ exp(θ · w_archetype)  [softmax over 12 archetypes]
  Updated after every response.

Validity checking:
  - Acquiescence score: % of "always" / strongest-positive answers
  - Validity flag count: # of VL items answered with socially desirable response
  - If acquiescence > 85% AND validity_flags ≥ 3 → flag as potentially invalid
"""
import math
import logging
import uuid
from typing import Any, Dict, List, Optional, Tuple

from backend.ml.psychometric_bank import (
    ITEM_BANK, ITEM_INDEX, ARCHETYPE_PROFILES,
    CLUSTER_ROUTING, GATEWAY_SEQUENCE,
)

logger = logging.getLogger(__name__)

TRAITS = ["risk", "value", "autonomy", "ai_adapt", "openness", "diligence", "social", "security"]
MIN_ITEMS = 16
MAX_ITEMS = 40
SE_THRESHOLD = 0.38


class PsychometricSession:
    """In-memory session state for one test-taker."""

    def __init__(self, session_id: str, stream: str = "", budget: int = 15):
        self.session_id = session_id
        self.stream = stream
        self.budget = budget
        self.phase = "gateway"  # gateway | cluster | converged
        self.gateway_index = 0
        self.answered_ids: List[str] = []
        self.responses: List[Dict[str, Any]] = []
        self.traits: Dict[str, float] = {t: 0.0 for t in TRAITS}
        self.trait_se: Dict[str, float] = {t: 1.2 for t in TRAITS}
        self.archetype_posterior: Dict[str, float] = {k: 1.0 / 12 for k in ARCHETYPE_PROFILES}
        self.validity_flags: int = 0
        self.acquiescence_count: int = 0
        self.cluster_queue: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "phase": self.phase,
            "items_completed": len(self.answered_ids),
            "traits": self.traits,
            "trait_se": self.trait_se,
            "archetype_posterior": self.archetype_posterior,
            "validity_flags": self.validity_flags,
            "potentially_invalid": self.validity_flags >= 3 and self.acquiescence_count / max(1, len(self.answered_ids)) > 0.85,
        }


class PsychometricEngine:
    """
    Full 8-dimensional CAT psychometric engine.
    """

    def __init__(self):
        self.sessions: Dict[str, PsychometricSession] = {}
        self.item_bank = ITEM_BANK
        self.item_index = ITEM_INDEX

    def create_session(self, stream: str = "", budget: int = 15) -> PsychometricSession:
        sid = str(uuid.uuid4())
        session = PsychometricSession(sid, stream, budget)
        self.sessions[sid] = session
        return session

    def get_session(self, session_id: str) -> Optional[PsychometricSession]:
        return self.sessions.get(session_id)

    # ── IRT ────────────────────────────────────────────────────────────────

    @staticmethod
    def _p3pl(theta: float, a: float, b: float, c: float = 0.05) -> float:
        logit = max(-12.0, min(12.0, -a * (theta - b)))
        return c + (1.0 - c) / (1.0 + math.exp(logit))

    def _fisher(self, item: Dict[str, Any], theta: float) -> float:
        a, b, c = item.get("a", 1.5), item.get("b", 0.0), item.get("c", 0.05)
        p = self._p3pl(theta, a, b, c)
        if p <= c + 1e-6 or p >= 1 - 1e-6:
            return 0.001
        num = a ** 2 * (p - c) ** 2 * (1 - p)
        den = (1 - c) ** 2 * p
        return max(0.001, num / max(1e-9, den))

    def _compute_se(self, trait: str, session: PsychometricSession) -> float:
        answered_items = [self.item_index[i] for i in session.answered_ids if i in self.item_index]
        total_info = sum(
            self._fisher(it, session.traits.get(trait, 0.0))
            for it in answered_items
            if it.get("trait") == trait
        )
        return 1.0 / math.sqrt(total_info) if total_info >= 0.01 else 1.2

    # ── Trait Estimation ───────────────────────────────────────────────────

    def _update_traits(self, session: PsychometricSession, item: Dict[str, Any], option: Dict[str, Any]) -> None:
        """
        EAP (Expected A Posteriori) update for each trait.
        Primary trait gets the option score; cross-loadings get weighted contribution.
        """
        scores: Dict[str, float] = option.get("scores", {})
        primary_trait = item.get("trait", "risk")

        for trait in TRAITS:
            # Count how many items have targeted this trait (for running average)
            n = sum(1 for r in session.responses if r.get("primary_trait") == trait)

            if trait == primary_trait:
                # Primary trait: running EAP
                n_primary = n + 1
                old = session.traits[trait]
                score_val = float(scores.get(trait, 0.0))
                session.traits[trait] = max(-3.0, min(3.0,
                    (old * (n_primary - 1) + score_val) / n_primary
                ))
            elif trait in scores:
                # Cross-loading: attenuated contribution (0.30 weight)
                session.traits[trait] = max(-3.0, min(3.0,
                    session.traits[trait] + float(scores[trait]) * 0.30
                ))

        # Recompute SE for all traits
        for trait in TRAITS:
            session.trait_se[trait] = self._compute_se(trait, session)

    # ── Archetype Posterior ────────────────────────────────────────────────

    def _update_archetype_posterior(self, session: PsychometricSession) -> None:
        """
        Softmax over dot product of trait vector with each archetype's weight vector.
        Updated after every response.
        """
        theta = session.traits
        log_probs: Dict[str, float] = {}
        for key, profile in ARCHETYPE_PROFILES.items():
            weights = profile["weights"]
            dot = sum(theta.get(t, 0.0) * weights.get(t, 0.0) for t in TRAITS)
            log_probs[key] = dot

        # Numerically stable softmax
        max_lp = max(log_probs.values())
        exp_probs = {k: math.exp(v - max_lp) for k, v in log_probs.items()}
        total = sum(exp_probs.values())
        session.archetype_posterior = {k: round(v / total, 4) for k, v in exp_probs.items()}

    # ── Validity Checking ─────────────────────────────────────────────────

    def _check_validity(self, session: PsychometricSession, item: Dict[str, Any], option_index: int) -> None:
        if item.get("validity", False) and option_index == 0:
            # First option in validity items is always the socially desirable "perfect" answer
            session.validity_flags += 1
        if option_index == 3:
            # Last option tends to be the most extreme — track acquiescence
            session.acquiescence_count += 1

    # ── Item Selection ─────────────────────────────────────────────────────

    def _select_next_cluster_item(self, session: PsychometricSession) -> Optional[Dict[str, Any]]:
        """
        Phase 2 routing:
        1. If cluster_queue non-empty, serve next item from it
        2. Otherwise, pick highest-SE trait, route to its cluster, fill queue
        3. Fall back to global max-Fisher if cluster exhausted
        """
        # Drain cluster queue first
        while session.cluster_queue:
            item_id = session.cluster_queue.pop(0)
            if item_id not in session.answered_ids and item_id in self.item_index:
                return self.item_index[item_id]

        # Pick highest-SE trait that still needs measurement
        max_se = max(session.trait_se.values())
        if max_se < SE_THRESHOLD and len(session.answered_ids) >= MIN_ITEMS:
            return None  # Converged

        target_trait = max(session.trait_se, key=lambda t: session.trait_se[t])
        theta_t = session.traits.get(target_trait, 0.0)
        direction = "high" if theta_t >= 0.0 else "low"

        cluster_ids = CLUSTER_ROUTING.get((target_trait, direction), [])
        session.cluster_queue = [
            iid for iid in cluster_ids
            if iid not in session.answered_ids and iid in self.item_index
        ]

        while session.cluster_queue:
            item_id = session.cluster_queue.pop(0)
            if item_id not in session.answered_ids and item_id in self.item_index:
                return self.item_index[item_id]

        # Fallback: global max-Fisher across all unanswered items
        unanswered = [
            it for it in self.item_bank
            if it["id"] not in session.answered_ids and not it.get("validity", False)
        ]
        if not unanswered:
            return None

        return max(
            unanswered,
            key=lambda it: self._fisher(it, session.traits.get(it.get("trait", "risk"), 0.0))
        )

    def get_next_item(self, session: PsychometricSession) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        Returns (item, is_converged).
        Adds validity items periodically (every 8 items, insert 1 validity check).
        """
        if len(session.answered_ids) >= MAX_ITEMS:
            session.phase = "converged"
            return None, True

        # Periodic validity item injection
        if len(session.answered_ids) > 0 and len(session.answered_ids) % 8 == 0:
            unanswered_validity = [
                it for it in self.item_bank
                if it.get("validity", False) and it["id"] not in session.answered_ids
            ]
            if unanswered_validity:
                return unanswered_validity[0], False

        # Phase 1: Gateway items
        if session.phase == "gateway":
            if session.gateway_index < len(GATEWAY_SEQUENCE):
                gid = GATEWAY_SEQUENCE[session.gateway_index]
                item = self.item_index.get(gid)
                if item and gid not in session.answered_ids:
                    return item, False
            session.phase = "cluster"

        # Phase 2: Cluster routing
        item = self._select_next_cluster_item(session)
        if item is None:
            session.phase = "converged"
            return None, True

        return item, False

    def record_response(
        self,
        session: PsychometricSession,
        item_id: str,
        option_index: int,
    ) -> Dict[str, Any]:
        """
        Record a response, update traits + archetype posterior, advance gateway index.
        Returns updated session state.
        """
        item = self.item_index.get(item_id)
        if not item:
            raise ValueError(f"Unknown item_id: {item_id}")

        options = item.get("options", [])
        if option_index < 0 or option_index >= len(options):
            raise ValueError(f"option_index {option_index} out of range for item {item_id}")

        option = options[option_index]
        session.answered_ids.append(item_id)

        # Record
        session.responses.append({
            "item_id": item_id,
            "option_index": option_index,
            "primary_trait": item.get("trait"),
            "option_text": option.get("text", ""),
            "scores": option.get("scores", {}),
        })

        # Advance gateway counter
        if item_id in GATEWAY_SEQUENCE:
            session.gateway_index = GATEWAY_SEQUENCE.index(item_id) + 1

        # Update traits
        self._update_traits(session, item, option)

        # Validity check
        self._check_validity(session, item, option_index)

        # Update archetype posterior
        self._update_archetype_posterior(session)

        return session.to_dict()

    def compute_final_report(self, session: PsychometricSession) -> Dict[str, Any]:
        """
        Full archetype report on test completion.
        """
        primary_archetype_key = max(session.archetype_posterior, key=lambda k: session.archetype_posterior[k])
        sorted_archetypes = sorted(
            session.archetype_posterior.items(), key=lambda x: x[1], reverse=True
        )
        top3 = [(k, round(v * 100, 1)) for k, v in sorted_archetypes[:3]]

        primary = ARCHETYPE_PROFILES[primary_archetype_key]
        secondary_key = top3[1][0] if len(top3) > 1 else primary_archetype_key
        secondary = ARCHETYPE_PROFILES[secondary_key]

        validity_ok = not (session.validity_flags >= 3 and
                           session.acquiescence_count / max(1, len(session.answered_ids)) > 0.85)

        # Trait confidence levels
        trait_confidence = {
            t: "high" if session.trait_se[t] < 0.4 else
               "medium" if session.trait_se[t] < 0.7 else "low"
            for t in TRAITS
        }

        # Normalized trait percentiles (for radar display)
        trait_pct = {t: round((session.traits[t] + 3.0) / 6.0 * 100) for t in TRAITS}

        return {
            "session_id": session.session_id,
            "items_completed": len(session.answered_ids),
            "validity_ok": validity_ok,
            "validity_flags": session.validity_flags,
            "primary_archetype": {
                "key": primary_archetype_key,
                "label": primary["label"],
                "emoji": primary["emoji"],
                "description": primary["description"],
                "career_paths": primary["career_paths"],
                "caution": primary["caution"],
                "probability_pct": round(session.archetype_posterior[primary_archetype_key] * 100, 1),
            },
            "secondary_archetype": {
                "key": secondary_key,
                "label": secondary["label"],
                "emoji": secondary["emoji"],
                "probability_pct": round(session.archetype_posterior[secondary_key] * 100, 1),
            },
            "top3_archetypes": top3,
            "trait_vector": session.traits,
            "trait_percentiles": trait_pct,
            "trait_se": session.trait_se,
            "trait_confidence": trait_confidence,
            "archetype_posterior": session.archetype_posterior,
        }


# Singleton
psychometric_engine = PsychometricEngine()
