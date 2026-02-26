import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Calendar, DollarSign, User, Users } from 'lucide-react';
import MilestoneChecklist from './MilestoneChecklist';
import { Project, Resource } from '../backend';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  planning: { label: 'Planning', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  active: { label: 'Active', className: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  onHold: { label: 'On Hold', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  completed: { label: 'Completed', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
};

interface ProjectDetailModalProps {
  project: Project | null;
  resources: Resource[];
  open: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  isTogglingMilestone?: boolean;
  togglingMilestoneId?: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function ProjectDetailModal({
  project,
  resources,
  open,
  onClose,
  onEdit,
  onDelete,
  onToggleMilestone,
  isTogglingMilestone,
  togglingMilestoneId,
  canEdit = true,
  canDelete = true,
}: ProjectDetailModalProps) {
  if (!project) return null;

  const assignedResources = resources.filter((r) =>
    project.assignedResourceIds.includes(r.id)
  );

  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const totalMilestones = project.milestones.length;
  const progress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const { label, className } = statusConfig[project.status] ?? statusConfig.planning;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-xl leading-tight">
                {project.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={cn('text-xs', className)}>
                  {label}
                </Badge>
                {totalMilestones > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {progress}% complete
                  </span>
                )}
              </div>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex gap-2 flex-shrink-0">
                {canEdit && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => onEdit(project)}
                  >
                    <Pencil size={14} />
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                    onClick={() => { onDelete(project.id); onClose(); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 py-2 pr-2">
            {project.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Progress */}
            {totalMilestones > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Overall Progress</span>
                  <span className="font-semibold text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Separator />

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <p className="font-medium text-foreground">{project.managerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={14} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-medium text-foreground">{formatCurrency(project.budget)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">{formatDate(project.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium text-foreground">{formatDate(project.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Assigned Resources */}
            {assignedResources.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">
                      Team ({assignedResources.length})
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignedResources.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-500 text-xs font-semibold">
                            {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground leading-tight">{r.name}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{r.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Milestones */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Milestones
              </h4>
              <MilestoneChecklist
                milestones={project.milestones}
                projectId={project.id}
                onToggle={onToggleMilestone}
                isToggling={isTogglingMilestone}
                togglingId={togglingMilestoneId}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
