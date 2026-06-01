export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-slate-800 rounded-lg" />
          <div className="h-4 w-64 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 bg-slate-800 rounded-lg" />
          <div className="h-10 w-28 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-900/50 border border-slate-800 rounded-xl"
          />
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="h-80 bg-slate-900/50 border border-slate-800 rounded-xl" />

      {/* Table Skeleton */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3 flex gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 w-20 bg-slate-800 rounded" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
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
