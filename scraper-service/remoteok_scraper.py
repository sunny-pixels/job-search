#!/usr/bin/env python3
"""
RemoteOK job scraper - they have a public API and are scraper-friendly
"""

import requests
import time
import random

def scrape_remoteok(keyword, limit=5):
    print(f"\nSearching RemoteOK for: {keyword}\n")
    
    # RemoteOK has a public API
    url = "https://remoteok.io/api"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    
    try:
        time.sleep(random.uniform(1, 2))  # Be respectful
        
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to fetch RemoteOK API. Status: {response.status_code}")
            return
        
        jobs_data = response.json()
        
        # Filter jobs by keyword
        matching_jobs = []
        keyword_lower = keyword.lower()
        
        for job in jobs_data[1:]:  # Skip first element (metadata)
            if not isinstance(job, dict):
                continue
                
            title = job.get('position', '').lower()
            description = job.get('description', '').lower()
            tags = ' '.join(job.get('tags', [])).lower()
            
            if (keyword_lower in title or 
                keyword_lower in description or 
                keyword_lower in tags):
                matching_jobs.append(job)
        
        count = 0
        for job in matching_jobs[:limit]:
            try:
                title = job.get('position', 'N/A')
                company = job.get('company', 'N/A')
                location = job.get('location', 'Remote')
                salary = job.get('salary_min', '')
                if salary:
                    salary_max = job.get('salary_max', '')
                    salary = f"${salary:,}" + (f" - ${salary_max:,}" if salary_max else "")
                
                job_url = f"https://remoteok.io/remote-jobs/{job.get('id', '')}"
                
                print("Title:", title)
                print("Company:", company)
                print("Location:", location)
                if salary:
                    print("Salary:", salary)
                print("URL:", job_url)
                print("Tags:", ', '.join(job.get('tags', [])))
                print("-" * 50)
                
                count += 1
                
            except Exception as e:
                print(f"Error parsing job: {e}")
                continue
        
        if count == 0:
            print(f"No jobs found for '{keyword}' on RemoteOK")
        else:
            print(f"Successfully found {count} jobs on RemoteOK")
            
    except Exception as e:
        print(f"Error scraping RemoteOK: {e}")

if __name__ == "__main__":
    scrape_remoteok("frontend developer", 3)