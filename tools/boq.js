/*
 * قارئ جداول الكميات (BOQ) بصيغة JavaScript — منقول عن boq_import.py.
 * يكتشف الأعمدة من ترويسات عربية/إنجليزية ويبني كائن مناقصة. CSV أصلاً،
 * وExcel عبر SheetJS (في المتصفح). يعمل في المتصفح وNode.
 */
(function (root) {
  "use strict";

  const KW = {
    code: ["الكود", "كود", "رقم البند", "رقم", "بند رقم", "item no", "code", "s/n", "sr", "م", "#", "ت", "no"],
    description: ["الوصف", "وصف", "البند", "بيان", "الأعمال", "الاعمال", "description", "desc"],
    unit: ["الوحدة", "وحدة", "unit", "uom"],
    quantity: ["الكمية", "كمية", "كميه", "العدد", "quantity", "qty"],
    unit_rate: ["سعر الوحدة", "السعر", "سعر", "الفئة", "فئة", "unit rate", "unit price", "rate", "price"],
    total: ["الإجمالي", "الاجمالي", "اجمالي", "القيمة", "قيمة", "total", "amount"],
    material: ["مواد", "خامات", "material"],
    labor: ["عمالة", "عمال", "labor", "labour"],
    equipment: ["معدات", "آليات", "اليات", "equipment"],
    subcontractor: ["مقاول باطن", "باطن", "subcontractor", "sub-contractor"],
  };
  const ORDER = ["code", "description", "quantity", "unit_rate", "total", "material", "labor", "equipment", "subcontractor", "unit"];

  const norm = (x) => (x == null ? "" : String(x).trim().toLowerCase());

  function toFloat(v) {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const m = String(v).replace(/[,٬]/g, "").match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  }

  function matchField(cell, field) {
    cell = norm(cell);
    if (!cell) return false;
    for (let kw of KW[field]) {
      kw = kw.toLowerCase();
      if (kw.length <= 2) { if (cell === kw) return true; }
      else if (cell.includes(kw)) return true;
    }
    return false;
  }

  function detectHeader(row) {
    const map = {}, used = new Set();
    for (const field of ORDER) {
      for (let i = 0; i < row.length; i++) {
        if (used.has(i)) continue;
        if (matchField(row[i], field)) { map[field] = i; used.add(i); break; }
      }
    }
    return map;
  }

  function findHeader(rows) {
    let best = -1, bestMap = {}, bestScore = 0;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const map = detectHeader(rows[i]);
      const score = ["description", "quantity", "unit"].filter((k) => k in map).length;
      if (score > bestScore) { best = i; bestMap = map; bestScore = score; }
    }
    if (!("description" in bestMap) || !("quantity" in bestMap))
      throw new Error("تعذّر اكتشاف أعمدة الجدول. تأكد من وجود عمودي 'الوصف' و'الكمية'.");
    return { idx: best, map: bestMap };
  }

  function buildTenderFromRows(rows, meta) {
    meta = meta || {};
    const { idx, map } = findHeader(rows);
    const items = [];
    let n = 0;
    for (let r = idx + 1; r < rows.length; r++) {
      const row = rows[r];
      const cell = (f) => (map[f] != null && map[f] < row.length ? row[map[f]] : null);
      const desc = norm(cell("description"));
      const qty = toFloat(cell("quantity"));
      if (!desc || qty <= 0) continue;
      n++;
      const item = { id: String(cell("code") || "I-" + String(n).padStart(3, "0")).trim(),
        description: String(cell("description")).trim(), unit: String(cell("unit") || "وحدة").trim(),
        quantity: qty, resources: [], material_cost: 0, labor_cost: 0, equipment_cost: 0,
        subcontractor_cost: 0, other_cost: 0, unit_rate: 0, source: "imported" };
      const comps = { material: toFloat(cell("material")), labor: toFloat(cell("labor")),
        equipment: toFloat(cell("equipment")), subcontractor: toFloat(cell("subcontractor")) };
      const compSum = comps.material + comps.labor + comps.equipment + comps.subcontractor;
      const rate = toFloat(cell("unit_rate")), total = toFloat(cell("total"));
      if (compSum > 0) {
        item.unit_rate = Math.round(compSum * 100) / 100;
        item.material_cost = Math.round(comps.material * qty * 100) / 100;
        item.labor_cost = Math.round(comps.labor * qty * 100) / 100;
        item.equipment_cost = Math.round(comps.equipment * qty * 100) / 100;
        item.subcontractor_cost = Math.round(comps.subcontractor * qty * 100) / 100;
      } else if (rate > 0) item.unit_rate = Math.round(rate * 100) / 100;
      else if (total > 0) item.unit_rate = Math.round((total / qty) * 100) / 100;
      items.push(item);
    }
    if (!items.length) throw new Error("لم يتم العثور على بنود صالحة (وصف + كمية موجبة).");
    return { id: meta.id || "TND-IMPORT", name: meta.name || "مناقصة مستوردة", client: meta.client || "غير محدد",
      type: meta.type || "private", location: meta.location || "الرياض", duration_months: meta.duration_months || 12,
      client_reputation: 3.0, competition_level: 3.0, advance_payment_pct: 0.1, retention_pct: 0.05, items };
  }

  function parseCSV(text) {
    // مُحلّل CSV بسيط يدعم علامات الاقتباس
    const rows = [];
    let row = [], field = "", q = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  const API = { buildTenderFromRows, parseCSV, toFloat };
  root.MasaratBOQ = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
