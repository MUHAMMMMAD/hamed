"""
استخراج جداول/نصوص جدول الكميات من ملفات PDF عبر PyMuPDF (fitz).
يحاول أولاً اكتشاف الجداول، ثم يرجع إلى تقسيم الأسطر النصية عند الحاجة.
تُمرَّر الصفوف الناتجة إلى نفس منطق التحليل في boq_import.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import List


def extract_pdf_rows(path: str | Path) -> List[List]:
    """يُرجع صفوف الجدول كقوائم خلايا (نص)."""
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise RuntimeError(
            "قراءة PDF تتطلب مكتبة pymupdf. ثبّتها عبر: pip install pymupdf "
            "— أو استخدم ملف Excel/CSV بدلاً من PDF."
        ) from exc

    rows: List[List] = []
    doc = fitz.open(str(path))
    try:
        for page in doc:
            extracted = False
            try:
                finder = page.find_tables()
                tables = getattr(finder, "tables", []) or []
            except Exception:
                tables = []
            for tbl in tables:
                try:
                    for r in tbl.extract():
                        rows.append(["" if c is None else str(c).strip() for c in r])
                    extracted = True
                except Exception:
                    continue
            if not extracted:  # احتياطي: تقسيم الأسطر النصية
                text = page.get_text("text") or ""
                for line in text.splitlines():
                    line = line.strip()
                    if line:
                        rows.append(re.split(r"\s{2,}|\t", line))
    finally:
        doc.close()
    return rows
