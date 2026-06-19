"""اختبارات قراءة الرسومات (DXF) وملفات PDF."""
import pytest


def test_dxf_extraction(tmp_path):
    ezdxf = pytest.importorskip("ezdxf")
    from masarat.io import extract_dxf_info

    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (4, 0), (4, 5), (0, 5)], close=True)  # مساحة 20
    msp.add_text("room").set_placement((1, 1))
    f = tmp_path / "d.dxf"
    doc.saveas(f)

    info = extract_dxf_info(f)
    assert info["closed_polyline_area"] == 20.0
    assert info["text_count"] == 1
    assert info["entity_counts"].get("LWPOLYLINE") == 1


def test_pdf_boq_import(tmp_path):
    fitz = pytest.importorskip("fitz")
    from masarat.io import import_boq

    doc = fitz.open()
    page = doc.new_page()
    y = 72
    for line in [
        "code    description    unit    qty    rate",
        "1    Concrete    m3    50    340",
        "2    Steel    ton    5    4900",
    ]:
        page.insert_text((50, y), line, fontsize=11)
        y += 22
    f = tmp_path / "b.pdf"
    doc.save(str(f))
    doc.close()

    t = import_boq(f, name="pdf")
    assert len(t.items) >= 1
