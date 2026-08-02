"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function VisionTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null) {
    setError(null);
    setReport(null);

    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("صيغة غير مدعومة. استخدم JPG أو PNG أو WEBP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("حجم الصورة يتجاوز ٥ ميجابايت.");
      return;
    }

    setFile(f);
    // نُحرّر عنوان المعاينة السابق قبل إنشاء آخر جديد.
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  }

  function clear() {
    setFile(null);
    setReport(null);
    setError(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/vision", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "تعذّر تحليل الصورة");
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="panel p-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        {!preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files?.[0] ?? null);
            }}
            className="flex min-h-72 w-full flex-col items-center justify-center border-2 border-dashed border-ink-600 p-10 text-center transition-colors hover:border-ochre-600"
          >
            <Upload className="h-9 w-9 text-ink-500" />
            <p className="mt-5 text-mist-200">اسحب صورة الموقع هنا أو اضغط للاختيار</p>
            <p className="mt-2 text-xs text-mist-500">JPG أو PNG أو WEBP — حتى ٥ ميجابايت</p>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {/* صورة يرفعها المستخدم محلياً — عنصر img العادي هو الأنسب هنا */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="معاينة صورة الموقع"
                className="max-h-96 w-full border border-ink-700 object-contain"
              />
              <button
                type="button"
                onClick={clear}
                className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center bg-ink-950/85 text-mist-200 hover:text-ochre-400"
                aria-label="إزالة الصورة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={analyze}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2.5 bg-ochre-500 py-3.5 font-bold text-ink-950 transition-colors hover:bg-ochre-400 disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الفحص...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  حلّل الصورة
                </>
              )}
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>

      <div className="panel p-7">
        {!report && !busy && (
          <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
            <Camera className="h-10 w-10 text-ink-600" />
            <p className="mt-5 max-w-sm leading-relaxed text-mist-400">
              يفحص الذكاء الاصطناعي الصورة بصفته مهندس موقع: مرحلة الإنجاز،
              ملاحظات السلامة، جودة التنفيذ الظاهرة، وتوصيات المتابعة.
            </p>
          </div>
        )}

        {busy && (
          <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
            <Loader2 className="h-9 w-9 animate-spin text-ochre-500" />
            <p className="mt-5 text-mist-300">يفحص الذكاء الاصطناعي الصورة...</p>
          </div>
        )}

        {report && !busy && (
          <div className="animate-rise">
            <h3 className="text-lg text-mist-100">تقرير الفحص البصري</h3>
            <div className="mt-5 space-y-3 whitespace-pre-wrap text-sm leading-relaxed text-mist-300">
              {report.split("\n").map((line, i) => {
                const heading = line.match(/^\*\*(.+?)\*\*(.*)$/);
                if (heading) {
                  return (
                    <p key={i} className="pt-2">
                      <span className="font-bold text-ochre-400">{heading[1]}</span>
                      {heading[2]}
                    </p>
                  );
                }
                return line.trim() ? <p key={i}>{line}</p> : null;
              })}
            </div>
            <p className="mt-6 border-r-2 border-ink-600 pr-4 text-xs leading-relaxed text-mist-500">
              تقييم بصري من صورة واحدة، لا يُغني عن معاينة ميدانية ولا عن تقرير
              استشاري معتمد.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
