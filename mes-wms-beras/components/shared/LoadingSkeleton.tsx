import { cn } from "@/lib/utils";

type SkeletonVariant = "table" | "card" | "form";

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
  className?: string;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-slate-800 rounded animate-pulse",
        className
      )}
    />
  );
}

function TableSkeleton({ rows = 5 }: { rows: number }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-slate-800">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-4 w-28" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3 border-b border-slate-800/50"
        >
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ rows = 4 }: { rows: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3"
        >
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-8 w-24" />
          <Shimmer className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton({ rows = 4 }: { rows: number }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Shimmer className="h-10 w-32 rounded-lg" />
    </div>
  );
}

export default function LoadingSkeleton({
  variant = "table",
  rows = 5,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {variant === "table" && <TableSkeleton rows={rows} />}
      {variant === "card" && <CardSkeleton rows={rows} />}
      {variant === "form" && <FormSkeleton rows={rows} />}
    </div>
  );
}
