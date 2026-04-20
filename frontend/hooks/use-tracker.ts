import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  TrackedJob,
  TrackerCreatePayload,
  TrackerUpdatePayload,
  TrackerStats,
} from "@/lib/types";

// ── Query Keys ─────────────────────────────────────────────────────────────

export const trackerKeys = {
  all: ["tracker"] as const,
  list: (status?: string) => [...trackerKeys.all, "list", status] as const,
  stats: () => [...trackerKeys.all, "stats"] as const,
  statuses: () => [...trackerKeys.all, "statuses"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────

export function useTrackedJobs(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: trackerKeys.list(status),
    queryFn: () => api.get<TrackedJob[]>(`/tracker/${qs}`),
  });
}

export function useTrackerStats() {
  return useQuery({
    queryKey: trackerKeys.stats(),
    queryFn: () => api.get<TrackerStats>("/tracker/stats/summary"),
  });
}

export function useTrackerStatuses() {
  return useQuery({
    queryKey: trackerKeys.statuses(),
    queryFn: () => api.get<{ statuses: string[] }>("/tracker/statuses"),
    staleTime: Infinity, // statuses never change at runtime
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useAddToTracker() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: TrackerCreatePayload) =>
      api.post<TrackedJob>("/tracker/", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
  });
}

export function useUpdateTracker() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: TrackerUpdatePayload & { id: number }) =>
      api.patch<TrackedJob>(`/tracker/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
  });
}

export function useRemoveFromTracker() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/tracker/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trackerKeys.all });
    },
  });
}
