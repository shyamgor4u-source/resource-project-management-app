import { Skeleton } from '@/components/ui/skeleton';

export default function WeeklyTimesheetViewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Day columns header */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>

      {/* Timesheet entry rows */}
      <div className="flex flex-col gap-3 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full rounded" />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
