import React from "react";

function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-sm text-slate-500 dark:text-slate-400">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/25 border-t-cyan-300" />
      <p>{label}</p>
    </div>
  );
}

export default LoadingSpinner;
