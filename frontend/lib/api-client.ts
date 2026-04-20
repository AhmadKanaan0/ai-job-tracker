/**
 * API Client — thin fetch wrapper for the FastAPI backend.
 *
 * Features:
 *  - Auto-injects Bearer token from localStorage
 *  - Typed JSON responses
 *  - File upload support (multipart/form-data)
 *  - Structured error handling via ApiError class
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Error class ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, body: { detail?: string }) {
    const detail = body?.detail || `Request failed with status ${status}`;
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ── Core fetch ─────────────────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }

  return body as T;
}

// ── Convenience methods ────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    apiFetch<T>(path, { method: "GET" }),

  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = void>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),

  /** Upload a file via multipart/form-data */
  upload: <T>(path: string, file: File, fieldName = "file") => {
    const form = new FormData();
    form.append(fieldName, file);
    return apiFetch<T>(path, { method: "POST", body: form });
  },
};
