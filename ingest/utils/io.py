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
        import hashlib
        
        current_time = datetime.utcnow().isoformat()
        manifest["generated_at"] = current_time
        manifest["status"]["ingest"] = status
        manifest["status"]["last_success"] = current_time if status == "ok" else manifest.get("status", {}).get("last_success")
        
        if interventions_file:
            manifest["current"]["interventions"] = interventions_file
            
            # Update files section for interventions
            if "files" not in manifest:
                manifest["files"] = {}
            
            # Calculate checksum if file exists
            file_path = Path(manifest_path).parent / Path(interventions_file).name
            checksum = ""
            record_count = 0
            
            if file_path.exists():
                # Calculate SHA256 checksum
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                    checksum = hashlib.sha256(file_content).hexdigest()
                
                # Count records if it's a parquet file
                if file_path.suffix == '.parquet':
                    try:
                        df = pd.read_parquet(file_path)
                        record_count = len(df)
                    except Exception:
                        record_count = 0
            
            # Update interventions file info
            manifest["files"]["interventions"] = {
                "filename": Path(interventions_file).name,
                "version": manifest.get("version", "0.1.0"),
                "generated_at": current_time,
                "checksum": checksum,
                "record_count": record_count,
                "status": "active" if status == "ok" else "error"
            }
        
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
