import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Milestone } from '../backend';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MilestoneChecklistProps {
  milestones: Milestone[];
  projectId: string;
  onToggle: (projectId: string, milestoneId: string) => void;
  isToggling?: boolean;
  togglingId?: string | null;
  readOnly?: boolean;
}

export default function MilestoneChecklist({
  milestones,
  projectId,
  onToggle,
  isToggling,
  togglingId,
  readOnly,
}: MilestoneChecklistProps) {
  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (milestones.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No milestones defined</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>{completed}/{total} completed</span>
        <span className="font-semibold text-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1.5" />

      <div className="space-y-2 mt-3">
        {milestones.map((m) => {
          const isLoading = isToggling && togglingId === m.id;
          return (
            <div
              key={m.id}
              className={cn(
                'flex items-start gap-3 p-2.5 rounded-lg border transition-colors',
                m.completed
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-border bg-card hover:border-amber-500/30'
              )}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-amber-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Checkbox
                  checked={m.completed}
                  onCheckedChange={() => !readOnly && onToggle(projectId, m.id)}
                  disabled={readOnly}
                  className={cn(
                    'mt-0.5 flex-shrink-0',
                    m.completed && 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
                  )}
                />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium leading-tight',
                    m.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due: {formatDate(m.dueDate)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
