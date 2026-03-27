#!/usr/bin/env python3
"""
JobSpy scraper — scrapes Indeed + LinkedIn across multiple countries.
Usage:
  python3 jobspy_scraper.py '["Software Engineer", "Full-Stack Developer"]'
  python3 jobspy_scraper.py '["Software Engineer"]' '["India", "USA", "UK"]'
"""

import sys
import json
from collections import defaultdict
from jobspy import scrape_jobs

SUPPORTED_COUNTRIES = ["India", "USA", "UK", "Canada", "Australia", "Germany", "Singapore", "UAE"]

# Map country name to indeed country code
INDEED_COUNTRY_MAP = {
    "India": "India",
    "USA": "USA",
    "UK": "UK",
    "Canada": "Canada",
    "Australia": "Australia",
    "Germany": "Germany",
    "Singapore": "Singapore",
    "UAE": "UAE",
}

def scrape_for_role_country(role, country, results_per_role=20):
    """Scrape jobs for a single role + country combination."""
    jobs_list = []
    try:
        jobs = scrape_jobs(
            site_name=["indeed"],
            search_term=role,
            location=country,
            results_wanted=results_per_role,
            hours_old=168,
            job_type="fulltime",
            country_indeed=INDEED_COUNTRY_MAP.get(country, country),
        )

        if jobs is None or jobs.empty:
            return []

        for _, row in jobs.iterrows():
            url = str(row.get("job_url", ""))
            if not url or url == "nan":
                continue
            jobs_list.append({
                "title": str(row.get("title", "N/A")),
                "company": str(row.get("company", "N/A")),
                "location": str(row.get("location", "N/A")),
                "country": country,
                "job_url": url,
                "date_posted": str(row.get("date_posted", "N/A")),
                "description": str(row.get("description", ""))[:1200],
                "source": str(row.get("site", "N/A")),
                "search_role": role,
            })
    except Exception as e:
        print(f"  ❌ Error [{country}] {role}: {e}", file=sys.stderr)

    return jobs_list

def scrape_all(roles, countries):
    """Scrape all role + country combinations, deduplicate by URL."""
    all_jobs = []
    seen_urls = set()

    for country in countries:
        for role in roles:
            print(f"  🔍 [{country}] {role} ...", file=sys.stderr, flush=True)
            results = scrape_for_role_country(role, country)
            new = 0
            for job in results:
                if job["job_url"] not in seen_urls:
                    seen_urls.add(job["job_url"])
                    all_jobs.append(job)
                    new += 1
            print(f"     ✅ {new} new jobs", file=sys.stderr)

    return all_jobs

def main():
    # Roles from arg 1
    if len(sys.argv) >= 2:
        try:
            roles = json.loads(sys.argv[1])
        except Exception:
            roles = [sys.argv[1]]
    else:
        roles = ["Software Engineer"]

    # Countries from arg 2 (optional)
    if len(sys.argv) >= 3:
        try:
            countries = json.loads(sys.argv[2])
        except Exception:
            countries = [sys.argv[2]]
    else:
        countries = SUPPORTED_COUNTRIES

    print(f"\n📋 Roles   : {roles}", file=sys.stderr)
    print(f"🌍 Countries: {countries}", file=sys.stderr)
    print(f"{'─'*80}", file=sys.stderr)

    jobs = scrape_all(roles, countries)

    # Group by country for display
    grouped = defaultdict(list)
    for job in jobs:
        grouped[job['country']].append(job)

    print(f"\n{'='*80}", file=sys.stderr)
    print(f"  📊 {len(jobs)} unique jobs found", file=sys.stderr)
    print(f"{'='*80}", file=sys.stderr)

    for country, country_jobs in grouped.items():
        print(f"\n  🌍 {country} — {len(country_jobs)} jobs\n", file=sys.stderr)
        for i, job in enumerate(country_jobs, 1):
            posted = job['date_posted'][:10] if job['date_posted'] not in ('nan', 'N/A') else 'N/A'
            print(f"  {i}. {job['title']}  [{job['search_role']}]", file=sys.stderr)
            print(f"     🏢 {job['company']}  |  📍 {job['location']}  |  🕒 {posted}  |  {job['source']}", file=sys.stderr)
            print(f"     🔗 {job['job_url']}", file=sys.stderr)
            print(file=sys.stderr)

    print(f"{'='*80}\n", file=sys.stderr)

    # JSON output for backend — use sentinel marker for reliable parsing
    print("__JSON_START__")
    print(json.dumps(jobs))
    print("__JSON_END__")

if __name__ == "__main__":
    main()
