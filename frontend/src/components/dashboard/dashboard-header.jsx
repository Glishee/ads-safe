import React from "react";

const ACCENTS = {
  blue:   ["bg-blue-600/30", "bg-indigo-500/25"],
  purple: ["bg-purple-600/30", "bg-fuchsia-500/25"],
  slate:  ["bg-blue-600/25", "bg-slate-400/20"],
};

export default function DashboardHeader({ title, subtitle, accent = "blue", children }) {
  const [glow1, glow2] = ACCENTS[accent] || ACCENTS.blue;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white md:p-8">
      <div className={`pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full ${glow1} blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full ${glow2} blur-3xl`} />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
}
