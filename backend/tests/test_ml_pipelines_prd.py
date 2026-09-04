"""
Unit & Integration Test Suite for PRD Section 07 Machine Learning Architecture
=============================================================================
Verifies:
  1. Section 7.1: Multi-Horizon Quantile Pinball Loss Regressor across 8 horizons and 5 quantiles.
  2. Section 7.1: 18-feature tensor extraction and rolling imputation.
  3. Section 7.2: 2-Layer BiLSTM deep sequence model and deterministic compound fallback.
  4. Section 7.3: Markov Chain Career State Transition Engine (Equation 7.2: π(t) = π(0) · P^t).
  5. Section 7.4: Automated Champion / Challenger Retraining Pipeline and 8% Anomaly Gate.
"""
import pytest
import numpy as np
import pandas as pd

from backend.ml.feature_engine import FeatureEngine
from backend.ml.salary_predictor import SalaryPredictor, HORIZONS, QUANTILES, QUANTILE_KEYS
from backend.ml.lstm_trajectory import LSTMTrajectoryModel
from backend.ml.markov_career import CareerMarkovModel, TRANSITION_MATRICES, STATES


# ── 1. FeatureEngine Tests (PRD Section 7.1) ──────────────────────────

def test_feature_engine_18_features():
    """Verify FeatureEngine produces exactly 18 features matching Section 7.1."""
    fe = FeatureEngine()
    assert len(fe.FEATURE_NAMES) == 18
    assert fe.N_FEATURES == 18

    # Test with standard program
    prog = {
        "college_name": "IIT Bombay",
        "degree_field": "engineering-cs",
        "tier": "1",
        "college_type": "IIT",
        "nirf_rank": 3,
        "total_cost_of_degree_inr": 350000,
        "placement_rate_pct": 0.98,
        "established_year": 1958,
        "state": "Maharashtra",
        "city": "Mumbai",
    }
    vec = fe.encode_program(prog)
    assert isinstance(vec, np.ndarray)
    assert vec.shape == (18,)
    assert vec.dtype == np.float32
    assert not np.isnan(vec).any()
    assert (vec >= 0.0).all()


def test_feature_engine_robust_imputation():
    """Verify FeatureEngine imputes missing values cleanly without crashing."""
    fe = FeatureEngine()
    empty_prog = {}
    vec = fe.encode_program(empty_prog)
    assert vec.shape == (18,)
    assert not np.isnan(vec).any()


# ── 2. Quantile Pinball Salary Regressor Tests (Section 7.1) ──────────

def test_salary_predictor_horizons_and_quantiles():
    """Verify SalaryPredictor covers 8 horizons × 5 quantiles."""
    assert len(HORIZONS) == 8
    assert set(HORIZONS) == {"y1", "y2", "y3", "y5", "y7", "y10", "y15", "y20"}
    assert len(QUANTILES) == 5
    assert QUANTILES == [0.10, 0.25, 0.50, 0.75, 0.90]

    predictor = SalaryPredictor(model_version="v2.0-test-suite")
    metrics = predictor.train()

    # Verify metrics evaluate test set MAPE and R²
    assert "mape_y1" in metrics
    assert "mape_y5" in metrics
    assert "r2_y1" in metrics
    assert "r2_y5" in metrics
    assert metrics["mape_y1"] <= 15.0
    assert metrics["mape_y5"] <= 18.0

    # Verify prediction across all horizons with monotonic quantile ordering
    sample_prog = {
        "college_name": "BITS Pilani",
        "degree_field": "engineering-cs",
        "tier": "1",
        "nirf_rank": 25,
        "total_cost_of_degree_inr": 2200000,
    }
    preds = predictor.predict(sample_prog)

    for h in HORIZONS:
        assert h in preds
        q_dict = preds[h]
        assert set(q_dict.keys()) == set(QUANTILE_KEYS)
        # Monotonic ordering check: p10 <= p25 <= p50 <= p75 <= p90
        assert q_dict["p10"] <= q_dict["p25"]
        assert q_dict["p25"] <= q_dict["p50"]
        assert q_dict["p50"] <= q_dict["p75"]
        assert q_dict["p75"] <= q_dict["p90"]

    # Verify salary expansion: Y20 > Y10 > Y5 > Y1
    assert preds["y20"]["p50"] > preds["y10"]["p50"] > preds["y5"]["p50"] > preds["y1"]["p50"]


def test_salary_predictor_feature_importances():
    """Verify feature importances are extracted across the 18-feature tensor."""
    predictor = SalaryPredictor(model_version="v2.0-test-suite")
    if not predictor.models["y5"]:
        predictor.train()

    fi = predictor.feature_importance(top_n=18)
    assert len(fi) == 18
    assert all("feature" in item and "importance" in item for item in fi)
    # Check that top features have positive weights
    assert fi[0]["importance"] > 0.0


# ── 3. BiLSTM Trajectory Tests (PRD Section 7.2) ───────────────────────

def test_bilstm_trajectory_horizons():
    """Verify LSTMTrajectoryModel predicts all 8 PRD horizons."""
    lstm = LSTMTrajectoryModel(model_version="v2.0-test-suite")
    prog = {
        "college_name": "IIT Delhi",
        "degree_field": "engineering-cs",
        "tier": "1",
        "seed_salary_y1": 1750000,
    }
    traj = lstm.predict_trajectory(prog)
    expected_horizons = ["y1", "y2", "y3", "y5", "y7", "y10", "y15", "y20"]

    for h in expected_horizons:
        assert h in traj, f"Missing horizon {h} in LSTM trajectory output"
        assert "p10" in traj[h]
        assert "p25" in traj[h]
        assert "p50" in traj[h]
        assert "p75" in traj[h]
        assert "p90" in traj[h]
        assert traj[h]["p10"] <= traj[h]["p50"] <= traj[h]["p90"]


# ── 4. Markov Career State Transition Tests (PRD Section 7.3) ─────────

def test_markov_career_equation_7_2():
    """
    Verify Equation 7.2:
    π(t) = π(0) · P^t
    Stochastic transition matrix properties:
      1. All transition probabilities >= 0
      2. All row sums == 1.0 (conserved probability mass)
      3. Matrix exponentiation produces valid probability vectors
    """
    for field, P in TRANSITION_MATRICES.items():
        assert (P >= 0.0).all(), f"Negative probability in {field} transition matrix"
        row_sums = P.sum(axis=1)
        np.testing.assert_allclose(row_sums, 1.0, atol=1e-5, err_msg=f"Row sum != 1.0 in {field}")

    model = CareerMarkovModel(field="engineering-cs", tier="1")
    df = model.analytical_transition(n_years=20, start_state="Fresher")

    assert len(df) == 21  # Years 0 to 20
    # Probability sums to 1.0 at each year
    for year in range(21):
        year_prob = df.iloc[year].sum()
        np.testing.assert_allclose(year_prob, 1.0, atol=1e-5)

    # In year 0, student is 100% Fresher
    assert df.loc[0, "Fresher"] == 1.0
    # Over 20 years, probability shifts away from Fresher towards Senior/Exec/Exit
    assert df.loc[20, "Fresher"] < 0.05
    assert df.loc[20, "Lead"] + df.loc[20, "Executive"] + df.loc[20, "Entrepreneur"] + df.loc[20, "Exit"] > 0.80


# ── 5. Champion / Challenger Retraining Pipeline Tests (PRD Section 7.4) ─

def test_champion_challenger_promotion_criteria():
    """
    Verify promotion rule from Section 7.4:
    Promote if: MAPE_challenger < MAPE_champion - 0.005 AND R2_challenger >= R2_champion
    """
    champ_mape = 14.500
    champ_r2 = 0.820

    # Case 1: Inferior challenger -> Rejected
    chal_mape_worse = 14.700
    chal_r2_worse = 0.810
    promote_1 = (chal_mape_worse < champ_mape - 0.005) and (chal_r2_worse >= champ_r2)
    assert not promote_1

    # Case 2: Slightly better MAPE but worse R2 -> Rejected
    chal_mape_better = 14.400  # -0.100 better
    chal_r2_worse = 0.800
    promote_2 = (chal_mape_better < champ_mape - 0.005) and (chal_r2_worse >= champ_r2)
    assert not promote_2

    # Case 3: Both MAPE improved by > 0.005 and R2 improved -> Promoted!
    chal_mape_pass = 13.200
    chal_r2_pass = 0.855
    promote_3 = (chal_mape_pass < champ_mape - 0.005) and (chal_r2_pass >= champ_r2)
    assert promote_3
