#!/usr/bin/env python3
"""
يبني النسخة الثابتة (Static Edition) من MASARAT AI:
ملف واحد static/index.html يعمل بالكامل في المتصفح بلا خادم — قابل للرفع
على أي استضافة (cPanel/أي موقع). يدمج: البيانات + محرّكات JS + قارئ BOQ + الواجهة.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "seed"
TOOLS = ROOT / "tools"
OUT = ROOT / "static" / "index.html"


def load(name):
    return json.loads((SEED / name).read_text(encoding="utf-8"))


def to_map(arr):
    return {x["id"]: x for x in arr}


def build_data_js():
    db = {
        "materials": to_map(load("materials.json")),
        "labor": to_map(load("labor.json")),
        "equipment": to_map(load("equipment.json")),
        "subcontractors": to_map(load("subcontractors.json")),
        "suppliers": to_map(load("suppliers.json")),
        "projects": to_map(load("projects.json")),
    }
    sample = load("boq_sample.json")
    payload = {"db": db, "sample": sample}
    return "const DATA = " + json.dumps(payload, ensure_ascii=False) + ";"


SHELL = r"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MASARAT AI — منصة تسعير المناقصات (نسخة المتصفح)</title>
<script>/*__XLSX_LIB__*/</script>
<style>
  :root{ --navy:#1F4E78; --navy2:#2c6aa0; --bg:#f4f6fa; --card:#fff;
         --ok:#1e7d34; --warn:#b8860b; --bad:#b3261e; --line:#e2e8f0; }
  *{box-sizing:border-box}
  body{margin:0;font-family:"Segoe UI",Tahoma,sans-serif;background:var(--bg);color:#1a2433}
  header{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;padding:22px 28px}
  header h1{margin:0;font-size:22px} header p{margin:6px 0 0;opacity:.9;font-size:13px}
  .wrap{max-width:1100px;margin:0 auto;padding:20px}
  nav{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
  nav button{background:#fff;border:1px solid var(--line);padding:10px 16px;border-radius:10px;
             cursor:pointer;font-size:14px;font-weight:600;color:var(--navy)}
  nav button.active{background:var(--navy);color:#fff;border-color:var(--navy)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:18px;
        box-shadow:0 1px 3px rgba(0,0,0,.04)}
  .card h2{margin:0 0 14px;font-size:17px;color:var(--navy)}
  .row{display:flex;gap:12px;flex-wrap:wrap;align-items:end}
  label{display:block;font-size:13px;margin-bottom:4px;color:#475569;font-weight:600}
  input,select{padding:9px 11px;border:1px solid var(--line);border-radius:8px;font-size:14px;font-family:inherit}
  .btn{background:var(--navy);color:#fff;border:none;padding:11px 20px;border-radius:9px;cursor:pointer;font-size:14px;font-weight:700}
  .btn:hover{background:var(--navy2)} .btn.alt{background:#eef2f7;color:var(--navy)}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
  th,td{border:1px solid var(--line);padding:8px 10px;text-align:right}
  th{background:#eef2f7;color:var(--navy)} tr:nth-child(even) td{background:#fafbfd}
  td[contenteditable]{background:#fffdf3;cursor:text}
  .verdict{font-size:20px;font-weight:800;padding:14px;border-radius:10px;text-align:center;margin-bottom:14px}
  .v-BID{background:#d8f3df;color:var(--ok)} .v-NO_BID{background:#f9d9d6;color:var(--bad)}
  .v-BID_WITH_CONDITIONS{background:#fdecc8;color:var(--warn)}
  .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
  .kpi{background:#f7f9fc;border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center}
  .kpi .v{font-size:20px;font-weight:800;color:var(--navy)} .kpi .l{font-size:12px;color:#64748b;margin-top:3px}
  .muted{color:#64748b;font-size:13px} .hidden{display:none}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:#d8f3df;color:var(--ok)}
</style>
</head>
<body>
<header>
  <h1>🏗️ MASARAT AI — منصة ذكاء التكاليف</h1>
  <p>نسخة المتصفح الثابتة · تعمل بلا خادم · شركة مسارات التشييد</p>
</header>
<div class="wrap">
  <nav>
    <button data-tab="analyze" class="active">📊 تحليل مشروع</button>
    <button data-tab="prices">💲 الأسعار</button>
    <button data-tab="about">ℹ️ حول</button>
  </nav>

  <section id="tab-analyze">
    <div class="card">
      <h2>تشغيل سريع <span class="badge">يعمل فوراً</span></h2>
      <p class="muted">جرّب النظام على مشروع نموذجي (مبنى إداري) دون رفع ملف.</p>
      <button class="btn" id="btnDemo">▶ تشغيل المشروع النموذجي</button>
    </div>
    <div class="card">
      <h2>رفع جدول كميات (BOQ)</h2>
      <p class="muted">ارفع ملف Excel (.xlsx) أو CSV — يُكتشف الأعمدة تلقائياً، والحساب يتم داخل متصفحك.</p>
      <div class="row">
        <div><label>اسم المشروع</label><input id="pName" placeholder="مثال: مبنى تجاري"></div>
        <div><label>العميل</label><input id="pClient" placeholder="اسم العميل"></div>
        <div><label>النوع</label><select id="pType">
          <option value="government">حكومي</option><option value="private" selected>خاص</option>
          <option value="epc">EPC</option><option value="subcontract">مقاول باطن</option></select></div>
        <div><label>المدة (شهر)</label><input id="pDur" type="number" value="12" style="width:90px"></div>
      </div>
      <div class="row" style="margin-top:12px">
        <div><label>ملف BOQ</label><input id="boqFile" type="file" accept=".xlsx,.xls,.xlsm,.csv"></div>
        <button class="btn" id="btnUpload">⬆ رفع وتحليل</button>
      </div>
    </div>
    <div id="results" class="hidden"></div>
  </section>

  <section id="tab-prices" class="hidden">
    <div class="card">
      <h2>قواعد الأسعار <span class="muted">(عدّلها وتُحفظ في متصفحك)</span></h2>
      <div class="row" style="margin-bottom:12px">
        <button class="btn" id="btnSavePrices">💾 حفظ التعديلات</button>
        <button class="btn alt" id="btnResetPrices">↺ استعادة الافتراضي</button>
      </div>
      <div id="pricesOut"></div>
    </div>
  </section>

  <section id="tab-about" class="hidden">
    <div class="card">
      <h2>عن هذه النسخة</h2>
      <p class="muted">نسخة المتصفح الثابتة من MASARAT AI: محرّك التسعير والمخاطر والقرار
      والتدفقات والتعلّم — كلها تعمل داخل متصفحك بلا خادم، فترفعها على أي استضافة عادية.</p>
      <p class="muted">ملاحظة: مجلس نماذج الذكاء الاصطناعي (ChatGPT/Claude/...) يحتاج خادماً
      ومفاتيح، لذا يتوفّر في "نسخة الخادم" الكاملة. هذه النسخة تركّز على محرّك التسعير الكامل.</p>
      <p class="muted">تنبيه واقعي: لا يضمن أي نظام دقة 99.99% قبل التنفيذ — الهدف 80–90% مبدئياً،
      صعوداً إلى 95–98% بإدخال أسعارك ومشاريعك الفعلية في تبويب «الأسعار».</p>
    </div>
  </section>
  <p class="muted" style="text-align:center;margin:24px 0">MASARAT AI · Static Edition · شركة مسارات التشييد</p>
</div>

<script>
/*__DATA__*/
/*__ENGINE__*/
/*__BOQ__*/
/*__UI__*/
</script>
</body>
</html>
"""

UI = r"""
const $ = (s) => document.querySelector(s);
const money = (n) => (n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 }) + " ريال";
const DB_KEY = "masarat_db_v1";

let DB = JSON.parse(JSON.stringify(DATA.db));
try { const saved = localStorage.getItem(DB_KEY); if (saved) DB = JSON.parse(saved); } catch (e) {}

document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => {
  document.querySelectorAll("nav button").forEach((x) => x.classList.remove("active"));
  b.classList.add("active");
  ["analyze", "prices", "about"].forEach((t) => $("#tab-" + t).classList.add("hidden"));
  $("#tab-" + b.dataset.tab).classList.remove("hidden");
  if (b.dataset.tab === "prices") renderPrices();
}));

let LAST = null;
function renderAnalysis(a) {
  LAST = a;
  const d = a.decision, c = a.cost, r = a.risk, cf = a.cashflow, ln = a.learning;
  const vtext = { BID: "✅ تقديم (BID)", NO_BID: "❌ عدم التقديم (NO BID)", BID_WITH_CONDITIONS: "⚠️ تقديم بشروط" }[d.decision];
  let h = `<div class="card"><div class="verdict v-${d.decision}">${vtext}</div>
    <div class="kpis">
      <div class="kpi"><div class="v">${d.score}</div><div class="l">درجة القرار /100</div></div>
      <div class="kpi"><div class="v">${d.win_probability}%</div><div class="l">احتمال الفوز</div></div>
      <div class="kpi"><div class="v">${c.margin_pct}%</div><div class="l">هامش الربح</div></div>
      <div class="kpi"><div class="v">${r.overall_level}</div><div class="l">مستوى المخاطر</div></div></div>
    <div class="kpis">
      <div class="kpi"><div class="v">${money(c.direct_cost)}</div><div class="l">التكلفة المباشرة</div></div>
      <div class="kpi"><div class="v">${money(c.selling_price)}</div><div class="l">سعر البيع</div></div>
      <div class="kpi"><div class="v">${money(c.final_price)}</div><div class="l">شامل الضريبة</div></div>
      <div class="kpi"><div class="v">${money(cf.peak_funding_required)}</div><div class="l">أقصى تمويل مطلوب</div></div></div>
    <p class="muted">${d.rationale}</p>
    <button class="btn" id="btnExport">⬇ تصدير CSV</button></div>`;

  const cr = [["المواد", c.materials], ["العمالة", c.labor], ["المعدات", c.equipment],
    ["مقاولو الباطن", c.subcontractors], ["غير مصنّف", c.other], ["<b>التكلفة المباشرة</b>", c.direct_cost],
    ["مصاريف إدارية", c.overhead], ["احتياطي", c.contingency], ["تعديل المخاطر", c.risk_adjustment],
    ["<b>إجمالي التكلفة</b>", c.total_cost], ["الربح", c.profit], ["<b>سعر البيع</b>", c.selling_price],
    ["ضريبة 15%", c.vat], ["<b>السعر النهائي</b>", c.final_price]];
  h += `<div class="card"><h2>تفصيل التكلفة</h2><table><tr><th>البند</th><th>القيمة</th></tr>` +
    cr.map((x) => `<tr><td>${x[0]}</td><td>${money(x[1])}</td></tr>`).join("") + `</table></div>`;

  if (ln && ln.sample_size) h += `<div class="card"><h2>التعلّم الآلي (${ln.sample_size} مشروعاً)</h2>
    <table><tr><th>المؤشر</th><th>القيمة</th></tr>
    <tr><td>الانحراف المتوقّع</td><td>${ln.predicted_deviation_pct}%</td></tr>
    <tr><td>الاحتياطي الموصى به (مُطبّق)</td><td>${ln.recommended_contingency_pct}%</td></tr>
    <tr><td>هامش الربح الموصى به</td><td>${ln.recommended_margin_pct}%</td></tr>
    <tr><td>الثقة</td><td>${ln.confidence}%</td></tr></table></div>`;

  h += `<div class="card"><h2>سجل المخاطر (معامل ${r.risk_factor_pct}%)</h2><table>
    <tr><th>الفئة</th><th>الوصف</th><th>الدرجة</th><th>المستوى</th><th>التخفيف</th></tr>` +
    r.items.map((x) => `<tr><td>${x.category}</td><td>${x.description}</td><td>${x.score}</td><td>${x.level}</td><td>${x.mitigation}</td></tr>`).join("") + `</table></div>`;

  h += `<div class="card"><h2>التدفقات النقدية</h2><table>
    <tr><th>الشهر</th><th>التكلفة</th><th>الإيراد</th><th>الصافي</th><th>التراكمي</th></tr>` +
    cf.months.map((m) => `<tr><td>${m.month}</td><td>${money(m.cost)}</td><td>${money(m.revenue)}</td><td>${money(m.net)}</td><td>${money(m.cumulative)}</td></tr>`).join("") + `</table></div>`;

  $("#results").innerHTML = h;
  $("#results").classList.remove("hidden");
  $("#btnExport").onclick = exportCSV;
  $("#results").scrollIntoView({ behavior: "smooth" });
}

function run(tender) {
  try { renderAnalysis(MasaratEngine.analyze(JSON.parse(JSON.stringify(tender)), DB)); }
  catch (e) { alert("خطأ: " + e.message); }
}
$("#btnDemo").onclick = () => run(DATA.sample);

$("#btnUpload").onclick = () => {
  const f = $("#boqFile").files[0];
  if (!f) { alert("اختر ملف BOQ أولاً"); return; }
  const meta = { name: $("#pName").value || f.name, client: $("#pClient").value || "غير محدد",
    type: $("#pType").value, duration_months: parseInt($("#pDur").value) || 12 };
  const reader = new FileReader();
  const isCsv = f.name.toLowerCase().endsWith(".csv");
  reader.onload = (ev) => {
    try {
      let rows;
      if (isCsv) rows = MasaratBOQ.parseCSV(ev.target.result);
      else {
        if (typeof XLSX === "undefined") { alert("تعذّر تحميل مكتبة قراءة Excel. جرّب حفظ الملف بصيغة CSV ثم ارفعه."); return; }
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });
      }
      run(MasaratBOQ.buildTenderFromRows(rows, meta));
    } catch (e) { alert("تعذّر القراءة: " + e.message); }
  };
  if (isCsv) reader.readAsText(f, "utf-8"); else reader.readAsArrayBuffer(f);
};

function exportCSV() {
  if (!LAST) return;
  const c = LAST.cost;
  const rows = [["البند", "القيمة"], ["المواد", c.materials], ["العمالة", c.labor], ["المعدات", c.equipment],
    ["مقاولو الباطن", c.subcontractors], ["غير مصنّف", c.other], ["التكلفة المباشرة", c.direct_cost],
    ["مصاريف إدارية", c.overhead], ["احتياطي", c.contingency], ["تعديل المخاطر", c.risk_adjustment],
    ["إجمالي التكلفة", c.total_cost], ["الربح", c.profit], ["سعر البيع", c.selling_price],
    ["ضريبة", c.vat], ["السعر النهائي", c.final_price], ["هامش الربح %", c.margin_pct],
    ["القرار", LAST.decision.decision], ["احتمال الفوز %", LAST.decision.win_probability]];
  const csv = "﻿" + rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "masarat_cost_sheet.csv"; a.click();
}

function renderPrices() {
  const mk = (title, arr, cols, fields) => `<h2>${title}</h2><table><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>` +
    arr.map((o) => `<tr data-id="${o.id}" data-kind="${title}">` +
      fields.map((f) => `<td contenteditable data-f="${f}">${o[f]}</td>`).join("") + `</tr>`).join("") + `</table>`;
  $("#pricesOut").innerHTML =
    mk("materials", Object.values(DB.materials), ["المادة", "السعر", "الوحدة", "الاتجاه%"], ["name_ar", "unit_price", "unit", "trend_pct"]) +
    mk("labor", Object.values(DB.labor), ["المهنة", "الأجر اليومي"], ["name_ar", "daily_rate"]) +
    mk("subcontractors", Object.values(DB.subcontractors), ["النشاط", "المقاول", "السعر"], ["activity", "name", "unit_price"]);
}

$("#btnSavePrices").onclick = () => {
  document.querySelectorAll("#pricesOut tr[data-id]").forEach((tr) => {
    const kind = tr.dataset.kind, id = tr.dataset.id;
    tr.querySelectorAll("td[data-f]").forEach((td) => {
      const f = td.dataset.f; let v = td.innerText.trim();
      if (["unit_price", "daily_rate", "trend_pct", "rate"].includes(f)) v = parseFloat(v) || 0;
      if (DB[kind] && DB[kind][id]) DB[kind][id][f] = v;
    });
  });
  localStorage.setItem(DB_KEY, JSON.stringify(DB));
  alert("✓ حُفظت الأسعار في متصفحك وستُستخدم في كل التحليلات.");
};
$("#btnResetPrices").onclick = () => {
  localStorage.removeItem(DB_KEY); DB = JSON.parse(JSON.stringify(DATA.db)); renderPrices();
  alert("↺ استُعيدت الأسعار الافتراضية.");
};
"""


def main():
    data_js = build_data_js()
    engine_js = (TOOLS / "engine.js").read_text(encoding="utf-8")
    boq_js = (TOOLS / "boq.js").read_text(encoding="utf-8")
    # مكتبة قراءة Excel مُضمّنة داخل الملف (تعمل بلا إنترنت)
    xlsx_lib = (TOOLS / "vendor" / "xlsx.full.min.js").read_text(encoding="utf-8")
    xlsx_lib = xlsx_lib.replace("</script>", "<\\/script>")
    html = (
        SHELL.replace("/*__DATA__*/", data_js)
        .replace("/*__ENGINE__*/", engine_js)
        .replace("/*__BOQ__*/", boq_js)
        .replace("/*__UI__*/", UI)
        .replace("/*__XLSX_LIB__*/", xlsx_lib)
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"✓ بُنيت النسخة الثابتة: {OUT}  ({len(html):,} حرف، شاملة مكتبة Excel)")


if __name__ == "__main__":
    main()
