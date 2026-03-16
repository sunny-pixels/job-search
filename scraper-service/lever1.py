import requests
import json

COMPANIES = [
    "scaleai",
    "anduril",
    "ramp",
    "benchling",
    "samsara",
    "plaid"
]

BASE_URL = "https://api.lever.co/v0/postings/{}"


def scrape_company(company):

    url = BASE_URL.format(company)

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching {company}: {e}")
        return []

    data = response.json()

    jobs = []

    for job in data:

        job_data = {
            "company": company,
            "title": job.get("text"),
            "location": job.get("categories", {}).get("location"),
            "team": job.get("categories", {}).get("team"),
            "type": job.get("categories", {}).get("commitment"),
            "url": job.get("hostedUrl")
        }

        jobs.append(job_data)

    return jobs


def main():

    all_jobs = []

    for company in COMPANIES:

        print(f"Scraping {company}...")

        jobs = scrape_company(company)

        for job in jobs:
            print(json.dumps(job, indent=2))

        all_jobs.extend(jobs)

    print("\nTotal Jobs:", len(all_jobs))


if __name__ == "__main__":
    main()