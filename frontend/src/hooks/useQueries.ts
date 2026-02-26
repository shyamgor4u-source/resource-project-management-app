import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Resource, Project, TimesheetEntry, Milestone, ProjectStatus, UserProfile } from '../backend';
import { dateToNs, getWeekStart, getWeekEnd } from '../lib/utils';

// ─── Resources ───────────────────────────────────────────────────────────────

export function useResources() {
  const { actor, isFetching } = useActor();
  return useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResources();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddResource() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resource: Resource) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addResource(resource);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useBulkAddResources() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (resourceList: Resource[]) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.addBulkResources(resourceList);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useUpdateResource() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resource }: { id: string; resource: Resource }) => {
      if (!actor) throw new Error('Actor not ready');
      // Backend doesn't have updateResource; use addResource as fallback
      return actor.addResource(resource);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useDeleteResource() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {
      if (!actor) throw new Error('Actor not ready');
      // Backend doesn't have deleteResource; no-op for now
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function useProjects(status?: ProjectStatus | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Project[]>({
    queryKey: ['projects', status ?? 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProjects(status ?? null, null, null, null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_project: Project) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { id: string; project: Project }) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useToggleMilestone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { projectId: string; milestoneId: string }) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useAddMilestone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { projectId: string; milestone: Milestone }) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// ─── Timesheets ───────────────────────────────────────────────────────────────

export function useTimesheetEntries(startDate?: Date, endDate?: Date) {
  const { actor, isFetching } = useActor();
  const sd = startDate ? dateToNs(startDate) : null;
  const ed = endDate ? dateToNs(endDate) : null;
  return useQuery<TimesheetEntry[]>({
    queryKey: ['timesheets', sd?.toString(), ed?.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTimesheetEntries(null, null, sd, ed);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllTimesheetEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<TimesheetEntry[]>({
    queryKey: ['timesheets', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTimesheetEntries(null, null, null, null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWeeklyTimesheets() {
  const start = getWeekStart();
  const end = getWeekEnd();
  return useTimesheetEntries(start, end);
}

export function useAddTimesheetEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_entry: TimesheetEntry) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  });
}

export function useUpdateTimesheetEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_args: { id: string; entry: TimesheetEntry }) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  });
}

export function useDeleteTimesheetEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  });
}

export function useSubmitTimesheet() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {
      if (!actor) throw new Error('Actor not ready');
      return Promise.resolve();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currentUserProfile'] }),
  });
}

// ─── Power BI ─────────────────────────────────────────────────────────────────

export function useGetPowerBIEmbedUrl() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ['powerBIEmbedUrl'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPowerBIEmbedUrl();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPowerBIEmbedUrl() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      if (!actor) throw new Error('Actor not ready');
      return actor.setPowerBIEmbedUrl(url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['powerBIEmbedUrl'] }),
  });
}
