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
    types_to_try = [ats_type] if ats_type != "auto" else ["greenhouse", "ashby", "lever", "workable"]
    
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
            elif t == "workable":
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.get(
                        f"https://apply.workable.com/api/v3/accounts/{company}/jobs",
                        headers={"Accept": "application/json"},
                    )
                    if resp.status_code == 200:
                        data = resp.json().get("results", [])
                        return [{
                            "title": j.get("title", ""),
                            "company": company,
                            "location": j.get("location", {}).get("city") or j.get("location", {}).get("country") or "Unknown",
                            "remote": "remote" if j.get("remote") else None,
                            "url": f"https://apply.workable.com/{company}/j/{j.get('shortcode', '')}",
                            "source": "workable",
                            "description": None,
                            "tags": j.get("department", []) if isinstance(j.get("department"), list) else [],
                            "salary_min": None,
                            "salary_max": None,
                            "salary_currency": None,
                            "posted_at": _parse_date(j.get("published_on")),
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
    default_sources = [
        # Fast JSON APIs
        "weworkremotely", "remotive", "remoteok", "himalayas", "workingnomads",
        "hackernews", "yc_jobs",
        # HTML scrapers (fail silently if blocked or SPA)
        "aijobsnet", "euremotejobs", "nodesk", "trulyremote", "fwddeploy",
        "getmanfred", "tecnoempleo", "jobfluent",
        "welcometothejungle", "trueup", "remoterocketship", "devreljob",
    ]
    # Auto-include LinkedIn/Indeed and expanded ATS WebSearch when JSearch key is available
    if settings.JSEARCH_API_KEY:
        default_sources.extend(["linkedin", "indeed", "websearch"])
    all_sources = sources or default_sources

    tasks = []
    for source in all_sources:
        if source == "weworkremotely":       tasks.append(_scrape_weworkremotely(query))
        elif source == "remotive":           tasks.append(_fetch_remotive(query))
        elif source == "remoteok":           tasks.append(_fetch_remoteok(query))
        elif source == "himalayas":          tasks.append(_fetch_himalayas(query))
        elif source == "workingnomads":      tasks.append(_fetch_workingnomads(query))
        elif source == "hackernews":         tasks.append(_fetch_hn_who_is_hiring(query))
        elif source == "yc_jobs":            tasks.append(_fetch_yc_jobs(query))
        elif source == "aijobsnet":          tasks.append(_scrape_aijobs_net(query))
        elif source == "euremotejobs":       tasks.append(_scrape_euremotejobs(query))
        elif source == "nodesk":             tasks.append(_scrape_nodesk(query))
        elif source == "trulyremote":        tasks.append(_scrape_trulyremote(query))
        elif source == "fwddeploy":          tasks.append(_scrape_fwddeploy(query))
        elif source == "getmanfred":         tasks.append(_scrape_getmanfred(query))
        elif source == "tecnoempleo":        tasks.append(_scrape_tecnoempleo(query))
        elif source == "jobfluent":          tasks.append(_scrape_jobfluent(query))
        elif source == "welcometothejungle": tasks.append(_scrape_welcometothejungle(query))
        elif source == "trueup":             tasks.append(_scrape_trueup(query))
        elif source == "remoterocketship":   tasks.append(_scrape_remoterocketship(query))
        elif source == "devreljob":          tasks.append(_scrape_devreljob(query))
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


# ── HN Who's Hiring (Algolia — no key needed) ────────────────────────────────

async def _fetch_hn_who_is_hiring(query: str) -> List[Dict]:
    """Hacker News 'Who is Hiring' via public Algolia API. Finds the latest monthly thread."""
    import json as _json
    async with httpx.AsyncClient(timeout=15) as client:
        story_resp = await client.get(
            "https://hn.algolia.com/api/v1/search_by_date",
            params={"query": "who is hiring", "tags": "story",
                    "restrictSearchableAttributes": "title", "hitsPerPage": 1},
        )
        story_resp.raise_for_status()
        hits = story_resp.json().get("hits", [])
        if not hits:
            return []
        story_id = hits[0].get("objectID", "")

        comments_resp = await client.get(
            "https://hn.algolia.com/api/v1/search",
            params={"query": query, "tags": f"comment,story_{story_id}", "hitsPerPage": 30},
        )
        comments_resp.raise_for_status()

    jobs = []
    for hit in comments_resp.json().get("hits", []):
        text = hit.get("comment_text") or ""
        soup_c = BeautifulSoup(text, "html.parser")
        first_line = soup_c.get_text().split("\n")[0]
        parts = [p.strip() for p in first_line.split("|")]
        company = parts[0][:80] if parts else "Unknown"
        title = parts[1][:100] if len(parts) > 1 else query
        location = parts[2] if len(parts) > 2 else "Remote"
        link_tag = soup_c.find("a")
        url = (link_tag["href"] if link_tag and link_tag.get("href")
               else f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}")
        jobs.append({
            "title": title, "company": company, "location": location,
            "remote": "remote" if "remote" in location.lower() else None,
            "url": url, "source": "hackernews",
            "description": soup_c.get_text("\n")[:3000],
            "tags": [], "salary_min": None, "salary_max": None, "salary_currency": None,
            "posted_at": _parse_date(hit.get("created_at")),
        })
    return jobs


# ── YC Work at a Startup ─────────────────────────────────────────────────────

async def _fetch_yc_jobs(query: str) -> List[Dict]:
    """YC Work at a Startup — tries __NEXT_DATA__ embedded JSON, returns [] if SPA."""
    import json as _json
    async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
        resp = await client.get("https://www.workatastartup.com/jobs", params={"q": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    script = soup.find("script", {"id": "__NEXT_DATA__"})
    if not (script and script.string):
        return []
    try:
        data = _json.loads(script.string)
        jobs_raw = data.get("props", {}).get("pageProps", {}).get("jobs", [])
        return [{
            "title": j.get("title", ""),
            "company": (j.get("company") or {}).get("name", "") if isinstance(j.get("company"), dict) else j.get("company", ""),
            "location": j.get("location") or "Remote",
            "remote": "remote" if j.get("remote") else None,
            "url": f"https://www.workatastartup.com/jobs/{j.get('id', '')}",
            "source": "workatastartup",
            "description": BeautifulSoup(j.get("description") or "", "html.parser").get_text("\n"),
            "tags": j.get("skills") or [],
            "salary_min": j.get("salary_min"), "salary_max": j.get("salary_max"),
            "salary_currency": "USD",
            "posted_at": _parse_date(j.get("created_at")),
        } for j in jobs_raw[:30]]
    except Exception:
        return []


# ── ai-jobs.net ───────────────────────────────────────────────────────────────

async def _scrape_aijobs_net(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://ai-jobs.net/", params={"search": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("article.job_listing, .job-listing, li.job-listing, .job_listing"):
        try:
            title_el = card.select_one("h3 a, h2 a, .position a")
            company_el = card.select_one(".company strong, .company a, .company-name")
            location_el = card.select_one(".location, .job-location")
            href = title_el["href"] if title_el else ""
            if href and not href.startswith("http"):
                href = "https://ai-jobs.net" + href
            jobs.append({
                "title": title_el.get_text(strip=True) if title_el else "Unknown",
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": location_el.get_text(strip=True) if location_el else "Remote",
                "remote": "remote", "url": href, "source": "aijobsnet",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:30]


# ── EU Remote Jobs ────────────────────────────────────────────────────────────

async def _scrape_euremotejobs(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://euremotejobs.com/", params={"s": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("article, .job_listing, .job-card"):
        try:
            title_el = card.select_one("h2 a, h3 a, .title a")
            company_el = card.select_one(".company, .employer, .company-name")
            if not title_el:
                continue
            jobs.append({
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Europe / Remote", "remote": "remote",
                "url": title_el["href"], "source": "euremotejobs",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Nodesk ────────────────────────────────────────────────────────────────────

async def _scrape_nodesk(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get(f"https://nodesk.co/remote-jobs/?search={query}")
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("article, .job, li[class*='job']"):
        try:
            title_el = card.select_one("h2 a, h3 a, a.title")
            company_el = card.select_one(".company, .employer")
            if not title_el:
                continue
            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://nodesk.co" + href
            jobs.append({
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Remote", "remote": "remote", "url": href, "source": "nodesk",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Truly Remote ──────────────────────────────────────────────────────────────

async def _scrape_trulyremote(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://trulyremote.co/", params={"s": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("article, .job_listing, .job"):
        try:
            title_el = card.select_one("h2 a, h3 a, .title a")
            company_el = card.select_one(".company strong, .company a")
            if not title_el:
                continue
            jobs.append({
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Remote", "remote": "remote",
                "url": title_el["href"], "source": "trulyremote",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Forward Deploy (fwddeploy.com) ────────────────────────────────────────────

async def _scrape_fwddeploy(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://fwddeploy.com")
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    keyword = query.lower()
    jobs = []
    for card in soup.select("article, .job, [class*='job-card'], [class*='listing']"):
        try:
            title_el = card.select_one("h2 a, h3 a, a")
            if not title_el:
                continue
            text = card.get_text(" ", strip=True)
            if not any(kw in text.lower() for kw in keyword.split()):
                continue
            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://fwddeploy.com" + href
            company_el = card.select_one(".company, strong")
            jobs.append({
                "title": title_el.get_text(strip=True)[:100],
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Remote", "remote": "remote", "url": href, "source": "fwddeploy",
                "description": text[:500], "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Getmanfred (Spain / Europe) ───────────────────────────────────────────────

async def _scrape_getmanfred(query: str) -> List[Dict]:
    """Getmanfred — tries public JSON API first."""
    async with httpx.AsyncClient(headers={**HEADERS, "Accept": "application/json"}, timeout=15) as client:
        api_resp = await client.get(
            "https://www.getmanfred.com/api/offer-catalog",
            params={"lang": "EN", "limit": 30, "skip": 0, "q": query},
        )
    if api_resp.status_code == 200:
        try:
            raw = api_resp.json()
            items = raw if isinstance(raw, list) else (raw.get("offers") or raw.get("results") or [])
            return [{
                "title": j.get("position") or j.get("title", ""),
                "company": (j.get("company") or {}).get("name", "") if isinstance(j.get("company"), dict) else j.get("company", ""),
                "location": j.get("location") or "Spain / Remote",
                "remote": "remote" if j.get("remote") or "remote" in str(j.get("location", "")).lower() else None,
                "url": f"https://www.getmanfred.com/en/offer/{j.get('slug') or j.get('id', '')}",
                "source": "getmanfred",
                "description": j.get("description", ""),
                "tags": j.get("skills", []) or [],
                "salary_min": j.get("salaryMin") or j.get("salary_min"),
                "salary_max": j.get("salaryMax") or j.get("salary_max"),
                "salary_currency": "EUR",
                "posted_at": _parse_date(j.get("publishedAt") or j.get("published_at")),
            } for j in items[:20]]
        except Exception:
            pass
    # HTML fallback
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get(f"https://www.getmanfred.com/en/job-offers?q={query}")
        if resp.status_code != 200:
            return []
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("article, .offer-card, [class*='offer']"):
        title_el = card.select_one("h2, h3, .title")
        link_el = card.select_one("a[href*='/offer/']")
        if not title_el:
            continue
        href = link_el["href"] if link_el else ""
        if href and not href.startswith("http"):
            href = "https://www.getmanfred.com" + href
        jobs.append({
            "title": title_el.get_text(strip=True), "company": "Unknown",
            "location": "Spain / Remote", "remote": "remote", "url": href, "source": "getmanfred",
            "description": None, "tags": [],
            "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
        })
    return jobs[:20]


# ── Tecnoempleo (Spain) ───────────────────────────────────────────────────────

async def _scrape_tecnoempleo(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://www.tecnoempleo.com/busca-empleo/", params={"te": query, "pg": 1})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select(".oferta, article.oferta, .job_listing"):
        try:
            title_el = card.select_one("h3 a, h2 a, .title a, a.position")
            company_el = card.select_one(".empresa, .company, strong")
            location_el = card.select_one(".location, .localidad, .lugar")
            if not title_el:
                continue
            href = title_el["href"]
            if href and not href.startswith("http"):
                href = "https://www.tecnoempleo.com" + href
            jobs.append({
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": location_el.get_text(strip=True) if location_el else "Spain",
                "remote": "remote" if "remot" in card.get_text().lower() else None,
                "url": href, "source": "tecnoempleo", "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── JobFluent (Spain) ─────────────────────────────────────────────────────────

async def _scrape_jobfluent(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://www.jobfluent.com/jobs", params={"q": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select(".job-card, article, [class*='job']"):
        try:
            title_el = card.select_one("h2 a, h3 a, .title a, a[href*='/jobs/']")
            company_el = card.select_one(".company, .employer")
            if not title_el:
                continue
            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://www.jobfluent.com" + href
            jobs.append({
                "title": title_el.get_text(strip=True), "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Spain", "remote": "remote" if "remote" in card.get_text().lower() else None,
                "url": href, "source": "jobfluent", "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Welcome to the Jungle ─────────────────────────────────────────────────────

async def _scrape_welcometothejungle(query: str) -> List[Dict]:
    """Tries their public API, then HTML fallback."""
    async with httpx.AsyncClient(headers={**HEADERS, "Accept": "application/json"}, timeout=15) as client:
        api_resp = await client.get(
            "https://api.welcometothejungle.com/api/v1/jobs",
            params={"query": query, "locale": "en", "page": 1, "per_page": 30},
        )
    if api_resp.status_code == 200:
        try:
            data = api_resp.json()
            jobs_raw = data.get("jobs") or data.get("data") or []
            if jobs_raw:
                return [{
                    "title": j.get("name", ""),
                    "company": (j.get("organization") or {}).get("name", ""),
                    "location": ((j.get("offices") or [{}])[0]).get("city", "Remote"),
                    "remote": "remote" if j.get("remote") else None,
                    "url": f"https://www.welcometothejungle.com/en/companies/{(j.get('organization') or {}).get('slug', '')}/jobs/{j.get('slug', '')}",
                    "source": "welcometothejungle",
                    "description": j.get("description_plain") or "",
                    "tags": [s.get("name") for s in (j.get("skills") or []) if isinstance(s, dict)],
                    "salary_min": j.get("salary_minimum"), "salary_max": j.get("salary_maximum"),
                    "salary_currency": j.get("salary_currency"),
                    "posted_at": _parse_date(j.get("published_at")),
                } for j in jobs_raw]
        except Exception:
            pass
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://www.welcometothejungle.com/en/jobs", params={"query": query})
        if resp.status_code != 200:
            return []
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("[data-testid*='job'], article"):
        try:
            title_el = card.select_one("h2, h3, [class*='title']")
            link_el = card.select_one("a")
            if not title_el or not link_el:
                continue
            href = link_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://www.welcometothejungle.com" + href
            jobs.append({
                "title": title_el.get_text(strip=True), "company": "Unknown",
                "location": "Remote", "remote": "remote", "url": href, "source": "welcometothejungle",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── TrueUp ────────────────────────────────────────────────────────────────────

async def _scrape_trueup(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://www.trueup.io/jobs", params={"query": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    jobs = []
    for card in soup.select("article, [class*='job-card'], [class*='JobCard']"):
        try:
            title_el = card.select_one("h2 a, h3 a, a[href*='/jobs/']")
            company_el = card.select_one("[class*='company'], [class*='Company']")
            location_el = card.select_one("[class*='location'], [class*='Location']")
            if not title_el:
                continue
            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://www.trueup.io" + href
            jobs.append({
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": location_el.get_text(strip=True) if location_el else "Remote",
                "remote": "remote" if "remote" in card.get_text().lower() else None,
                "url": href, "source": "trueup", "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Remote Rocketship ─────────────────────────────────────────────────────────

async def _scrape_remoterocketship(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://remoterocketship.com/jobs/engineer", params={"q": query})
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    keyword = query.lower()
    jobs = []
    for card in soup.select("article, [class*='job-card'], [class*='JobCard']"):
        try:
            title_el = card.select_one("h2 a, h3 a, a[href*='/jobs/']")
            company_el = card.select_one("[class*='company'], [class*='Company']")
            if not title_el:
                continue
            if not any(kw in card.get_text().lower() for kw in keyword.split()):
                continue
            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://remoterocketship.com" + href
            jobs.append({
                "title": title_el.get_text(strip=True),
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Remote", "remote": "remote", "url": href, "source": "remoterocketship",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── DevRel Job Board ──────────────────────────────────────────────────────────

async def _scrape_devreljob(query: str) -> List[Dict]:
    async with httpx.AsyncClient(headers=HEADERS, timeout=15, follow_redirects=True) as client:
        resp = await client.get("https://devreljob.com")
        resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    keyword = query.lower()
    jobs = []
    for card in soup.select("article, .job, [class*='job'], li"):
        try:
            title_el = card.select_one("h2 a, h3 a, a")
            if not title_el:
                continue
            text = card.get_text().lower()
            if len(text) < 20 or not any(kw in text for kw in keyword.split()):
                continue
            href = title_el.get("href", "")
            if href and not href.startswith("http"):
                href = "https://devreljob.com" + href
            company_el = card.select_one(".company, strong")
            jobs.append({
                "title": title_el.get_text(strip=True)[:100],
                "company": company_el.get_text(strip=True) if company_el else "Unknown",
                "location": "Remote", "remote": "remote", "url": href, "source": "devreljob",
                "description": None, "tags": [],
                "salary_min": None, "salary_max": None, "salary_currency": None, "posted_at": None,
            })
        except Exception:
            continue
    return jobs[:20]


# ── Working Nomads (public JSON API) ────────────────────────────────────────

async def _fetch_workingnomads(query: str) -> List[Dict]:
    """Working Nomads — free public JSON API, no key needed."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://www.workingnomads.com/api/exposed_jobs/",
            params={"limit": 50},
        )
        resp.raise_for_status()

    keyword = query.lower()
    jobs = []
    for j in resp.json():
        if not isinstance(j, dict):
            continue
        combined = f"{j.get('title', '')} {j.get('company', '')} {' '.join(j.get('tags', []))}".lower()
        if not any(kw in combined for kw in keyword.split()):
            continue
        jobs.append({
            "title": j.get("title", ""),
            "company": j.get("company", ""),
            "location": j.get("region") or "Remote",
            "remote": "remote",
            "url": j.get("source_url") or j.get("url", ""),
            "source": "workingnomads",
            "description": j.get("description", ""),
            "tags": j.get("tags", []) if isinstance(j.get("tags"), list) else [],
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "posted_at": _parse_date(j.get("pub_date")),
        })
    return jobs[:30]


# ── JSearch API (LinkedIn + Indeed via RapidAPI) ─────────────────────────────

async def _fetch_jsearch(query: str, location: Optional[str], source: str) -> List[Dict]:
    """
    Uses JSearch API on RapidAPI to get LinkedIn / Indeed results.
    Free tier: 200 requests/month. Get key at rapidapi.com/jsearch.
    """
    if not settings.JSEARCH_API_KEY:
        return []

    if source == "websearch":
        search_query = (
            f"{query} ("
            "site:boards.greenhouse.io OR site:jobs.lever.co OR site:jobs.ashbyhq.com "
            "OR site:apply.workable.com OR site:euremotejobs.com OR site:ai-jobs.net "
            "OR site:nodesk.co OR site:trulyremote.co OR site:workatastartup.com "
            "OR site:fwddeploy.com OR site:remoterocketship.com OR site:devreljob.com"
            ")"
        )
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
