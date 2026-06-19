"""
فريق الوكلاء الذكيين الثمانية.
كل وكيل يؤدي تخصصه ثم يضيف نتيجته إلى السياق المشترك.
ترتيب التشغيل: هندسة ← مشتريات ← مخاطر ← تسعير ← قانوني ← مناقصة ← PMO ← CEO
"""
from __future__ import annotations

from typing import List

from ..engines import BidEngine, CashFlowEngine, PricingEngine, RiskEngine
from ..models import PricingConfig, ResourceType
from .base import Agent, AgentContext


# ---------------------------------------------------------------------------
# 4) Engineering Agent - تحليل المخططات والمواصفات والبنود
# ---------------------------------------------------------------------------
class EngineeringAgent(Agent):
    name = "engineering"
    title = "وكيل الهندسة (Engineering Agent)"
    task = "engineering"

    def run(self, ctx: AgentContext) -> dict:
        t = ctx.tender
        subbed = [
            it.id for it in t.items
            if any(
                (r.resource_type == ResourceType.SUBCONTRACTOR
                 or str(r.resource_type) == "subcontractor")
                for r in it.resources
            )
        ]
        insight = self._consult(
            ctx,
            f"حلّل فنياً جدول كميات لمشروع '{t.name}' يحتوي {len(t.items)} بنداً. "
            f"حدّد البنود الحرجة فنياً والمخاطر الهندسية المحتملة.",
            system="أنت مهندس تكاليف خبير في المقاولات السعودية.",
        )
        report = {
            "title": self.title,
            "items_analyzed": len(t.items),
            "subcontracted_items": subbed,
            "note": "يلزم توفّر المخططات (DWG) والمواصفات لرفع دقة الحصر.",
            "ai_insight": insight,
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 5) Procurement Agent - أسعار الموردين والبنود طويلة التوريد
# ---------------------------------------------------------------------------
class ProcurementAgent(Agent):
    name = "procurement"
    title = "وكيل المشتريات (Procurement Agent)"
    task = "market"

    def run(self, ctx: AgentContext) -> dict:
        usage: dict[str, float] = {}
        for it in ctx.tender.items:
            for r in it.resources:
                rtype = (r.resource_type.value
                         if isinstance(r.resource_type, ResourceType)
                         else str(r.resource_type))
                if rtype == "material":
                    usage[r.resource_id] = usage.get(r.resource_id, 0.0) + (
                        r.coefficient * it.quantity
                    )

        materials_plan = []
        long_lead = []
        for mid, qty in sorted(usage.items(), key=lambda x: -x[1]):
            mat = ctx.db.materials.get(mid)
            if not mat:
                continue
            supplier = next(
                (s for s in ctx.db.suppliers.values() if mid in s.materials), None
            )
            entry = {
                "material": mat.name_ar,
                "qty": round(qty, 2),
                "unit": mat.unit,
                "supplier": supplier.name if supplier else "غير محدد",
                "lead_time_days": supplier.lead_time_days if supplier else None,
                "trend_pct": mat.trend_pct,
            }
            materials_plan.append(entry)
            if supplier and supplier.lead_time_days >= 14:
                long_lead.append(entry)

        insight = self._consult(
            ctx,
            "ما اتجاه أسعار الحديد والخرسانة والألمنيوم في السوق السعودي حالياً، "
            "وما توصياتك لتثبيت الأسعار؟",
            system="أنت محلل سوق مواد بناء.",
        )
        report = {
            "title": self.title,
            "materials_plan": materials_plan[:10],
            "long_lead_items": long_lead,
            "ai_insight": insight,
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 7) Risk Agent - حساب المخاطر ومعامل التعديل
# ---------------------------------------------------------------------------
class RiskAgent(Agent):
    name = "risk"
    title = "وكيل المخاطر (Risk Agent)"

    def run(self, ctx: AgentContext) -> dict:
        ctx.risk = RiskEngine(ctx.db).assess(ctx.tender)
        report = {
            "title": self.title,
            "overall_level": ctx.risk.overall_level.value,
            "risk_factor_pct": ctx.risk.risk_factor_pct,
            "register": [
                {
                    "category": r.category,
                    "description": r.description,
                    "score": r.score,
                    "level": r.level.value,
                    "mitigation": r.mitigation,
                }
                for r in ctx.risk.items
            ],
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 3) Estimation Agent - محرك التسعير
# ---------------------------------------------------------------------------
class EstimationAgent(Agent):
    name = "estimation"
    title = "وكيل التسعير (Estimation Agent)"
    task = "pricing"

    def run(self, ctx: AgentContext) -> dict:
        risk_factor = ctx.risk.risk_factor_pct if ctx.risk else 0.0
        cfg = PricingConfig()
        if ctx.learning and ctx.learning.sample_size:
            # احتياطي مُعاير من المشاريع السابقة بدل الافتراضي الثابت
            cfg.contingency_pct = ctx.learning.recommended_contingency_pct / 100.0
        ctx.cost = PricingEngine(ctx.db).price_tender(
            ctx.tender, cfg, risk_factor_pct=risk_factor
        )
        insight = self._consult(
            ctx,
            f"راجع منطقية تسعير مشروع بتكلفة مباشرة {ctx.cost.direct_cost:,.0f} ريال "
            f"وسعر بيع {ctx.cost.selling_price:,.0f} ريال وهامش {ctx.cost.margin_pct}%.",
            system="أنت خبير تسعير مشاريع إنشائية.",
        )
        report = {
            "title": self.title,
            "cost": ctx.cost.model_dump(),
            "contingency_pct": round(cfg.contingency_pct * 100, 2),
            "ai_insight": insight,
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 6) Legal Agent - مراجعة العقد والمخاطر القانونية
# ---------------------------------------------------------------------------
class LegalAgent(Agent):
    name = "legal"
    title = "الوكيل القانوني (Legal Agent)"
    task = "contracts"

    def run(self, ctx: AgentContext) -> dict:
        insight = self._consult(
            ctx,
            f"راجع المخاطر القانونية لعقد مقاولات حكومي/خاص لمشروع '{ctx.tender.name}' "
            f"بمحتجزات {ctx.tender.retention_pct*100:.0f}% ودفعة مقدمة "
            f"{ctx.tender.advance_payment_pct*100:.0f}%. ركّز على الشروط الجزائية "
            f"وأوامر التغيير وتسوية النزاعات.",
            system="أنت مستشار قانوني متخصص في عقود المقاولات (FIDIC والنظام السعودي).",
        )
        report = {
            "title": self.title,
            "checklist": [
                "الشروط الجزائية والغرامات",
                "آلية أوامر التغيير (Variation Orders)",
                "شروط الدفع والمحتجزات",
                "تسوية النزاعات والتحكيم",
                "الضمانات والكفالات",
            ],
            "ai_review": insight,
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 2) Tender Agent - قرار Bid / No-Bid
# ---------------------------------------------------------------------------
class TenderAgent(Agent):
    name = "tender"
    title = "وكيل المناقصات (Tender Agent)"

    def run(self, ctx: AgentContext) -> dict:
        ctx.decision = BidEngine().decide(ctx.tender, ctx.cost, ctx.risk)
        report = {
            "title": self.title,
            "decision": ctx.decision.decision.value,
            "score": ctx.decision.score,
            "win_probability": ctx.decision.win_probability,
            "rationale": ctx.decision.rationale,
            "conditions": ctx.decision.conditions,
            "factors": ctx.decision.factors,
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 8 (PMO) - خطة التنفيذ والتدفقات النقدية
# ---------------------------------------------------------------------------
class PMOAgent(Agent):
    name = "pmo"
    title = "وكيل إدارة المشاريع (PMO Agent)"
    task = "agents"

    def run(self, ctx: AgentContext) -> dict:
        ctx.cashflow = CashFlowEngine().project(ctx.tender, ctx.cost)
        report = {
            "title": self.title,
            "duration_months": ctx.tender.duration_months,
            "peak_funding_required": ctx.cashflow.peak_funding_required,
            "final_cumulative": ctx.cashflow.final_cumulative,
            "phases": [
                "التجهيز والتعبئة (Mobilization)",
                "الأعمال الترابية والأساسات",
                "الهيكل الإنشائي",
                "البناء والتشطيبات",
                "الأنظمة (كهرباء/ميكانيكا)",
                "التسليم والإغلاق",
            ],
        }
        ctx.reports[self.name] = report
        return report


# ---------------------------------------------------------------------------
# 1) CEO Agent - القرار النهائي والتقرير التنفيذي
# ---------------------------------------------------------------------------
class CEOAgent(Agent):
    name = "ceo"
    title = "الوكيل التنفيذي (CEO Agent)"

    def run(self, ctx: AgentContext) -> dict:
        d, c, r = ctx.decision, ctx.cost, ctx.risk
        verdict = {
            "BID": "✅ التوصية: التقديم على المناقصة",
            "BID_WITH_CONDITIONS": "⚠️ التوصية: التقديم بشروط",
            "NO_BID": "❌ التوصية: عدم التقديم",
        }.get(d.decision.value, d.decision.value)

        summary = (
            f"{verdict}.\n"
            f"سعر البيع المقترح: {c.selling_price:,.0f} ريال "
            f"(شامل الضريبة {c.final_price:,.0f} ريال).\n"
            f"هامش الربح: {c.margin_pct}% | درجة القرار: {d.score}/100 | "
            f"احتمال الفوز: {d.win_probability}% | "
            f"مستوى المخاطر: {r.overall_level.value}.\n"
            f"أقصى تمويل مطلوب: {ctx.cashflow.peak_funding_required:,.0f} ريال."
        )
        if ctx.learning and ctx.learning.sample_size:
            summary += (
                f"\nالتعلّم الآلي ({ctx.learning.sample_size} مشروعاً، ثقة "
                f"{ctx.learning.confidence}%): انحراف متوقّع "
                f"{ctx.learning.predicted_deviation_pct}% واحتياطي مُعاير "
                f"{ctx.learning.recommended_contingency_pct}%."
            )
        report = {
            "title": self.title,
            "final_decision": d.decision.value,
            "executive_summary": summary,
            "conditions": d.conditions,
        }
        ctx.reports[self.name] = report
        return report


# ترتيب تشغيل الفريق (التبعيات محسوبة)
def build_team() -> List[Agent]:
    return [
        EngineeringAgent(),
        ProcurementAgent(),
        RiskAgent(),
        EstimationAgent(),
        LegalAgent(),
        TenderAgent(),
        PMOAgent(),
        CEOAgent(),
    ]
