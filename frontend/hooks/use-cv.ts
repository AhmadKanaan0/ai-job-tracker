import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CV } from "@/lib/types";

// ── Query Keys ─────────────────────────────────────────────────────────────

export const cvKeys = {
  all: ["cv"] as const,
  list: () => [...cvKeys.all, "list"] as const,
  active: () => [...cvKeys.all, "active"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────

export function useCVs() {
  return useQuery({
    queryKey: cvKeys.list(),
    queryFn: () => api.get<CV[]>("/cv/"),
  });
}

export function useActiveCV() {
  return useQuery({
    queryKey: cvKeys.active(),
    queryFn: () => api.get<CV>("/cv/active"),
    retry: false, // 404 if no active CV — don't retry
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useUploadCV() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => api.upload<CV>("/cv/upload", file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cvKeys.all });
    },
  });
}

export function useActivateCV() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cvId: number) =>
      api.patch<CV>(`/cv/${cvId}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cvKeys.all });
    },
  });
}

export function useDeleteCV() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (cvId: number) => api.delete(`/cv/${cvId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cvKeys.all });
    },
  });
}
