import { useState } from 'react';
import { useTimesheetEntries, useResources, useProjects } from '../hooks/useQueries';
import WeeklyTimesheetView from '../components/WeeklyTimesheetView';
import WeeklyTimesheetViewSkeleton from '../components/WeeklyTimesheetViewSkeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TimesheetEntry } from '../backend';

interface TimesheetsPageProps {
  canLogTime?: boolean;
  canApprove?: boolean;
  showApprovalActions?: boolean;
}

export default function TimesheetsPage({
  canLogTime = true,
  showApprovalActions = false,
}: TimesheetsPageProps) {
  const [_showLogModal, setShowLogModal] = useState(false);
  const [_editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);

  const { data: timesheetEntries, isLoading: timesheetsLoading } = useTimesheetEntries();
  const { data: resources, isLoading: resourcesLoading } = useResources();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const isLoading = timesheetsLoading || resourcesLoading || projectsLoading;

  const handleEdit = (entry: TimesheetEntry) => {
    setEditingEntry(entry);
    setShowLogModal(true);
  };

  const handleDelete = (_id: string) => {
    // Delete not implemented in backend
  };

  const handleSubmit = (_id: string) => {
    // Submit not implemented in backend
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
          <p className="text-sm text-muted-foreground">Track and manage time entries</p>
        </div>
        {canLogTime && (
          <Button size="sm" onClick={() => setShowLogModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Log Time
          </Button>
        )}
      </div>

      {isLoading ? (
        <WeeklyTimesheetViewSkeleton />
      ) : (
        <WeeklyTimesheetView
          entries={timesheetEntries ?? []}
          resources={resources ?? []}
          projects={projects ?? []}
          onEdit={canLogTime ? handleEdit : () => {}}
          onDelete={canLogTime ? handleDelete : () => {}}
          onSubmit={canLogTime ? handleSubmit : () => {}}
          showApprovalActions={showApprovalActions}
        />
      )}
    </div>
  );
}
