#!/usr/bin/env python3
"""
Hacker News Jobs scraper - monthly "Who is hiring?" threads
"""

import requests
import time
import re

def scrape_hackernews_jobs(keyword, limit=5):
    """
    Scrape Hacker News "Who is hiring?" posts
    """
    print(f"\nSearching Hacker News Jobs for: {keyword}\n")
    
    try:
        # Get latest "Who is hiring?" post
        # HN API is public and allows scraping
        search_url = "https://hn.algolia.com/api/v1/search"
        params = {
            "query": "who is hiring",
            "tags": "story",
            "hitsPerPage": 1
        }
        
        response = requests.get(search_url, params=params, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to search HN: {response.status_code}")
            return
            
        search_data = response.json()
        
        if not search_data.get("hits"):
            print("No 'Who is hiring?' posts found")
            return
            
        story_id = search_data["hits"][0]["objectID"]
        
        # Get comments from the hiring post
        comments_url = f"https://hn.algolia.com/api/v1/search"
        params = {
            "tags": f"comment,story_{story_id}",
            "hitsPerPage": 100,
            "query": keyword
        }
        
        response = requests.get(comments_url, params=params, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to get comments: {response.status_code}")
            return
            
        comments_data = response.json()
        comments = comments_data.get("hits", [])
        
        count = 0
        for comment in comments:
            if count >= limit:
                break
                
            text = comment.get("comment_text", "")
            author = comment.get("author", "")
            
            # Extract company name (usually in first line)
            lines = text.split('\n')
            company = lines[0] if lines else "Unknown Company"
            
            # Clean up company name
            company = re.sub(r'<[^>]+>', '', company)  # Remove HTML tags
            company = company.strip()
            
            # Extract location if mentioned
            location = "Not specified"
            location_patterns = [
                r'Location[:\s]+([^\n|]+)',
                r'Based in[:\s]+([^\n|]+)',
                r'\b(Remote|SF|NYC|London|Berlin|Austin|Seattle|Boston)\b'
            ]
            
            for pattern in location_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    break
            
            # Extract job title/role
            title_patterns = [
                r'hiring[:\s]+([^\n|]+)',
                r'looking for[:\s]+([^\n|]+)',
                r'seeking[:\s]+([^\n|]+)'
            ]
            
            title = f"{keyword.title()} Position"
            for pattern in title_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    title = match.group(1).strip()
                    break
            
            # Get HN comment URL
            comment_url = f"https://news.ycombinator.com/item?id={comment.get('objectID', '')}"
            
            print("Title:", title[:100])  # Truncate long titles
            print("Company:", company[:50])  # Truncate long company names
            print("Location:", location)
            print("Author:", author)
            print("URL:", comment_url)
            print("Preview:", text[:200] + "..." if len(text) > 200 else text)
            print("-" * 50)
            
            count += 1
            
        if count == 0:
            print(f"No jobs found for '{keyword}' in latest HN hiring thread")
        else:
            print(f"Found {count} potential jobs on Hacker News")
            
    except Exception as e:
        print(f"Error scraping Hacker News: {e}")

if __name__ == "__main__":
    keywords = ["frontend", "react", "python", "ai"]
    
    for keyword in keywords:
        scrape_hackernews_jobs(keyword, 3)
        time.sleep(2)