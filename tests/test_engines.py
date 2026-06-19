"""اختبارات محركات التسعير والمخاطر والقرار والتدفقات النقدية."""
from masarat.database import db
from masarat.engines import BidEngine, CashFlowEngine, PricingEngine, RiskEngine
from masarat.models import BOQItem, Tender


def test_pricing_formula(sample_tender):
    cost = PricingEngine(db).price_tender(sample_tender)
    assert cost.direct_cost > 0
    assert cost.total_cost >= cost.direct_cost
    assert cost.selling_price > cost.total_cost
    # السعر النهائي = سعر البيع + ضريبة 15% (تسامح تقريب الضريبة المنفصل)
    assert abs(cost.final_price - cost.selling_price * 1.15) < 0.05
    assert 0 < cost.margin_pct < 100


def test_priced_boq_other_bucket():
    """بند مُسعّر مسبقاً (بلا تحليل سعر) يُصنّف تحت 'غير مصنّف'."""
    t = Tender(
        id="X", name="lump", client="c",
        items=[BOQItem(id="1", description="مقطوعية", unit="م2", quantity=10, unit_rate=100)],
    )
    cost = PricingEngine(db).price_tender(t)
    assert cost.other == 1000
    assert cost.direct_cost == 1000
    assert t.items[0].other_cost == 1000


def test_risk_register(sample_tender):
    r = RiskEngine(db).assess(sample_tender)
    assert len(r.items) == 5
    assert 0 < r.risk_factor_pct <= 10


def test_bid_decision(sample_tender):
    c = PricingEngine(db).price_tender(sample_tender)
    r = RiskEngine(db).assess(sample_tender)
    d = BidEngine().decide(sample_tender, c, r)
    assert d.decision.value in {"BID", "NO_BID", "BID_WITH_CONDITIONS"}
    assert 0 <= d.score <= 100
    assert 5 <= d.win_probability <= 95


def test_cashflow_self_check(sample_tender):
    """التحقق الذاتي: صافي التراكم النهائي = الربح."""
    c = PricingEngine(db).price_tender(sample_tender)
    cf = CashFlowEngine().project(sample_tender, c)
    assert len(cf.months) == sample_tender.duration_months + 1
    assert abs(cf.final_cumulative - c.profit) < 1.0
    assert cf.peak_funding_required >= 0
