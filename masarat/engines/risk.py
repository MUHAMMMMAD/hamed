"""
محرك المخاطر (Risk Engine).
يبني سجل مخاطر عبر خمس فئات (سوق، تنفيذ، عقد، موردون، وقت)، يحسب درجة لكل
خطر (احتمال × أثر)، ثم يشتق "معامل تعديل المخاطر" المضاف على التكلفة.
يتعلّم من اتجاهات أسعار المواد ومن انحرافات المشاريع السابقة.
"""
from __future__ import annotations

from statistics import mean

from ..database import Database, db as default_db
from ..models import (
    ProjectType,
    ResourceType,
    RiskAssessment,
    RiskItem,
    RiskLevel,
    Tender,
)

# الحد الأقصى لمعامل المخاطر على التكلفة المباشرة (%)
MAX_RISK_FACTOR_PCT = 10.0


def _level(score: float) -> RiskLevel:
    if score <= 6:
        return RiskLevel.LOW
    if score <= 14:
        return RiskLevel.MEDIUM
    return RiskLevel.HIGH


def _clamp(v: float, lo: float = 1.0, hi: float = 5.0) -> float:
    return max(lo, min(hi, v))


class RiskEngine:
    def __init__(self, database: Database | None = None) -> None:
        self.db = database or default_db

    def assess(self, tender: Tender) -> RiskAssessment:
        items: list[RiskItem] = []

        # --- 1) مخاطر السوق: تعتمد على اتجاهات أسعار المواد المستخدمة ---
        used_materials = {
            u.resource_id
            for it in tender.items
            for u in it.resources
            if (u.resource_type == ResourceType.MATERIAL
                or str(u.resource_type) == "material")
        }
        trends = [
            self.db.materials[m].trend_pct
            for m in used_materials
            if m in self.db.materials
        ]
        avg_trend = mean(trends) if trends else 0.0
        market_prob = _clamp(2.0 + avg_trend)        # كل 1% اتجاه يرفع الاحتمال
        items.append(
            RiskItem(
                category="السوق",
                description=f"تقلب أسعار المواد (متوسط الاتجاه {avg_trend:.1f}%)",
                probability=market_prob,
                impact=4.0,
                mitigation="تثبيت أسعار الموردين مبكراً وعقود توريد طويلة",
            )
        )

        # --- 2) مخاطر التنفيذ: من متوسط انحراف المشاريع السابقة ---
        hist_dev = self.db.historical_avg_deviation(tender.type.value)
        exec_prob = _clamp(2.0 + hist_dev / 4.0)
        items.append(
            RiskItem(
                category="التنفيذ",
                description=f"انحراف التكلفة التاريخي لهذا النوع {hist_dev:.1f}%",
                probability=exec_prob,
                impact=4.0,
                mitigation="رفع دقة حصر الكميات وضبط الإنتاجية ميدانياً",
            )
        )

        # --- 3) مخاطر العقد: نوع المشروع والمحتجزات والدفعة المقدمة ---
        contract_prob = {
            ProjectType.GOVERNMENT: 3.0,
            ProjectType.EPC: 4.0,
            ProjectType.PRIVATE: 3.0,
            ProjectType.SUBCONTRACT: 2.5,
        }.get(tender.type, 3.0)
        if tender.advance_payment_pct < 0.10:
            contract_prob += 1.0
        items.append(
            RiskItem(
                category="العقد",
                description="شروط تعاقدية، محتجزات، وأوامر تغيير محتملة",
                probability=_clamp(contract_prob),
                impact=3.5,
                mitigation="مراجعة قانونية كاملة (Legal Agent) قبل التوقيع",
            )
        )

        # --- 4) مخاطر الموردين: ثبات الأسعار ووقت التوريد ---
        stabilities = [s.price_stability for s in self.db.suppliers.values()]
        avg_stab = mean(stabilities) if stabilities else 3.0
        supplier_prob = _clamp(6.0 - avg_stab)       # ثبات أعلى = خطر أقل
        items.append(
            RiskItem(
                category="الموردون",
                description=f"ثبات أسعار الموردين (متوسط {avg_stab:.1f}/5)",
                probability=supplier_prob,
                impact=3.0,
                mitigation="تعدد الموردين وعروض أسعار محدّثة دورياً",
            )
        )

        # --- 5) مخاطر الوقت: مدة المشروع ---
        time_prob = _clamp(1.5 + tender.duration_months / 6.0)
        items.append(
            RiskItem(
                category="الوقت",
                description=f"مدة التنفيذ {tender.duration_months} شهراً",
                probability=time_prob,
                impact=3.5,
                mitigation="جدول زمني واقعي مع مسار حرج وموارد احتياطية",
            )
        )

        # حساب الدرجات والمستويات
        for r in items:
            r.score = round(r.probability * r.impact, 2)
            r.level = _level(r.score)

        avg_score = mean(r.score for r in items)
        risk_factor = round(avg_score / 25.0 * MAX_RISK_FACTOR_PCT, 2)

        return RiskAssessment(
            items=items,
            total_score=round(avg_score, 2),
            risk_factor_pct=risk_factor,
            overall_level=_level(avg_score),
        )
