"""Time utilities for parsing Italian parliamentary timestamps."""
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def parse_italian_timestamp(timestamp_str: str) -> Optional[datetime]:
    """
    Parse Italian parliamentary timestamp formats.
    
    Args:
        timestamp_str: Timestamp string in various formats
    
    Returns:
        datetime object in UTC, or None if parsing fails
    """
    if not timestamp_str:
        return None
    
    # Remove common prefixes and normalize
    timestamp_str = timestamp_str.strip()
    
    # Common patterns in Italian parliamentary transcripts
    patterns = [
        # "ore 14:30" or "14:30"
        r'(?:ore\s+)?(\d{1,2}):(\d{2})',
        # "14.30" (Italian format)
        r'(\d{1,2})\.(\d{2})',
        # "14,30" (alternative Italian format)
        r'(\d{1,2}),(\d{2})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, timestamp_str)
        if match:
            try:
                hour = int(match.group(1))
                minute = int(match.group(2))
                
                # Validate time components
                if 0 <= hour <= 23 and 0 <= minute <= 59:
                    # Assume Rome timezone (UTC+1/+2)
                    # For now, use UTC+1 as default
                    # TODO: Implement proper timezone detection
                    now = datetime.now(timezone.utc)
                    rome_offset = timedelta(hours=1)  # UTC+1
                    
                    # Create datetime for today with the parsed time
                    parsed_time = datetime(
                        now.year, now.month, now.day,
                        hour, minute, 0, 0,
                        timezone.utc
                    )
                    
                    # Convert to UTC
                    parsed_time = parsed_time - rome_offset
                    
                    return parsed_time
                    
            except (ValueError, TypeError) as e:
                logger.warning(f"Error parsing time components: {e}")
                continue
    
    logger.warning(f"Could not parse timestamp: {timestamp_str}")
    return None

def extract_session_date(text: str) -> Optional[datetime]:
    """
    Extract session date from text content.
    
    Args:
        text: Text content that may contain date information
    
    Returns:
        datetime object or None
    """
    if not text:
        return None
    
    # Common Italian date patterns
    date_patterns = [
        # "seduta del 15 gennaio 2025"
        r'seduta\s+del\s+(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})',
        # "15 gennaio 2025"
        r'(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})',
        # "15/01/2025" or "15-01-2025"
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
    ]
    
    month_names = {
        'gennaio': 1, 'febbraio': 2, 'marzo': 3, 'aprile': 4,
        'maggio': 5, 'giugno': 6, 'luglio': 7, 'agosto': 8,
        'settembre': 9, 'ottobre': 10, 'novembre': 11, 'dicembre': 12
    }
    
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                if len(match.groups()) == 3:
                    if match.group(2).isdigit():
                        # Numeric format (DD/MM/YYYY)
                        day = int(match.group(1))
                        month = int(match.group(2))
                        year = int(match.group(3))
                    else:
                        # Text format (DD Month YYYY)
                        day = int(match.group(1))
                        month = month_names[match.group(2).lower()]
                        year = int(match.group(3))
                    
                    # Validate date components
                    if 1 <= day <= 31 and 1 <= month <= 12 and 1900 <= year <= 2100:
                        return datetime(year, month, day, 0, 0, 0, 0, timezone.utc)
                        
            except (ValueError, KeyError) as e:
                logger.warning(f"Error parsing date components: {e}")
                continue
    
    logger.warning("Could not extract date from text")
    return None

def format_timestamp_for_parquet(dt: datetime) -> str:
    """
    Format datetime for Parquet storage (ISO format with UTC).
    
    Args:
        dt: datetime object
    
    Returns:
        ISO format string in UTC
    """
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        # Convert to UTC
        dt = dt.astimezone(timezone.utc)
    
    return dt.isoformat()

def get_current_rome_time() -> datetime:
    """
    Get current time in Rome timezone.
    
    Returns:
        datetime object in Rome timezone
    """
    # For now, use UTC+1 as approximation
    # TODO: Implement proper timezone handling with pytz or zoneinfo
    now = datetime.now(timezone.utc)
    rome_offset = timedelta(hours=1)
    return now + rome_offset
