/*
 * محرّكات MASARAT AI بصيغة JavaScript (نسخة المتصفح الثابتة).
 * منقولة بدقّة عن محرّكات Python (التسعير/المخاطر/القرار/التدفقات/التعلّم)
 * لتعمل بالكامل داخل المتصفح بلا أي خادم — قابلة للرفع على أي استضافة.
 *
 * تعمل في المتصفح (دوال عامة) وفي Node (module.exports) للاختبار.
 */
(function (root) {
  "use strict";

  const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const pstdev = (a) => {
    if (a.length < 2) return 0;
    const m = mean(a);
    return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
  };

  // --------------------------------------------------------------- الأسعار
  function resourceRate(db, type, id) {
    if (type === "material" && db.materials[id]) return db.materials[id].unit_price;
    if (type === "labor" && db.labor[id]) return db.labor[id].daily_rate;
    if (type === "equipment" && db.equipment[id]) return db.equipment[id].rate;
    if (type === "subcontractor" && db.subcontractors[id]) return db.subcontractors[id].unit_price;
    throw new Error("مورد غير معروف: " + type + ":" + id);
  }

  function priceItem(item, db) {
    if ((!item.resources || !item.resources.length) && item.unit_rate) {
      item.direct_total = round2(item.unit_rate * item.quantity);
      const split =
        (item.material_cost || 0) + (item.labor_cost || 0) +
        (item.equipment_cost || 0) + (item.subcontractor_cost || 0);
      item.other_cost = round2(item.direct_total - split);
      return;
    }
    let m = 0, l = 0, e = 0, s = 0;
    for (const u of item.resources || []) {
      const rate = resourceRate(db, u.resource_type, u.resource_id);
      const c = u.coefficient * rate;
      if (u.resource_type === "material") m += c;
      else if (u.resource_type === "labor") l += c;
      else if (u.resource_type === "equipment") e += c;
      else if (u.resource_type === "subcontractor") s += c;
    }
    item.material_cost = round2(m * item.quantity);
    item.labor_cost = round2(l * item.quantity);
    item.equipment_cost = round2(e * item.quantity);
    item.subcontractor_cost = round2(s * item.quantity);
    item.other_cost = 0;
    item.unit_rate = round2(m + l + e + s);
    item.direct_total = round2(item.unit_rate * item.quantity);
  }

  function priceTender(tender, db, cfg, riskFactorPct) {
    cfg = cfg || { overhead_pct: 0.1, contingency_pct: 0.15, profit_pct: 0.15, vat_pct: 0.15 };
    riskFactorPct = riskFactorPct || 0;
    let mat = 0, lab = 0, eq = 0, sub = 0, oth = 0;
    for (const it of tender.items) {
      priceItem(it, db);
      mat += it.material_cost; lab += it.labor_cost; eq += it.equipment_cost;
      sub += it.subcontractor_cost; oth += it.other_cost;
    }
    const direct = mat + lab + eq + sub + oth;
    const overhead = direct * cfg.overhead_pct;
    const contingency = direct * cfg.contingency_pct;
    const risk = direct * (riskFactorPct / 100);
    const total = direct + overhead + contingency + risk;
    const profit = total * cfg.profit_pct;
    const selling = total + profit;
    const vat = selling * cfg.vat_pct;
    const final = selling + vat;
    return {
      materials: round2(mat), labor: round2(lab), equipment: round2(eq),
      subcontractors: round2(sub), other: round2(oth), direct_cost: round2(direct),
      overhead: round2(overhead), contingency: round2(contingency), risk_adjustment: round2(risk),
      total_cost: round2(total), profit: round2(profit), selling_price: round2(selling),
      vat: round2(vat), final_price: round2(final),
      margin_pct: selling ? round2((profit / selling) * 100) : 0,
    };
  }

  // --------------------------------------------------------------- المخاطر
  function histAvgDeviation(db, type) {
    let items = Object.values(db.projects);
    if (type) items = items.filter((p) => p.type === type);
    return items.length ? mean(items.map((p) => p.deviation_pct)) : 0;
  }
  const riskLevel = (s) => (s <= 6 ? "low" : s <= 14 ? "medium" : "high");

  function assessRisk(tender, db) {
    const items = [];
    const usedMat = new Set();
    tender.items.forEach((it) =>
      (it.resources || []).forEach((u) => {
        if (u.resource_type === "material") usedMat.add(u.resource_id);
      })
    );
    const trends = [...usedMat].filter((m) => db.materials[m]).map((m) => db.materials[m].trend_pct);
    const avgTrend = trends.length ? mean(trends) : 0;
    items.push({ category: "السوق", description: `تقلب أسعار المواد (متوسط الاتجاه ${avgTrend.toFixed(1)}%)`,
      probability: clamp(2 + avgTrend, 1, 5), impact: 4.0, mitigation: "تثبيت أسعار الموردين مبكراً وعقود توريد طويلة" });

    const histDev = histAvgDeviation(db, tender.type);
    items.push({ category: "التنفيذ", description: `انحراف التكلفة التاريخي لهذا النوع ${histDev.toFixed(1)}%`,
      probability: clamp(2 + histDev / 4, 1, 5), impact: 4.0, mitigation: "رفع دقة حصر الكميات وضبط الإنتاجية ميدانياً" });

    const contractMap = { government: 3.0, epc: 4.0, private: 3.0, subcontract: 2.5 };
    let contractProb = contractMap[tender.type] != null ? contractMap[tender.type] : 3.0;
    if ((tender.advance_payment_pct || 0) < 0.1) contractProb += 1.0;
    items.push({ category: "العقد", description: "شروط تعاقدية، محتجزات، وأوامر تغيير محتملة",
      probability: clamp(contractProb, 1, 5), impact: 3.5, mitigation: "مراجعة قانونية كاملة قبل التوقيع" });

    const stab = Object.values(db.suppliers || {}).map((s) => s.price_stability);
    const avgStab = stab.length ? mean(stab) : 3.0;
    items.push({ category: "الموردون", description: `ثبات أسعار الموردين (متوسط ${avgStab.toFixed(1)}/5)`,
      probability: clamp(6 - avgStab, 1, 5), impact: 3.0, mitigation: "تعدد الموردين وعروض أسعار محدّثة دورياً" });

    items.push({ category: "الوقت", description: `مدة التنفيذ ${tender.duration_months} شهراً`,
      probability: clamp(1.5 + tender.duration_months / 6, 1, 5), impact: 3.5, mitigation: "جدول زمني واقعي مع مسار حرج" });

    items.forEach((r) => { r.score = round2(r.probability * r.impact); r.level = riskLevel(r.score); });
    const avgScore = mean(items.map((r) => r.score));
    return { items, total_score: round2(avgScore), risk_factor_pct: round2((avgScore / 25) * 10), overall_level: riskLevel(avgScore) };
  }

  // ---------------------------------------------------------------- التعلّم
  function learn(tender, db) {
    const projects = Object.values(db.projects);
    const n = projects.length;
    if (!n) return { sample_size: 0, recommended_contingency_pct: 15, recommended_margin_pct: 15, calibrated_cost_factor: 1, confidence: 0, method: "none", predicted_deviation_pct: 0, avg_deviation_pct: 0, std_deviation_pct: 0 };
    const devs = projects.map((p) => p.deviation_pct);
    const avg = mean(devs), std = pstdev(devs);
    const margins = projects.filter((p) => p.contract_value).map((p) => (p.actual_profit / p.contract_value) * 100);
    const recMargin = margins.length ? round2(mean(margins)) : 15;
    const same = projects.filter((p) => p.type === tender.type).map((p) => p.deviation_pct);
    const pred = same.length ? mean(same) : avg;
    const recCont = round2(clamp(pred + 0.5 * std, 8, 25));
    return {
      sample_size: n, avg_deviation_pct: round2(avg), std_deviation_pct: round2(std),
      predicted_deviation_pct: round2(pred), recommended_contingency_pct: recCont,
      recommended_margin_pct: recMargin, calibrated_cost_factor: round2(1 + pred / 100),
      confidence: round2(clamp(40 + n * 6, 0, 95)), method: "historical_mean",
    };
  }

  // ----------------------------------------------------------------- القرار
  function decideBid(tender, cost, risk) {
    const c0 = (v) => clamp(v, 0, 100);
    const marginScore = c0((cost.margin_pct / 15) * 100);
    const riskScore = c0(100 - risk.risk_factor_pct * 10);
    const compScore = c0(((5 - tender.competition_level) / 4) * 100);
    const clientScore = c0((tender.client_reputation / 5) * 100);
    const liqScore = c0(((tender.advance_payment_pct - tender.retention_pct + 0.1) / 0.25) * 100);
    const score = round2(0.3 * marginScore + 0.25 * riskScore + 0.2 * compScore + 0.15 * clientScore + 0.1 * liqScore);
    let win = 75 - (tender.competition_level - 1) * 11 - Math.max(0, cost.margin_pct - 12) * 2 + (tender.client_reputation - 3) * 2;
    win = round2(clamp(win, 5, 95));
    const conditions = [];
    if (marginScore < 60) conditions.push("رفع هامش الربح أو خفض التكلفة المباشرة قبل التقديم");
    if (risk.risk_factor_pct >= 5) conditions.push("تثبيت أسعار الموردين الرئيسيين قبل التقديم");
    if (tender.advance_payment_pct < 0.1) conditions.push("التفاوض على دفعة مقدمة لا تقل عن 10%");
    if (tender.competition_level >= 4) conditions.push("مراجعة تنافسية السعر مقابل السوق");
    let decision, rationale;
    if (score >= 65) { decision = "BID"; rationale = "المؤشرات إيجابية: ربحية ومخاطر مقبولة مع فرصة فوز معقولة."; }
    else if (score >= 50) { decision = "BID_WITH_CONDITIONS"; rationale = "فرصة جيدة لكنها مشروطة بمعالجة نقاط الضعف."; }
    else { decision = "NO_BID"; rationale = "المخاطر أو ضعف الربحية يفوقان الفرصة."; }
    return { decision, score, win_probability: win, rationale, conditions: decision === "BID" ? [] : conditions,
      factors: { "هامش الربح": round2(marginScore), "المخاطر": round2(riskScore), "المنافسة": round2(compScore), "سمعة العميل": round2(clientScore), "السيولة": round2(liqScore) } };
  }

  // -------------------------------------------------------------- التدفقات
  function sCurve(n, k) {
    k = k || 7;
    if (n <= 1) return [1];
    const cdf = (t) => 1 / (1 + Math.exp(-k * (t - 0.5)));
    const raw = [];
    for (let i = 1; i <= n; i++) raw.push(cdf(i / n) - cdf((i - 1) / n));
    const tot = raw.reduce((s, x) => s + x, 0);
    return raw.map((r) => r / tot);
  }

  function projectCashflow(tender, cost) {
    const n = Math.max(1, tender.duration_months);
    const w = sCurve(n, 7);
    const contract = cost.selling_price, totalCost = cost.total_cost;
    const advance = tender.advance_payment_pct * contract;
    const size = n + 1;
    const costs = new Array(size + 2).fill(0);
    const rev = new Array(size + 2).fill(0);
    rev[1] += advance;
    let totalRet = 0;
    for (let i = 1; i <= n; i++) {
      costs[i] = totalCost * w[i - 1];
      const billing = contract * w[i - 1];
      const ret = tender.retention_pct * billing;
      const advRec = tender.advance_payment_pct * billing;
      totalRet += ret;
      rev[i + 1] += billing - ret - advRec;
    }
    rev[size] += totalRet;
    const months = [];
    let cum = 0, peak = 0;
    for (let i = 1; i <= size; i++) {
      const net = rev[i] - costs[i];
      cum += net; peak = Math.min(peak, cum);
      months.push({ month: i, cost: round2(costs[i]), revenue: round2(rev[i]), net: round2(net), cumulative: round2(cum) });
    }
    return { months, peak_funding_required: round2(-peak), final_cumulative: round2(cum) };
  }

  // ----------------------------------------------------------- التحليل الكامل
  function analyze(tender, db) {
    const learning = learn(tender, db);
    const risk = assessRisk(tender, db);
    const cfg = { overhead_pct: 0.1, contingency_pct: learning.sample_size ? learning.recommended_contingency_pct / 100 : 0.15, profit_pct: 0.15, vat_pct: 0.15 };
    const cost = priceTender(tender, db, cfg, risk.risk_factor_pct);
    const decision = decideBid(tender, cost, risk);
    const cashflow = projectCashflow(tender, cost);
    return { tender, cost, risk, decision, cashflow, learning };
  }

  const API = { round2, clamp, resourceRate, priceItem, priceTender, assessRisk, learn, decideBid, projectCashflow, analyze };
  root.MasaratEngine = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
