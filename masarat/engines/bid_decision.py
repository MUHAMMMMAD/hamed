"""
محرك قرار المناقصة (Bid / No-Bid Engine).
يوازن بين: هامش الربح، المنافسة، المخاطر، سمعة العميل، والسيولة،
لإنتاج قرار آلي (تقديم / عدم تقديم / تقديم بشروط) + احتمال الفوز.
"""
from __future__ import annotations

from ..models import (
    BidDecision,
    BidDecisionType,
    CostBreakdown,
    RiskAssessment,
    Tender,
)


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


class BidEngine:
    def decide(
        self,
        tender: Tender,
        cost: CostBreakdown,
        risk: RiskAssessment,
    ) -> BidDecision:
        # --- درجات فرعية (كل منها 0-100) ---
        margin_score = _clamp(cost.margin_pct / 15.0 * 100.0)
        risk_score = _clamp(100.0 - risk.risk_factor_pct * 10.0)
        competition_score = _clamp((5.0 - tender.competition_level) / 4.0 * 100.0)
        client_score = _clamp(tender.client_reputation / 5.0 * 100.0)
        liquidity_score = _clamp(
            (tender.advance_payment_pct - tender.retention_pct + 0.10) / 0.25 * 100.0
        )

        score = (
            0.30 * margin_score
            + 0.25 * risk_score
            + 0.20 * competition_score
            + 0.15 * client_score
            + 0.10 * liquidity_score
        )
        score = round(score, 1)

        # --- احتمال الفوز (heuristic) ---
        win = (
            75.0
            - (tender.competition_level - 1) * 11.0
            - max(0.0, cost.margin_pct - 12.0) * 2.0
            + (tender.client_reputation - 3.0) * 2.0
        )
        win = round(_clamp(win, 5.0, 95.0), 1)

        # --- القرار ---
        conditions: list[str] = []
        if margin_score < 60:
            conditions.append("رفع هامش الربح أو خفض التكلفة المباشرة قبل التقديم")
        if risk.risk_factor_pct >= 5:
            conditions.append("تثبيت أسعار الموردين الرئيسيين (حديد/خرسانة) قبل التقديم")
        if tender.advance_payment_pct < 0.10:
            conditions.append("التفاوض على دفعة مقدمة لا تقل عن 10%")
        if tender.competition_level >= 4:
            conditions.append("مراجعة تنافسية السعر مقابل السوق")

        if score >= 65:
            decision = BidDecisionType.BID
            rationale = "المؤشرات إيجابية: ربحية ومخاطر مقبولة مع فرصة فوز معقولة."
        elif score >= 50:
            decision = BidDecisionType.BID_WITH_CONDITIONS
            rationale = "فرصة جيدة لكنها مشروطة بمعالجة نقاط الضعف أدناه."
        else:
            decision = BidDecisionType.NO_BID
            rationale = "المخاطر أو ضعف الربحية يفوقان الفرصة؛ يُنصح بعدم التقديم."

        return BidDecision(
            decision=decision,
            score=score,
            win_probability=win,
            rationale=rationale,
            conditions=conditions if decision != BidDecisionType.BID else [],
            factors={
                "هامش الربح": round(margin_score, 1),
                "المخاطر": round(risk_score, 1),
                "المنافسة": round(competition_score, 1),
                "سمعة العميل": round(client_score, 1),
                "السيولة": round(liquidity_score, 1),
            },
        )
