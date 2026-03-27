import React from "react";

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-3xl border p-5 ${accent}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default StatCard;
