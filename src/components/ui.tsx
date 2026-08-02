import {
  Building2,
  ClipboardList,
  Compass,
  Hammer,
  Paintbrush,
  Route,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  building: Building2,
  compass: Compass,
  paintbrush: Paintbrush,
  hammer: Hammer,
  clipboard: ClipboardList,
  route: Route,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Building2;
  return <Icon className={className} aria-hidden="true" />;
}

/** عنوان قسم موحّد: شارة صغيرة، عنوان، ونص تمهيدي اختياري. */
export function SectionHeading({
  label,
  title,
  intro,
  align = "center",
}: {
  label: string;
  title: string;
  intro?: string;
  align?: "center" | "start";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
        <span className="h-px w-8 bg-ochre-600" />
        <span className="rule-label">{label}</span>
        {centered && <span className="h-px w-8 bg-ochre-600" />}
      </div>
      <h2 className="mt-5 text-3xl text-mist-100 sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 leading-relaxed text-mist-400">{intro}</p>}
    </div>
  );
}

/** رقم بارز مع تسمية — يُستخدم في شريط الإحصاءات. */
export function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="nums-ar font-display text-3xl font-bold text-ochre-400 sm:text-4xl">{value}</p>
      <p className="mt-2 text-xs text-mist-400 sm:text-sm">{label}</p>
    </div>
  );
}
