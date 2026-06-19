# MASARAT AI — صورة Docker لتشغيل لوحة الويب + الـ API
FROM python:3.11-slim

WORKDIR /app

# تثبيت المتطلبات أولاً للاستفادة من طبقات الكاش
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# نسخ المشروع
COPY . .

EXPOSE 8000

# تشغيل الخادم (لوحة الويب على / والـ API على /docs)
CMD ["uvicorn", "masarat.api:app", "--host", "0.0.0.0", "--port", "8000"]
