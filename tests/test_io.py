"""اختبارات الإدخال/الإخراج: قراءة BOQ، القوالب، استيراد الأسعار."""
import shutil
from pathlib import Path

from openpyxl import Workbook

from masarat import config
from masarat.database import db
from masarat.io import (
    generate_boq_template,
    generate_prices_template,
    import_boq,
    import_prices,
)


def test_boq_template(tmp_path):
    assert generate_boq_template(tmp_path / "b.xlsx").exists()


def test_prices_template(tmp_path):
    assert generate_prices_template(tmp_path / "p.xlsx").exists()


def test_import_boq_excel(tmp_path):
    wb = Workbook()
    ws = wb.active
    ws.append(["عنوان المناقصة"])                       # صف عنوان يُتخطّى
    ws.append(["م", "الوصف", "الوحدة", "الكمية", "سعر الوحدة"])
    ws.append([1, "خرسانة", "م3", 100, 340])
    ws.append([2, "حديد", "طن", 10, 4900])
    f = tmp_path / "boq.xlsx"
    wb.save(f)
    t = import_boq(f, name="اختبار")
    assert len(t.items) == 2
    assert t.items[0].unit_rate == 340
    assert t.items[1].quantity == 10


def test_import_boq_csv(tmp_path):
    f = tmp_path / "boq.csv"
    f.write_text("code,description,unit,qty,rate\n1,Concrete,m3,50,340\n", encoding="utf-8")
    t = import_boq(f)
    assert len(t.items) == 1
    assert t.items[0].quantity == 50


def test_import_prices_roundtrip(tmp_path):
    """دورة كاملة معزولة: لا تلمس بيانات seed الحقيقية."""
    seed = tmp_path / "seed"
    seed.mkdir()
    for fl in Path(config.DATA_DIR).glob("*.json"):
        shutil.copy(fl, seed / fl.name)

    orig = config.DATA_DIR
    config.DATA_DIR = seed
    db.reload()
    try:
        tpl = generate_prices_template(tmp_path / "prices.xlsx")
        res = import_prices(tpl)
        assert res["imported"]["materials"] >= 10
        assert "MAT-STEEL" in db.materials
        assert db.suppliers["SUP-RAJHI"].last_updated  # حقل محفوظ
    finally:
        config.DATA_DIR = orig
        db.reload()
