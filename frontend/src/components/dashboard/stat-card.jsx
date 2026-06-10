import React from "react";

const GRADIENTS = {
  blue:   { bg: "from-blue-500 to-blue-600",     shadow: "shadow-blue-500/30", border: "border-t-blue-500"   },
  green:  { bg: "from-emerald-500 to-teal-600",  shadow: "shadow-emerald-500/30", border: "border-t-emerald-500" },
  yellow: { bg: "from-amber-400 to-orange-500",  shadow: "shadow-amber-500/30", border: "border-t-amber-400"  },
  purple: { bg: "from-purple-500 to-violet-600", shadow: "shadow-purple-500/30", border: "border-t-purple-500" },
  sky:    { bg: "from-sky-500 to-cyan-500",      shadow: "shadow-sky-500/30",  border: "border-t-sky-500"    },
  orange: { bg: "from-orange-500 to-red-500",    shadow: "shadow-orange-500/30", border: "border-t-orange-500" },
};

export default function StatCard({ icon: Icon, label, value, hint, color = "blue", onClick }) {
  const { bg, shadow, border } = GRADIENTS[color] || GRADIENTS.blue;
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border border-t-2 bg-white p-5 shadow-sm transition-all duration-300 overflow-hidden
        ${border}
        ${onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg" : ""}`}
    >
      {/* Subtle background glow on hover */}
      <div className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${bg} opacity-[0.03]`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${bg} text-white shadow-md ${shadow} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {onClick && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors">
          <span>View details</span>
          <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
