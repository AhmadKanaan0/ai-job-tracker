import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CoverLetter, CoverLetterPayload } from "@/lib/types";

// ── Query Keys ─────────────────────────────────────────────────────────────

export const coverLetterKeys = {
  all: ["cover-letter"] as const,
  list: () => [...coverLetterKeys.all, "list"] as const,
  detail: (id: number) => [...coverLetterKeys.all, "detail", id] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────

export function useCoverLetters() {
  return useQuery({
    queryKey: coverLetterKeys.list(),
    queryFn: () => api.get<CoverLetter[]>("/cover-letter/"),
  });
}

export function useCoverLetter(id: number) {
  return useQuery({
    queryKey: coverLetterKeys.detail(id),
    queryFn: () => api.get<CoverLetter>(`/cover-letter/${id}`),
    enabled: !!id,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useGenerateCoverLetter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CoverLetterPayload) =>
      api.post<CoverLetter>("/cover-letter/generate", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coverLetterKeys.all });
    },
  });
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/cover-letter/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coverLetterKeys.all });
    },
  });
}
