"""
محرك التسعير (Pricing Engine).
يحوّل جدول الكميات (BOQ) من مجرد جدول إلى "محرك تسعير حي" عبر تحليل السعر:
  تكلفة الوحدة = Σ (معامل المورد × سعر المورد)
ثم يجمّع التكاليف ويطبّق المصاريف والاحتياطي والمخاطر والربح والضريبة.

  التكلفة المباشرة = مواد + عمالة + معدات + مقاولو باطن
  إجمالي التكلفة   = مباشرة + مصاريف 10% + احتياطي 15% + معامل المخاطر
  سعر البيع        = إجمالي التكلفة + ربح 15%
  السعر النهائي    = سعر البيع + ضريبة 15%
"""
from __future__ import annotations

from ..database import Database, db as default_db
from ..models import CostBreakdown, PricingConfig, ResourceType, Tender


class PricingEngine:
    def __init__(self, database: Database | None = None) -> None:
        self.db = database or default_db

    # ------------------------------------------------------------------
    def price_item(self, item) -> None:
        """يحسب تكلفة بند واحد ويملأ حقوله (in-place)."""
        # حالة BOQ مُسعّر مسبقاً: لا يوجد تحليل سعر، لكن سعر الوحدة معروف
        if not item.resources and item.unit_rate:
            item.direct_total = round(item.unit_rate * item.quantity, 2)
            split = (
                item.material_cost + item.labor_cost
                + item.equipment_cost + item.subcontractor_cost
            )
            # ما تبقّى بعد أي تفصيل جزئي يُصنّف "غير مصنّف"
            item.other_cost = round(item.direct_total - split, 2)
            return

        material = labor = equipment = subcontractor = 0.0

        for use in item.resources:
            rtype = (
                use.resource_type.value
                if isinstance(use.resource_type, ResourceType)
                else str(use.resource_type)
            )
            rate = self.db.resource_rate(rtype, use.resource_id)
            cost_per_unit = use.coefficient * rate
            if rtype == "material":
                material += cost_per_unit
            elif rtype == "labor":
                labor += cost_per_unit
            elif rtype == "equipment":
                equipment += cost_per_unit
            elif rtype == "subcontractor":
                subcontractor += cost_per_unit

        item.material_cost = round(material * item.quantity, 2)
        item.labor_cost = round(labor * item.quantity, 2)
        item.equipment_cost = round(equipment * item.quantity, 2)
        item.subcontractor_cost = round(subcontractor * item.quantity, 2)
        item.unit_rate = round(material + labor + equipment + subcontractor, 2)
        item.direct_total = round(item.unit_rate * item.quantity, 2)

    # ------------------------------------------------------------------
    def price_tender(
        self,
        tender: Tender,
        config: PricingConfig | None = None,
        risk_factor_pct: float = 0.0,
    ) -> CostBreakdown:
        """يسعّر المناقصة كاملة ويُرجع تفصيل التكلفة."""
        cfg = config or PricingConfig()

        materials = labor = equipment = subs = other = 0.0
        for item in tender.items:
            self.price_item(item)
            materials += item.material_cost
            labor += item.labor_cost
            equipment += item.equipment_cost
            subs += item.subcontractor_cost
            other += item.other_cost

        direct = materials + labor + equipment + subs + other
        overhead = direct * cfg.overhead_pct
        contingency = direct * cfg.contingency_pct
        risk_adj = direct * (risk_factor_pct / 100.0)
        total_cost = direct + overhead + contingency + risk_adj
        profit = total_cost * cfg.profit_pct
        selling = total_cost + profit
        vat = selling * cfg.vat_pct
        final = selling + vat

        return CostBreakdown(
            materials=round(materials, 2),
            labor=round(labor, 2),
            equipment=round(equipment, 2),
            subcontractors=round(subs, 2),
            other=round(other, 2),
            direct_cost=round(direct, 2),
            overhead=round(overhead, 2),
            contingency=round(contingency, 2),
            risk_adjustment=round(risk_adj, 2),
            total_cost=round(total_cost, 2),
            profit=round(profit, 2),
            selling_price=round(selling, 2),
            vat=round(vat, 2),
            final_price=round(final, 2),
            margin_pct=round(profit / selling * 100.0, 2) if selling else 0.0,
        )
