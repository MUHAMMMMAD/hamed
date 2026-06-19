#!/usr/bin/env bash
# نشر سريع لـ MASARAT AI عبر Docker Compose على خادم Ubuntu.
# الاستخدام:  bash deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

# 1) تجهيز ملف الإعدادات إن لم يوجد
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ أُنشئ ملف .env (عدّله لإضافة مفاتيح الـ API اختيارياً)"
fi

# 2) اختيار أمر compose المتاح
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "✗ Docker Compose غير مثبّت. ثبّت Docker أولاً." >&2
  exit 1
fi

# 3) البناء والتشغيل
$COMPOSE up -d --build
$COMPOSE ps

echo ""
echo "✓ تم النشر. افتح:  http://<عنوان-الخادم>/"
echo "  السجلات:   $COMPOSE logs -f"
echo "  الإيقاف:   $COMPOSE down"
