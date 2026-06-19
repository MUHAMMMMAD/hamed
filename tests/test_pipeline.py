"""اختبار خط الإنتاج الكامل (end-to-end)."""
from masarat.pipeline import analyze_tender


def test_full_pipeline(sample_tender):
    a = analyze_tender(sample_tender)
    assert a.cost.selling_price > 0
    assert a.risk is not None
    assert a.decision is not None
    assert a.cashflow is not None
    assert a.learning is not None
    # الوكلاء الثمانية أنتجوا تقاريرهم
    assert len(a.agent_reports) == 8
    assert "ceo" in a.agent_reports
    # مجلس النماذج أُستشير
    assert a.council_insights
