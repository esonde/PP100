#!/usr/bin/env python3
"""
PP100 Schema Validator

Validates all files in public/data/ against their corresponding JSON schemas.
Fails the build if any file is invalid.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict

from jsonschema import ValidationError
from jsonschema.validators import validator_for


def load_schema(schema_path: Path) -> Dict[str, Any]:
    """Load a JSON schema file."""
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading schema {schema_path}: {e}")
        sys.exit(1)


def load_data_file(file_path: Path) -> Any:
    """Load a data file (JSON or JSONL)."""
    try:
        if file_path.suffix == ".jsonl":
            # Handle JSONL files
            data = []
            with open(file_path, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if line:
                        try:
                            data.append(json.loads(line))
                        except json.JSONDecodeError as e:
                            print(f"❌ JSONL parse error in {file_path}:{line_num}: {e}")
                            return None
            return data
        else:
            # Handle regular JSON files
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"❌ Error loading data file {file_path}: {e}")
        return None


def validate_file(data_file: Path, schema: Dict[str, Any], schema_name: str) -> bool:
    """Validate a single data file against its schema."""
    print(f"🔍 Validating {data_file.name} against {schema_name}...")

    data = load_data_file(data_file)
    if data is None:
        return False

    try:
        # Get the appropriate validator for the schema
        validator_cls = validator_for(schema)
        validator = validator_cls(schema)

        if isinstance(data, list):
            # For array data, validate each item
            for i, item in enumerate(data):
                validator.validate(item)
        else:
            # For single object data, validate directly
            validator.validate(data)

        print(f"✅ {data_file.name} is valid")
        return True

    except ValidationError as e:
        print(f"❌ Validation error in {data_file.name}: {e.message}")
        if e.path:
            print(f"   Path: {' -> '.join(str(p) for p in e.path)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error validating {data_file.name}: {e}")
        return False


def get_schema_mapping() -> Dict[str, str]:
    """Define which schema to use for each data file type."""
    return {
        "manifest": "manifest.schema.json",
        "cards": "cards.schema.json",
        "scores-rolling": "scores-rolling.schema.json",
    }


def main():
    """Main validation function."""
    print("🚀 PP100 Schema Validation Starting...")

    # Paths
    repo_root = Path(__file__).parent.parent
    schemas_dir = repo_root / "schemas"
    data_dir = repo_root / "public" / "data"

    if not schemas_dir.exists():
        print("❌ Schemas directory not found")
        sys.exit(1)

    if not data_dir.exists():
        print("❌ Data directory not found")
        sys.exit(1)

    # Load all schemas
    schemas = {}
    schema_mapping = get_schema_mapping()

    for schema_name, schema_file in schema_mapping.items():
        schema_path = schemas_dir / schema_file
        if schema_path.exists():
            schemas[schema_name] = load_schema(schema_path)
        else:
            print(
                f"⚠️  Schema {schema_file} not found, skipping {schema_name} validation"
            )

    # Validate each data file
    validation_results = []

    for data_file in data_dir.glob("*"):
        if data_file.is_file() and data_file.suffix in [".json", ".jsonl"]:
            # Determine which schema to use based on filename
            schema_to_use = None
            for schema_name in schemas:
                if schema_name in data_file.name:
                    schema_to_use = schema_name
                    break

            if schema_to_use and schema_to_use in schemas:
                is_valid = validate_file(
                    data_file, schemas[schema_to_use], schema_to_use
                )
                validation_results.append((data_file.name, is_valid))
            else:
                print(f"⚠️  No schema found for {data_file.name}, skipping validation")

    # Summary
    print("\n📊 Validation Summary:")
    total_files = len(validation_results)
    valid_files = sum(1 for _, is_valid in validation_results if is_valid)

    for filename, is_valid in validation_results:
        status = "✅ VALID" if is_valid else "❌ INVALID"
        print(f"   {filename}: {status}")

    print(f"\n📈 Results: {valid_files}/{total_files} files valid")

    if valid_files < total_files:
        print("❌ Validation failed - some files are invalid")
        sys.exit(1)
    else:
        print("🎉 All files validated successfully!")
        sys.exit(0)


if __name__ == "__main__":
    main()
