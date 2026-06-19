"""
طبقة الوصول للبيانات (Data Access Layer).
تحمّل قواعد الأسعار والموردين ومقاولي الباطن والمشاريع السابقة من ملفات JSON
وتوفّر دوال بحث سريعة لمحرك التسعير.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from . import config
from .models import (
    BOQItem,
    Equipment,
    Labor,
    Material,
    PastProject,
    Subcontractor,
    Supplier,
    Tender,
)


def _load_json(name: str) -> list | dict:
    path = config.DATA_DIR / name
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


class Database:
    """مستودع بيانات في الذاكرة محمّل من ملفات seed."""

    def __init__(self) -> None:
        self.materials: Dict[str, Material] = {}
        self.labor: Dict[str, Labor] = {}
        self.equipment: Dict[str, Equipment] = {}
        self.suppliers: Dict[str, Supplier] = {}
        self.subcontractors: Dict[str, Subcontractor] = {}
        self.projects: Dict[str, PastProject] = {}
        self.reload()

    # ------------------------------------------------------------------
    def reload(self) -> None:
        self.materials = {
            m["id"]: Material(**m) for m in _load_json("materials.json")
        }
        self.labor = {l["id"]: Labor(**l) for l in _load_json("labor.json")}
        self.equipment = {
            e["id"]: Equipment(**e) for e in _load_json("equipment.json")
        }
        self.suppliers = {
            s["id"]: Supplier(**s) for s in _load_json("suppliers.json")
        }
        self.subcontractors = {
            s["id"]: Subcontractor(**s) for s in _load_json("subcontractors.json")
        }
        self.projects = {
            p["id"]: PastProject(**p) for p in _load_json("projects.json")
        }

    # ------------------------------------------------------------------
    # أسعار الموارد - الدالة الموحّدة التي يستخدمها محرك التسعير
    # ------------------------------------------------------------------
    def resource_rate(self, resource_type: str, resource_id: str) -> float:
        """يُرجع سعر الوحدة لأي مورد بحسب نوعه."""
        if resource_type == "material" and resource_id in self.materials:
            return self.materials[resource_id].unit_price
        if resource_type == "labor" and resource_id in self.labor:
            return self.labor[resource_id].daily_rate
        if resource_type == "equipment" and resource_id in self.equipment:
            return self.equipment[resource_id].rate
        if resource_type == "subcontractor" and resource_id in self.subcontractors:
            return self.subcontractors[resource_id].unit_price
        raise KeyError(f"مورد غير معروف: {resource_type}:{resource_id}")

    def resource_name(self, resource_type: str, resource_id: str) -> str:
        try:
            if resource_type == "material":
                return self.materials[resource_id].name_ar
            if resource_type == "labor":
                return self.labor[resource_id].name_ar
            if resource_type == "equipment":
                return self.equipment[resource_id].name_ar
            if resource_type == "subcontractor":
                return self.subcontractors[resource_id].name
        except KeyError:
            pass
        return resource_id

    # ------------------------------------------------------------------
    # المشاريع السابقة - مصدر التعلّم لمعايرة المخاطر والربحية
    # ------------------------------------------------------------------
    def historical_avg_deviation(self, project_type: str | None = None) -> float:
        """متوسط الانحراف التاريخي بين التكلفة المقدّرة والفعلية (%)."""
        items: List[PastProject] = list(self.projects.values())
        if project_type:
            items = [p for p in items if p.type.value == project_type]
        if not items:
            return 0.0
        return sum(p.deviation_pct for p in items) / len(items)

    def historical_avg_margin(self, project_type: str | None = None) -> float:
        """متوسط هامش الربح الفعلي التاريخي (%)."""
        items: List[PastProject] = list(self.projects.values())
        if project_type:
            items = [p for p in items if p.type.value == project_type]
        if not items:
            return 0.0
        margins = [
            (p.actual_profit / p.contract_value * 100.0)
            for p in items
            if p.contract_value
        ]
        return sum(margins) / len(margins) if margins else 0.0


def load_sample_tender() -> Tender:
    """تحميل المناقصة النموذجية (مبنى إداري)."""
    raw = _load_json("boq_sample.json")
    raw["items"] = [BOQItem(**i) for i in raw["items"]]
    return Tender(**raw)


def load_tender_from_file(path: str | Path) -> Tender:
    """تحميل مناقصة من ملف JSON خارجي يرفعه المستخدم."""
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    raw["items"] = [BOQItem(**i) for i in raw.get("items", [])]
    return Tender(**raw)


# نسخة وحيدة مشتركة (singleton)
db = Database()
