"""
محرك التدفقات النقدية (Cash Flow Engine).
يوزّع التكلفة والإيراد على أشهر المشروع باستخدام منحنى S، مع مراعاة:
الدفعة المقدمة، تأخّر تحصيل المستخلصات (شهر)، المحتجزات واستردادها.
يُخرج التدفق الشهري، التراكمي، وأقصى تمويل مطلوب.
"""
from __future__ import annotations

import math
from typing import List

from ..models import CashFlow, CashFlowMonth, CostBreakdown, Tender


def _s_curve_weights(n: int, steepness: float = 7.0) -> List[float]:
    """أوزان منحنى S لتوزيع الإنجاز عبر n شهراً (يجمع إلى 1)."""
    if n <= 1:
        return [1.0]

    def cdf(t: float) -> float:  # دالة لوجستية تراكمية على [0,1]
        return 1.0 / (1.0 + math.exp(-steepness * (t - 0.5)))

    raw = [cdf(i / n) - cdf((i - 1) / n) for i in range(1, n + 1)]
    total = sum(raw)
    return [r / total for r in raw]


class CashFlowEngine:
    def project(self, tender: Tender, cost: CostBreakdown) -> CashFlow:
        n = max(1, tender.duration_months)
        weights = _s_curve_weights(n)

        contract_value = cost.selling_price          # قيمة العقد (قبل الضريبة)
        total_cost = cost.total_cost                  # تكلفة المقاول (بدون ربح)
        advance = tender.advance_payment_pct * contract_value

        # مصفوفات بطول n+1 (الشهر الإضافي لإغلاق المستخلص الأخير والمحتجزات)
        size = n + 1
        costs = [0.0] * (size + 1)     # فهرسة 1..size
        revenue = [0.0] * (size + 1)

        revenue[1] += advance          # الدفعة المقدمة في الشهر الأول
        total_retention = 0.0

        for i in range(1, n + 1):
            costs[i] = total_cost * weights[i - 1]
            billing = contract_value * weights[i - 1]
            retention = tender.retention_pct * billing
            advance_recovery = tender.advance_payment_pct * billing
            total_retention += retention
            net_payment = billing - retention - advance_recovery
            revenue[i + 1] += net_payment   # تحصيل بعد شهر

        revenue[size] += total_retention    # إطلاق المحتجزات في الإغلاق

        months: List[CashFlowMonth] = []
        cumulative = 0.0
        peak = 0.0
        for i in range(1, size + 1):
            net = revenue[i] - costs[i]
            cumulative += net
            peak = min(peak, cumulative)
            months.append(
                CashFlowMonth(
                    month=i,
                    cost=round(costs[i], 2),
                    revenue=round(revenue[i], 2),
                    net=round(net, 2),
                    cumulative=round(cumulative, 2),
                )
            )

        return CashFlow(
            months=months,
            peak_funding_required=round(-peak, 2),
            final_cumulative=round(cumulative, 2),
        )
