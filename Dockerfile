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

# فحص صحة الحاوية (يحترم منفذ المنصة PORT إن وُجد)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request as u,sys; p=os.getenv('PORT','8000'); sys.exit(0 if u.urlopen('http://127.0.0.1:'+p+'/health').status==200 else 1)"

# تشغيل الخادم — يستمع على PORT الذي تحدّده المنصة (أو 8000 افتراضياً)
CMD ["sh", "-c", "uvicorn masarat.api:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
