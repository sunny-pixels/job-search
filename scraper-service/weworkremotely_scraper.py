#!/usr/bin/env python3
"""
WeWorkRemotely job scraper - allows scraping
"""

import requests
from bs4 import BeautifulSoup
import time
import random

def scrape_weworkremotely(keyword, limit=5):
    print(f"\nSearching WeWorkRemotely for: {keyword}\n")
    
    # WeWorkRemotely search URL
    url = "https://weworkremotely.com/remote-jobs/search"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    
    params = {
        "term": keyword
    }
    
    try:
        time.sleep(random.uniform(1, 2))
        
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to fetch WeWorkRemotely. Status: {response.status_code}")
            return
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # WeWorkRemotely job listings
        job_cards = soup.select("li.feature, section.jobs article")
        
        count = 0
        for job in job_cards[:limit]:
            try:
                # Extract job details
                title_elem = job.select_one(".title, h2 a, .job-title")
                company_elem = job.select_one(".company, .company-name")
                location_elem = job.select_one(".region, .location")
                
                title = title_elem.get_text(strip=True) if title_elem else ""
                company = company_elem.get_text(strip=True) if company_elem else ""
                location = location_elem.get_text(strip=True) if location_elem else "Remote"
                
                # Get job URL
                job_url = ""
                link_elem = job.select_one("a")
                if link_elem and link_elem.get('href'):
                    href = link_elem['href']
                    job_url = f"https://weworkremotely.com{href}" if href.startswith('/') else href
                
                if title and company:
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
            print(f"No jobs found for '{keyword}' on WeWorkRemotely")
        else:
            print(f"Successfully found {count} jobs on WeWorkRemotely")
            
    except Exception as e:
        print(f"Error scraping WeWorkRemotely: {e}")

if __name__ == "__main__":
    scrape_weworkremotely("frontend developer", 3)