#!/usr/bin/env python3
"""
Working Workday scraper - only includes companies that actually work
"""

import requests
import json
import time
import random

# Only companies that are confirmed to work
working_companies = [
    ("netflix", "Netflix"),
    ("dell", "External"),  # ✅ Newly discovered!
]

# Additional companies to try (some might work)
companies_to_test = [
    ("tesla", "Tesla"),
    ("nvidia", "NVIDIAExternalCareerSite"),
    ("qualcomm", "Qualcomm_Careers"),
    ("coinbase", "Coinbase"),
    ("servicenow", "ServiceNow_Careers"),
    ("splunk", "Splunk_Careers"),
    ("walmart", "WalmartCorporate"),
    ("target", "Target"),
    ("salesforce", "External_Salesforce"),
    ("adobe", "Adobe"),
    ("dell", "External"),
    ("accenture", "AccentureCareerSite"),
    ("deloitte", "DeloitteGA"),
    ("pwc", "PwC_Careers"),
    ("nike", "NikeCareers"),
    ("airbnb", "Airbnb"),
    ("uber", "ATG-External"),
    ("lyft", "Lyft"),
    ("spotify", "Spotify"),
    ("slack", "External"),
    ("zoom", "Zoom"),
    ("dropbox", "DBX_External"),
    ("square", "External"),
    ("stripe", "Stripe"),
    ("twilio", "Twilio_External_Career_Site"),
]

def scrape_workday_company(tenant, company, limit=10):
    """Scrape jobs from a single Workday company"""
    
    url = f"https://{tenant}.wd1.myworkdayjobs.com/wday/cxs/{tenant}/{company}/jobs"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": f"https://{tenant}.wd1.myworkdayjobs.com/{company}",
    }

    payload = {
        "appliedFacets": {},
        "limit": limit,
        "offset": 0,
        "searchText": "",
        "sortBy": []
    }

    jobs_found = []
    
    try:
        time.sleep(random.uniform(1, 2))
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("jobPostings", [])
            
            print(f"✅ {tenant.title()}: Found {len(jobs)} jobs")
            
            for job in jobs:
                title = job.get("title", "N/A")
                location = job.get("locationsText", "N/A")
                posted_date = job.get("postedOn", "N/A")
                external_path = job.get("externalPath", "")
                
                job_url = f"https://{tenant}.wd1.myworkdayjobs.com/{company}/job/{external_path}" if external_path else "N/A"
                
                job_data = {
                    "company": tenant.title(),
                    "title": title,
                    "location": location,
                    "posted_date": posted_date,
                    "job_url": job_url
                }
                
                jobs_found.append(job_data)
                
                print(f"  📋 {title}")
                print(f"     📍 {location}")
                print(f"     🔗 {job_url}")
                print()
                
        elif response.status_code == 422:
            print(f"❌ {tenant.title()}: API format error (422)")
        elif response.status_code == 404:
            print(f"❌ {tenant.title()}: Not found (404)")
        elif response.status_code == 403:
            print(f"❌ {tenant.title()}: Blocked (403)")
        else:
            print(f"❌ {tenant.title()}: Error {response.status_code}")
            
    except Exception as e:
        print(f"❌ {tenant.title()}: Exception - {e}")

    return jobs_found

def discover_working_companies():
    """Test companies to find which ones work"""
    
    print("🔍 Discovering working Workday companies...")
    print("=" * 50)
    
    working = []
    
    for tenant, company in companies_to_test:
        print(f"\n🧪 Testing {tenant}...")
        
        url = f"https://{tenant}.wd1.myworkdayjobs.com/wday/cxs/{tenant}/{company}/jobs"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        
        payload = {
            "appliedFacets": {},
            "limit": 3,
            "offset": 0,
            "searchText": "",
            "sortBy": []
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get("jobPostings", [])
                if jobs:
                    print(f"✅ {tenant} WORKS! Found {len(jobs)} jobs")
                    working.append((tenant, company))
                else:
                    print(f"⚠️  {tenant} responds but no jobs")
            else:
                print(f"❌ {tenant} - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {tenant} - Error: {e}")
        
        time.sleep(random.uniform(1, 2))
    
    return working

def main():
    print("🚀 Workday Job Scraper - Testing Multiple Companies")
    print("=" * 60)
    
    all_jobs = []
    
    # Scrape confirmed working companies
    print("📊 Scraping confirmed working companies...")
    for tenant, company in working_companies:
        print(f"\n✅ Scraping {tenant.title()}...")
        jobs = scrape_workday_company(tenant, company, limit=5)
        all_jobs.extend(jobs)
        time.sleep(2)
    
    # Test all companies to find working ones
    print(f"\n🔍 Testing {len(companies_to_test)} companies...")
    print("=" * 40)
    
    newly_working = []
    
    for tenant, company in companies_to_test:
        print(f"\n🧪 Testing {tenant.title()}...")
        
        url = f"https://{tenant}.wd1.myworkdayjobs.com/wday/cxs/{tenant}/{company}/jobs"
        
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        
        payload = {
            "appliedFacets": {},
            "limit": 3,
            "offset": 0,
            "searchText": "",
            "sortBy": []
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                jobs = data.get("jobPostings", [])
                if jobs:
                    print(f"✅ {tenant.upper()} WORKS! Found {len(jobs)} jobs")
                    newly_working.append((tenant, company))
                    
                    # Scrape a few jobs from this working company
                    company_jobs = scrape_workday_company(tenant, company, limit=3)
                    all_jobs.extend(company_jobs)
                else:
                    print(f"⚠️  {tenant.title()} responds but no jobs available")
            elif response.status_code == 422:
                print(f"❌ {tenant.title()} - API format error (422)")
            elif response.status_code == 404:
                print(f"❌ {tenant.title()} - Not found (404) - Wrong company name")
            elif response.status_code == 403:
                print(f"❌ {tenant.title()} - Blocked (403)")
            else:
                print(f"❌ {tenant.title()} - Status {response.status_code}")
                
        except Exception as e:
            print(f"❌ {tenant.title()} - Error: {str(e)[:50]}")
        
        time.sleep(random.uniform(1, 3))  # Be respectful with rate limiting
    
    # Summary
    print(f"\n📈 RESULTS SUMMARY")
    print("=" * 40)
    print(f"✅ Working companies: {len(working_companies) + len(newly_working)}")
    print(f"📋 Total jobs found: {len(all_jobs)}")
    
    if newly_working:
        print(f"\n🎉 Newly discovered working companies:")
        for tenant, company in newly_working:
            print(f"   - {tenant.title()} ({company})")
        
        print(f"\n💡 Add these to 'working_companies' list for future runs!")
    
    if all_jobs:
        # Save to file
        with open("workday_jobs.json", "w") as f:
            json.dump(all_jobs, f, indent=2)
        print(f"\n💾 Saved {len(all_jobs)} jobs to workday_jobs.json")
        
        # Show sample jobs
        print(f"\n📋 Sample jobs found:")
        for job in all_jobs[:5]:
            print(f"   • {job['title']} at {job['company']}")
    else:
        print(f"\n❌ No jobs found from any company")

if __name__ == "__main__":
    main()