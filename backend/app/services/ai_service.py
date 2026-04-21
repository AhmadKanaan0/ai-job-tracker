"""
AI Service — all AI API calls in one place.
Supports both Claude (Anthropic) and Gemini (Google) as providers.
Set AI_PROVIDER in .env to "claude" or "gemini" to switch.
"""
import json
import re
from app.core.config import settings

# ── Provider setup ───────────────────────────────────────────────────────────

_provider = settings.AI_PROVIDER  # "claude" or "gemini"

# Lazy-init: clients are created on first call, not at import time.
# This avoids crashes if the unused provider's SDK isn't installed.
_claude_client = None
_gemini_client = None
_CLAUDE_MODEL = "claude-sonnet-4-20250514"
_GEMINI_MODEL = "gemini-3-flash-preview"


def _get_claude():
    global _claude_client
    if _claude_client is None:
        from anthropic import Anthropic
        _claude_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _claude_client


def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        try:
            from google import genai
        except ImportError:
            raise ImportError(
                "google-genai is not installed. Run: pip install google-genai"
            )
        _gemini_client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    return _gemini_client


# ── Low-level helpers ────────────────────────────────────────────────────────

def _ask(system: str, user: str, max_tokens: int = 2000) -> str:
    """Send a single prompt to the configured AI provider and return text."""
    if _provider == "claude":
        msg = _get_claude().messages.create(
            model=_CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return msg.content[0].text

    else:  # gemini
        response = _get_gemini().models.generate_content(
            model=_GEMINI_MODEL,
            contents=f"{system}\n\n{user}",
            config={
                "max_output_tokens": max_tokens,
                "temperature": 0.3,
            },
        )
        return response.text


def _parse_json(text: str) -> dict:
    """Strip markdown fences and parse JSON safely."""
    clean = re.sub(r"```(?:json)?|```", "", text).strip()
    return json.loads(clean)


# ── 1. Full Job Analysis ─────────────────────────────────────────────────────

def analyze_job(cv_text: str, job_description: str, job_title: str, company: str) -> dict:
    """
    6-block evaluation adapted from career-ops.
    Returns a structured dict ready to store in JobAnalysis.
    """
    system = (
        "You are a senior technical recruiter and career coach. "
        "Analyse the fit between a candidate's CV and a job description. "
        "Be direct, honest, and specific. Never fabricate skills or experience. "
        "Always respond with valid JSON only — no preamble, no markdown fences."
    )

    user = f"""
Job Title: {job_title}
Company: {company}

--- JOB DESCRIPTION ---
{job_description}

--- CANDIDATE CV ---
{cv_text}

Return a JSON object with exactly these keys:

{{
  "match_score": <integer 0-100>,
  "role_summary": "<2-3 sentence summary of what this role actually is>",
  "matched_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill1", "skill2", ...],
  "level_strategy": "<is this role above / at / below the candidate's level? 2-3 sentences>",
  "ats_score": <integer 0-100>,
  "ats_issues": {{
    "formatting_issues": ["issue1", ...],
    "missing_keywords": ["keyword1", ...]
  }},
  "personalization_tips": [
    "<specific tip to tailor the CV for this role>",
    ...
  ],
  "interview_questions": [
    {{
      "question": "<likely interview question>",
      "tip": "<how to answer it based on the candidate's background>"
    }}
  ]
}}
"""
    raw = _ask(system, user, max_tokens=3000)
    return _parse_json(raw)


# ── 2. ATS Score Only ────────────────────────────────────────────────────────

def score_ats(cv_text: str, job_description: str) -> dict:
    """Faster, cheaper ATS-only check."""
    system = (
        "You are an ATS (Applicant Tracking System) expert. "
        "Evaluate how well a CV will pass ATS for a given job description. "
        "Respond with valid JSON only."
    )
    user = f"""
--- JOB DESCRIPTION ---
{job_description}

--- CV ---
{cv_text}

Return JSON:
{{
  "ats_score": <integer 0-100>,
  "keyword_coverage": <integer 0-100>,
  "formatting_score": <integer 0-100>,
  "missing_keywords": ["kw1", ...],
  "formatting_issues": ["issue1", ...],
  "quick_wins": ["<specific fix that takes <5 min>", ...]
}}
"""
    raw = _ask(system, user, max_tokens=1000)
    return _parse_json(raw)


# ── 3. Fix CV for a Specific Job ─────────────────────────────────────────────

def fix_cv(cv_text: str, job_description: str, job_title: str) -> dict:
    """
    Rewrite the CV to better match the job.
    Returns the fixed text + a list of changes made.
    """
    system = (
        "You are a professional CV writer and ATS expert. "
        "Rewrite the CV to better match the job description — improve keyword density, "
        "reframe experience, strengthen bullet points. "
        "Do NOT fabricate experience or skills that don't exist. "
        "Respond with valid JSON only."
    )
    user = f"""
Target Role: {job_title}

--- JOB DESCRIPTION ---
{job_description}

--- ORIGINAL CV ---
{cv_text}

Return JSON:
{{
  "fixed_cv_text": "<the full rewritten CV as plain text>",
  "changes_made": [
    "<specific change 1>",
    "<specific change 2>",
    ...
  ],
  "ats_improvement": "<brief explanation of how ATS score improved>"
}}
"""
    raw = _ask(system, user, max_tokens=4000)
    return _parse_json(raw)


# ── 4. Cover Letter Generator ────────────────────────────────────────────────

TONE_INSTRUCTIONS = {
    "professional": "formal, confident, third-person references to the company",
    "friendly":     "warm, personable, enthusiastic but not over the top",
    "concise":      "punchy, under 200 words, bullet-point style if helpful",
}

def generate_cover_letter(
    cv_text: str,
    job_description: str,
    job_title: str,
    company: str,
    tone: str = "professional",
) -> str:
    """Returns a ready-to-send cover letter as plain text."""
    tone_instruction = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["professional"])

    system = (
        f"You are a professional cover letter writer. "
        f"Tone: {tone_instruction}. "
        "Write a compelling cover letter that connects the candidate's experience "
        "to the specific role requirements. Avoid generic phrases like 'I am writing to apply'. "
        "Return only the cover letter text — no JSON, no commentary."
    )
    user = f"""
Role: {job_title} at {company}

--- JOB DESCRIPTION ---
{job_description}

--- CANDIDATE CV ---
{cv_text}

Write the cover letter now:
"""
    return _ask(system, user, max_tokens=1000)


# ── 5. Extract Profile from CV ───────────────────────────────────────────────

def extract_profile_from_cv(cv_text: str) -> dict:
    """
    Parse a CV to extract structured profile data.
    """
    system = (
        "You are an expert ATS parser. Extract the candidate's profile "
        "information from the provided CV text. "
        "Respond with valid JSON only."
    )
    user = f"""
--- CANDIDATE CV ---
{cv_text}

Return a JSON object with exactly these keys matching this schema:
{{
  "first_name": "string or null",
  "last_name": "string or null",
  "phone": "string or null",
  "country": "string or null",
  "city": "string or null",
  "educations": [
    {{
      "schoolName": "string",
      "major": "string",
      "degreeType": "string",
      "gpa": "string",
      "startDate": "YYYY or string",
      "endDate": "YYYY or string",
      "currentlyStudying": false
    }}
  ],
  "experiences": [
    {{
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "startDate": "YYYY-MM or string",
      "endDate": "YYYY-MM or string",
      "currentlyWorking": false,
      "summary": "string",
      "descriptions": ["string bullet point 1"]
    }}
  ],
  "skills": ["skill 1", "skill 2"]
}}
"""
    raw = _ask(system, user, max_tokens=3000)
    return _parse_json(raw)


# ── 6. Optimize Job Description ──────────────────────────────────────────────

def optimize_job_description(description: str) -> str:
    """
    Reorganize messy job descriptions into a structured, organized format.
    Uses Markdown for clear titles and bullet points.
    """
    system = (
        "You are a professional editor. Your task is to take a messy, unorganized job description "
        "and rewrite it into a beautifully structured Markdown format. "
        "Use clear headings (e.g., # Role Overview, # Responsibilities, # Qualifications, # Benefits). "
        "Use bullet points for lists. Preserve all original information but make it highly readable. "
        "Return ONLY the formatted Markdown — no commentary."
    )
    user = f"""
--- MESSY JOB DESCRIPTION ---
{description}

Reorganize this description now:
"""
    return _ask(system, user, max_tokens=2500)
