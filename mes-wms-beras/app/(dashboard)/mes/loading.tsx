export default function MESLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-slate-800 rounded-lg" />
          <div className="h-4 w-60 bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-800 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl"
          />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3 flex gap-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-24 bg-slate-800 rounded" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border-b border-slate-800/50 px-4 py-3 flex gap-8">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 w-24 bg-slate-800/60 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
