#!/usr/bin/env python3
"""
HTTP utilities for PP100 ingest pipeline
"""

import logging
import time
from typing import Dict, Optional, Tuple
import requests
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

def create_session() -> requests.Session:
    """Create a requests session with proper headers"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'PP100Bot/0.1 (+https://github.com/ensound/PP100; contact: info@pp100.it)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    return session

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
def fetch_with_etag(
    session: requests.Session,
    url: str,
    last_etag: Optional[str] = None,
    last_modified: Optional[str] = None
) -> Dict[str, any]:
    """
    Fetch URL with ETag/If-Modified-Since support and exponential backoff
    
    Args:
        session: Requests session
        url: URL to fetch
        last_etag: Last known ETag
        last_modified: Last known Last-Modified header
        
    Returns:
        Dictionary with: content, status_code, etag, last_modified, url
    """
    headers = {}
    
    # Add conditional headers if we have them
    if last_etag:
        headers['If-None-Match'] = last_etag
    if last_modified:
        headers['If-Modified-Since'] = last_modified
    
    try:
        logger.debug(f"Fetching {url} with headers: {headers}")
        
        response = session.get(url, headers=headers, timeout=30)
        
        # Log response info
        logger.info(f"Fetched {url} - Status: {response.status_code}, ETag: {response.headers.get('ETag')}")
        
        # Handle 304 Not Modified
        if response.status_code == 304:
            return {
                "content": None,
                "status_code": 304,
                "etag": last_etag,
                "last_modified": last_modified,
                "url": url
            }
        
        # Handle successful responses
        if response.status_code == 200:
            return {
                "content": response.text,
                "status_code": 200,
                "etag": response.headers.get('ETag'),
                "last_modified": response.headers.get('Last-Modified'),
                "url": url
            }
        
        # Handle other status codes
        response.raise_for_status()
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching {url}: {e}")
        raise

def fetch_with_content_hash(
    session: requests.Session,
    url: str,
    last_content_hash: Optional[str] = None
) -> Dict[str, any]:
    """
    Fetch URL with content hash for deduplication when ETag is not available
    
    Args:
        session: Requests session
        url: URL to fetch
        last_content_hash: Last known content hash
        
    Returns:
        Dictionary with: content, status_code, content_hash, url
    """
    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()
        
        content = response.text
        content_hash = str(hash(content))
        
        # Check if content has changed
        if last_content_hash and content_hash == last_content_hash:
            return {
                "content": None,
                "status_code": 304,
                "content_hash": content_hash,
                "url": url
            }
        
        return {
            "content": content,
            "status_code": 200,
            "content_hash": content_hash,
            "url": url
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching {url}: {e}")
        raise
