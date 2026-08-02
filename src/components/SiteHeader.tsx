"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import Logo from "./Logo";
import { company } from "@/lib/company";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/services", label: "الخدمات" },
  { href: "/projects", label: "المشاريع" },
  { href: "/ai", label: "منصة الذكاء" },
  { href: "/about", label: "عن الشركة" },
  { href: "/contact", label: "تواصل معنا" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // إغلاق القائمة عند تغيّر المسار حتى لا تبقى مفتوحة بعد التنقل.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-ink-700 bg-ink-950/92 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" aria-label={company.name}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-4 py-2 text-sm transition-colors ${
                  active ? "text-ochre-400" : "text-mist-300 hover:text-mist-100"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-ochre-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${company.phone.replace(/\s/g, "")}`}
            className="hidden items-center gap-2 border border-ink-600 px-4 py-2.5 text-sm text-mist-200 transition-colors hover:border-ochre-500 hover:text-ochre-400 md:flex"
          >
            <Phone className="h-4 w-4" />
            <span dir="ltr" className="nums-ar">
              {company.phone}
            </span>
          </a>

          <Link
            href="/contact"
            className="hidden bg-ochre-500 px-5 py-2.5 text-sm font-bold text-ink-950 transition-colors hover:bg-ochre-400 sm:block"
          >
            اطلب عرض سعر
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-2 text-mist-200 lg:hidden"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink-700 bg-ink-900 lg:hidden">
          <div className="mx-auto max-w-7xl px-5 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block border-b border-ink-800 py-3.5 text-mist-200 last:border-0 hover:text-ochre-400"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-4 block bg-ochre-500 py-3 text-center font-bold text-ink-950"
            >
              اطلب عرض سعر
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
