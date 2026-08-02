"use client";

import { useState } from "react";
import { AlertTriangle, Calculator, Lightbulb, Loader2, TrendingDown } from "lucide-react";
import { company } from "@/lib/company";
import {
  finishLevels,
  projectTypes,
  timelines,
  type EstimateResult,
} from "@/lib/estimator";
import { ar, pct, sar } from "@/lib/format";

type Analysis = {
  summary: string;
  recommendations: string[];
  risks: string[];
  valueEngineering: string[];
  nextStep: string;
};

type ApiResponse = { estimate: EstimateResult; analysis: Analysis; engine: "ai" | "local" };



export default function EstimatorTool() {
  const [form, setForm] = useState({
    projectType: "villa",
    area: "500",
    floors: "2",
    finishLevel: "standard",
    city: "الرياض",
    timeline: "normal",
    basement: false,
    includeDesign: false,
    notes: "",
  });
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          area: Number(form.area),
          floors: Number(form.floors),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر احتساب التقدير");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  const maxShare = result ? Math.max(...result.estimate.breakdown.map((b) => b.share)) : 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      {/* ===== نموذج الإدخال ===== */}
      {/* النموذج يبقى مثبّتاً على الشاشات الكبيرة ليعدّل المستخدم المدخلات وهو يقرأ النتائج */}
      <form onSubmit={submit} className="panel h-fit space-y-5 p-6 lg:sticky lg:top-24">
        <Field label="نوع المشروع">
          <Select
            value={form.projectType}
            onChange={(v) => setForm({ ...form, projectType: v })}
            options={Object.entries(projectTypes)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="المساحة (م²)">
            <input
              type="number"
              min={30}
              max={200000}
              required
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="nums-ar w-full bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none focus:ring-1 focus:ring-ochre-600"
            />
          </Field>
          <Field label="عدد الأدوار">
            <input
              type="number"
              min={1}
              max={40}
              required
              value={form.floors}
              onChange={(e) => setForm({ ...form, floors: e.target.value })}
              className="nums-ar w-full bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none focus:ring-1 focus:ring-ochre-600"
            />
          </Field>
        </div>

        <Field label="مستوى التشطيب">
          <Select
            value={form.finishLevel}
            onChange={(v) => setForm({ ...form, finishLevel: v })}
            options={Object.entries(finishLevels)}
          />
        </Field>

        <Field label="المدينة">
          <Select
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            options={company.cities.map((c) => [c, c] as [string, string])}
          />
        </Field>

        <Field label="الجدول الزمني">
          <Select
            value={form.timeline}
            onChange={(v) => setForm({ ...form, timeline: v })}
            options={Object.entries(timelines)}
          />
        </Field>

        <div className="space-y-3 border-t border-ink-700 pt-4">
          <Check
            label="يشمل قبواً (بدروم)"
            checked={form.basement}
            onChange={(v) => setForm({ ...form, basement: v })}
          />
          <Check
            label="يشمل أتعاب التصميم"
            checked={form.includeDesign}
            onChange={(v) => setForm({ ...form, includeDesign: v })}
          />
        </div>

        <Field label="ملاحظات إضافية (اختياري)">
          <textarea
            rows={3}
            maxLength={1200}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="مثال: أرض منحدرة، أو رغبة في مسبح وملحق خارجي"
            className="w-full resize-none bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none placeholder:text-mist-500 focus:ring-1 focus:ring-ochre-600"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2.5 bg-ochre-500 py-3.5 font-bold text-ink-950 transition-colors hover:bg-ochre-400 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ التحليل...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              احسب التكلفة
            </>
          )}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {/* ===== النتائج ===== */}
      <div className="space-y-6">
        {!result && !busy && (
          <div className="panel flex h-full min-h-80 flex-col items-center justify-center p-10 text-center">
            <Calculator className="h-10 w-10 text-ink-600" />
            <p className="mt-5 max-w-sm leading-relaxed text-mist-400">
              أدخل بيانات مشروعك في النموذج، وسيحتسب المحرك الهندسي التكلفة
              ويحلّلها الذكاء الاصطناعي ببنودها ومخاطرها وفرص التوفير فيها.
            </p>
          </div>
        )}

        {busy && (
          <div className="panel flex h-full min-h-80 flex-col items-center justify-center p-10 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-ochre-500" />
            <p className="mt-5 text-mist-300">يُحلّل الذكاء الاصطناعي مشروعك...</p>
            <p className="mt-2 text-sm text-mist-500">يستغرق هذا بضع ثوانٍ</p>
          </div>
        )}

        {result && !busy && (
          <>
            {/* الرقم الرئيسي */}
            <div className="panel corner-mark relative animate-rise overflow-hidden p-8">
              <div className="blueprint-fine absolute inset-0 opacity-40" aria-hidden="true" />
              <div className="relative">
                <p className="rule-label">التكلفة التقديرية الإجمالية</p>
                <p className="nums-ar mt-4 font-display text-4xl font-bold text-ochre-400 sm:text-5xl">
                  {ar(result.estimate.low)} – {ar(result.estimate.high)}
                  <span className="mr-3 text-xl text-mist-400">ريال</span>
                </p>

                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  <Metric
                    label="سعر المتر"
                    value={sar(result.estimate.ratePerSqm)}
                  />
                  <Metric
                    label="المدة المتوقعة"
                    value={`${ar(result.estimate.monthsLow)}–${ar(result.estimate.monthsHigh)} شهراً`}
                  />
                  <Metric
                    label="شامل الضريبة"
                    value={sar(result.estimate.vat)}
                  />
                </div>
              </div>
            </div>

            {/* تحليل النموذج */}
            <div className="panel p-7">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg text-mist-100">قراءة التقدير</h3>
                <span
                  className={`px-2.5 py-1 text-[0.68rem] ${
                    result.engine === "ai"
                      ? "bg-ochre-500/12 text-ochre-400"
                      : "bg-ink-700 text-mist-400"
                  }`}
                >
                  {result.engine === "ai" ? "تحليل بالذكاء الاصطناعي" : "المحرك المحلي"}
                </span>
              </div>
              <p className="mt-4 leading-relaxed text-mist-300">{result.analysis.summary}</p>
              <p className="mt-5 border-r-2 border-ochre-600 bg-ochre-500/5 py-3 pr-4 text-sm text-mist-200">
                الخطوة التالية: {result.analysis.nextStep}
              </p>
            </div>

            {/* توزيع البنود */}
            <div className="panel p-7">
              <h3 className="text-lg text-mist-100">توزيع التكلفة على البنود</h3>
              <div className="mt-6 space-y-4">
                {result.estimate.breakdown.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-mist-300">{b.label}</span>
                      <span className="nums-ar shrink-0 text-mist-400">
                        {sar(b.amount)}
                        <span className="mr-2 text-ochre-500">
                          {pct(b.share)}
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-ink-800">
                      <div
                        className="h-full bg-ochre-500"
                        style={{ width: `${(b.share / maxShare) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* جدول الدفعات */}
            <div className="panel overflow-x-auto p-7">
              <h3 className="text-lg text-mist-100">جدول الدفعات المقترح</h3>
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-700 text-right text-xs text-mist-500">
                    <th className="pb-3 font-medium">المرحلة</th>
                    <th className="pb-3 font-medium">النسبة</th>
                    <th className="pb-3 font-medium">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {result.estimate.cashflow.map((c) => (
                    <tr key={c.phase} className="border-b border-ink-800 last:border-0">
                      <td className="py-3 text-mist-300">{c.phase}</td>
                      <td className="nums-ar py-3 text-ochre-400">
                        {pct(c.percent)}
                      </td>
                      <td className="nums-ar py-3 text-mist-300">{sar(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* التوصيات والمخاطر */}
            <div className="grid gap-6 md:grid-cols-2">
              <ListPanel
                icon={<Lightbulb className="h-5 w-5 text-ochre-500" />}
                title="توصيات"
                items={result.analysis.recommendations}
              />
              <ListPanel
                icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                title="مخاطر محتملة"
                items={result.analysis.risks}
              />
            </div>

            <ListPanel
              icon={<TrendingDown className="h-5 w-5 text-emerald-500" />}
              title="فرص التوفير (هندسة القيمة)"
              items={result.analysis.valueEngineering}
            />

            {/* الافتراضات */}
            <details className="panel group p-7">
              <summary className="cursor-pointer list-none text-sm text-mist-300 hover:text-ochre-400">
                الافتراضات التي بُني عليها هذا التقدير ▾
              </summary>
              <ul className="mt-5 space-y-2.5">
                {result.estimate.assumptions.map((a) => (
                  <li key={a} className="flex gap-3 text-sm leading-relaxed text-mist-400">
                    <span className="mt-2 h-1 w-1 shrink-0 bg-ochre-600" />
                    {a}
                  </li>
                ))}
              </ul>
            </details>

            <p className="border-r-2 border-ink-600 pr-4 text-xs leading-relaxed text-mist-500">
              هذا تقدير استرشادي يعتمد على متوسطات السوق ولا يُعدّ عرض سعر ملزماً.
              العرض النهائي يصدر بعد المعاينة الميدانية وإعداد جدول الكميات التفصيلي.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== عناصر مساعدة ===== */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-mist-400">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none focus:ring-1 focus:ring-ochre-600"
    >
      {options.map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-mist-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-ochre-500)]"
      />
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r-2 border-ink-700 pr-4">
      <p className="text-xs text-mist-500">{label}</p>
      <p className="nums-ar mt-1.5 text-lg text-mist-100">{value}</p>
    </div>
  );
}

function ListPanel({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="panel p-7">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg text-mist-100">{title}</h3>
      </div>
      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-mist-300">
            <span className="mt-2 h-1 w-1 shrink-0 bg-ochre-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
