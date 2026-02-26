import { Clock, FolderKanban, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityEvent {
  id: string;
  type: 'timesheet_submitted' | 'timesheet_approved' | 'project_updated' | 'resource_added';
  title: string;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  periodLabel?: string;
}

const iconMap = {
  timesheet_submitted: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  timesheet_approved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  project_updated: { icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  resource_added: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ events, periodLabel }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No activity{periodLabel ? ` in ${periodLabel}` : ' for this period'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const { icon: Icon, color, bg } = iconMap[event.type];
        return (
          <div key={event.id} className="flex items-start gap-3">
            <div className={cn('p-2 rounded-lg flex-shrink-0 mt-0.5', bg)}>
              <Icon size={14} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight">{event.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(event.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
}
