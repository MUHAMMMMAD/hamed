# منصة مراسلات مسارات التشييد

تطبيق مراسلة بين الموظفين والعملاء لمؤسسة **مسارات التشييد للمقاولات** مع:

- واجهة مراسلات داخلية بين الموظف والعميل.
- اقتراح ردود بالذكاء الاصطناعي.
- لوحة تحكم إدارية للإحصائيات ومتابعة آخر الرسائل.
- تكامل واتساب أعمال (إرسال + استقبال عبر Webhook).
- دعم العمل على المسار `http://m-t.sa/mail`.

## التشغيل محلياً

```bash
python app.py
```

ثم افتح:

- `http://localhost:8000/mail/` للمنصة.
- `http://localhost:8000/mail/admin` للوحة الإدارة.

## متغيرات البيئة

```bash
export OPENAI_API_KEY="..."
export WHATSAPP_VERIFY_TOKEN="masarat_secure_token"
```

> عند عدم تعريف `OPENAI_API_KEY` سيستخدم التطبيق ردًا افتراضيًا ذكيًا.

## ربط واتساب أعمال

- Webhook verification endpoint:
  - `GET /webhooks/whatsapp`
- Webhook receive endpoint:
  - `POST /webhooks/whatsapp`
- إرسال رسالة واتساب عبر API:
  - `POST /api/whatsapp/send`

## النشر على `m-t.sa/mail`

يمكن تشغيل التطبيق خلف Nginx وتمرير المسار `/mail` إلى الخدمة.
التطبيق يدعم الروابط `/mail/` و `/mail/admin` مباشرة.
