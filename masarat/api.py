"""
واجهة برمجية (REST API) لنظام MASARAT AI عبر FastAPI.

التشغيل:
    uvicorn masarat.api:app --reload
ثم افتح:  http://127.0.0.1:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import __app_name__, __version__
from .database import db, load_sample_tender
from .llm.council import Council
from .models import Tender, TenderAnalysis
from .pipeline import analyze_tender
from .reports import build_report, export_excel

app = FastAPI(title=__app_name__, version=__version__)


class CouncilQuery(BaseModel):
    question: str
    providers: list[str] | None = None


@app.get("/")
def root() -> dict:
    return {
        "app": __app_name__,
        "version": __version__,
        "endpoints": [
            "/health", "/providers", "/prices",
            "/demo", "/analyze (POST)", "/analyze/excel (POST)",
            "/council (POST)", "/docs",
        ],
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/providers")
def providers() -> list[dict]:
    """حالة نماذج الذكاء الاصطناعي الثمانية."""
    return Council().status()


@app.get("/prices")
def prices() -> dict:
    """قواعد الأسعار (مواد، عمالة، معدات، مقاولو باطن)."""
    return {
        "materials": [m.model_dump() for m in db.materials.values()],
        "labor": [l.model_dump() for l in db.labor.values()],
        "equipment": [e.model_dump() for e in db.equipment.values()],
        "subcontractors": [s.model_dump() for s in db.subcontractors.values()],
    }


@app.get("/demo", response_model=TenderAnalysis)
def demo() -> TenderAnalysis:
    """تشغيل التحليل الكامل على المشروع النموذجي."""
    return analyze_tender(load_sample_tender())


@app.post("/analyze", response_model=TenderAnalysis)
def analyze(tender: Tender) -> TenderAnalysis:
    """رفع مناقصة (BOQ) والحصول على التحليل الكامل."""
    if not tender.items:
        raise HTTPException(status_code=400, detail="المناقصة لا تحتوي بنوداً")
    return analyze_tender(tender)


@app.post("/analyze/excel")
def analyze_excel(tender: Tender) -> FileResponse:
    """رفع مناقصة والحصول على ملف Excel (Cost Sheet)."""
    if not tender.items:
        raise HTTPException(status_code=400, detail="المناقصة لا تحتوي بنوداً")
    analysis = analyze_tender(tender)
    path = export_excel(analysis)
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=path.name,
    )


@app.post("/council")
def council(query: CouncilQuery) -> dict:
    """مداولة جماعية بين النماذج حول سؤال محدد."""
    return Council().deliberate(query.question, providers=query.providers)
