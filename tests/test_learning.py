"""اختبارات محرك التعلّم الآلي."""
from masarat.database import db
from masarat.engines import LearningEngine


def test_learning_insight(sample_tender):
    ln = LearningEngine(db).analyze(sample_tender)
    assert ln.sample_size == 8
    assert ln.method in {"regression", "historical_mean"}
    assert 8.0 <= ln.recommended_contingency_pct <= 25.0
    assert ln.confidence > 0
    assert ln.calibrated_cost_factor > 0
    assert ln.recommended_margin_pct > 0
