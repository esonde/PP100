#!/usr/bin/env python3
"""
ID utilities for PP100 ingest pipeline
"""

import hashlib
from typing import Any

def stable_id(*components: Any) -> str:
    """
    Generate a stable, deterministic ID from components
    
    Args:
        *components: Components to hash together
        
    Returns:
        16-character SHA256 hash
    """
    # Convert all components to strings and join
    combined = "|".join(str(comp) for comp in components)
    
    # Generate SHA256 hash
    hash_obj = hashlib.sha256(combined.encode('utf-8'))
    
    # Return first 16 characters
    return hash_obj.hexdigest()[:16]

def intervention_id(source: str, seduta: str, ts_start: str, oratore: str, text_hash: int = None) -> str:
    """
    Generate a stable ID for an intervention
    
    Args:
        source: Source chamber ("camera" or "senato")
        seduta: Session identifier
        ts_start: Start timestamp
        oratore: Speaker name
        text_hash: Hash of the intervention text (optional)
        
    Returns:
        16-character SHA256 hash
    """
    if text_hash is None:
        text_hash = 0
    
    return stable_id(source, seduta, ts_start, oratore, text_hash)

def validate_id(id_str: str) -> bool:
    """
    Validate if a string is a valid ID format.
    
    Args:
        id_str: String to validate
    
    Returns:
        True if valid 16-character hex string
    """
    if not isinstance(id_str, str):
        return False
    
    if len(id_str) != 16:
        return False
    
    try:
        int(id_str, 16)
        return True
    except ValueError:
        return False
