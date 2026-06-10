import React from "react";

const COLORS = {
  blue:   "bg-blue-50 text-blue-600",
  green:  "bg-emerald-50 text-emerald-600",
  yellow: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
  sky:    "bg-sky-50 text-sky-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function StatCard({ icon: Icon, label, value, hint, color = "blue", onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200
        ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-blue-100" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-gray-400">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${COLORS[color] || COLORS.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
