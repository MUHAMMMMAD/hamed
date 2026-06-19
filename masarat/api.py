"""
واجهة برمجية (REST API) + لوحة ويب لنظام MASARAT AI عبر FastAPI.

التشغيل:
    uvicorn masarat.api:app --reload
ثم افتح:  http://127.0.0.1:8000/        (لوحة الويب)
          http://127.0.0.1:8000/docs    (توثيق الـ API)
"""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

from . import __app_name__, __version__, config
from .database import db, load_sample_tender
from .io import (
    generate_boq_template,
    generate_prices_template,
    import_boq,
    import_prices,
)
from .llm.council import Council
from .models import Tender, TenderAnalysis
from .pipeline import analyze_tender
from .reports import build_report, export_excel

app = FastAPI(title=__app_name__, version=__version__)

WEB_DIR = Path(__file__).parent / "web"


class CouncilQuery(BaseModel):
    question: str
    providers: list[str] | None = None


def _save_upload(upload: UploadFile, suffix: str) -> Path:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    with tmp as f:
        shutil.copyfileobj(upload.file, f)
    return Path(tmp.name)


# ===========================================================================
# لوحة الويب
# ===========================================================================
@app.get("/", response_class=HTMLResponse)
def dashboard() -> str:
    return (WEB_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/api")
def api_info() -> dict:
    return {
        "app": __app_name__,
        "version": __version__,
        "endpoints": [
            "/ (لوحة الويب)", "/docs", "/health", "/providers", "/prices",
            "/demo", "/analyze (POST)", "/analyze/excel (POST)", "/council (POST)",
            "/templates/boq", "/templates/prices",
            "/ui/demo", "/ui/analyze (POST)", "/ui/import-prices (POST)",
        ],
    }


# ===========================================================================
# واجهة API نظيفة (JSON)
# ===========================================================================
@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/providers")
def providers() -> list[dict]:
    return Council().status()


@app.get("/prices")
def prices() -> dict:
    return {
        "materials": [m.model_dump() for m in db.materials.values()],
        "labor": [l.model_dump() for l in db.labor.values()],
        "equipment": [e.model_dump() for e in db.equipment.values()],
        "subcontractors": [s.model_dump() for s in db.subcontractors.values()],
    }


@app.get("/demo", response_model=TenderAnalysis)
def demo() -> TenderAnalysis:
    return analyze_tender(load_sample_tender())


@app.post("/analyze", response_model=TenderAnalysis)
def analyze(tender: Tender) -> TenderAnalysis:
    if not tender.items:
        raise HTTPException(status_code=400, detail="المناقصة لا تحتوي بنوداً")
    return analyze_tender(tender)


@app.post("/analyze/excel")
def analyze_excel(tender: Tender) -> FileResponse:
    if not tender.items:
        raise HTTPException(status_code=400, detail="المناقصة لا تحتوي بنوداً")
    path = export_excel(analyze_tender(tender))
    return FileResponse(path, filename=path.name)


@app.post("/council")
def council(query: CouncilQuery) -> dict:
    return Council().deliberate(query.question, providers=query.providers)


# ===========================================================================
# القوالب والتنزيل
# ===========================================================================
@app.get("/templates/boq")
def template_boq() -> FileResponse:
    path = generate_boq_template()
    return FileResponse(path, filename=path.name)


@app.get("/templates/prices")
def template_prices() -> FileResponse:
    path = generate_prices_template()
    return FileResponse(path, filename=path.name)


@app.get("/download/{name}")
def download(name: str) -> FileResponse:
    # حماية من اجتياز المسارات: نأخذ الاسم فقط
    path = config.OUTPUT_DIR / Path(name).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="الملف غير موجود")
    return FileResponse(path, filename=path.name)


# ===========================================================================
# نقاط خدمة لوحة الويب (تُرجع التحليل + اسم ملف Excel للتنزيل)
# ===========================================================================
@app.get("/ui/demo")
def ui_demo() -> dict:
    analysis = analyze_tender(load_sample_tender())
    excel = export_excel(analysis)
    return {"analysis": analysis.model_dump(), "excel_file": excel.name}


@app.post("/ui/analyze")
async def ui_analyze(
    file: UploadFile = File(...),
    name: str = Form(""),
    client: str = Form("غير محدد"),
    project_type: str = Form("private"),
    duration_months: int = Form(12),
) -> dict:
    suffix = Path(file.filename or "boq.xlsx").suffix or ".xlsx"
    tmp = _save_upload(file, suffix)
    try:
        tender = import_boq(
            tmp,
            name=name or Path(file.filename or "مشروع").stem,
            client=client,
            project_type=project_type,
            duration_months=int(duration_months),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        tmp.unlink(missing_ok=True)

    analysis = analyze_tender(tender)
    excel = export_excel(analysis)
    return {"analysis": analysis.model_dump(), "excel_file": excel.name}


@app.post("/ui/import-prices")
async def ui_import_prices(file: UploadFile = File(...)) -> dict:
    tmp = _save_upload(file, ".xlsx")
    try:
        return import_prices(tmp)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        tmp.unlink(missing_ok=True)
