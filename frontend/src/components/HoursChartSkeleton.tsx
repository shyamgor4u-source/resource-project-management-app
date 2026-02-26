import { Skeleton } from '@/components/ui/skeleton';

export default function HoursChartSkeleton() {
  const bars = [60, 80, 45, 90, 55, 70, 40];
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-end gap-3 h-40 mt-2">
        {bars.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Skeleton className="w-full rounded-t" style={{ height: `${height}%` }} />
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
