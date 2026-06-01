export default function WMSLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-800 rounded-lg" />
          <div className="h-4 w-64 bg-slate-800/60 rounded" />
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

      {/* Filter Bar Skeleton */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-slate-800 rounded-lg" />
        <div className="h-10 w-32 bg-slate-800 rounded-lg" />
        <div className="h-10 w-40 bg-slate-800 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3 flex gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-20 bg-slate-800 rounded" />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-b border-slate-800/50 px-4 py-3 flex gap-8">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 w-20 bg-slate-800/60 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
