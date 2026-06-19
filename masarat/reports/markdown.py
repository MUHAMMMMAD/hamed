"""
تقرير الإدارة العليا (Executive Report) بصيغة Markdown.
يلخّص القرار، التسعير، المخاطر، التدفقات، ورؤى مجلس النماذج.
"""
from __future__ import annotations

from .. import __app_name_ar__, config
from ..models import TenderAnalysis


def _money(x: float) -> str:
    return f"{x:,.0f} {config.CURRENCY_AR}"


def build_report(a: TenderAnalysis) -> str:
    t, c, r, d, cf = a.tender, a.cost, a.risk, a.decision, a.cashflow
    L: list[str] = []

    L.append(f"# تقرير الإدارة العليا — {__app_name_ar__}")
    L.append("")
    L.append(f"## المشروع: {t.name}")
    L.append(
        f"- **العميل:** {t.client}  |  **الموقع:** {t.location}  |  "
        f"**النوع:** {t.type.value}  |  **المدة:** {t.duration_months} شهراً"
    )
    L.append("")

    # القرار التنفيذي
    verdict = {
        "BID": "✅ تقديم (BID)",
        "BID_WITH_CONDITIONS": "⚠️ تقديم بشروط (BID WITH CONDITIONS)",
        "NO_BID": "❌ عدم التقديم (NO BID)",
    }.get(d.decision.value, d.decision.value)
    L.append("## 1) القرار التنفيذي")
    L.append(f"> **{verdict}**")
    L.append("")
    L.append(f"- **درجة القرار:** {d.score}/100")
    L.append(f"- **احتمال الفوز:** {d.win_probability}%")
    L.append(f"- **المبرر:** {d.rationale}")
    if d.conditions:
        L.append("- **الشروط:**")
        for cond in d.conditions:
            L.append(f"  - {cond}")
    L.append("")

    # التسعير
    L.append("## 2) ملخص التسعير")
    L.append("| البند | القيمة |")
    L.append("|---|---|")
    L.append(f"| المواد | {_money(c.materials)} |")
    L.append(f"| العمالة | {_money(c.labor)} |")
    L.append(f"| المعدات | {_money(c.equipment)} |")
    L.append(f"| مقاولو الباطن | {_money(c.subcontractors)} |")
    if c.other:
        L.append(f"| غير مصنّف (سعر إجمالي) | {_money(c.other)} |")
    L.append(f"| **التكلفة المباشرة** | **{_money(c.direct_cost)}** |")
    L.append(f"| مصاريف إدارية | {_money(c.overhead)} |")
    L.append(f"| احتياطي | {_money(c.contingency)} |")
    L.append(f"| تعديل المخاطر | {_money(c.risk_adjustment)} |")
    L.append(f"| **إجمالي التكلفة** | **{_money(c.total_cost)}** |")
    L.append(f"| الربح | {_money(c.profit)} |")
    L.append(f"| **سعر البيع (قبل الضريبة)** | **{_money(c.selling_price)}** |")
    L.append(f"| ضريبة القيمة المضافة | {_money(c.vat)} |")
    L.append(f"| **السعر النهائي (شامل الضريبة)** | **{_money(c.final_price)}** |")
    L.append(f"| **هامش الربح** | **{c.margin_pct}%** |")
    L.append("")

    # المخاطر
    L.append("## 3) تحليل المخاطر")
    L.append(
        f"- **المستوى العام:** {r.overall_level.value}  |  "
        f"**معامل تعديل المخاطر:** {r.risk_factor_pct}%"
    )
    L.append("")
    L.append("| الفئة | الوصف | الدرجة | المستوى | إجراء التخفيف |")
    L.append("|---|---|---|---|---|")
    for ri in r.items:
        L.append(
            f"| {ri.category} | {ri.description} | {ri.score} | "
            f"{ri.level.value} | {ri.mitigation} |"
        )
    L.append("")

    # التدفقات النقدية
    L.append("## 4) التدفقات النقدية")
    L.append(f"- **أقصى تمويل مطلوب:** {_money(cf.peak_funding_required)}")
    L.append(f"- **صافي التراكم النهائي:** {_money(cf.final_cumulative)}")
    L.append("")
    L.append("| الشهر | التكلفة | الإيراد | الصافي | التراكمي |")
    L.append("|---|---|---|---|---|")
    for m in cf.months:
        L.append(
            f"| {m.month} | {m.cost:,.0f} | {m.revenue:,.0f} | "
            f"{m.net:,.0f} | {m.cumulative:,.0f} |"
        )
    L.append("")

    # رؤى مجلس الذكاء الاصطناعي
    L.append("## 5) رؤى مجلس الذكاء الاصطناعي (Multi-LLM Council)")
    if a.council_insights:
        for key, ins in a.council_insights.items():
            mode = "تجريبي" if ins.get("offline") else "حقيقي"
            L.append(
                f"- **{ins.get('display_name')}** [{ins.get('role')}] "
                f"({mode}، ثقة {ins.get('confidence')}%)"
            )
    else:
        L.append("- لا توجد رؤى (لم يتم استدعاء المجلس).")
    L.append("")

    L.append("---")
    L.append(
        "_تنبيه واقعي: لا يضمن أي نظام دقة 99.99% قبل التنفيذ. الهدف الواقعي "
        "دقة 80–90% مبدئياً، ترتفع إلى 95–98% بربط الأسعار الفعلية وبيانات "
        "المشاريع المنفّذة._"
    )
    return "\n".join(L)
