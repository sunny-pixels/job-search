#!/usr/bin/env python3
"""
Job API scraper using public APIs and scraper-friendly job boards
"""

import requests
import time
import random

def scrape_jobs_api(keyword, limit=5):
    """
    Scrape jobs using Adzuna API (free tier available)
    """
    print(f"\nSearching Jobs API for: {keyword}\n")
    
    # Adzuna API (free tier - 1000 calls/month)
    # You can get free API key from: https://developer.adzuna.com/
    app_id = "your_app_id"  # Replace with actual API key
    app_key = "your_app_key"  # Replace with actual API key
    
    # For demo purposes, we'll use a mock response
    # In production, uncomment the API call below
    
    """
    url = f"https://api.adzuna.com/v1/api/jobs/us/search/1"
    params = {
        'app_id': app_id,
        'app_key': app_key,
        'what': keyword,
        'where': 'remote',
        'results_per_page': limit,
        'sort_by': 'date'
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        if response.status_code == 200:
            data = response.json()
            jobs = data.get('results', [])
            
            for job in jobs:
                print("Title:", job.get('title', 'N/A'))
                print("Company:", job.get('company', {}).get('display_name', 'N/A'))
                print("Location:", job.get('location', {}).get('display_name', 'Remote'))
                print("Salary:", job.get('salary_min', 'Not specified'))
                print("URL:", job.get('redirect_url', ''))
                print("-" * 50)
        else:
            print(f"API request failed: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    """
    
    # Mock data for demonstration
    print("📝 Note: This is a demo. To use real data, get free API key from Adzuna")
    mock_jobs = [
        {
            "title": f"{keyword.title()} - Senior Level",
            "company": "TechCorp Inc",
            "location": "Remote",
            "salary": "$80,000 - $120,000",
            "url": "https://example.com/job1"
        },
        {
            "title": f"{keyword.title()} - Mid Level", 
            "company": "StartupXYZ",
            "location": "San Francisco, CA",
            "salary": "$70,000 - $100,000",
            "url": "https://example.com/job2"
        }
    ]
    
    for job in mock_jobs[:limit]:
        print("Title:", job['title'])
        print("Company:", job['company'])
        print("Location:", job['location'])
        print("Salary:", job['salary'])
        print("URL:", job['url'])
        print("-" * 50)

def scrape_usajobs(keyword, limit=5):
    """
    Scrape USAJobs.gov - government jobs, public API
    """
    print(f"\nSearching USAJobs for: {keyword}\n")
    
    url = "https://data.usajobs.gov/api/search"
    headers = {
        "Host": "data.usajobs.gov",
        "User-Agent": "your-email@example.com"  # Required by USAJobs
    }
    
    params = {
        "Keyword": keyword,
        "ResultsPerPage": limit,
        "SortField": "OpenDate",
        "SortDirection": "Desc"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("SearchResult", {}).get("SearchResultItems", [])
            
            count = 0
            for item in jobs:
                job = item.get("MatchedObjectDescriptor", {})
                
                title = job.get("PositionTitle", "N/A")
                org = job.get("OrganizationName", "N/A")
                location = job.get("PositionLocationDisplay", "N/A")
                salary_min = job.get("PositionRemuneration", [{}])[0].get("MinimumRange", "")
                salary_max = job.get("PositionRemuneration", [{}])[0].get("MaximumRange", "")
                salary = f"${salary_min} - ${salary_max}" if salary_min and salary_max else "Not specified"
                job_url = job.get("PositionURI", "")
                
                print("Title:", title)
                print("Organization:", org)
                print("Location:", location)
                print("Salary:", salary)
                print("URL:", job_url)
                print("-" * 50)
                
                count += 1
                if count >= limit:
                    break
                    
        else:
            print(f"USAJobs API failed: {response.status_code}")
            
    except Exception as e:
        print(f"Error scraping USAJobs: {e}")

if __name__ == "__main__":
    keywords = ["software engineer", "data scientist", "frontend developer"]
    
    for keyword in keywords:
        scrape_jobs_api(keyword, 3)
        time.sleep(2)
        
        scrape_usajobs(keyword, 3)
        time.sleep(2)