"""
قراءة الرسومات الهندسية بصيغة DXF عبر ezdxf (الصيغة المفتوحة لأوتوكاد).
يستخرج: الطبقات، عدّ الكيانات، النصوص (وسوم/أبعاد)، أطوال الخطوط، ومساحات
المضلّعات المغلقة — كمساعدة لحصر الكميات وتحليل المخططات.

ملاحظة: DXF هي صيغة التبادل المفتوحة. لملفات DWG، صدّرها إلى DXF من أوتوكاد
(أو عبر أداة تحويل) ثم استوردها هنا.
"""
from __future__ import annotations

from pathlib import Path
from typing import List, Tuple


def _polygon_area(points: List[Tuple[float, float]]) -> float:
    """مساحة مضلّع مغلق (طريقة الحذاء/Shoelace)."""
    n = len(points)
    area = 0.0
    for i in range(n):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % n]
        area += x1 * y2 - x2 * y1
    return area / 2.0


def extract_dxf_info(path: str | Path) -> dict:
    """يُرجع ملخّصاً ذكياً عن محتوى ملف DXF."""
    import ezdxf

    doc = ezdxf.readfile(str(path))
    msp = doc.modelspace()

    layers = sorted(layer.dxf.name for layer in doc.layers)
    counts: dict[str, int] = {}
    texts: List[str] = []
    total_line_length = 0.0
    closed_area = 0.0

    for e in msp:
        etype = e.dxftype()
        counts[etype] = counts.get(etype, 0) + 1

        if etype == "TEXT":
            try:
                texts.append(str(e.dxf.text))
            except Exception:
                pass
        elif etype == "MTEXT":
            try:
                texts.append(e.plain_text())
            except Exception:
                pass
        elif etype == "LINE":
            try:
                s, en = e.dxf.start, e.dxf.end
                total_line_length += ((en[0] - s[0]) ** 2 + (en[1] - s[1]) ** 2) ** 0.5
            except Exception:
                pass
        elif etype == "LWPOLYLINE":
            try:
                if e.closed:
                    pts = [(p[0], p[1]) for p in e.get_points()]
                    closed_area += abs(_polygon_area(pts))
            except Exception:
                pass

    return {
        "layers": layers,
        "layer_count": len(layers),
        "entity_counts": counts,
        "text_count": len(texts),
        "texts_sample": texts[:50],
        "total_line_length": round(total_line_length, 2),
        "closed_polyline_area": round(closed_area, 2),
    }


def import_dxf(path: str | Path) -> dict:
    """واجهة موحّدة لقراءة DXF."""
    return extract_dxf_info(path)
