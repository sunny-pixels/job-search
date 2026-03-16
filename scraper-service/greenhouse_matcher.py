#!/usr/bin/env python3
"""
Greenhouse Job Matcher - Searches for jobs based on resume keywords
"""

import sys
import json
import requests
import time
import random

# Companies using Greenhouse
GREENHOUSE_COMPANIES = [
    "cloudflare",
    "stripe",
    "airbnb",
    "squarespace",
    "databricks",
    "gitlab",
    "figma",
    "canonical",
    "reddit",
    "roblox",
    "discord",
    "airtable",
    "webflow",
    "vercel",
    "anthropic",
]

def search_jobs_by_keywords(keywords, max_jobs=500):
    """
    Search for jobs matching the given keywords across multiple companies
    Returns mixed results from all companies (not sequential)
    
    Args:
        keywords: List of job titles to search for
        max_jobs: Maximum number of jobs to return
    
    Returns:
        List of matching jobs (mixed from all companies)
    """
    
    # Store jobs per company
    company_jobs = {}
    keywords_lower = [k.lower() for k in keywords]
    
    # First, collect jobs from ALL companies
    for company in GREENHOUSE_COMPANIES:
        try:
            url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "application/json",
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get("jobs", [])
                
                company_matches = []
                
                # Filter jobs by keywords
                for job in jobs:
                    title_lower = job.get("title", "").lower()
                    
                    # Check if any keyword matches the job title
                    if any(keyword in title_lower for keyword in keywords_lower):
                        location_obj = job.get("location", {})
                        location = location_obj.get("name", "N/A") if isinstance(location_obj, dict) else str(location_obj)
                        
                        departments = job.get("departments", [])
                        department = ", ".join([d.get("name", "") for d in departments if d.get("name")]) if departments else "N/A"
                        
                        job_data = {
                            "company": company.title(),
                            "job_id": job.get("id"),
                            "title": job.get("title", "N/A"),
                            "location": location,
                            "department": department,
                            "job_url": job.get("absolute_url", "N/A"),
                            "updated_at": job.get("updated_at", "N/A"),
                            "source": "Greenhouse"
                        }
                        
                        company_matches.append(job_data)
                
                if company_matches:
                    company_jobs[company] = company_matches
            
            # Rate limiting
            time.sleep(random.uniform(0.3, 0.8))
            
        except Exception as e:
            # Silently continue on errors
            continue
    
    # Now mix jobs from all companies (round-robin style)
    mixed_jobs = []
    max_iterations = 1000  # Safety limit
    iteration = 0
    
    while len(mixed_jobs) < max_jobs and iteration < max_iterations:
        added_in_round = False
        
        # Take one job from each company in rotation
        for company in GREENHOUSE_COMPANIES:
            if company in company_jobs and len(company_jobs[company]) > 0:
                # Take the first job from this company
                job = company_jobs[company].pop(0)
                mixed_jobs.append(job)
                added_in_round = True
                
                # Check if we've reached the limit
                if len(mixed_jobs) >= max_jobs:
                    break
        
        # If no jobs were added in this round, we're done
        if not added_in_round:
            break
        
        iteration += 1
    
    return mixed_jobs

def main():
    try:
        # Get keywords from command line argument
        if len(sys.argv) < 2:
            print(json.dumps([]))
            return
        
        keywords = json.loads(sys.argv[1])
        
        # Search for jobs (increased limit to get more results)
        jobs = search_jobs_by_keywords(keywords, max_jobs=500)
        
        # Output as JSON
        print(json.dumps(jobs))
        
    except Exception as e:
        # Return empty array on error
        print(json.dumps([]))
        sys.exit(1)

if __name__ == "__main__":
    main()
