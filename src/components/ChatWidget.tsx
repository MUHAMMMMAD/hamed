"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import { company } from "@/lib/company";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content: `مرحباً بك في ${company.name} 👋
أنا المساعد الذكي للشركة. اسألني عن تكلفة البناء، مدة التنفيذ، الخدمات، أو الضمانات — وسأجيبك فوراً.`,
};

const SUGGESTIONS = [
  "كم تكلفة بناء فيلا ٤٠٠ متر؟",
  "ما مدة تنفيذ عمارة سكنية؟",
  "ما الضمانات التي تقدمونها؟",
  "هل تستخرجون رخصة البناء؟",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    const history = [...messages, { role: "user" as const, content: question }];
    setMessages(history);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // نُسقط رسالة الترحيب لأنها من الواجهة لا من النموذج.
        body: JSON.stringify({ messages: history.slice(1).map(({ role, content }) => ({ role, content })) }),
      });

      if (!res.ok || !res.body) throw new Error("request failed");

      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `تعذّر الاتصال حالياً. يسعدنا خدمتك مباشرة على ${company.phone} أو واتساب ${company.whatsapp}.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center bg-ochre-500 text-ink-950 shadow-lg shadow-ochre-700/25 transition-transform hover:scale-105"
        aria-label={open ? "إغلاق المساعد الذكي" : "افتح المساعد الذكي"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {open && (
        <div className="animate-rise fixed bottom-24 left-4 right-4 z-50 flex h-[min(34rem,72vh)] flex-col border border-ink-600 bg-ink-900 shadow-2xl sm:right-auto sm:w-[26rem]">
          <div className="flex items-center gap-3 border-b border-ink-700 bg-ink-850 px-4 py-3.5">
            <span className="flex h-9 w-9 items-center justify-center bg-ochre-500/12 text-ochre-400">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-mist-100">المساعد الذكي</p>
              <p className="text-[0.7rem] text-mist-400">يجيب فوراً على استفساراتك</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-ochre-500 text-ink-950"
                      : "border border-ink-700 bg-ink-850 text-mist-200"
                  }`}
                >
                  {m.content || (
                    <span className="flex gap-1.5 py-1">
                      <span className="h-1.5 w-1.5 animate-pulse-dot bg-ochre-400" />
                      <span
                        className="h-1.5 w-1.5 animate-pulse-dot bg-ochre-400"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-pulse-dot bg-ochre-400"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full border border-ink-700 px-3 py-2 text-right text-xs text-mist-300 transition-colors hover:border-ochre-600 hover:text-ochre-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-ink-700 bg-ink-850 p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك..."
              maxLength={500}
              className="flex-1 bg-ink-800 px-3 py-2.5 text-sm text-mist-100 outline-none placeholder:text-mist-500 focus:ring-1 focus:ring-ochre-600"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="flex h-10 w-10 items-center justify-center bg-ochre-500 text-ink-950 transition-opacity disabled:opacity-40"
              aria-label="إرسال"
            >
              <Send className="h-4 w-4 rotate-180" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
