import { company } from "@/lib/company";

/** الشعار: ثلاثة مسارات صاعدة داخل إطار — "مسارات" + "تشييد". */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="38" height="38" stroke="var(--color-ochre-500)" strokeWidth="1.5" />
        <path d="M8 31V19" stroke="var(--color-mist-300)" strokeWidth="2.5" strokeLinecap="square" />
        <path d="M16.5 31V13" stroke="var(--color-ochre-400)" strokeWidth="2.5" strokeLinecap="square" />
        <path d="M25 31V16" stroke="var(--color-mist-300)" strokeWidth="2.5" strokeLinecap="square" />
        <path d="M32 31V9" stroke="var(--color-ochre-500)" strokeWidth="2.5" strokeLinecap="square" />
        <path d="M6 34h28" stroke="var(--color-mist-400)" strokeWidth="1.5" strokeLinecap="square" />
      </svg>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight text-mist-100">
            {company.name}
          </span>
          <span className="mt-1 text-[0.62rem] tracking-[0.2em] text-ochre-500">
            للمقاولات
          </span>
        </span>
      )}
    </span>
  );
}
