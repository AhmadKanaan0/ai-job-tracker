"""
Job Scraper — fetches listings from multiple portals.

Supported sources:
  - We Work Remotely   (no JS needed, clean HTML)
  - Remotive           (public JSON API)
  - RemoteOK           (public JSON API)
  - Himalayas          (public JSON API)
  - Greenhouse         (company-specific JSON API)
  - Lever              (company-specific JSON API)
  - Ashby              (company-specific JSON API)
  - LinkedIn           (via JSearch RapidAPI — requires API key)
  - Indeed             (via JSearch RapidAPI — requires API key)

For LinkedIn/Indeed we use JSearch API (https://rapidapi.com/letscrape-6baf62af1c/api/jsearch)
because scraping LinkedIn directly gets you blocked fast.
"""

import httpx
import asyncio
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Optional
from app.core.config import settings

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# ── Playwright Fallback (Level 1) ────────────────────────────────────────────

async def _scrape_with_playwright(url: str) -> str:
    """Uses Playwright to render JS and extract text from complex SPAs."""
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=20000)
            # Remove noise
            await page.evaluate('''() => {
                const noise = document.querySelectorAll('nav, header, footer, script, style, svg');
                noise.forEach(n => n.remove());
            }''')
            # Extract text from body
            text = await page.locator("body").inner_text()
            return text[:8000]
        finally:
            await browser.close()


# ── Zero-Token Board Scanner (Level 2) ───────────────────────────────────────

async def scan_company_board(company: str, ats_type: str = "auto") -> List[Dict]:
    """
    Fetches all active jobs for a given company via their JSON APIs.
    ats_type can be 'greenhouse', 'ashby', 'lever', or 'auto' (will try to guess/bruteforce).
    """
    # Simple bruteforce if auto
    types_to_try = [ats_type] if ats_type != "auto" else ["greenhouse", "ashby", "lever"]
    
    for t in types_to_try:
        try:
            if t == "greenhouse":
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs")
                    if resp.status_code == 200:
                        data = resp.json().get("jobs", [])
                        return [{
                            "title": j.get("title", ""),
                            "company": company,
                            "location": j.get("location", {}).get("name", "Unknown"),
                            "remote": "remote" if "remote" in j.get("location", {}).get("name", "").lower() else None,
                            "url": j.get("absolute_url", ""),
                            "source": "greenhouse",
                            "description": None,
                            "tags": [],
                            "salary_min": None,
                            "salary_max": None,
                            "salary_currency": None,
                            "posted_at": None,
                        } for j in data]
            
            elif t == "ashby":
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(f"https://api.ashbyhq.com/posting-api/job-board/{company}?includeCompensation=true")
                    if resp.status_code == 200:
                        data = resp.json().get("jobs", [])
                        return [{
                            "title": j.get("title", ""),
                            "company": company,
                            "location": j.get("location", "Unknown"),
                            "remote": "remote" if "remote" in j.get("location", "").lower() else None,
                            "url": j.get("jobUrl", ""),
                            "source": "ashby",
                            "description": None,
                            "tags": [],
                            "salary_min": None,
                            "salary_max": None,
                            "salary_currency": None,
                            "posted_at": None,
                        } for j in data]
            
            elif t == "lever":
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(f"https://api.lever.co/v0/postings/{company}")
                    if resp.status_code == 200:
                        data = resp.json()
                        return [{
                            "title": j.get("text", ""),
                            "company": company,
                            "location": j.get("categories", {}).get("location", "Unknown"),
                            "remote": "remote" if "remote" in j.get("categories", {}).get("location", "").lower() else None,
                            "url": j.get("hostedUrl", ""),
                            "source": "lever",
                            "description": None,
                            "tags": [],
                            "salary_min": None,
                            "salary_max": None,
                            "salary_currency": None,
                            "posted_at": _parse_date(j.get("createdAt")),
                        } for j in data]
        except Exception:
            continue

    return []

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


# ── Master search entry point ────────────────────────────────────────────────

async def search_jobs(
    query: str,
    location: Optional[str] = None,
    remote_only: bool = False,
    sources: Optional[List[str]] = None,
    limit: int = 50,
) -> List[Dict]:
    """
    Search across all (or selected) portals and return a merged list.
    Each result is a dict matching the Job model fields.
    """
    default_sources = ["weworkremotely", "remotive", "remoteok", "himalayas"]
    # Auto-include LinkedIn/Indeed and ATS WebSearch when JSearch key is available
    if settings.JSEARCH_API_KEY:
        default_sources.extend(["linkedin", "indeed", "websearch"])
    all_sources = sources or default_sources

    tasks = []
    for source in all_sources:
        if source == "weworkremotely":
            tasks.append(_scrape_weworkremotely(query))
        elif source == "remotive":
            tasks.append(_fetch_remotive(query))
        elif source == "remoteok":
            tasks.append(_fetch_remoteok(query))
        elif source == "himalayas":
            tasks.append(_fetch_himalayas(query))
        elif source in ("linkedin", "indeed", "websearch") and settings.JSEARCH_API_KEY:
            tasks.append(_fetch_jsearch(query, location, source))

    results_nested = await asyncio.gather(*tasks, return_exceptions=True)

    jobs = []
    for r in results_nested:
        if isinstance(r, Exception):
            # If it's an HTTP error from an external API (like RapidAPI/JSearch)
            if hasattr(r, "response"):
                status_code = getattr(r.response, "status_code", 0)
                if status_code in (401, 403):
                    from fastapi import HTTPException
                    raise HTTPException(status_code=401, detail="External API Key (JSearch/RapidAPI) is invalid or unauthorized. Please check your settings.")
                elif status_code == 429:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=429, detail="External API rate limit exceeded (JSearch/RapidAPI).")
                elif status_code == 402:
                    from fastapi import HTTPException
                    raise HTTPException(status_code=402, detail="External API quota exceeded (JSearch/RapidAPI).")
            continue   # skip other failed sources silently
        jobs.extend(r)

    # Deduplicate by URL
    seen_urls = set()
    unique_jobs = []
    for job in jobs:
        if job["url"] not in seen_urls:
            seen_urls.add(job["url"])
            unique_jobs.append(job)

    return unique_jobs[:limit]


# ── Scrape a single job URL ──────────────────────────────────────────────────

async def scrape_single_job(url: str) -> Dict:
    """
    Detect portal from URL and scrape the single job posting.
    Fallback: generic HTML extraction.
    """
    if "greenhouse.io" in url:
        return await _scrape_greenhouse_job(url)
    elif "lever.co" in url:
        return await _scrape_lever_job(url)
    elif "ashbyhq.com" in url:
        return await _scrape_ashby_job(url)
    elif "weworkremotely.com" in url:
        return await _scrape_wwr_job(url)
    else:
        return await _scrape_generic(url)


# ── We Work Remotely ─────────────────────────────────────────────────────────

async def _scrape_weworkremotely(query: str) -> List[Dict]:
    """Scrape WWR search results page."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(
            "https://weworkremotely.com/remote-jobs/search",
            params={"term": query},
        )
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []

    for article in soup.select("ul.jobs li.feature"):
        try:
            link_tag = article.select_one("a")
            if not link_tag:
                continue
            href = "https://weworkremotely.com" + link_tag["href"]
            company = article.select_one(".company") or article.select_one("span.company")
            title = article.select_one(".title") or article.select_one("span.title")
            region = article.select_one(".region")

            jobs.append({
                "title": title.get_text(strip=True) if title else "Unknown",
                "company": company.get_text(strip=True) if company else "Unknown",
                "location": region.get_text(strip=True) if region else "Remote",
                "remote": "remote",
                "url": href,
                "source": "weworkremotely",
                "description": None,
                "tags": [],
                "salary_min": None,
                "salary_max": None,
                "salary_currency": None,
                "posted_at": None,
            })
        except Exception:
            continue

    return jobs


async def _scrape_wwr_job(url: str) -> Dict:
    """Scrape a single WWR job detail page."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    title = soup.select_one("h1.listing-header-container h2")
    company = soup.select_one("h1.listing-header-container h3")
    description_div = soup.select_one("div.listing-container")

    return {
        "title": title.get_text(strip=True) if title else "Unknown",
        "company": company.get_text(strip=True) if company else "Unknown",
        "location": "Remote",
        "remote": "remote",
        "url": url,
        "source": "weworkremotely",
        "description": description_div.get_text("\n", strip=True) if description_div else None,
        "tags": [],
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "posted_at": None,
    }


# ── Remotive (JSON API) ──────────────────────────────────────────────────────

async def _fetch_remotive(query: str) -> List[Dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://remotive.com/api/remote-jobs",
            params={"search": query, "limit": 30},
        )
        resp.raise_for_status()

    data = resp.json().get("jobs", [])
    jobs = []
    for j in data:
        jobs.append({
            "title": j.get("title", ""),
            "company": j.get("company_name", ""),
            "location": j.get("candidate_required_location", "Remote"),
            "remote": "remote",
            "url": j.get("url", ""),
            "source": "remotive",
            "description": BeautifulSoup(j.get("description", ""), "html.parser").get_text("\n"),
            "tags": j.get("tags", []),
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "posted_at": _parse_date(j.get("publication_date")),
        })
    return jobs


# ── RemoteOK (JSON API) ──────────────────────────────────────────────────────

async def _fetch_remoteok(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers={**HEADERS, "Accept": "application/json"}, timeout=15) as client:
        resp = await client.get("https://remoteok.com/api")
        resp.raise_for_status()

    all_jobs = resp.json()
    keyword = query.lower()
    jobs = []
    for j in all_jobs:
        if not isinstance(j, dict):
            continue
        combined = f"{j.get('position','')} {j.get('company','')} {' '.join(j.get('tags',[]))}".lower()
        if keyword not in combined:
            continue
        jobs.append({
            "title": j.get("position", ""),
            "company": j.get("company", ""),
            "location": "Remote",
            "remote": "remote",
            "url": j.get("url", f"https://remoteok.com/remote-jobs/{j.get('id','')}"),
            "source": "remoteok",
            "description": BeautifulSoup(j.get("description", ""), "html.parser").get_text("\n"),
            "tags": j.get("tags", []),
            "salary_min": j.get("salary_min"),
            "salary_max": j.get("salary_max"),
            "salary_currency": "USD",
            "posted_at": _parse_date(j.get("date")),
        })
    return jobs[:30]


# ── Himalayas (JSON API) ─────────────────────────────────────────────────────

async def _fetch_himalayas(query: str) -> List[Dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://himalayas.app/jobs/api",
            params={"q": query, "limit": 30},
        )
        resp.raise_for_status()

    data = resp.json().get("jobs", [])
    jobs = []
    for j in data:
        jobs.append({
            "title": j.get("title", ""),
            "company": j.get("companyName", ""),
            "location": j.get("locationRestrictions", ["Remote"])[0] if j.get("locationRestrictions") else "Remote",
            "remote": "remote",
            "url": j.get("applicationLink", ""),
            "source": "himalayas",
            "description": j.get("description", ""),
            "tags": [s.get("name") for s in j.get("skills", [])],
            "salary_min": j.get("salaryMin"),
            "salary_max": j.get("salaryMax"),
            "salary_currency": j.get("salaryCurrency"),
            "posted_at": _parse_date(j.get("createdAt")),
        })
    return jobs


# ── JSearch API (LinkedIn + Indeed via RapidAPI) ─────────────────────────────

async def _fetch_jsearch(query: str, location: Optional[str], source: str) -> List[Dict]:
    """
    Uses JSearch API on RapidAPI to get LinkedIn / Indeed results.
    Free tier: 200 requests/month. Get key at rapidapi.com/jsearch.
    """
    if not settings.JSEARCH_API_KEY:
        return []

    if source == "websearch":
        # Level 3 WebSearch discovery for ATS boards
        search_query = f"{query} (site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.ashbyhq.com)"
    else:
        search_query = f"{query} on {source}"
        if location:
            search_query += f" in {location}"

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            "https://jsearch.p.rapidapi.com/search",
            params={"query": search_query, "num_pages": "1"},
            headers={
                "X-RapidAPI-Key": settings.JSEARCH_API_KEY,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
        )
        resp.raise_for_status()

    data = resp.json().get("data", [])
    jobs = []
    for j in data:
        jobs.append({
            "title": j.get("job_title", ""),
            "company": j.get("employer_name", ""),
            "location": j.get("job_city") or j.get("job_country") or "Unknown",
            "remote": "remote" if j.get("job_is_remote") else "onsite",
            "url": j.get("job_apply_link", ""),
            "source": source,
            "description": j.get("job_description", ""),
            "tags": j.get("job_required_skills", []) or [],
            "salary_min": j.get("job_min_salary"),
            "salary_max": j.get("job_max_salary"),
            "salary_currency": j.get("job_salary_currency"),
            "posted_at": _parse_date(j.get("job_posted_at_datetime_utc")),
        })
    return jobs


# ── Greenhouse job detail ────────────────────────────────────────────────────

async def _scrape_greenhouse_job(url: str) -> Dict:
    # URL is usually https://boards.greenhouse.io/company/jobs/id
    try:
        parts = url.rstrip("/").split("/")
        job_id = parts[-1]
        company = parts[-3] if parts[-2] == "jobs" else parts[-2]
        
        api_url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs/{job_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(api_url)
            resp.raise_for_status()
        j = resp.json()
        description = BeautifulSoup(j.get("content", ""), "html.parser").get_text("\n")
        return {
            "title": j.get("title", "Unknown"),
            "company": company,
            "location": j.get("location", {}).get("name", "Unknown"),
            "remote": "remote" if "remote" in j.get("location", {}).get("name", "").lower() else None,
            "url": j.get("absolute_url", url),
            "source": "greenhouse",
            "description": description,
            "tags": [],
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "posted_at": None,
        }
    except Exception:
        return await _scrape_generic(url)


# ── Lever job detail ─────────────────────────────────────────────────────────

async def _scrape_lever_job(url: str) -> Dict:
    # Lever has a JSON endpoint: replace /jobs/ URL with /v0/postings/
    # e.g. https://jobs.lever.co/company/uuid → https://api.lever.co/v0/postings/company/uuid
    try:
        parts = url.rstrip("/").split("/")
        company, job_id = parts[-2], parts[-1]
        api_url = f"https://api.lever.co/v0/postings/{company}/{job_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(api_url)
            resp.raise_for_status()
        j = resp.json()
        description = BeautifulSoup(
            j.get("descriptionPlain") or j.get("description", ""), "html.parser"
        ).get_text("\n")
        return {
            "title": j.get("text", "Unknown"),
            "company": company,
            "location": j.get("categories", {}).get("location", "Unknown"),
            "remote": "remote" if "remote" in j.get("categories", {}).get("location", "").lower() else None,
            "url": j.get("hostedUrl", url),
            "source": "lever",
            "description": description,
            "tags": [],
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "posted_at": None,
        }
    except Exception:
        return await _scrape_generic(url)


# ── Ashby job detail ─────────────────────────────────────────────────────────

async def _scrape_ashby_job(url: str) -> Dict:
    # url e.g. https://jobs.ashbyhq.com/company/id
    try:
        parts = url.rstrip("/").split("/")
        job_id = parts[-1]
        company = parts[-2]
        
        # Fetch the entire board to find the job (Ashby doesn't have an unauth GET for a single job)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(f"https://api.ashbyhq.com/posting-api/job-board/{company}?includeCompensation=true")
            resp.raise_for_status()
            
        jobs = resp.json().get("jobs", [])
        for j in jobs:
            if j.get("id") == job_id or str(job_id) in j.get("jobUrl", ""):
                desc_html = j.get("descriptionHtml", "")
                description = BeautifulSoup(desc_html, "html.parser").get_text("\n") if desc_html else None
                return {
                    "title": j.get("title", "Unknown"),
                    "company": company,
                    "location": j.get("location", "Unknown"),
                    "remote": "remote" if "remote" in j.get("location", "").lower() else None,
                    "url": j.get("jobUrl", url),
                    "source": "ashby",
                    "description": description,
                    "tags": [],
                    "salary_min": None,
                    "salary_max": None,
                    "salary_currency": None,
                    "posted_at": None,
                }
    except Exception:
        pass
        
    return await _scrape_generic(url)


# ── Generic fallback ─────────────────────────────────────────────────────────

async def _scrape_generic(url: str) -> Dict:
    """Best-effort scrape of any job URL. Tries simple HTML, then Playwright."""
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=10, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")
        title = (
            soup.select_one("h1")
            or soup.select_one('[class*="job-title"]')
            or soup.select_one('[class*="position"]')
        )
        
        # If it's a SPA with empty body or Workday, fallback to Playwright
        content = soup.get_text()
        if len(content) < 500 or "workdayjobs" in url:
            raise ValueError("Too little content, probably SPA")

        for tag in soup(["nav", "header", "footer", "script", "style"]):
            tag.decompose()
        description = soup.get_text("\n", strip=True)[:8000]
        
    except Exception:
        # Fallback to Playwright (Level 1)
        try:
            description = await _scrape_with_playwright(url)
            title = None
        except Exception:
            description = "Could not scrape job details."
            title = None

    return {
        "title": title.get_text(strip=True) if title else "Unknown",
        "company": "Unknown",
        "location": None,
        "remote": None,
        "url": url,
        "source": "direct",
        "description": description,
        "tags": [],
        "salary_min": None,
        "salary_max": None,
        "salary_currency": None,
        "posted_at": None,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_date(value) -> Optional[datetime]:
    if not value:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None
