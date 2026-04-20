import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Analysis, AnalyzePayload, ATSPayload, FixCVPayload } from "@/lib/types";

// ── Query Keys ─────────────────────────────────────────────────────────────

export const analysisKeys = {
  all: ["analysis"] as const,
  history: () => [...analysisKeys.all, "history"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────

export function useAnalysisHistory() {
  return useQuery({
    queryKey: analysisKeys.history(),
    queryFn: () => api.get<Analysis[]>("/analyze/history"),
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useFullAnalysis() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AnalyzePayload) =>
      api.post<Analysis>("/analyze/full", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysisKeys.all });
    },
  });
}

export function useATSScore() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ATSPayload) =>
      api.post<Analysis>("/analyze/ats", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysisKeys.all });
    },
  });
}

export function useFixCV() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: FixCVPayload) =>
      api.post<Analysis>("/analyze/fix-cv", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysisKeys.all });
    },
  });
}
