"""
واجهة سطر الأوامر (CLI) لنظام MASARAT AI.

أمثلة:
    python -m masarat demo                 # تشغيل التحليل الكامل على المشروع النموذجي
    python -m masarat status               # حالة نماذج الذكاء الاصطناعي
    python -m masarat prices               # عرض قواعد الأسعار
    python -m masarat analyze tender.json  # تحليل مناقصة من ملف
    python -m masarat council "سؤالك"      # مداولة جماعية بين النماذج
"""
from __future__ import annotations

import argparse
import json
import sys

from . import __app_name__, __version__, config
from .database import db, load_sample_tender, load_tender_from_file
from .io import (
    extract_dxf_info,
    generate_boq_template,
    generate_prices_template,
    import_boq,
    import_prices,
)
from .llm.council import Council
from .pipeline import analyze_tender
from .reports import build_report, export_excel


def _print_header() -> None:
    print("=" * 70)
    print(f"  {__app_name__}  v{__version__}")
    print(f"  منصة مسارات الذكية لتسعير ودراسة المناقصات")
    print("=" * 70)


def cmd_status(_args) -> None:
    _print_header()
    print(f"\nالوضع التجريبي مُفعّل قسرياً: {config.OFFLINE}\n")
    print(f"{'النموذج':<22}{'الوضع':<10}{'الدور'}")
    print("-" * 70)
    for p in Council().status():
        print(f"{p['display_name']:<22}{p['mode']:<10}{p['role']}")
    print(
        "\nملاحظة: النظام يعمل بالكامل في الوضع التجريبي بدون مفاتيح. "
        "أضف المفاتيح في .env لتفعيل التحليل الحقيقي."
    )


def cmd_prices(_args) -> None:
    _print_header()
    print("\n— المواد —")
    for m in db.materials.values():
        print(f"  {m.name_ar:<22} {m.unit_price:>8,.0f} {config.CURRENCY_AR}/{m.unit}")
    print("\n— العمالة (ريال/يوم) —")
    for l in db.labor.values():
        print(f"  {l.name_ar:<22} {l.daily_rate:>8,.0f}")
    print("\n— المعدات —")
    for e in db.equipment.values():
        print(f"  {e.name_ar:<22} {e.rate:>8,.0f} {config.CURRENCY_AR}/{e.unit}")
    print("\n— مقاولو الباطن —")
    for s in db.subcontractors.values():
        print(f"  {s.activity:<14} {s.name:<26} {s.unit_price:>6,.0f} ريال/{s.unit}")


def _run_analysis(tender, export: bool = True) -> None:
    analysis = analyze_tender(tender)
    print(build_report(analysis))
    if export:
        path = export_excel(analysis)
        print(f"\n📊 تم تصدير ملف Excel: {path}")
        # حفظ التقرير أيضاً
        md_path = config.OUTPUT_DIR / f"{tender.id}_report.md"
        md_path.write_text(build_report(analysis), encoding="utf-8")
        print(f"📄 تم حفظ التقرير: {md_path}")


def cmd_demo(_args) -> None:
    _print_header()
    print("\n▶ تشغيل التحليل الكامل على المشروع النموذجي...\n")
    _run_analysis(load_sample_tender())


def cmd_analyze(args) -> None:
    _print_header()
    tender = load_tender_from_file(args.file)
    print(f"\n▶ تحليل المناقصة: {tender.name}\n")
    _run_analysis(tender)


def cmd_import_boq(args) -> None:
    _print_header()
    tender = import_boq(
        args.file,
        name=args.name,
        client=args.client,
        project_type=args.type,
        duration_months=args.duration,
    )
    print(f"\n▶ تم استيراد {len(tender.items)} بنداً من: {args.file}\n")
    _run_analysis(tender)


def cmd_template(args) -> None:
    _print_header()
    if args.kind == "boq":
        path = generate_boq_template()
        print(f"\n✓ قالب جدول الكميات: {path}")
    else:
        path = generate_prices_template()
        print(f"\n✓ قالب الأسعار (مُعبّأ بالبيانات الحالية): {path}")
    print("املأ القالب ببياناتك الفعلية ثم استورده.")


def cmd_import_prices(args) -> None:
    _print_header()
    result = import_prices(args.file)
    print(f"\n✓ تم استيراد الأسعار الفعلية إلى النظام:")
    for sheet, n in result.get("imported", {}).items():
        print(f"   {sheet}: {n} سجلاً")
    if result.get("errors"):
        print("\n⚠️ صفوف تم تخطّيها:")
        for e in result["errors"][:10]:
            print(f"   - {e}")


def cmd_read_dxf(args) -> None:
    _print_header()
    info = extract_dxf_info(args.file)
    print(f"\n▶ تحليل الرسم: {args.file}\n")
    print(f"الطبقات ({info['layer_count']}): {', '.join(info['layers'][:15])}")
    print(f"عدّ الكيانات: {info['entity_counts']}")
    print(f"عدد النصوص: {info['text_count']}")
    print(f"إجمالي أطوال الخطوط: {info['total_line_length']:,.2f}")
    print(f"مساحة المضلّعات المغلقة: {info['closed_polyline_area']:,.2f}")
    if info["texts_sample"]:
        print("\nعيّنة من النصوص:")
        for t in info["texts_sample"][:15]:
            print(f"   • {t}")


def cmd_serve(args) -> None:
    import uvicorn

    _print_header()
    print(f"\n🌐 لوحة الويب: http://{args.host}:{args.port}/")
    print(f"📚 توثيق API: http://{args.host}:{args.port}/docs\n")
    uvicorn.run("masarat.api:app", host=args.host, port=args.port)


def cmd_council(args) -> None:
    _print_header()
    result = Council().deliberate(args.question)
    print(f"\n{result['summary']}\n")
    print(f"ثقة الإجماع: {result['consensus_confidence']}%\n")
    print("— الردود التفصيلية —")
    for resp in result["responses"]:
        print(f"\n[{resp['display_name']}] ({resp['role']}):")
        print(resp["content"])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="masarat", description=__app_name__
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("demo", help="تشغيل التحليل الكامل على المشروع النموذجي")
    sub.add_parser("status", help="حالة نماذج الذكاء الاصطناعي")
    sub.add_parser("prices", help="عرض قواعد الأسعار")

    p_an = sub.add_parser("analyze", help="تحليل مناقصة من ملف JSON")
    p_an.add_argument("file", help="مسار ملف المناقصة (BOQ JSON)")

    p_ib = sub.add_parser("import-boq", help="استيراد وتحليل BOQ من Excel/CSV/PDF")
    p_ib.add_argument("file", help="مسار ملف BOQ (.xlsx أو .csv أو .pdf)")
    p_ib.add_argument("--name", default=None, help="اسم المشروع")
    p_ib.add_argument("--client", default="غير محدد", help="العميل")
    p_ib.add_argument("--type", default="private",
                      choices=["government", "private", "epc", "subcontract"])
    p_ib.add_argument("--duration", type=int, default=12, help="المدة بالأشهر")

    p_tp = sub.add_parser("template", help="توليد قالب جاهز (BOQ أو الأسعار)")
    p_tp.add_argument("kind", choices=["boq", "prices"], help="نوع القالب")

    p_ip = sub.add_parser("import-prices", help="استيراد الأسعار الفعلية من قالب Excel")
    p_ip.add_argument("file", help="مسار قالب الأسعار (.xlsx)")

    p_dx = sub.add_parser("read-dxf", help="تحليل رسم هندسي بصيغة DXF")
    p_dx.add_argument("file", help="مسار ملف الرسم (.dxf)")

    p_sv = sub.add_parser("serve", help="تشغيل لوحة الويب + الـ API")
    p_sv.add_argument("--host", default="127.0.0.1")
    p_sv.add_argument("--port", type=int, default=8000)

    p_co = sub.add_parser("council", help="مداولة جماعية بين النماذج")
    p_co.add_argument("question", help="السؤال المطروح على المجلس")

    args = parser.parse_args(argv)

    handlers = {
        "demo": cmd_demo,
        "status": cmd_status,
        "prices": cmd_prices,
        "analyze": cmd_analyze,
        "import-boq": cmd_import_boq,
        "template": cmd_template,
        "import-prices": cmd_import_prices,
        "read-dxf": cmd_read_dxf,
        "serve": cmd_serve,
        "council": cmd_council,
    }
    if not args.command:
        cmd_demo(args)
        return 0
    handlers[args.command](args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
