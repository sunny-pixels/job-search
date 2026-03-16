#!/usr/bin/env python3

from greenhouse import scrape_greenhouse
from remoteok_scraper import scrape_remoteok
from hackernews_jobs import scrape_hackernews_jobs
from jobs_api_scraper import scrape_usajobs
import time

def main():
    keywords = [
        "frontend",
        "react", 
        "python",
        "ai"
    ]

    search_queries = [
        "frontend developer",
        "react developer", 
        "python developer"
    ]

    greenhouse_companies = [
        "airbnb",
        "stripe"
    ]

    print("🚀 Starting Job Scraper with Working Sources...")
    print("=" * 60)

    print("\n========== GREENHOUSE JOBS ==========")
    for company in greenhouse_companies:
        scrape_greenhouse(company, keywords, limit=2)
        time.sleep(2)

    for query in search_queries:
        print(f"\n🔍 Searching for: {query}")
        print("=" * 40)
        
        print("\n========== REMOTEOK JOBS ==========")
        scrape_remoteok(query, limit=3)
        time.sleep(2)
        
        print("\n========== HACKER NEWS JOBS ==========")
        scrape_hackernews_jobs(query.split()[0], limit=3)  # Use first word as keyword
        time.sleep(2)
        
        print("\n========== USA JOBS (Government) ==========")
        scrape_usajobs(query, limit=2)
        time.sleep(2)

    print("\n✅ Job scraping completed!")
    print("\n📝 Note: Indeed and Wellfound block scraping (403 errors)")
    print("💡 Consider using their official APIs or job aggregator APIs instead")

if __name__ == "__main__":
    main()