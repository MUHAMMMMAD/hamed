import json
import os
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL, whatsapp_number TEXT)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS conversations (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              subject TEXT NOT NULL,
              employee_id INTEGER NOT NULL,
              client_id INTEGER NOT NULL,
              status TEXT NOT NULL DEFAULT 'open',
              updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              conversation_id INTEGER NOT NULL,
              sender_id INTEGER NOT NULL,
              receiver_id INTEGER NOT NULL,
              content TEXT NOT NULL,
              channel TEXT NOT NULL DEFAULT 'platform',
              created_at TEXT NOT NULL
            )
            """
        )
        if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            seed_data(conn)
        conn.commit()


def seed_data(conn: sqlite3.Connection) -> None:
    now = datetime.utcnow().isoformat()
    conn.executemany(
        "INSERT INTO users (name, role, whatsapp_number) VALUES (?, ?, ?)",
        [
            ("مدير النظام", "admin", None),
            ("المهندس أحمد", "employee", "966500000001"),
            ("المهندسة سارة", "employee", "966500000002"),
            ("شركة المدى", "client", "966511111111"),
            ("مؤسسة البناء الحديث", "client", "966522222222"),
        ],
    )
    conn.executemany(
        "INSERT INTO conversations (subject, employee_id, client_id, status, updated_at) VALUES (?, ?, ?, ?, ?)",
        [
            ("متابعة عقد مشروع الرياض", 2, 4, "open", now),
            ("استفسار حول تسعير الهيكل", 3, 5, "open", now),
        ],
    )
    conn.executemany(
        "INSERT INTO messages (conversation_id, sender_id, receiver_id, content, channel, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
            (1, 4, 2, "نحتاج تحديث جدول التنفيذ للأسبوع القادم.", "whatsapp", now),
            (1, 2, 4, "تم الاستلام، سنرسل الجدول خلال ساعتين.", "platform", now),
            (2, 5, 3, "هل السعر يشمل أعمال العزل؟", "whatsapp", now),
        ],
    )


def render_template(path: str, context: dict) -> bytes:
    content = (BASE_DIR / "templates" / path).read_text(encoding="utf-8")
    for key, value in context.items():
        content = content.replace("{{ " + key + " }}", str(value))
    return content.encode("utf-8")


def ai_suggest(messages: list[dict]) -> str:
    prompt = "\n".join([f"{m.get('sender_name', '')}: {m.get('content', '')}" for m in messages[-6:]])
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "مقترح رد ذكي: شكرًا لتواصلكم. تم استلام طلبكم وسيقوم فريق مسارات التشييد بالرد عليكم قريبًا."

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "أنت مساعد خدمة عملاء عربي رسمي لشركة مقاولات."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
    }
    try:
        req = Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً."


class Handler(BaseHTTPRequestHandler):
    def _send(self, code=200, body=b"", ctype="text/html; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, data, code=200):
        self._send(code, json.dumps(data, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ["/", "/mail/"]:
            return self._send(body=render_template("index.html", {"company_name": "مسارات التشييد للمقاولات"}))
        if path in ["/admin", "/mail/admin"]:
            return self._send(body=render_template("admin.html", {}))
        if path.startswith("/static/"):
            file_path = BASE_DIR / path.lstrip("/")
            if file_path.exists():
                ctype = "text/css; charset=utf-8" if file_path.suffix == ".css" else "text/plain; charset=utf-8"
                return self._send(body=file_path.read_bytes(), ctype=ctype)
            return self._send(404, b"not found")
        if path == "/api/admin/stats":
            with get_db() as conn:
                stats = {
                    "total_conversations": conn.execute("SELECT COUNT(*) FROM conversations").fetchone()[0],
                    "total_messages": conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0],
                    "employees": conn.execute("SELECT COUNT(*) FROM users WHERE role='employee'").fetchone()[0],
                    "clients": conn.execute("SELECT COUNT(*) FROM users WHERE role='client'").fetchone()[0],
                }
                recent = conn.execute(
                    """
                    SELECT m.content, m.channel, m.created_at, s.name sender_name, r.name receiver_name
                    FROM messages m
                    JOIN users s ON s.id = m.sender_id
                    JOIN users r ON r.id = m.receiver_id
                    ORDER BY m.id DESC LIMIT 12
                    """
                ).fetchall()
            return self._json({"stats": stats, "recent_messages": [dict(r) for r in recent]})
        if path == "/api/conversations":
            with get_db() as conn:
                rows = conn.execute(
                    """
                    SELECT c.id, c.subject, c.client_id, c.status, c.updated_at,
                           e.name employee_name, cl.name client_name
                    FROM conversations c
                    JOIN users e ON e.id = c.employee_id
                    JOIN users cl ON cl.id = c.client_id
                    ORDER BY c.updated_at DESC
                    """
                ).fetchall()
            return self._json([dict(r) for r in rows])
        if path.startswith("/api/conversations/") and path.endswith("/messages"):
            conversation_id = int(path.split("/")[3])
            with get_db() as conn:
                rows = conn.execute(
                    """
                    SELECT m.id, m.content, m.created_at, m.channel,
                           s.name sender_name, s.role sender_role, r.name receiver_name
                    FROM messages m
                    JOIN users s ON s.id = m.sender_id
                    JOIN users r ON r.id = m.receiver_id
                    WHERE m.conversation_id = ? ORDER BY m.id ASC
                    """,
                    (conversation_id,),
                ).fetchall()
            return self._json([dict(r) for r in rows])
        if path == "/webhooks/whatsapp":
            q = parse_qs(urlparse(self.path).query)
            token = q.get("hub.verify_token", [""])[0]
            challenge = q.get("hub.challenge", [""])[0]
            if token == os.getenv("WHATSAPP_VERIFY_TOKEN", "masarat_secure_token"):
                return self._send(200, challenge.encode("utf-8"), "text/plain; charset=utf-8")
            return self._send(403, b"forbidden", "text/plain; charset=utf-8")
        return self._send(404, b"not found", "text/plain; charset=utf-8")

    def do_POST(self):
        path = urlparse(self.path).path
        size = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(size) or b"{}")

        if path == "/api/messages":
            required = ["conversation_id", "sender_id", "receiver_id", "content"]
            if any(not payload.get(k) for k in required):
                return self._json({"error": "البيانات المطلوبة غير مكتملة"}, 400)
            now = datetime.utcnow().isoformat()
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO messages (conversation_id, sender_id, receiver_id, content, channel, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        payload["conversation_id"],
                        payload["sender_id"],
                        payload["receiver_id"],
                        payload["content"],
                        payload.get("channel", "platform"),
                        now,
                    ),
                )
                conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, payload["conversation_id"]))
                conn.commit()
            return self._json({"status": "ok"})

        if path == "/api/ai/suggest":
            return self._json({"suggestion": ai_suggest(payload.get("messages", []))})

        if path == "/api/whatsapp/send":
            to_number = payload.get("to")
            body = payload.get("body")
            if not to_number or not body:
                return self._json({"error": "رقم الوجهة ونص الرسالة مطلوبان"}, 400)
            return self._json({"status": "simulated", "message": "تم إرسال تجريبيًا (اضبط مفاتيح واتساب للإرسال الفعلي)."})

        if path == "/webhooks/whatsapp":
            save_incoming_whatsapp(payload)
            return self._send(200, b"ok", "text/plain; charset=utf-8")

        return self._send(404, b"not found", "text/plain; charset=utf-8")


def save_incoming_whatsapp(data: dict) -> None:
    for entry in data.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            msgs = value.get("messages", [])
            contacts = value.get("contacts", [])
            if not msgs:
                continue
            wa_id = contacts[0].get("wa_id") if contacts else None
            text = msgs[0].get("text", {}).get("body")
            if not wa_id or not text:
                continue
            with get_db() as conn:
                client = conn.execute("SELECT id FROM users WHERE whatsapp_number = ?", (wa_id,)).fetchone()
                if client:
                    client_id = client[0]
                else:
                    conn.execute("INSERT INTO users (name, role, whatsapp_number) VALUES (?, 'client', ?)", (f"عميل واتساب {wa_id[-4:]}", wa_id))
                    client_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                employee_id = 2
                conv = conn.execute("SELECT id FROM conversations WHERE client_id = ? ORDER BY id DESC LIMIT 1", (client_id,)).fetchone()
                if conv:
                    conversation_id = conv[0]
                else:
                    conn.execute(
                        "INSERT INTO conversations (subject, employee_id, client_id, status, updated_at) VALUES (?, ?, ?, 'open', ?)",
                        ("محادثة واتساب جديدة", employee_id, client_id, datetime.utcnow().isoformat()),
                    )
                    conversation_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                now = datetime.utcnow().isoformat()
                conn.execute(
                    "INSERT INTO messages (conversation_id, sender_id, receiver_id, content, channel, created_at) VALUES (?, ?, ?, ?, 'whatsapp', ?)",
                    (conversation_id, client_id, employee_id, text, now),
                )
                conn.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, conversation_id))
                conn.commit()


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    print("Server running on http://0.0.0.0:8000")
    server.serve_forever()
