import { useMemo, useState } from 'react';
import { useResources, useProjects, useTimesheetEntries } from '../hooks/useQueries';
import SummaryCard from '../components/SummaryCard';
import SummaryCardSkeleton from '../components/SummaryCardSkeleton';
import HoursChart from '../components/HoursChart';
import HoursChartSkeleton from '../components/HoursChartSkeleton';
import ActivityFeed, { ActivityEvent } from '../components/ActivityFeed';
import ActivityFeedSkeleton from '../components/ActivityFeedSkeleton';
import DashboardDateFilter, { FilterState } from '../components/DashboardDateFilter';
import { Users, FolderKanban, Clock, CheckSquare } from 'lucide-react';
import { isDateInPeriod, formatPeriodLabel, nsToDate } from '../lib/utils';
import { ProjectStatus, TimesheetStatus } from '../backend';

export default function DashboardPage() {
  const now = new Date();
  const [filter, setFilter] = useState<FilterState>({
    selectedMonth: now.getMonth() + 1,
    selectedYear: now.getFullYear(),
    selectedDate: null,
  });

  const { data: resources, isLoading: resourcesLoading } = useResources();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: timesheetEntries, isLoading: timesheetsLoading } = useTimesheetEntries();

  const isLoading = resourcesLoading || projectsLoading || timesheetsLoading;

  const periodLabel = formatPeriodLabel(
    filter.selectedMonth,
    filter.selectedYear,
    filter.selectedDate
  );

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter((r) => {
      const date = nsToDate(r.assignmentStartDate);
      return isDateInPeriod(date, filter.selectedMonth, filter.selectedYear, filter.selectedDate);
    });
  }, [resources, filter]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      const date = nsToDate(p.startDate);
      return isDateInPeriod(date, filter.selectedMonth, filter.selectedYear, filter.selectedDate);
    });
  }, [projects, filter]);

  const filteredTimesheets = useMemo(() => {
    if (!timesheetEntries) return [];
    return timesheetEntries.filter((t) => {
      const date = nsToDate(t.date);
      return isDateInPeriod(date, filter.selectedMonth, filter.selectedYear, filter.selectedDate);
    });
  }, [timesheetEntries, filter]);

  const activeResources = useMemo(
    () => filteredResources.filter((r) => r.status === 'active').length,
    [filteredResources]
  );

  const activeProjects = useMemo(
    () => filteredProjects.filter((p) => p.status === ProjectStatus.active).length,
    [filteredProjects]
  );

  const totalHours = useMemo(
    () => filteredTimesheets.reduce((sum, t) => sum + Number(t.hoursLogged), 0),
    [filteredTimesheets]
  );

  const pendingApprovals = useMemo(
    () => filteredTimesheets.filter((t) => t.status === TimesheetStatus.submitted).length,
    [filteredTimesheets]
  );

  // Build hours-per-project data for HoursChart
  const hoursPerProject = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTimesheets.forEach((t) => {
      const project = filteredProjects.find((p) => p.id === t.projectId);
      const name = project?.name ?? t.projectId;
      map[name] = (map[name] ?? 0) + Number(t.hoursLogged);
    });
    return Object.entries(map).map(([project, hours]) => ({ project, hours }));
  }, [filteredTimesheets, filteredProjects]);

  // Build activity events for ActivityFeed
  const activityEvents = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    filteredTimesheets
      .filter(
        (t) =>
          t.status === TimesheetStatus.submitted || t.status === TimesheetStatus.approved
      )
      .slice(-5)
      .forEach((t) => {
        const resource = filteredResources.find((r) => r.id === t.resourceId);
        const project = filteredProjects.find((p) => p.id === t.projectId);
        events.push({
          id: t.id,
          type:
            t.status === TimesheetStatus.approved
              ? 'timesheet_approved'
              : 'timesheet_submitted',
          title:
            t.status === TimesheetStatus.approved
              ? 'Timesheet Approved'
              : 'Timesheet Submitted',
          description: `${resource?.name ?? 'Unknown'} — ${project?.name ?? t.projectId} (${Number(t.hoursLogged)}h)`,
          timestamp: nsToDate(t.date),
        });
      });

    filteredProjects.slice(-3).forEach((p) => {
      events.push({
        id: `proj-${p.id}`,
        type: 'project_updated',
        title: `Project: ${p.name}`,
        description: `Status: ${p.status} · Manager: ${p.managerName}`,
        timestamp: nsToDate(p.startDate),
      });
    });

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);
  }, [filteredTimesheets, filteredResources, filteredProjects]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your team and projects</p>
      </div>

      <DashboardDateFilter value={filter} onChange={setFilter} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              label="Active Resources"
              value={activeResources}
              icon={Users}
              accentColor="amber"
              trend={periodLabel}
            />
            <SummaryCard
              label="Active Projects"
              value={activeProjects}
              icon={FolderKanban}
              accentColor="blue"
              trend={periodLabel}
            />
            <SummaryCard
              label="Hours Logged"
              value={totalHours}
              icon={Clock}
              accentColor="green"
              trend={periodLabel}
            />
            <SummaryCard
              label="Pending Approvals"
              value={pendingApprovals}
              icon={CheckSquare}
              accentColor="purple"
              trend={periodLabel}
            />
          </>
        )}
      </div>

      {/* Charts and Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-1">Hours per Project</h3>
          <p className="text-xs text-muted-foreground mb-4">{periodLabel} breakdown</p>
          {isLoading ? (
            <HoursChartSkeleton />
          ) : (
            <HoursChart data={hoursPerProject} periodLabel={periodLabel} />
          )}
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-1">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mb-4">{periodLabel}</p>
          {isLoading ? (
            <ActivityFeedSkeleton />
          ) : (
            <ActivityFeed events={activityEvents} periodLabel={periodLabel} />
          )}
        </div>
      </div>
    </div>
  );
}
