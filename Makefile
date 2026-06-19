.PHONY: install dev demo serve test docker clean

install:        ## تثبيت المتطلبات
	pip install -r requirements.txt

dev:            ## تثبيت كحزمة قابلة للتعديل + أدوات التطوير
	pip install -e ".[dev]"

demo:           ## تشغيل التحليل الكامل على المشروع النموذجي
	python -m masarat demo

serve:          ## تشغيل لوحة الويب + الـ API
	python -m masarat serve

test:           ## تشغيل الاختبارات
	pytest

docker:         ## بناء صورة Docker
	docker build -t masarat-ai .

clean:          ## حذف المخرجات والكاش
	rm -rf output __pycache__ */__pycache__ */*/__pycache__ .pytest_cache
