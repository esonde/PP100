#!/usr/bin/env python3
"""
PP100 Schema Validation Script
Validates all JSON schemas in the schemas/ directory
"""

import json
import sys
from pathlib import Path
from jsonschema import validate, ValidationError

def validate_schema_file(schema_path: Path) -> bool:
    """Validate a single schema file"""
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema = json.load(f)
        
        # Basic schema validation
        if not isinstance(schema, dict):
            print(f"❌ {schema_path}: Schema must be a JSON object")
            return False
            
        # Check required fields for JSON Schema
        if "$schema" in schema:
            # This is a JSON Schema, validate it
            from jsonschema import Draft7Validator
            Draft7Validator.check_schema(schema)
            print(f"✅ {schema_path}: Valid JSON Schema")
        else:
            # This is a regular JSON file, just check syntax
            print(f"✅ {schema_path}: Valid JSON")
            
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ {schema_path}: Invalid JSON - {e}")
        return False
    except ValidationError as e:
        print(f"❌ {schema_path}: Invalid JSON Schema - {e}")
        return False
    except Exception as e:
        print(f"❌ {schema_path}: Error - {e}")
        return False

def validate_all_schemas() -> bool:
    """Validate all schema files"""
    schemas_dir = Path("schemas")
    if not schemas_dir.exists():
        print("❌ schemas/ directory not found")
        return False
    
    schema_files = list(schemas_dir.glob("*.json"))
    if not schema_files:
        print("❌ No schema files found in schemas/")
        return False
    
    print(f"🔍 Validating {len(schema_files)} schema files...")
    
    success_count = 0
    total_count = len(schema_files)
    
    for schema_file in schema_files:
        if validate_schema_file(schema_file):
            success_count += 1
    
    print(f"\n📊 Validation Results:")
    print(f"✅ Passed: {success_count}")
    print(f"❌ Failed: {total_count - success_count}")
    print(f"📁 Total: {total_count}")
    
    return success_count == total_count

def main():
    """Main entry point"""
    print("🔍 PP100 Schema Validation")
    print("=" * 40)
    
    success = validate_all_schemas()
    
    if success:
        print("\n🎉 All schemas are valid!")
        sys.exit(0)
    else:
        print("\n💥 Some schemas failed validation!")
        sys.exit(1)

if __name__ == "__main__":
    main()
