#!/usr/bin/env python3
"""
Lever Jobs API Scraper - Scrapes job postings from companies using Lever
"""

import requests
import json
import time
import random
from typing import List, Dict, Optional

def scrape_lever_company(company: str, limit: Optional[int] = None) -> List[Dict]:
    """
    Scrape jobs from a single company using Lever API
    
    Args:
        company: Company identifier (e.g., 'netflix', 'figma')
        limit: Maximum number of jobs to return (None for all)
    
    Returns:
        List of job dictionaries
    """
    
    url = f"https://api.lever.co/v0/postings/{company}?mode=json"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
    }
    
    jobs_found = []
    
    try:
        print(f"🔍 Scraping {company.title()} via Lever API...")
        
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            try:
                data = response.json()
                
                if not isinstance(data, list):
                    print(f"❌ {company.title()}: Unexpected API response format")
                    return []
                
                print(f"✅ {company.title()}: Found {len(data)} jobs")
                
                # Apply limit if specified
                jobs_to_process = data[:limit] if limit else data
                
                for job in jobs_to_process:
                    # Extract job details with proper validation
                    title = job.get("text", "N/A")
                    categories = job.get("categories", {})
                    
                    # Handle location - can be string or list
                    location = categories.get("location", "N/A")
                    if isinstance(location, list):
                        location = ", ".join(location) if location else "N/A"
                    
                    # Handle department/team
                    department = categories.get("team", "N/A")
                    if isinstance(department, list):
                        department = ", ".join(department) if department else "N/A"
                    
                    # Handle commitment (Full-time, Part-time, etc.)
                    commitment = categories.get("commitment", "N/A")
                    if isinstance(commitment, list):
                        commitment = ", ".join(commitment) if commitment else "N/A"
                    
                    job_url = job.get("hostedUrl", "N/A")
                    posted_date = job.get("createdAt", "N/A")
                    
                    job_data = {
                        "company": company.title(),
                        "title": title,
                        "location": location,
                        "department": department,
                        "commitment": commitment,
                        "posted_date": posted_date,
                        "job_url": job_url,
                        "source": "Lever"
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
            print(f"❌ {company.title()}: Company not found on Lever (404)")
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

def scrape_multiple_lever_companies(companies: List[str], limit_per_company: Optional[int] = 10) -> List[Dict]:
    """
    Scrape jobs from multiple companies using Lever API
    
    Args:
        companies: List of company identifiers
        limit_per_company: Max jobs per company (None for all)
    
    Returns:
        Combined list of all jobs found
    """
    
    all_jobs = []
    
    print(f"🚀 Lever Jobs Scraper - {len(companies)} Companies")
    print("=" * 50)
    
    for i, company in enumerate(companies, 1):
        print(f"\n[{i}/{len(companies)}] Processing {company}...")
        
        jobs = scrape_lever_company(company, limit_per_company)
        all_jobs.extend(jobs)
        
        # Rate limiting - be respectful to the API
        if i < len(companies):  # Don't sleep after the last company
            sleep_time = random.uniform(1, 3)
            print(f"⏳ Waiting {sleep_time:.1f}s before next company...")
            time.sleep(sleep_time)
    
    return all_jobs

def main():
    """Main function to demonstrate the scraper"""
    
    # Companies known to use Lever
    lever_companies = [
        "netflix",
        "figma", 
        "robinhood",
        "notion",
        "segment",
        "openai",
        "stripe",
        "github",
        "postmates",
        "lever",  # Lever itself
        "mixpanel",
        "benchling",
        "flexport",
        "plaid",
        "coursera",
    ]
    
    print("🎯 Available Lever Companies:")
    for i, company in enumerate(lever_companies, 1):
        print(f"  {i:2d}. {company.title()}")
    
    # Scrape all companies
    all_jobs = scrape_multiple_lever_companies(lever_companies, limit_per_company=5)
    
    # Summary
    print(f"\n📈 RESULTS SUMMARY")
    print("=" * 40)
    print(f"🏢 Companies scraped: {len(lever_companies)}")
    print(f"📋 Total jobs found: {len(all_jobs)}")
    
    if all_jobs:
        # Save to file
        output_file = "lever_jobs.json"
        with open(output_file, "w") as f:
            json.dump(all_jobs, f, indent=2)
        print(f"💾 Saved jobs to {output_file}")
        
        # Show sample jobs
        print(f"\n📋 Sample jobs found:")
        for job in all_jobs[:5]:
            print(f"   • {job['title']} at {job['company']}")
            print(f"     📍 {job['location']}")
    else:
        print("❌ No jobs found from any company")

if __name__ == "__main__":
    main()