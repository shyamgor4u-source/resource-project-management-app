import { useState } from 'react';
import { useProjects, useAddProject, useUpdateProject, useResources } from '../hooks/useQueries';
import ProjectKanbanBoard from '../components/ProjectKanbanBoard';
import ProjectFormModal from '../components/ProjectFormModal';
import ProjectDetailModal from '../components/ProjectDetailModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Project } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectsPageProps {
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

export default function ProjectsPage({
  canEdit = true,
  canDelete = true,
  canCreate = true,
}: ProjectsPageProps) {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const { data: projects, isLoading } = useProjects();
  const { data: resources } = useResources();
  const addProjectMutation = useAddProject();
  const updateProjectMutation = useUpdateProject();

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    setDeletingProjectId(id);
  };

  const handleView = (project: Project) => {
    setViewingProject(project);
  };

  const handleFormSubmit = async (project: Project) => {
    if (editingProject) {
      await updateProjectMutation.mutateAsync({ id: project.id, project });
    } else {
      await addProjectMutation.mutateAsync(project);
    }
    setShowFormModal(false);
    setEditingProject(null);
  };

  const confirmDelete = async () => {
    // Delete not implemented in backend yet
    setDeletingProjectId(null);
  };

  const noopEdit = (_project: Project) => {};
  const noopDelete = (_id: string) => {};

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Track and manage all your projects</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        )}
      </div>

      <ProjectKanbanBoard
        projects={projects ?? []}
        isLoading={isLoading}
        onView={handleView}
        onEdit={canEdit ? handleEdit : noopEdit}
        onDelete={canDelete ? handleDelete : noopDelete}
      />

      {showFormModal && (
        <ProjectFormModal
          open={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingProject(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingProject ?? undefined}
          isLoading={addProjectMutation.isPending || updateProjectMutation.isPending}
          resources={resources ?? []}
        />
      )}

      {viewingProject && (
        <ProjectDetailModal
          open={!!viewingProject}
          project={viewingProject}
          onClose={() => setViewingProject(null)}
          onEdit={canEdit ? handleEdit : noopEdit}
          onDelete={canDelete ? handleDelete : noopDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          resources={resources ?? []}
          onToggleMilestone={(_projectId: string, _milestoneId: string) => {}}
        />
      )}

      <AlertDialog open={!!deletingProjectId} onOpenChange={() => setDeletingProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
