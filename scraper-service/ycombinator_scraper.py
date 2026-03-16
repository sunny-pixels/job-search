#!/usr/bin/env python3
"""
Y Combinator jobs scraper - they allow scraping
"""

import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_ycombinator(keyword, limit=5):
    print(f"\nSearching Y Combinator jobs for: {keyword}\n")
    
    # YC jobs search URL
    keyword_encoded = keyword.replace(" ", "%20")
    url = f"https://www.ycombinator.com/jobs?q={keyword_encoded}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    
    try:
        time.sleep(random.uniform(1, 2))
        
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to fetch YC jobs. Status: {response.status_code}")
            return
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # YC job listings
        job_cards = soup.select(".job-listing, .job-item, [data-testid='job-card']")
        
        if not job_cards:
            # Try alternative selectors
            job_cards = soup.select("a[href*='/jobs/']")
        
        count = 0
        for job in job_cards[:limit]:
            try:
                # Extract job details
                title_elem = job.select_one(".job-title, h3, h4") or job
                company_elem = job.select_one(".company-name, .company")
                location_elem = job.select_one(".location, .job-location")
                
                title = title_elem.get_text(strip=True) if title_elem else "N/A"
                company = company_elem.get_text(strip=True) if company_elem else "N/A"
                location = location_elem.get_text(strip=True) if location_elem else "Remote"
                
                # Get job URL
                job_url = ""
                if job.get('href'):
                    href = job['href']
                    job_url = f"https://www.ycombinator.com{href}" if href.startswith('/') else href
                elif job.select_one('a'):
                    link = job.select_one('a')
                    href = link.get('href', '')
                    job_url = f"https://www.ycombinator.com{href}" if href.startswith('/') else href
                
                if title and title != "N/A":
                    print("Title:", title)
                    print("Company:", company)
                    print("Location:", location)
                    print("URL:", job_url)
                    print("-" * 50)
                    
                    count += 1
                    
            except Exception as e:
                print(f"Error parsing job: {e}")
                continue
        
        if count == 0:
            print(f"No jobs found for '{keyword}' on Y Combinator")
        else:
            print(f"Successfully found {count} jobs on Y Combinator")
            
    except Exception as e:
        print(f"Error scraping Y Combinator: {e}")

if __name__ == "__main__":
    scrape_ycombinator("react developer", 3)