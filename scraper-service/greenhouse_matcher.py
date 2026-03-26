#!/usr/bin/env python3
"""
Greenhouse Job Matcher - Fetches jobs + full JDs for accurate scoring
"""

import sys
import json
import requests
import time
import random
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

GREENHOUSE_COMPANIES = [
    "cloudflare", "stripe", "airbnb", "squarespace", "databricks",
    "gitlab", "figma", "canonical", "reddit", "roblox",
    "discord", "airtable", "webflow", "vercel", "anthropic",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
}

def strip_html(html):
    """Strip HTML tags and clean up whitespace"""
    if not html:
        return ""
    text = re.sub(r'<[^>]+>', ' ', html)
    text = re.sub(r'&[a-zA-Z]+;', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:1200]  # Keep first 1200 chars (requirements section)

def fetch_full_jd(company, job_id):
    """Fetch full job description for a single job"""
    try:
        url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs/{job_id}"
        response = requests.get(url, headers=HEADERS, timeout=8)
        if response.status_code == 200:
            data = response.json()
            raw_content = data.get("content", "") or data.get("description", "")
            return strip_html(raw_content)
    except Exception:
        pass
    return ""

def fetch_jds_parallel(jobs, max_workers=12):
    """Fetch full JDs for all jobs in parallel"""
    print(f"Fetching full JDs for {len(jobs)} jobs...", file=sys.stderr)

    def fetch_one(job):
        company_slug = job["company"].lower()
        jd = fetch_full_jd(company_slug, job["job_id"])
        return job["job_id"], jd

    jd_map = {}
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(fetch_one, job): job for job in jobs}
        for future in as_completed(futures):
            try:
                job_id, jd = future.result()
                jd_map[job_id] = jd
            except Exception:
                pass

    print(f"Fetched {len(jd_map)} JDs", file=sys.stderr)
    return jd_map

def search_jobs_by_keywords(keywords, max_jobs=200):
    """
    Search for keyword-matched jobs across all companies,
    then fetch full JDs in parallel for accurate scoring.
    """
    company_jobs = {}
    keywords_lower = [k.lower() for k in keywords]

    # Fetch job listings from all companies
    for company in GREENHOUSE_COMPANIES:
        try:
            url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"
            response = requests.get(url, headers=HEADERS, timeout=10)

            if response.status_code == 200:
                data = response.json()
                jobs = data.get("jobs", [])
                company_matches = []

                for job in jobs:
                    title_lower = job.get("title", "").lower()
                    if any(keyword in title_lower for keyword in keywords_lower):
                        location_obj = job.get("location", {})
                        location = location_obj.get("name", "N/A") if isinstance(location_obj, dict) else str(location_obj)

                        departments = job.get("departments", [])
                        department = ", ".join([d.get("name", "") for d in departments if d.get("name")]) if departments else "N/A"

                        company_matches.append({
                            "company": company.title(),
                            "job_id": job.get("id"),
                            "title": job.get("title", "N/A"),
                            "location": location,
                            "department": department,
                            "job_url": job.get("absolute_url", "N/A"),
                            "updated_at": job.get("updated_at", "N/A"),
                            "source": "Greenhouse",
                            "description": ""
                        })

                if company_matches:
                    company_jobs[company] = company_matches

            time.sleep(random.uniform(0.2, 0.5))

        except Exception:
            continue

    # Round-robin mix across companies
    mixed_jobs = []
    iteration = 0
    while len(mixed_jobs) < max_jobs and iteration < 1000:
        added = False
        for company in GREENHOUSE_COMPANIES:
            if company in company_jobs and company_jobs[company]:
                mixed_jobs.append(company_jobs[company].pop(0))
                added = True
                if len(mixed_jobs) >= max_jobs:
                    break
        if not added:
            break
        iteration += 1

    # Fetch full JDs in parallel
    if mixed_jobs:
        jd_map = fetch_jds_parallel(mixed_jobs)
        for job in mixed_jobs:
            job["description"] = jd_map.get(job["job_id"], "")

    return mixed_jobs

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps([]))
            return

        keywords = json.loads(sys.argv[1])
        jobs = search_jobs_by_keywords(keywords, max_jobs=150)
        print(json.dumps(jobs))

    except Exception:
        print(json.dumps([]))
        sys.exit(1)

if __name__ == "__main__":
    main()
