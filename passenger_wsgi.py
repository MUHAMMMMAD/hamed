"""
نقطة دخول cPanel / Passenger (للاستضافة المشتركة التي تدعم "Setup Python App").

Passenger يبحث عن متغيّر اسمه `application` بصيغة WSGI، بينما FastAPI يعمل
بصيغة ASGI — لذا نلفّه عبر a2wsgi.

في cPanel: اجعل "Application startup file" = passenger_wsgi.py
وتأكّد من تثبيت متطلبات requirements-min.txt داخل البيئة الافتراضية.
"""
from a2wsgi import ASGIMiddleware

from masarat.api import app

# المتغيّر الذي يبحث عنه Passenger
application = ASGIMiddleware(app)
