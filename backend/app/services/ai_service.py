"""
AI Service — all AI API calls in one place.
Supports Claude (Anthropic), Gemini (Google), and DeepSeek as providers.
Set AI_PROVIDER in .env to "claude", "gemini", or "deepseek" to switch.
"""
import json
import re
from app.core.config import settings

# ── Provider setup ───────────────────────────────────────────────────────────

_provider = settings.AI_PROVIDER  # "claude", "gemini", or "deepseek"

# Lazy-init: clients are created on first call, not at import time.
# This avoids crashes if the unused provider's SDK isn't installed.
_claude_client = None
_gemini_client = None
_deepseek_client = None
_CLAUDE_MODEL = "claude-3-5-sonnet-20240620"
_GEMINI_MODEL = "gemini-3-flash-preview"
_DEEPSEEK_MODEL = "deepseek-chat"


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


def _get_deepseek():
    global _deepseek_client
    if _deepseek_client is None:
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError(
                "openai is not installed. Run: pip install openai"
            )
        _deepseek_client = OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com",
        )
    return _deepseek_client


# ── Low-level helpers ────────────────────────────────────────────────────────

def _ask(system: str, user: str, max_tokens: int = 2000) -> str:
    """Send a single prompt to the configured AI provider and return text."""
    import time
    max_retries = 3
    retry_delay = 2

    for attempt in range(max_retries):
        try:
            if _provider == "claude":
                msg = _get_claude().messages.create(
                    model=_CLAUDE_MODEL,
                    max_tokens=max_tokens,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                )
                return msg.content[0].text

            elif _provider == "deepseek":
                response = _get_deepseek().chat.completions.create(
                    model=_DEEPSEEK_MODEL,
                    max_tokens=max_tokens,
                    temperature=0.3,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                )
                return response.choices[0].message.content

            else:  # gemini
                response = _get_gemini().models.generate_content(
                    model=_GEMINI_MODEL,
                    contents=f"{system}\n\n{user}",
                    config={
                        "max_output_tokens": max_tokens,
                        "temperature": 0.3,
                    },
                )
                # Check for block
                if not response.text:
                     raise ValueError("AI response was blocked by safety filters.")
                return response.text
        except Exception as e:
            err_str = str(e).lower()
            
            # Auth errors (invalid API key)
            if "401" in err_str or "unauthorized" in err_str or "invalid_api_key" in err_str or "authentication" in err_str:
                from fastapi import HTTPException
                raise HTTPException(status_code=401, detail=f"AI API Key is invalid or unauthorized ({_provider}). Please check your settings.")

            # Quota errors (out of credits)
            if "402" in err_str or "insufficient_quota" in err_str or "billing" in err_str or "out of credit" in err_str:
                from fastapi import HTTPException
                raise HTTPException(status_code=402, detail=f"AI API Key has run out of credits/quota ({_provider}).")

            # Rate limits (too many requests in a short time)
            if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
                if attempt < max_retries - 1:
                    print(f"Rate limit hit, retrying in {retry_delay}s... (Attempt {attempt+1})")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=429, detail=f"AI provider rate limit exceeded after retries ({_provider}).")
            
            print(f"AI Provider Error ({_provider}): {e}")
            
            # If it's already an HTTPException, raise it directly
            if e.__class__.__name__ == "HTTPException":
                raise e
                
            raise e
    
    from fastapi import HTTPException
    raise HTTPException(status_code=429, detail="AI provider rate limit exceeded after retries.")


def _parse_json(text: str) -> dict:
    """Extract and parse JSON from text, even if it has preamble/postamble."""
    try:
        # Find first { and last }
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            raise ValueError("No JSON object found in response")
        
        clean = text[start:end+1]
        return json.loads(clean)
    except Exception as e:
        print(f"JSON Parse Error: {e}\nRaw Text: {text}")
        raise e


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
Return JSON: {"ats_score": 0-100, "issues": ["issue1", ...]}
"""
    raw = _ask(system, user, max_tokens=1000)
    return _parse_json(raw)


def quick_score(cv_text: str, job_description: str) -> dict:
    """Ultra-fast scoring for the Discovery Feed."""
    system = "You are a recruiter. Respond ONLY with valid JSON. No text before or after."
    user = f"""
Evaluate the fit (0-100) between this CV and Job.
Return JSON: {{"match_score": <int>}}

CV: {cv_text[:1500]}
JD: {job_description[:1500]}
"""
    raw = _ask(system, user, max_tokens=100)
    return _parse_json(raw)


async def async_quick_score(cv_text: str, job_description: str) -> dict:
    """Async version of quick_score for batch processing."""
    import asyncio
    return await asyncio.to_thread(quick_score, cv_text, job_description)


# ── 3. Fix CV for a Specific Job ─────────────────────────────────────────────

def fix_cv(cv_text: str, job_description: str, job_title: str) -> dict:
    """
    Rewrite the CV to better match the job.
    Returns the fixed text + detailed section-level changes.
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

Return JSON with this exact structure:
{{
  "fixed_cv_text": "<the full rewritten CV as plain text>",
  "changes": [
    {{
      "section": "<which CV section was changed: Summary, Skills, Experience, Education, etc.>",
      "before": "<the original text from that section (brief excerpt)>",
      "after": "<the improved text for that section (brief excerpt)>",
      "reason": "<why this change improves the CV for this specific role>"
    }}
  ],
  "quick_wins": [
    "<actionable suggestion 1 the candidate can do manually>",
    "<actionable suggestion 2>",
    "<actionable suggestion 3>"
  ],
  "ats_improvement": "<explain how the ATS score improved, e.g. 'Estimated ATS score improved from ~55 to ~82 by adding 8 missing keywords and restructuring bullet points.'>"
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
    user_name: str = "",
    user_email: str = "",
    user_phone: str = "",
    user_city: str = "",
    user_country: str = "",
) -> str:
    """Returns a ready-to-send cover letter as plain text with professional structure."""
    from datetime import date
    tone_instruction = TONE_INSTRUCTIONS.get(tone, TONE_INSTRUCTIONS["professional"])
    today = date.today().strftime("%B %d, %Y")

    # Build contact info block for the AI
    contact_parts = []
    if user_name:
        contact_parts.append(f"Full Name: {user_name}")
    if user_phone:
        contact_parts.append(f"Phone: {user_phone}")
    if user_email:
        contact_parts.append(f"Email: {user_email}")
    if user_city or user_country:
        location = ", ".join(filter(None, [user_city, user_country]))
        contact_parts.append(f"Location: {location}")
    contact_parts.append(f"Date: {today}")
    contact_info = "\n".join(contact_parts)

    system = (
        f"You are an expert executive cover letter writer. "
        f"Tone: {tone_instruction}. "
        "Your MOST IMPORTANT rule: the cover letter must be about the CANDIDATE's concrete achievements. "
        "Do NOT write generic filler about the company's mission or industry standing. "
        "Return ONLY the final cover letter text. Do not include markdown formatting like ```text or ```markdown. "
        "Do not include commentary, notes, or placeholders. Do not repeat information."
    )
    user = f"""
Role: {job_title}
Company: {company}

--- CANDIDATE CONTACT INFO ---
{contact_info}

--- JOB DESCRIPTION ---
{job_description}

--- CANDIDATE CV ---
{cv_text}

Write a professional cover letter following this EXACT structure. Do NOT include section titles or numbers in your output. Just write the letter naturally.

[Header Section]
Candidate's full name
Candidate's phone number
Candidate's email
Candidate's location (city/state)

{today}

Hiring Manager
{company}

[Salutation]
Dear Hiring Manager,

[Opening Paragraph (3-4 sentences)]
State the candidate's name and the position being applied for. Mention relevant experience and enthusiasm for the role. Focus on responsibilities and accomplishments from the CV.

[Skills Alignment Paragraph (3-4 sentences)]
Outline how the candidate's skills align with the position requirements. Mention specific programming languages, frameworks, and technologies from the CV that match the job description. Highlight projects worked on to demonstrate technical versatility.

[Conclusion Paragraph (2-3 sentences)]
Summarize key points reinforcing why the candidate is qualified. Include a call to action indicating eagerness to discuss the opportunity further.

[Sign-off]
Sincerely,

[Candidate's full name]

CRITICAL RULES:
1. EVERY paragraph must reference concrete facts, skills, or achievements strictly from the provided CV.
2. DO NOT fabricate any skills, experience, or metrics that are not in the CV.
3. DO NOT repeat the header or contact information anywhere else in the letter.
4. Ensure the letter is COMPLETE. Do not cut off the text. Finish the letter with the sign-off and the candidate's name.
5. Keep total length between 300-450 words.

Write the cover letter now:
"""  
    return _ask(system, user, max_tokens=2500)


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
