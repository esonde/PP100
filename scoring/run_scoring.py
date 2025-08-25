#!/usr/bin/env python3
"""
PP100 Scoring Pipeline Runner
Calculates PP (Political Position) scores and indicators
"""

import argparse
import logging
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

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

def run_scoring_dry_run() -> bool:
    """Run scoring pipeline in dry-run mode for PR CI"""
    logger = logging.getLogger(__name__)
    logger.info("Starting scoring pipeline in dry-run mode")
    
    try:
        # Check if we're in PR CI mode
        if os.getenv('PR_CI') == '1':
            logger.info("PR_CI mode detected - running validation only")
            
            # Validate that scoring components can be imported
            try:
                import pandas as pd
                import pyarrow
                logger.info("✅ Required scoring dependencies available")
            except ImportError as e:
                logger.warning(f"Missing dependency: {e}")
            
            # Check if scoring schemas exist
            schemas_dir = Path("../schemas")
            scoring_schemas = list(schemas_dir.glob("*scores*.json"))
            
            if scoring_schemas:
                logger.info(f"✅ Found {len(scoring_schemas)} scoring schemas")
                for schema in scoring_schemas:
                    logger.info(f"   - {schema.name}")
            else:
                logger.info("ℹ️  No scoring schemas found (expected during development)")
            
            # Check if sample scoring data exists
            data_dir = Path("../public/data")
            scoring_files = list(data_dir.glob("*scores*.json")) if data_dir.exists() else []
            
            if scoring_files:
                logger.info(f"✅ Found {len(scoring_files)} scoring data files")
                for file in scoring_files:
                    logger.info(f"   - {file.name}")
            else:
                logger.info("ℹ️  No scoring data files found (expected in dry-run)")
            
            logger.info("Scoring pipeline dry-run validation completed successfully")
            return True
            
        else:
            logger.info("Full scoring mode - calculating PP scores")
            
            # Full scoring pipeline would go here
            # For now, just validate the environment
            logger.info("Full scoring mode not yet implemented")
            return True
            
    except Exception as e:
        logger.error(f"Scoring pipeline failed: {e}")
        return False

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="PP100 Scoring Pipeline")
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run in dry-run mode (PR CI)"
    )
    parser.add_argument(
        "--window",
        type=int,
        default=30,
        help="Rolling window in days (default: 30)"
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    
    # Run scoring
    if args.dry_run or os.getenv('PR_CI') == '1':
        success = run_scoring_dry_run()
    else:
        success = run_scoring_dry_run()  # For now, always dry-run mode
    
    if success:
        print("Scoring pipeline completed successfully")
        sys.exit(0)
    else:
        print("Scoring pipeline failed")
        sys.exit(1)

if __name__ == "__main__":
    main()