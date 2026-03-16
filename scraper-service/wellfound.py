import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_wellfound(keyword, limit=5):
    print(f"\nSearching Wellfound for: {keyword}\n")

    keyword = keyword.replace(" ", "%20")
    url = f"https://wellfound.com/jobs?query={keyword}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    try:
        # Add delay to avoid rate limiting
        time.sleep(random.uniform(1, 3))
        
        print(f"Fetching: {url}")
        res = requests.get(url, headers=headers, timeout=15)
        
        print(f"Response status: {res.status_code}")
        
        if res.status_code != 200:
            print(f"Failed to fetch Wellfound page. Status: {res.status_code}")
            return

        soup = BeautifulSoup(res.text, "html.parser")
        
        # Try multiple selectors for Wellfound job listings
        job_selectors = [
            "div[data-test='JobSearchResult']",
            ".job-listing",
            ".startup-job-listing",
            "a[href*='/jobs/']",
            "[data-testid='job-card']"
        ]
        
        jobs = []
        for selector in job_selectors:
            jobs = soup.select(selector)
            if jobs:
                print(f"Found {len(jobs)} jobs using selector: {selector}")
                break
        
        if not jobs:
            print("No job listings found. Wellfound structure may have changed.")
            # Save HTML for debugging
            with open("wellfound_debug.html", "w", encoding="utf-8") as f:
                f.write(res.text)
            print("Saved HTML to wellfound_debug.html for debugging")
            return

        count = 0
        for job in jobs[:limit]:
            try:
                # Extract job details from the listing page directly
                title_selectors = [
                    "h2 a",
                    ".job-title",
                    "[data-test='job-title']",
                    "h3 a",
                    "a[href*='/jobs/'] h2",
                    "a[href*='/jobs/'] h3"
                ]
                
                company_selectors = [
                    ".company-name",
                    "[data-test='company-name']",
                    "a[href*='/company/']",
                    ".startup-name"
                ]
                
                location_selectors = [
                    ".location",
                    "[data-test='location']",
                    ".job-location"
                ]
                
                # Try to extract title
                title = None
                for sel in title_selectors:
                    title_elem = job.select_one(sel)
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        break
                
                # Try to extract company
                company = None
                for sel in company_selectors:
                    company_elem = job.select_one(sel)
                    if company_elem:
                        company = company_elem.get_text(strip=True)
                        break
                
                # Try to extract location
                location = None
                for sel in location_selectors:
                    location_elem = job.select_one(sel)
                    if location_elem:
                        location = location_elem.get_text(strip=True)
                        break
                
                # Get job URL
                job_url = ""
                link_elem = job.select_one("a[href*='/jobs/']")
                if link_elem and link_elem.get('href'):
                    href = link_elem['href']
                    job_url = f"https://wellfound.com{href}" if href.startswith('/') else href
                elif job.get('href') and '/jobs/' in job.get('href', ''):
                    href = job['href']
                    job_url = f"https://wellfound.com{href}" if href.startswith('/') else href

                # If we have basic info, display it
                if title or company:
                    print("Title:", title or "N/A")
                    print("Company:", company or "N/A") 
                    print("Location:", location or "Remote")
                    print("URL:", job_url)
                    print("-" * 50)
                    
                    count += 1
                    
                    # Add delay between jobs
                    time.sleep(random.uniform(0.5, 1.5))
                    
            except Exception as e:
                print(f"Error parsing job: {e}")
                continue

        if count == 0:
            print(f"No valid jobs found for '{keyword}' on Wellfound")
        else:
            print(f"Successfully scraped {count} jobs from Wellfound")

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

# MAIN
if __name__ == "__main__":
    domains = [
        "frontend engineer",
        "ai engineer", 
        "machine learning engineer"
    ]

    for domain in domains:
        scrape_wellfound(domain, limit=3)
        time.sleep(3)
        