# 🚀 دليل نشر MASARAT AI على خادم الشركة

هذا الدليل لنشر النظام على خادم خاص (VPS / سيرفر الشركة) بحيث يعمل برابط
دائم يصل إليه فريقك من أي جهاز. توجد طريقتان — اختر واحدة.

**متطلبات الخادم:** Ubuntu 22.04+ · ذاكرة 2GB+ · (نطاق Domain اختياري لـ HTTPS).

---

## الطريقة (أ) — Docker Compose ✅ (الموصى بها)

### 1) تثبيت Docker (مرة واحدة)
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # ثم سجّل خروج/دخول
```

### 2) جلب الكود
```bash
git clone https://github.com/MUHAMMMMAD/hamed.git
cd hamed
git checkout claude/gallant-cerf-aq45eq
```

### 3) النشر بأمر واحد
```bash
bash deploy/deploy.sh
```
أو يدوياً:
```bash
cp .env.example .env          # (اختياري) أضف مفاتيح الـ API داخل .env
docker compose up -d --build
```

### 4) الوصول
افتح: `http://عنوان-الخادم/` — لوحة الويب جاهزة. الـ API على `/docs`.

> Nginx يستقبل على المنفذ 80 ويمرّر للتطبيق داخلياً (المنفذ 8000 غير مكشوف).

### 5) أوامر الصيانة
```bash
docker compose logs -f          # متابعة السجلات
docker compose restart          # إعادة تشغيل
docker compose down             # إيقاف
git pull && docker compose up -d --build   # تحديث لأحدث نسخة
```

---

## الطريقة (ب) — بدون Docker (systemd + Nginx)

### 1) التثبيت
```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nginx
sudo mkdir -p /opt/masarat && sudo chown $USER /opt/masarat
git clone https://github.com/MUHAMMMMAD/hamed.git /opt/masarat
cd /opt/masarat && git checkout claude/gallant-cerf-aq45eq
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 2) تشغيل التطبيق كخدمة
```bash
sudo cp deploy/masarat.service /etc/systemd/system/masarat.service
sudo systemctl daemon-reload
sudo systemctl enable --now masarat
sudo systemctl status masarat        # تأكّد أنها active
```

### 3) Nginx وكيلاً عكسياً
أنشئ `/etc/nginx/sites-available/masarat`:
```nginx
server {
    listen 80;
    server_name tender.masarat.com;     # أو عنوان الخادم
    client_max_body_size 50M;
    location / {
        proxy_pass         http://127.0.0.1:8000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```
ثم:
```bash
sudo ln -s /etc/nginx/sites-available/masarat /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### تحديث النسخة لاحقاً
```bash
cd /opt/masarat && git pull
.venv/bin/pip install -r requirements.txt
sudo systemctl restart masarat
```

---

## 🔒 تفعيل HTTPS (نطاق + شهادة مجانية)

بعد توجيه نطاقك (سجل A) إلى عنوان الخادم:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tender.masarat.com
```
certbot يضيف كتلة 443 ويجدّد الشهادة تلقائياً.
(في مسار Docker: استخدم حاوية certbot أو أصدر الشهادة ثم فعّل كتلة 443 في
`deploy/nginx.conf` وأزل التعليق عن منفذ 443 في `docker-compose.yml`.)

---

## 🛡️ الجدار الناري (مستحسن)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```
لا تفتح المنفذ 8000 للإنترنت — يبقى خلف Nginx.

---

## 💾 النسخ الاحتياطي
بياناتك الفعلية ومخرجاتك في مجلدين فقط:
- `data/seed/` — أسعارك ومورّدوك ومشاريعك السابقة.
- `output/` — التقارير وملفات Excel المُولّدة.

انسخهما دورياً:
```bash
tar czf masarat-backup-$(date +%F).tar.gz data/seed output
```

---

## 🔑 مفاتيح الذكاء الاصطناعي (اختياري)
النظام يعمل بلا مفاتيح (وضع تجريبي). لتفعيل النماذج الحقيقية، أضف المفاتيح
في `.env` (انظر `.env.example`) ثم أعد التشغيل. لا تُرفع `.env` إلى Git أبداً.
