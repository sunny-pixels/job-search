#!/usr/bin/env python3
"""
Greenhouse Jobs API Scraper - Scrapes job postings from companies using Greenhouse
"""

import requests
import json
import time
import random
from typing import List, Dict, Optional

def scrape_greenhouse_company(company: str, keywords: Optional[List[str]] = None, limit: Optional[int] = None) -> List[Dict]:
    """
    Scrape jobs from a single company using Greenhouse API
    
    Args:
        company: Company identifier (e.g., 'cloudflare', 'stripe')
        keywords: Optional list of keywords to filter jobs (searches in title)
        limit: Maximum number of jobs to return (None for all)
    
    Returns:
        List of job dictionaries
    """
    
    url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    jobs_found = []
    
    try:
        print(f"🔍 Scraping {company.title()} via Greenhouse API...")
        
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            try:
                data = response.json()
                jobs = data.get("jobs", [])
                
                if not jobs:
                    print(f"⚠️  {company.title()}: No jobs available")
                    return []
                
                print(f"✅ {company.title()}: Found {len(jobs)} total jobs")
                
                # Filter by keywords if provided
                if keywords:
                    filtered_jobs = []
                    for job in jobs:
                        title_lower = job.get("title", "").lower()
                        if any(keyword.lower() in title_lower for keyword in keywords):
                            filtered_jobs.append(job)
                    jobs = filtered_jobs
                    print(f"   🔎 Filtered to {len(jobs)} jobs matching keywords: {', '.join(keywords)}")
                
                # Apply limit if specified
                jobs_to_process = jobs[:limit] if limit else jobs
                
                for job in jobs_to_process:
                    # Extract job details
                    title = job.get("title", "N/A")
                    job_id = job.get("id", "N/A")
                    
                    # Handle location
                    location_obj = job.get("location", {})
                    if isinstance(location_obj, dict):
                        location = location_obj.get("name", "N/A")
                    else:
                        location = str(location_obj) if location_obj else "N/A"
                    
                    # Get departments
                    departments = job.get("departments", [])
                    department = ", ".join([d.get("name", "") for d in departments if d.get("name")]) if departments else "N/A"
                    
                    # Get offices
                    offices = job.get("offices", [])
                    office = ", ".join([o.get("name", "") for o in offices if o.get("name")]) if offices else "N/A"
                    
                    job_url = job.get("absolute_url", "N/A")
                    updated_at = job.get("updated_at", "N/A")
                    
                    job_data = {
                        "company": company.title(),
                        "job_id": job_id,
                        "title": title,
                        "location": location,
                        "department": department,
                        "office": office,
                        "updated_at": updated_at,
                        "job_url": job_url,
                        "source": "Greenhouse"
                    }
                    
                    jobs_found.append(job_data)
                    
                    print(f"  📋 {title}")
                    print(f"     📍 {location}")
                    print(f"     🏢 {department}")
                    print(f"     🔗 {job_url}")
                    print()
                    
            except json.JSONDecodeError:
                print(f"❌ {company.title()}: Invalid JSON response")
                
        elif response.status_code == 404:
            print(f"❌ {company.title()}: Company not found on Greenhouse (404)")
        elif response.status_code == 403:
            print(f"❌ {company.title()}: Access forbidden (403)")
        elif response.status_code == 429:
            print(f"❌ {company.title()}: Rate limited (429)")
        else:
            print(f"❌ {company.title()}: HTTP {response.status_code}")
            
    except requests.exceptions.Timeout:
        print(f"❌ {company.title()}: Request timeout")
    except requests.exceptions.ConnectionError:
        print(f"❌ {company.title()}: Connection error")
    except Exception as e:
        print(f"❌ {company.title()}: Error - {str(e)[:50]}")
    
    return jobs_found

def scrape_multiple_greenhouse_companies(
    companies: List[str], 
    keywords: Optional[List[str]] = None, 
    limit_per_company: Optional[int] = 10
) -> List[Dict]:
    """
    Scrape jobs from multiple companies using Greenhouse API
    
    Args:
        companies: List of company identifiers
        keywords: Optional keywords to filter jobs
        limit_per_company: Max jobs per company (None for all)
    
    Returns:
        Combined list of all jobs found
    """
    
    all_jobs = []
    
    print(f"🚀 Greenhouse Jobs Scraper - {len(companies)} Companies")
    print("=" * 60)
    
    if keywords:
        print(f"🔎 Filtering by keywords: {', '.join(keywords)}")
        print("=" * 60)
    
    for i, company in enumerate(companies, 1):
        print(f"\n[{i}/{len(companies)}] Processing {company}...")
        
        jobs = scrape_greenhouse_company(company, keywords, limit_per_company)
        all_jobs.extend(jobs)
        
        # Rate limiting - be respectful to the API
        if i < len(companies):  # Don't sleep after the last company
            sleep_time = random.uniform(1, 2)
            print(f"⏳ Waiting {sleep_time:.1f}s before next company...")
            time.sleep(sleep_time)
    
    return all_jobs

def main():
    """Main function to demonstrate the scraper"""
    
    # Companies using Greenhouse (from your list)
    greenhouse_companies = [
        "cloudflare",
        "stripe",
        "airbnb",
        # "hubspot",
        "squarespace",
        "databricks",
        "gitlab",
        # "hashicorp",
        "figma",
        "canonical",
        # "doordash", 
        "reddit",
        "roblox",
        "discord",
        # "notion",
        "airtable",
        "webflow",
        "vercel",
        "anthropic",
        # "scale",
    ]
    
    print("🎯 Available Greenhouse Companies:")
    for i, company in enumerate(greenhouse_companies, 1):
        print(f"  {i:2d}. {company.title()}")
    
    # Optional: Filter by keywords (uncomment to use)
    # keywords = ["engineer", "developer", "software"]
    keywords = None
    
    # Scrape all companies
    all_jobs = scrape_multiple_greenhouse_companies(
        greenhouse_companies, 
        keywords=keywords,
        limit_per_company=5  # Limit to 5 jobs per company for demo
    )
    
    # Summary
    print(f"\n📈 RESULTS SUMMARY")
    print("=" * 40)
    print(f"🏢 Companies scraped: {len(greenhouse_companies)}")
    print(f"📋 Total jobs found: {len(all_jobs)}")
    
    if all_jobs:
        # Save to file
        output_file = "greenhouse_jobs.json"
        with open(output_file, "w") as f:
            json.dump(all_jobs, f, indent=2)
        print(f"💾 Saved jobs to {output_file}")
        
        # Show sample jobs
        print(f"\n📋 Sample jobs found:")
        for job in all_jobs[:10]:
            print(f"   • {job['title']} at {job['company']}")
            print(f"     📍 {job['location']}")
        
        # Company breakdown
        company_counts = {}
        for job in all_jobs:
            company = job['company']
            company_counts[company] = company_counts.get(company, 0) + 1
        
        print(f"\n📊 Jobs by Company:")
        for company, count in sorted(company_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"   • {company}: {count} jobs")
    else:
        print("❌ No jobs found from any company")

if __name__ == "__main__":
    main()