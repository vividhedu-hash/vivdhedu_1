"""
/api/v2/career — Markov career-state trajectory (PRD Section 7.3, Eq 7.2).

`ml/markov_career.py` has been complete, tested code since the model layer was
built, and it was never reachable: it had no router, so `to_api_dict()` — which
was already written in API shape — was called by nothing. `training_pipeline.py`
imports the class but never instantiates it. This router is the first consumer.

Three deliberate constraints on what this endpoint claims:

1. **The transition matrix is returned, not summarised away.** A single
   "in 10 years you will be a Senior" is a claim about a point estimate drawn
   from a stochastic process. The model computes the exact distribution
   π(t) = π(0)·Pᵗ; this returns the whole matrix plus the distribution at every
   year, so a UI can show that the model produces a distribution, not an oracle.

2. **Monte Carlo and analytic solutions are reported separately, never blended.**
   `simulate()` and `analytical_transition()` are two independent paths to the
   same distribution. Reporting only one would hide sampling noise; reporting
   both lets the caller see it. They are returned as separate blocks, and their
   divergence is surfaced as `agreement` rather than averaged away.

3. **Unmodelled things are null, not zero.** A salary percentile that falls
   inside the absorbing `Exit` state's mass is not "you will earn ₹0", it is
   "this percentile is dominated by paths that stopped earning" — the same rule
   `colleges.py::_optional_float` applies to an unmeasured NUMERIC column.

The transition coefficients themselves are UNCHANGED from `markov_career.py`;
this router adds no new science. The one behavioural change to the model is
`expected_time_to_state()`, documented in that file, which previously ignored
its own `n_years` argument and the caller's start state.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/career", tags=["Career Trajectory"])

# Sampled paths per request. The model's own `to_api_dict` uses 2000; 4000 keeps
# sampling noise low on an 8-state chain while holding the block near 2s.
N_SIMULATIONS = 4000
MAX_HORIZON_YEARS = 40

# Two independent estimates of the same distribution should agree to well under
# this. Above it, the discrepancy is larger than Monte-Carlo noise explains and
# is reported as a caveat rather than quietly dropped.
AGREEMENT_TVD_THRESHOLD = 0.02

# Share of the distribution covered by each reported salary band, used to
# decide whether that band is contaminated by the zero-earning Exit mass. See
# `_pct_or_none`.
PERCENTILE_BAND_MASS = {
    "p10": 0.10,
    "p25": 0.25,
    "p50": 0.50,
    "p75": 0.75,
    "p90": 0.90,
}

# Fields with a hand-calibrated matrix. `default` is the fallback for commerce,
# design, social-sciences and arts — a real matrix, but one that is explicitly
# an average of four disciplines rather than a calibration for any of them, so
# it is reported back as `field_fallback` rather than passed off as specific.
CALIBRATED_FIELDS: Dict[str, str] = {
    "engineering-cs": "Engineering — CS / IT",
    "engineering-non-cs": "Engineering — non-CS",
    "medicine": "Medicine",
    "management": "Management / MBA",
    "law": "Law",
}

DEFAULT_FIELD = "default"
VALID_TIERS = ("1", "2", "3")

FIELD_FALLBACK_NOTE = (
    "No hand-calibrated matrix exists for this field. Projected with the "
    "cross-discipline average, which is not a calibration for your field."
)


class CareerTrajectoryRequest(BaseModel):
    """A Markov chain has no opinion until it is told where it starts."""

    field: str = Field(
        DEFAULT_FIELD,
        description="Degree field key. Falls back to the cross-discipline average matrix if unmodelled.",
    )
    tier: str = Field("2", description="College tier: 1, 2 or 3. Adjusts promotion speed only.")
    start_state: str = Field(
        "Fresher",
        description="Where the student is today: Fresher, Junior, Mid, Senior, Lead, Executive, Entrepreneur, Exit.",
    )
    horizon_years: int = Field(20, ge=1, le=MAX_HORIZON_YEARS, description="Years to project forward.")
    base_salary_y1_inr: Optional[int] = Field(
        None,
        description=(
            "First-year salary in INR. Omit and the salary trajectory is reported as not "
            "modelled — this model knows salary *multipliers* by state, not salaries."
        ),
    )
    include_monte_carlo: bool = Field(
        True,
        description="Run the stochastic path sampler alongside the exact solution. Costs ~2s.",
    )


def _import_model():
    """Import the model lazily, so a broken dependency degrades one route, not the app.

    `ml` is a top-level sibling package under `uvicorn api.main:app` — it is not
    reachable by relative import from inside `api/` (see the import note at
    main.py:60-66). Keeping this out of module scope also means a missing pandas
    cannot prevent the rest of the router from registering.
    """
    from ml.markov_career import CareerMarkovModel, STATES, TRANSITION_MATRICES, TIER_SPEED_MULTIPLIER

    return CareerMarkovModel, STATES, TRANSITION_MATRICES, TIER_SPEED_MULTIPLIER


def _num(value: Any, places: int = 4) -> Optional[float]:
    """Round for transport, but never emit NaN/Inf as a bare JSON literal.

    `jsonable_encoder` passes bare `NaN` through untouched and bare `NaN` is not
    valid JSON, so a strict client parser throws on it. Non-finite values are
    treated as absent, the same rule colleges.py `_optional_float` applies to
    NUMERIC columns.
    """
    if value is None:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return round(result, places) if np.isfinite(result) else None


def _pct_or_none(value: Any, exit_share: Optional[float], band_mass: float) -> Optional[int]:
    """Return a salary percentile, or None when that band falls inside the Exit mass.

    `Exit` is an absorbing state with a salary multiplier of 0.0, so a
    percentile drawn from a band that the exited paths occupy is, by
    construction, a statement about having no income. Emitting it as an integer
    0 publishes "you will earn ₹0" as a measurement.

    The test is per-band, not per-year. A year with 72% Exit mass still has a
    perfectly real p90 — the top 10% of earners never left — and a blanket
    year-level rule throws that away. It would in fact blank every percentile of
    every year here, because even year 1 carries a 5% exit mass. Suppressing
    only the bands the zero-mass actually contaminates keeps p75/p90 while still
    refusing to print a fabricated 0 for p10.

    A band p_b spans the lowest b% of the distribution, so it is contaminated
    exactly when the share of exited paths is at least b.

    Follows `colleges.py::_optional_float`: a genuine measurement and "we never
    measured this" must not serialise identically.
    """
    if exit_share is None:
        return None
    numeric = _num(value, 0)
    if numeric is None:
        return None
    return None if exit_share >= band_mass else int(numeric)


def _matrix_rows(matrix: Any, states: List[str]) -> List[Dict[str, Any]]:
    """Serialise the transition matrix as [{from_state, to: p, ...}].

    Long form rather than a bare nested list, so each cell keeps the name of the
    state it belongs to and the response stays readable without a second lookup.
    """
    rows: List[Dict[str, Any]] = []
    for i, from_state in enumerate(states):
        row: Dict[str, Any] = {"from_state": from_state, "row_sum": _num(matrix[i].sum(), 6)}
        for j, to_state in enumerate(states):
            row[to_state] = _num(matrix[i][j], 4)
        rows.append(row)
    return rows


def _distribution_rows(frame: Any, states: List[str]) -> List[Dict[str, Any]]:
    return [
        {"year": int(idx), **{state: _num(frame.loc[idx, state], 4) for state in states}}
        for idx in frame.index
    ]


def _validate(req: CareerTrajectoryRequest, states: List[str], calibrated: bool) -> None:
    """Reject unmodelled inputs by name, listing what the model actually supports."""
    if req.start_state not in states:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "unknown_start_state",
                "reason": f"'{req.start_state}' is not a modelled state.",
                "valid_states": states,
            },
        )
    if req.tier not in VALID_TIERS:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "unknown_tier",
                "reason": f"'{req.tier}' is not a modelled tier.",
                "valid_tiers": list(VALID_TIERS),
            },
        )
    if not calibrated:
        logger.info("Career trajectory: field %r is unmodelled, using the default matrix", req.field)


def _validate_and_build(req: CareerTrajectoryRequest):
    """Import, validate, and construct. Raises 503 if the model cannot load and
    422 — naming what is valid — if the caller asked for something unmodelled."""
    try:
        CareerMarkovModel, states, matrices, _ = _import_model()
    except Exception as e:  # pragma: no cover - environment failure
        logger.error("Career trajectory model unavailable: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail={"error": "model_unavailable", "reason": str(e)})

    _validate(req, states, req.field in matrices)
    return CareerMarkovModel(field=req.field, tier=req.tier), states, req.field in matrices


@router.get("/states")
async def list_states() -> Dict[str, Any]:
    """The state space and every field this model has actually been calibrated for.

    Exposed so the frontend can build selectors from the model's real vocabulary
    instead of a hardcoded list that will silently drift from the coefficients.
    """
    try:
        _, states, matrices, tier_multipliers = _import_model()
    except Exception as e:  # pragma: no cover - environment failure
        logger.error("Career trajectory model unavailable: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail={"error": "model_unavailable", "reason": str(e)})

    return {
        "states": states,
        "fields": [{"key": key, "label": label} for key, label in CALIBRATED_FIELDS.items()],
        "default_field": DEFAULT_FIELD,
        "default_field_label": "Other / not specifically calibrated",
        "field_fallback_note": FIELD_FALLBACK_NOTE,
        "tiers": list(VALID_TIERS),
        "tier_speed_multiplier": {k: _num(v, 2) for k, v in tier_multipliers.items()},
        "tier_speed_note": (
            "Tier scales promotion speed only. It does not change which states are "
            "reachable, and it does not change exit risk."
        ),
        "model_has_exact_solution": True,
        "model_has_sampled_solution": True,
        "_source": "model_constants",
    }


@router.post("/trajectory")
async def career_trajectory(req: CareerTrajectoryRequest) -> Dict[str, Any]:
    """Project a career-state distribution forward from a known starting state.

    Returns the transition matrix actually used, the year-by-year distribution
    from the exact matrix-power solution, and the independent Monte-Carlo
    estimate beside it — the three things a UI needs to show the result as a
    distribution rather than a prediction.
    """
    model, states, calibrated = _validate_and_build(req)

    try:
        analytic = model.analytical_transition(n_years=req.horizon_years, start_state=req.start_state)
    except Exception as e:
        logger.error("Analytic transition failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "projection_failed", "reason": str(e)})

    horizon = req.horizon_years
    exit_at_horizon = _num(analytic.loc[horizon, "Exit"], 4)

    payload: Dict[str, Any] = {
        "field": req.field,
        "field_label": CALIBRATED_FIELDS.get(req.field, "Cross-discipline average (not calibrated for this field)"),
        "field_fallback": not calibrated,
        "field_fallback_note": None if calibrated else FIELD_FALLBACK_NOTE,
        "tier": req.tier,
        "start_state": req.start_state,
        "horizon_years": horizon,
        "states": states,
        "transition_matrix": {
            "rows": _matrix_rows(model.T, states),
            "note": (
                "Annual transition probabilities for the exact matrix used, after the tier "
                "adjustment. Rows sum to 1. Exit is absorbing."
            ),
        },
        "distribution": _distribution_rows(analytic, states),
        "distribution_source": "exact",
        "distribution_at_horizon": {state: _num(analytic.loc[horizon, state], 4) for state in states},
        "exit_risk_at_horizon": exit_at_horizon,
        "exit_risk_note": (
            "Share of modelled paths in the absorbing Exit state by the horizon year. "
            "Exit is absorbing, so this is a floor, not a midpoint."
        ),
        "salary_trajectory": None,
        "salary_trajectory_unavailable_reason": (
            "This model knows salary *multipliers* by state, not salaries. Supply "
            "base_salary_y1_inr — ideally a measured median from a program's placement "
            "data — to scale them."
        ),
        "monte_carlo": None,
        "monte_carlo_unavailable_reason": None,
        "agreement": None,
        "_source": "markov_career_model",
        "model_version": settings.current_model_version,
        "generated_at": datetime.utcnow().isoformat(),
    }

    if req.base_salary_y1_inr is not None:
        try:
            trajectory = model.salary_trajectory(
                base_salary_y1=int(req.base_salary_y1_inr),
                n_years=horizon,
                n_simulations=N_SIMULATIONS,
            )
        except Exception as e:
            logger.error("Salary trajectory failed: %s", e, exc_info=True)
            raise HTTPException(status_code=500, detail={"error": "projection_failed", "reason": str(e)})

        # `salary_trajectory` hardcodes its checkpoints to y1/y3/y5/y10/y15/y20,
        # so a shorter horizon returns a partial dict. That is passed through
        # un-padded, with the years that exist stated explicitly, rather than
        # back-filled with interpolated values the model never computed.
        percentiles: Dict[str, Any] = {}
        for year_key, band in sorted(trajectory.items(), key=lambda kv: int(kv[0][1:])):
            year = int(year_key[1:])
            exit_share = _num(analytic.loc[year, "Exit"], 4) if year in analytic.index else None
            row: Dict[str, Any] = {
                band_key: _pct_or_none(band_val, exit_share, PERCENTILE_BAND_MASS.get(band_key, 0.0))
                for band_key, band_val in band.items()
            }
            row["exit_mass_pct"] = _num(exit_share * 100 if exit_share is not None else None, 2)
            suppressed = sorted(
                k for k, v in band.items() if row.get(k) is None and _num(v, 0) is not None
            )
            row["suppressed_bands"] = suppressed or None
            row["suppressed_reason"] = (
                f"{', '.join(suppressed)} fall inside the Exit mass (salary multiplier 0.0), "
                "so a specific figure there would be a fabricated zero. The bands above "
                "the exit mass are still reported."
                if suppressed
                else None
            )
            percentiles[year_key] = row

        payload["salary_trajectory"] = {
            "base_salary_y1_inr": int(req.base_salary_y1_inr),
            "available_years": sorted(trajectory.keys(), key=lambda k: int(k[1:])),
            "percentiles": percentiles,
            "method": (
                "Analytic state distribution × per-state salary multiplier, with "
                "log-normal noise within each state."
            ),
            "checkpoints_note": (
                "The model evaluates fixed checkpoints (1, 3, 5, 10, 15, 20 years). "
                "A shorter horizon returns fewer years rather than interpolated ones."
            ),
        }
        payload["salary_trajectory_unavailable_reason"] = None

    if not req.include_monte_carlo:
        payload["monte_carlo_unavailable_reason"] = "Disabled by the caller for this request."
        return payload

    # ── Monte Carlo, reported beside the exact run and never merged into it ──
    try:
        sampled = model.simulate(
            n_years=horizon,
            n_simulations=N_SIMULATIONS,
            start_state=req.start_state,
        )
    except Exception as e:
        logger.error("Monte Carlo simulation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "projection_failed", "reason": str(e)})

    # Total-variation distance between two independent estimates of the same
    # distribution at the horizon year.
    tvd = float(np.abs(np.asarray(sampled.iloc[horizon]) - np.asarray(analytic.iloc[horizon])).sum() / 2)
    tvd_rounded = _num(tvd, 4)

    payload["monte_carlo"] = {
        "n_simulations": N_SIMULATIONS,
        "is_sampled_estimate": True,
        "distribution": _distribution_rows(sampled, states),
        "note": (
            f"{N_SIMULATIONS} sampled paths. Every number in this block is a sample "
            "estimate, not an exact value. The `distribution` block is the exact one."
        ),
    }
    payload["agreement"] = {
        "method": "total variation distance between exact and sampled distributions at the horizon year",
        "tvd": tvd_rounded,
        "tvd_threshold": AGREEMENT_TVD_THRESHOLD,
        "in_agreement": tvd_rounded is not None and tvd <= AGREEMENT_TVD_THRESHOLD,
        "note": (
            None
            if tvd_rounded is not None and tvd <= AGREEMENT_TVD_THRESHOLD
            else "Exact and sampled solutions disagree by more than sampling noise explains. "
            "Treat this projection as low confidence."
        ),
    }
    return payload
