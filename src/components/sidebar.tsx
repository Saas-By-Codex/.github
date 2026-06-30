"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/vehicles", label: "Vehicles", icon: "🚗" },
  { href: "/charging", label: "Charging", icon: "🔌" },
  { href: "/battery", label: "Battery Health", icon: "🔋" },
  { href: "/maintenance", label: "Maintenance", icon: "🛠️" },
  { href: "/drivers", label: "Driver Analytics", icon: "🧑‍✈️" },
  { href: "/esg", label: "ESG / Carbon", icon: "🌱" },
  { href: "/integrations", label: "Integrations", icon: "🔗" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/admin", label: "Admin", icon: "🛡️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-30 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm md:hidden"
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 transform border-r border-slate-200 bg-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-semibold text-slate-900">EVFleetIQ</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
