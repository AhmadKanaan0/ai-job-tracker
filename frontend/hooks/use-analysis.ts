import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Analysis, AnalyzePayload, ATSPayload, FixCVPayload, Job } from "@/lib/types";

// ── Query Keys ─────────────────────────────────────────────────────────────

export const analysisKeys = {
  all: ["analysis"] as const,
  history: () => [...analysisKeys.all, "history"] as const,
  detail: (jobId: number, cvId: number) => [...analysisKeys.all, "detail", jobId, cvId] as const,
};

// ── Queries ────────────────────────────────────────────────────────────────

export function useAnalysisHistory() {
  return useQuery({
    queryKey: analysisKeys.history(),
    queryFn: () => api.get<Analysis[]>("/analyze/history"),
  });
}

export function useAnalysis(jobId: number, cvId: number) {
  return useQuery({
    queryKey: analysisKeys.detail(jobId, cvId),
    queryFn: () => api.get<Analysis | null>(`/analyze/${jobId}/${cvId}`),
    enabled: !!jobId && !!cvId,
  });
}

export function useAnalysisDetail(analysisId: number) {
  return useQuery({
    queryKey: [...analysisKeys.all, "detail-id", analysisId] as const,
    queryFn: () => api.get<Analysis>(`/analyze/detail/${analysisId}`),
    enabled: !!analysisId,
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
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useQuickAnalysis() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AnalyzePayload) =>
      api.post<Analysis>("/analyze/quick-score", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
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

export function useCvDiff() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: FixCVPayload) =>
      api.post<Analysis>("/analyze/cv-diff", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysisKeys.all });
    },
  });
}

export function useCheckLegitimacy() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) =>
      api.post<Job>(`/jobs/${jobId}/check-legitimacy`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

// ── Batch Scoring ──────────────────────────────────────────────────────────

export interface BatchScorePayload {
  job_ids: number[];
  cv_id: number;
}

export interface BatchScoreResult {
  job_id: number;
  match_score: number | null;
}

export function useBatchQuickScore() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: BatchScorePayload) =>
      api.post<BatchScoreResult[]>("/analyze/batch-quick-score", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
