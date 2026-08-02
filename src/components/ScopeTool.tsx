"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { company } from "@/lib/company";
import { projectTypes } from "@/lib/estimator";
import { ar } from "@/lib/format";

type Phase = { name: string; duration: string; deliverables: string[] };
type BoqRow = { item: string; unit: string; note: string };
type ScopeDoc = {
  title: string;
  overview: string;
  included: string[];
  excluded: string[];
  phases: Phase[];
  boq: BoqRow[];
  acceptance: string[];
  assumptions: string[];
};
type ApiResponse = { engine: "ai" | "local"; doc: ScopeDoc | null; markdown: string };

const EXAMPLE =
  "أرغب ببناء فيلا دورين وملحق علوي على أرض ٦٠٠ متر شمال الرياض، مع مسبح وحديقة ومواقف مغطاة لسيارتين، بتشطيب مميّز وواجهة حجر طبيعي.";

export default function ScopeTool() {
  const [form, setForm] = useState({
    description: "",
    projectType: "villa",
    city: "الرياض",
    area: "",
  });
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          projectType: form.projectType,
          city: form.city,
          ...(form.area ? { area: Number(form.area) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر إعداد الوثيقة");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "نطاق-العمل.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="panel space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-xs text-mist-400">نوع المشروع</span>
            <select
              value={form.projectType}
              onChange={(e) => setForm({ ...form, projectType: e.target.value })}
              className="w-full bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none focus:ring-1 focus:ring-ochre-600"
            >
              {Object.entries(projectTypes).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-mist-400">المدينة</span>
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none focus:ring-1 focus:ring-ochre-600"
            >
              {company.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-mist-400">المساحة (م²) — اختياري</span>
            <input
              type="number"
              min={0}
              max={200000}
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="nums-ar w-full bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none focus:ring-1 focus:ring-ochre-600"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 flex items-center justify-between text-xs text-mist-400">
            <span>صف مشروعك بلغتك</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, description: EXAMPLE })}
              className="text-ochre-500 hover:text-ochre-400"
            >
              استخدم مثالاً
            </button>
          </span>
          <textarea
            rows={5}
            required
            minLength={20}
            maxLength={4000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="اكتب ما تريد بناءه، المساحات، عدد الغرف، مستوى التشطيب، وأي متطلبات خاصة..."
            className="w-full resize-none bg-ink-800 px-3.5 py-3 text-sm leading-relaxed text-mist-100 outline-none placeholder:text-mist-500 focus:ring-1 focus:ring-ochre-600"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2.5 bg-ochre-500 px-7 py-3.5 font-bold text-ink-950 transition-colors hover:bg-ochre-400 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ الإعداد...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              أنشئ وثيقة نطاق العمل
            </>
          )}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      {busy && (
        <div className="panel flex flex-col items-center justify-center p-14 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-ochre-500" />
          <p className="mt-5 text-mist-300">يُحلّل الذكاء الاصطناعي وصف مشروعك...</p>
          <p className="mt-2 text-sm text-mist-500">
            يُعدّ المراحل والتسليمات وجدول الكميات المبدئي
          </p>
        </div>
      )}

      {result && !busy && (
        <div className="animate-rise space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span
              className={`px-2.5 py-1 text-[0.68rem] ${
                result.engine === "ai"
                  ? "bg-ochre-500/12 text-ochre-400"
                  : "bg-ink-700 text-mist-400"
              }`}
            >
              {result.engine === "ai" ? "أُعدّت بالذكاء الاصطناعي" : "قالب المحرك المحلي"}
            </span>
            <button
              type="button"
              onClick={download}
              className="flex items-center gap-2 border border-ink-600 px-5 py-2.5 text-sm text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400"
            >
              <Download className="h-4 w-4" />
              حمّل الوثيقة
            </button>
          </div>

          {result.doc ? (
            <StructuredDoc doc={result.doc} />
          ) : (
            <pre className="panel overflow-x-auto whitespace-pre-wrap p-7 text-sm leading-relaxed text-mist-300">
              {result.markdown}
            </pre>
          )}

          <p className="border-r-2 border-ink-600 pr-4 text-xs leading-relaxed text-mist-500">
            وثيقة مبدئية استرشادية تُولَّد آلياً من وصفك، ولا تُغني عن جدول كميات
            تفصيلي وعقد موقّع بعد المعاينة الميدانية.
          </p>
        </div>
      )}
    </div>
  );
}

function StructuredDoc({ doc }: { doc: ScopeDoc }) {
  return (
    <div className="space-y-6">
      <div className="panel corner-mark relative p-8">
        <h3 className="text-2xl text-mist-100">{doc.title}</h3>
        <p className="mt-4 leading-relaxed text-mist-300">{doc.overview}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Block title="الأعمال المشمولة" items={doc.included} tone="ochre" />
        <Block title="الأعمال غير المشمولة" items={doc.excluded} tone="muted" />
      </div>

      <div className="panel p-7">
        <h4 className="text-lg text-mist-100">مراحل التنفيذ</h4>
        <div className="mt-6 space-y-5">
          {doc.phases.map((p, i) => (
            <div key={p.name} className="border-r-2 border-ochre-600 pr-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h5 className="text-mist-100">
                  <span className="nums-ar ml-2 text-ochre-500">{ar(i + 1)}.</span>
                  {p.name}
                </h5>
                <span className="nums-ar text-xs text-mist-500">{p.duration}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {p.deliverables.map((d) => (
                  <li key={d} className="flex gap-3 text-sm text-mist-400">
                    <span className="mt-2 h-1 w-1 shrink-0 bg-ink-600" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="panel overflow-x-auto p-7">
        <h4 className="text-lg text-mist-100">جدول الكميات المبدئي</h4>
        <table className="mt-5 w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-right text-xs text-mist-500">
              <th className="pb-3 font-medium">البند</th>
              <th className="pb-3 font-medium">الوحدة</th>
              <th className="pb-3 font-medium">ملاحظة فنية</th>
            </tr>
          </thead>
          <tbody>
            {doc.boq.map((b) => (
              <tr key={b.item} className="border-b border-ink-800 last:border-0">
                <td className="py-3 pl-4 text-mist-200">{b.item}</td>
                <td className="py-3 pl-4 text-ochre-400">{b.unit}</td>
                <td className="py-3 leading-relaxed text-mist-400">{b.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Block title="معايير القبول" items={doc.acceptance} tone="ochre" />
        <Block title="الافتراضات" items={doc.assumptions} tone="muted" />
      </div>
    </div>
  );
}

function Block({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "ochre" | "muted";
}) {
  return (
    <div className="panel p-7">
      <h4 className="text-lg text-mist-100">{title}</h4>
      <ul className="mt-5 space-y-3">
        {items.map((x) => (
          <li key={x} className="flex gap-3 text-sm leading-relaxed text-mist-300">
            <span
              className={`mt-2 h-1 w-1 shrink-0 ${
                tone === "ochre" ? "bg-ochre-500" : "bg-ink-600"
              }`}
            />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
