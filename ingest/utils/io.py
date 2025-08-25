#!/usr/bin/env python3
"""
I/O utilities for PP100 ingest pipeline
"""

import json
import os
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

def safe_write_parquet(df: pd.DataFrame, output_path: str) -> bool:
    """
    Safely write DataFrame to Parquet file using atomic write
    
    Args:
        df: DataFrame to write
        output_path: Output file path
        
    Returns:
        True if successful
    """
    try:
        # Create temporary file
        temp_dir = Path(output_path).parent
        temp_file = temp_dir / f".tmp_{Path(output_path).name}"
        
        # Write to temporary file
        df.to_parquet(temp_file, engine='pyarrow', index=False)
        
        # Atomic move
        os.replace(temp_file, output_path)
        
        return True
    except Exception as e:
        # Clean up temp file if it exists
        if temp_file.exists():
            temp_file.unlink()
        raise e

def read_manifest(manifest_path: str) -> Dict[str, Any]:
    """
    Read manifest file
    
    Args:
        manifest_path: Path to manifest file
        
    Returns:
        Manifest data dictionary
    """
    with open(manifest_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_default_manifest() -> Dict[str, Any]:
    """
    Create default manifest structure
    
    Returns:
        Default manifest dictionary
    """
    return {
        "version": "1",
        "generated_at": None,
        "current": {
            "interventions": None
        },
        "status": {
            "ingest": "unknown"
        },
        "sources": {}
    }

def update_manifest(manifest_path: str, interventions_file: Optional[str] = None, 
                   status: str = "unknown", sources: Optional[Dict[str, str]] = None) -> None:
    """
    Update manifest file with new information
    
    Args:
        manifest_path: Path to manifest file
        interventions_file: Path to interventions file (relative to public/data/)
        status: Ingest status ("ok", "error", "no_data", "unknown")
        sources: Dictionary of source URLs used
    """
    try:
        # Read existing manifest or create new one
        if Path(manifest_path).exists():
            manifest = read_manifest(manifest_path)
        else:
            manifest = create_default_manifest()
        
        # Update fields
        from datetime import datetime
        manifest["generated_at"] = datetime.utcnow().isoformat()
        manifest["status"]["ingest"] = status
        
        if interventions_file:
            manifest["current"]["interventions"] = interventions_file
        
        if sources:
            manifest["sources"] = sources
        
        # Write updated manifest
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"Updated manifest: {manifest_path}")
        
    except Exception as e:
        print(f"Error updating manifest: {e}")
        raise

def ensure_directory(path: Path) -> None:
    """
    Ensure directory exists, create if necessary
    
    Args:
        path: Directory path
    """
    path.mkdir(parents=True, exist_ok=True)

def get_file_size_mb(file_path: str) -> float:
    """
    Get file size in megabytes
    
    Args:
        file_path: Path to file
        
    Returns:
        File size in MB
    """
    size_bytes = Path(file_path).stat().st_size
    return size_bytes / (1024 * 1024)
