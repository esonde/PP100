#!/usr/bin/env python3
"""
PP100 Ingest Pipeline Runner
Main CLI for running the ingest pipeline
"""

import argparse
import logging
import sys
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict, Optional
import pandas as pd

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ingest.adapters.camera_html import CameraHTMLAdapter
from ingest.adapters.senato_html import SenatoHTMLAdapter
from ingest.utils.http import create_session
from ingest.utils.io import (
    safe_write_parquet, read_manifest, create_default_manifest,
    update_manifest, ensure_directory, get_file_size_mb
)
from ingest.utils.text import test_span_coherence

# Import at top level to avoid NameError
from ingest.utils.io import update_manifest

def setup_logging(verbose: bool = False) -> None:
    """Setup logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

def run_ingest(day: str, verbose: bool = False, dry_run: bool = False) -> bool:
    """
    Run the complete ingest pipeline
    
    Args:
        day: Date string in YYYY-MM-DD format
        verbose: Enable verbose logging
        dry_run: Run in dry-run mode (no file writing, no manifest updates)
        
    Returns:
        True if successful, False otherwise
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting ingest pipeline")
    
    # Ensure data directory exists
    data_dir = Path("public/data")
    ensure_directory(data_dir)
    
    # Read or create manifest
    manifest_path = data_dir / "manifest.json"
    try:
        manifest = read_manifest(str(manifest_path))
    except FileNotFoundError:
        manifest = create_default_manifest()
        logger.info("Created new manifest")
    
    # Create HTTP session
    session = create_session()
    
    # Initialize adapters
    camera_adapter = CameraHTMLAdapter()
    senato_adapter = SenatoHTMLAdapter()
    
    all_interventions = []
    sources_used = {}
    
    # Process Camera dei Deputati
    logger.info("Processing Camera dei Deputati")
    try:
        camera_interventions = process_source(
            camera_adapter, session, manifest, "camera"
        )
        if camera_interventions:
            all_interventions.extend(camera_interventions)
            # Get the source URL used
            sources_used["camera"] = camera_interventions[0].get("source_url", "unknown")
            logger.info(f"Camera: {len(camera_interventions)} interventions")
        else:
            sources_used["camera"] = "no_data"
            logger.info("Camera: No interventions found")
    except Exception as e:
        logger.error(f"Error processing camera: {e}")
        sources_used["camera"] = "error"
    
    # Process Senato della Repubblica
    logger.info("Processing Senato della Repubblica")
    try:
        senato_interventions = process_source(
            senato_adapter, session, manifest, "senato"
        )
        if senato_interventions:
            all_interventions.extend(senato_interventions)
            # Get the source URL used
            sources_used["senato"] = senato_interventions[0].get("source_url", "unknown")
            logger.info(f"Senato: {len(senato_interventions)} interventions")
        else:
            sources_used["senato"] = "no_data"
            logger.info("Senato: No interventions found")
    except Exception as e:
        logger.error(f"Error processing senato: {e}")
        sources_used["senato"] = "error"
    
    # Validate spans coherence
    logger.info("Span validation complete")
    if all_interventions:
        valid_interventions = []
        for intervention in all_interventions:
            try:
                if test_span_coherence(intervention["text"], intervention["spans_frasi"]):
                    valid_interventions.append(intervention)
                else:
                    logger.warning(f"Span coherence failed for intervention {intervention['id']}")
            except Exception as e:
                logger.warning(f"Error testing span coherence: {e}")
                # Keep the intervention anyway
                valid_interventions.append(intervention)
        
        all_interventions = valid_interventions
        logger.info(f"Validated {len(all_interventions)} interventions")
    
    # Write interventions to Parquet file
    if all_interventions:
        output_filename = f"interventions-{day}.parquet"
        output_path = data_dir / output_filename
        
        if dry_run:
            logger.info(f"Dry-run mode: Would write {len(all_interventions)} interventions to {output_filename}")
            logger.info("Dry-run mode: manifest not updated")
            return True
        
        try:
            # Convert to DataFrame
            df = pd.DataFrame(all_interventions)
            
            # Write to Parquet
            safe_write_parquet(df, str(output_path))
            
            file_size = get_file_size_mb(str(output_path))
            logger.info(f"Wrote {len(all_interventions)} interventions to {output_filename} ({file_size:.2f} MB)")
            
            # Update manifest with success
            update_manifest(
                str(manifest_path),
                interventions_file=f"public/data/{output_filename}",
                status="ok",
                sources=sources_used
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error writing Parquet file: {e}")
            # Update manifest with error
            update_manifest(str(manifest_path), status="error")
            return False
    else:
        logger.info("No valid interventions to write")
        # Update manifest with no data status
        if not dry_run:
            update_manifest(str(manifest_path), status="no_data")
        else:
            logger.info("Dry-run mode: manifest not updated")
        return True

def process_source(adapter, session, manifest: Dict, source_name: str) -> List[Dict]:
    """
    Process a single source using the adapter
    
    Args:
        adapter: Source adapter instance
        session: HTTP session
        manifest: Current manifest data
        source_name: Name of the source for logging
        
    Returns:
        List of intervention dictionaries
    """
    logger = logging.getLogger(__name__)
    
    try:
        # Get last known ETag and Last-Modified for this source
        last_etag = None
        last_modified = None
        
        # Try to get from manifest if available
        if "sources" in manifest and source_name in manifest["sources"]:
            source_info = manifest["sources"][source_name]
            if isinstance(source_info, dict):
                last_etag = source_info.get("etag")
                last_modified = source_info.get("last_modified")
        
        # Fetch latest data
        result = adapter.fetch_latest(session, last_etag, last_modified)
        
        # Check if not modified
        if result.get("not_modified", False):
            logger.info(f"{source_name}: Document not modified, skipping")
            return []
        
        # Parse interventions
        interventions = adapter.parse_interventions(result["html"], result["url"])
        
        # Add fetch metadata
        for intervention in interventions:
            intervention["fetch_etag"] = result.get("etag")
            intervention["fetch_last_modified"] = result.get("last_modified")
        
        return interventions
        
    except Exception as e:
        logger.error(f"Error processing {source_name}: {e}")
        return []

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="PP100 Ingest Pipeline")
    parser.add_argument(
        "--day", 
        type=str, 
        default=date.today().isoformat(),
        help="Date to process (YYYY-MM-DD format, default: today)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run in dry-run mode (no file writing, no manifest updates)"
    )
    
    args = parser.parse_args()
    
    # Validate date format
    try:
        datetime.strptime(args.day, "%Y-%m-%d")
    except ValueError:
        print(f"Error: Invalid date format '{args.day}'. Use YYYY-MM-DD format.")
        sys.exit(1)
    
    # Setup logging
    setup_logging(args.verbose)
    
    # Run ingest
    success = run_ingest(args.day, args.verbose, args.dry_run)
    
    if success:
        print("Ingest pipeline completed")
        sys.exit(0)
    else:
        print("Ingest pipeline failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
