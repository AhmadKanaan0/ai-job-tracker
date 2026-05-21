/**
 * TypeScript types mirroring the FastAPI Pydantic schemas.
 * Keep in sync with backend/app/schemas/*.py
 */

// ── Auth ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  postal_code: string | null;
  address_line: string | null;
  educations: Education[] | null;
  experiences: Experience[] | null;
  skills: string[] | null;
  has_disability: string | null;
  gender: string | null;
  setup_completed: boolean;
  has_cv: boolean;
  desired_roles: string[] | null;
  preferred_job_types: string[] | null;
  preferred_location: string | null;
  open_to_remote: boolean;
  needs_visa: boolean;
}

export interface Education {
  schoolName: string;
  major: string;
  degreeType: string;
  gpa?: string;
  startDate: string;
  endDate?: string;
  currentlyStudying: boolean;
}

export interface Experience {
  jobTitle: string;
  company: string;
  jobType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  summary?: string;
  descriptions: string[];
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  address_line?: string;
  educations?: Education[];
  experiences?: Experience[];
  skills?: string[];
  has_disability?: string;
  gender?: string;
  setup_completed?: boolean;
  desired_roles?: string[];
  preferred_job_types?: string[];
  preferred_location?: string;
  open_to_remote?: boolean;
  needs_visa?: boolean;
}

export interface RegisterPayload {
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Jobs ──────────────────────────────────────────────────────────────────

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string | null;
  remote: string | null;
  description: string | null;
  url: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  source: string | null;
  tags: string[] | null;
  job_type: string | null;
  experience_level: string | null;
  is_early_applicant: boolean | null;
  applicants_count: string | null;
  no_h1b: boolean | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  scraped_at: string;
  posted_at: string | null;
  formatted_description: string | null;
  match_score?: number | null;
}

export interface JobSearchPayload {
  query: string;
  location?: string;
  remote_only?: boolean;
  sources?: string[];
  limit?: number;
}

export interface ScrapePayload {
  url: string;
}

// ── Tracker ───────────────────────────────────────────────────────────────

export interface TrackedJob {
  id: number;
  status: string;
  notes: string | null;
  applied_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string | null;
  match_score: number | null;
  job: Job;
}

export interface TrackerCreatePayload {
  job_id: number;
  status?: string;
  notes?: string;
  next_action?: string;
  next_action_date?: string;
}

export interface TrackerUpdatePayload {
  status?: string;
  notes?: string;
  applied_date?: string;
  next_action?: string;
  next_action_date?: string;
}

export interface TrackerStats {
  total: number;
  by_status: Record<string, number>;
  interview_rate_pct: number;
}

// ── CV ────────────────────────────────────────────────────────────────────

export interface CV {
  id: number;
  filename: string;
  file_url: string;
  is_active: boolean;
  created_at: string;
}

// ── Analysis ──────────────────────────────────────────────────────────────

export interface Analysis {
  id: number;
  job_id: number;
  cv_id: number;
  match_score: number | null;
  ats_score: number | null;
  role_summary: string | null;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  level_strategy: string | null;
  personalization_tips: unknown;
  interview_questions: unknown;
  ats_issues: unknown;
  fixed_cv_text: string | null;
  created_at: string;
}

export interface AnalyzePayload {
  job_id: number;
  cv_id: number;
}

export interface ATSPayload {
  job_id: number;
  cv_id: number;
}

export interface FixCVPayload {
  job_id: number;
  cv_id: number;
}

// ── Cover Letter ──────────────────────────────────────────────────────────

export interface CoverLetter {
  id: number;
  job_id: number;
  cv_id: number;
  tone: string;
  content: string;
  created_at: string;
}

export interface CoverLetterPayload {
  job_id: number;
  cv_id: number;
  tone?: "professional" | "friendly" | "concise";
}
