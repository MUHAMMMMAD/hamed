/* اختبار: محرّك JavaScript يطابق نتائج Python. */
const fs = require("fs");
const path = require("path");
const E = require("./engine.js");
const B = require("./boq.js");

const SEED = path.join(__dirname, "..", "data", "seed");
const load = (n) => JSON.parse(fs.readFileSync(path.join(SEED, n), "utf8"));
const toMap = (a) => Object.fromEntries(a.map((x) => [x.id, x]));

const db = {
  materials: toMap(load("materials.json")), labor: toMap(load("labor.json")),
  equipment: toMap(load("equipment.json")), subcontractors: toMap(load("subcontractors.json")),
  suppliers: toMap(load("suppliers.json")), projects: toMap(load("projects.json")),
};
const sample = load("boq_sample.json");

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? "✓ " : "✗ ") + msg); if (!cond) fail++; };
const near = (a, b, t) => Math.abs(a - b) <= (t || 1);

const a = E.analyze(sample, db);
console.log("\n— التسعير —");
ok(near(a.cost.materials, 1258772.5), `المواد = ${a.cost.materials} (متوقع 1258772.5)`);
ok(near(a.cost.labor, 1150530.0), `العمالة = ${a.cost.labor} (متوقع 1150530)`);
ok(near(a.cost.equipment, 56100.0), `المعدات = ${a.cost.equipment} (متوقع 56100)`);
ok(near(a.cost.subcontractors, 1228000.0), `مقاولو الباطن = ${a.cost.subcontractors} (متوقع 1228000)`);
ok(near(a.cost.direct_cost, 3693402.5), `التكلفة المباشرة = ${a.cost.direct_cost} (متوقع 3693402.5)`);

console.log("\n— الضريبة والهامش —");
ok(near(a.cost.final_price, a.cost.selling_price * 1.15, 0.05), "السعر النهائي = سعر البيع +15% ضريبة");
ok(a.cost.margin_pct > 12 && a.cost.margin_pct < 14, `هامش الربح = ${a.cost.margin_pct}%`);

console.log("\n— المخاطر —");
ok(a.risk.items.length === 5, `عدد بنود المخاطر = ${a.risk.items.length} (متوقع 5)`);
ok(a.risk.risk_factor_pct > 0 && a.risk.risk_factor_pct <= 10, `معامل المخاطر = ${a.risk.risk_factor_pct}%`);

console.log("\n— التعلّم —");
ok(a.learning.sample_size === 8, `مشاريع متعلَّم منها = ${a.learning.sample_size}`);
ok(a.learning.recommended_contingency_pct >= 8 && a.learning.recommended_contingency_pct <= 25,
   `احتياطي موصى به = ${a.learning.recommended_contingency_pct}%`);

console.log("\n— القرار —");
ok(["BID", "NO_BID", "BID_WITH_CONDITIONS"].includes(a.decision.decision), `القرار = ${a.decision.decision}`);
ok(a.decision.win_probability >= 5 && a.decision.win_probability <= 95, `احتمال الفوز = ${a.decision.win_probability}%`);

console.log("\n— التدفقات النقدية (تحقق ذاتي) —");
ok(a.cashflow.months.length === sample.duration_months + 1, `عدد الأشهر = ${a.cashflow.months.length}`);
ok(near(a.cashflow.final_cumulative, a.cost.profit, 1.0), `صافي التراكم (${a.cashflow.final_cumulative}) = الربح (${a.cost.profit})`);

console.log("\n— قارئ BOQ (CSV) —");
const csv = "code,description,unit,qty,rate\n1,Concrete,m3,500,340\n2,Steel,ton,60,4900\n";
const t = B.buildTenderFromRows(B.parseCSV(csv), { name: "csv" });
ok(t.items.length === 2, `بنود مستوردة = ${t.items.length}`);
ok(t.items[0].unit_rate === 340, `سعر الوحدة = ${t.items[0].unit_rate}`);
const ca = E.analyze(t, db);
ok(ca.cost.direct_cost === 500 * 340 + 60 * 4900, `تكلفة BOQ المستورد = ${ca.cost.direct_cost}`);

console.log(fail === 0 ? "\n✅ كل اختبارات JS ناجحة" : `\n❌ فشل ${fail} اختبار`);
process.exit(fail ? 1 : 0);
