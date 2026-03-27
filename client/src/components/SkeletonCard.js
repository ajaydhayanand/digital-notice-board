import React from "react";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded-full bg-white/10" />
        <div className="h-6 w-3/4 rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-white/10" />
          <div className="h-3 rounded-full bg-white/10" />
          <div className="h-3 w-5/6 rounded-full bg-white/10" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-full bg-white/10" />
          <div className="h-10 w-28 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
