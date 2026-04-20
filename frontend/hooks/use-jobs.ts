import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Job, JobSearchPayload, ScrapePayload } from "@/lib/types";

// ── Query Keys ─────────────────────────────────────────────────────────────

export const jobKeys = {
  all: ["jobs"] as const,
  list: (filters?: { source?: string; remote?: string }) =>
    [...jobKeys.all, "list", filters] as const,
  detail: (id: number) => [...jobKeys.all, "detail", id] as const,
  search: () => [...jobKeys.all, "search"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────

export function useJobs(filters?: { source?: string; remote?: string; limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (filters?.source) params.set("source", filters.source);
  if (filters?.remote) params.set("remote", filters.remote);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  const qs = params.toString();

  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => api.get<Job[]>(`/jobs/${qs ? `?${qs}` : ""}`),
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => api.get<Job>(`/jobs/${id}`),
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useSearchJobs() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: JobSearchPayload) =>
      api.post<Job[]>("/jobs/search", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useScrapeJob() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScrapePayload) =>
      api.post<Job>("/jobs/scrape", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
