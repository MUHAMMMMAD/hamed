# MASARAT AI — صورة Docker لتشغيل لوحة الويب + الـ API (إنتاجي)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# تثبيت المتطلبات أولاً للاستفادة من طبقات الكاش
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ المشروع
COPY . .

EXPOSE 8000

# فحص صحة الحاوية
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"

# تشغيل الخادم بعدّة عمّال (لوحة الويب على / والـ API على /docs)
CMD ["uvicorn", "masarat.api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
