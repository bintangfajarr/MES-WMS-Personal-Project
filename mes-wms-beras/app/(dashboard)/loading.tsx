export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="h-8 w-24 bg-slate-800 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="w-8 h-8 bg-slate-800 rounded-lg" />
            </div>
            <div className="h-6 w-20 bg-slate-800 rounded" />
            <div className="h-3 w-32 bg-slate-800/50 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[350px] bg-slate-900/50 border border-slate-800 rounded-xl" />
        <div className="h-[350px] bg-slate-900/50 border border-slate-800 rounded-xl" />
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-slate-900/50 border border-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-900/50 border border-slate-800 rounded-xl" />
      </div>
    </div>
  );
}
