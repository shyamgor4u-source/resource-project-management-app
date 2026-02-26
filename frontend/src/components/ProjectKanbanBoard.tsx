import { Project, ProjectStatus } from '../backend';
import ProjectKanbanCardSkeleton from './ProjectKanbanCardSkeleton';

interface Column {
  status: ProjectStatus;
  label: string;
  color: string;
}

const COLUMNS: Column[] = [
  { status: ProjectStatus.planning, label: 'Planning', color: 'text-yellow-500' },
  { status: ProjectStatus.active, label: 'Active', color: 'text-green-500' },
  { status: ProjectStatus.onHold, label: 'On Hold', color: 'text-orange-500' },
  { status: ProjectStatus.completed, label: 'Completed', color: 'text-blue-500' },
];

interface ProjectKanbanBoardProps {
  projects: Project[];
  isLoading?: boolean;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

// Inline card component to avoid missing module error
function KanbanCard({
  project,
  onView,
  onEdit,
  onDelete,
}: {
  project: Project;
  onView?: (p: Project) => void;
  onEdit?: (p: Project) => void;
  onDelete?: (id: string) => void;
}) {
  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const totalMilestones = project.milestones.length;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onView?.(project)}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-foreground line-clamp-2">{project.name}</span>
      </div>
      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
      )}
      {totalMilestones > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{project.managerName}</span>
        <span>{project.assignedResourceIds.length} members</span>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-1 border-t border-border">
          {onEdit && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectKanbanBoard({
  projects,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: ProjectKanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
              {!isLoading && (
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {colProjects.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <>
                  <ProjectKanbanCardSkeleton />
                  <ProjectKanbanCardSkeleton />
                  <ProjectKanbanCardSkeleton />
                </>
              ) : colProjects.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">
                  No {col.label.toLowerCase()} projects
                </div>
              ) : (
                colProjects.map((project) => (
                  <KanbanCard
                    key={project.id}
                    project={project}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
