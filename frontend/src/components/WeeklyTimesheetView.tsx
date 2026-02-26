import { useMemo } from 'react';
import { Pencil, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimesheetEntry, TimesheetStatus, Project, Resource } from '../backend';
import { nsToDate, getWeekStart } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface WeeklyTimesheetViewProps {
  entries: TimesheetEntry[];
  projects: Project[];
  resources: Resource[];
  onEdit: (entry: TimesheetEntry) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  showApprovalActions?: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusConfig = {
  [TimesheetStatus.draft]: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  [TimesheetStatus.submitted]: { label: 'Submitted', className: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  [TimesheetStatus.approved]: { label: 'Approved', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
};

export default function WeeklyTimesheetView({
  entries,
  projects,
  resources,
  onEdit,
  onDelete,
  onSubmit,
  showApprovalActions = false,
}: WeeklyTimesheetViewProps) {
  const weekStart = useMemo(() => getWeekStart(), []);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  const entriesByDay = useMemo(() => {
    const map: Record<string, TimesheetEntry[]> = {};
    weekDays.forEach((d) => {
      map[d.toDateString()] = [];
    });
    entries.forEach((e) => {
      const d = nsToDate(e.date);
      const key = d.toDateString();
      if (map[key]) map[key].push(e);
    });
    return map;
  }, [entries, weekDays]);

  const totalHours = useMemo(
    () => entries.reduce((sum, e) => sum + Number(e.hoursLogged), 0),
    [entries]
  );

  const hoursPerDay = useMemo(() =>
    weekDays.map((d) => {
      const dayEntries = entriesByDay[d.toDateString()] ?? [];
      return dayEntries.reduce((sum, e) => sum + Number(e.hoursLogged), 0);
    }),
    [weekDays, entriesByDay]
  );

  const today = new Date().toDateString();

  return (
    <div className="space-y-4">
      {/* Day columns summary */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === today;
          return (
            <div
              key={i}
              className={cn(
                'rounded-lg p-2 text-center border',
                isToday ? 'border-amber-500/40 bg-amber-500/8' : 'border-border bg-card'
              )}
            >
              <p className={cn('text-xs font-medium', isToday ? 'text-amber-500' : 'text-muted-foreground')}>
                {DAY_LABELS[i]}
              </p>
              <p className={cn('text-sm font-bold mt-0.5', isToday ? 'text-amber-500' : 'text-foreground')}>
                {day.getDate()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hoursPerDay[i] > 0 ? `${hoursPerDay[i]}h` : '—'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-muted-foreground">
          {entries.length} entries this week
        </span>
        <span className="text-sm font-semibold text-foreground">
          Total: <span className="text-amber-500">{totalHours}h</span>
        </span>
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground text-sm">No entries this week</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Log Time" to add your first entry</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const project = projects.find((p) => p.id === entry.projectId);
            const resource = resources.find((r) => r.id === entry.resourceId);
            const date = nsToDate(entry.date);
            const { label, className } = statusConfig[entry.status] ?? statusConfig[TimesheetStatus.draft];

            return (
              <div
                key={entry.id}
                className="flex items-center gap-4 bg-card rounded-lg border border-border px-4 py-3 hover:border-amber-500/30 transition-colors group"
              >
                <div className="w-12 text-center flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{DAY_LABELS[(date.getDay() + 6) % 7]}</p>
                  <p className="text-sm font-bold text-foreground">{date.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {project?.name ?? entry.projectId}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {resource?.name ?? entry.resourceId}
                    {entry.description && ` · ${entry.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-amber-500">
                    {Number(entry.hoursLogged)}h
                  </span>
                  <Badge variant="outline" className={cn('text-xs', className)}>
                    {label}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {entry.status === TimesheetStatus.draft && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onEdit(entry)}
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-amber-500 hover:text-amber-600"
                          onClick={() => onSubmit(entry.id)}
                          title="Submit"
                        >
                          <Send size={12} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDelete(entry.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                    {entry.status === TimesheetStatus.submitted && (
                      <>
                        <CheckCircle2 size={16} className="text-amber-500" />
                        {showApprovalActions && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-500 hover:text-green-600"
                            title="Approve"
                            onClick={() => onSubmit(entry.id)}
                          >
                            <CheckCircle2 size={12} />
                          </Button>
                        )}
                      </>
                    )}
                    {entry.status === TimesheetStatus.approved && (
                      <CheckCircle2 size={16} className="text-green-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
