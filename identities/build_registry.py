"""
Build the persons registry from seed data.
Generates persons.jsonl, person_xref.parquet, person_aliases.parquet, party_registry.jsonl
"""
import csv
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from identities.utils import (
    normalize_name, split_name, slugify, 
    generate_person_id, generate_party_id
)


class RegistryBuilder:
    """Builds and maintains the persons registry."""
    
    def __init__(self, data_dir: str = "public/data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # File paths
        self.persons_file = self.data_dir / "persons.jsonl"
        self.xref_file = self.data_dir / "person_xref.parquet"
        self.aliases_file = self.data_dir / "person_aliases.parquet"
        self.parties_file = self.data_dir / "party_registry.jsonl"
        self.inbox_file = self.data_dir / "identities_inbox.jsonl"
        
        # Load existing data
        self.persons = self._load_persons()
        self.xref = self._load_xref()
        self.aliases = self._load_aliases()
        self.parties = self._load_parties()
        self.inbox = self._load_inbox()
        
        # Counters for new IDs
        self.next_person_id = self._get_next_person_id()
        self.next_party_id = self._get_next_party_id()
    
    def _load_persons(self) -> List[Dict]:
        """Load existing persons from JSONL."""
        if self.persons_file.exists():
            with open(self.persons_file, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        return []
    
    def _load_xref(self) -> pd.DataFrame:
        """Load existing crosswalk from Parquet."""
        if self.xref_file.exists():
            return pd.read_parquet(self.xref_file)
        return pd.DataFrame(columns=[
            'person_id', 'source', 'source_id', 'url', 'first_seen', 'last_seen'
        ])
    
    def _load_aliases(self) -> pd.DataFrame:
        """Load existing aliases from Parquet."""
        if self.aliases_file.exists():
            return pd.read_parquet(self.aliases_file)
        return pd.DataFrame(columns=[
            'person_id', 'alias', 'from', 'to', 'confidence'
        ])
    
    def _load_parties(self) -> List[Dict]:
        """Load existing parties from JSONL."""
        if self.parties_file.exists():
            with open(self.parties_file, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        return []
    
    def _load_inbox(self) -> List[Dict]:
        """Load existing inbox from JSONL."""
        if self.inbox_file.exists():
            with open(self.inbox_file, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        return []
    
    def _get_next_person_id(self) -> int:
        """Get next available person ID counter."""
        if not self.persons:
            return 1
        
        max_id = max(int(p['person_id'][1:]) for p in self.persons)
        return max_id + 1
    
    def _get_next_party_id(self) -> int:
        """Get next available party ID counter."""
        if not self.parties:
            return 1
        
        max_id = max(int(p['party_id'][5:]) for p in self.parties)
        return max_id + 1
    
    def _find_person_by_slug_dob(self, slug: str, dob: Optional[str]) -> Optional[Dict]:
        """Find person by slug and DOB (if available)."""
        for person in self.persons:
            if person['slug'] == slug:
                if dob is None or person.get('dob') == dob:
                    return person
        return None
    
    def _find_person_by_name(self, nome: str, cognome: str) -> Optional[Dict]:
        """Find person by exact name match."""
        for person in self.persons:
            if person['nome'] == nome and person['cognome'] == cognome:
                return person
        return None
    
    def build_from_seeds(self):
        """Build registry from seed CSV files."""
        print("Building registry from seeds...")
        
        # Build parties first
        self._build_parties_from_seed()
        
        # Build persons
        self._build_persons_from_seed()
        
        # Save all data
        self._save_all()
        
        print(f"Registry built: {len(self.persons)} persons, {len(self.parties)} parties")
    
    def _build_parties_from_seed(self):
        """Build party registry from seed CSV."""
        seed_file = Path(__file__).parent / "seeds" / "parties.csv"
        
        if not seed_file.exists():
            print(f"Warning: {seed_file} not found, skipping parties")
            return
        
        with open(seed_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                party = {
                    'party_id': row['party_id'],
                    'name': row['name'],
                    'acronym': row['acronym'],
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                
                # Check if party already exists
                if not any(p['party_id'] == party['party_id'] for p in self.parties):
                    self.parties.append(party)
                    print(f"Added party: {party['name']} ({party['acronym']})")
    
    def _build_persons_from_seed(self):
        """Build persons registry from seed CSV."""
        seed_file = Path(__file__).parent / "seeds" / "persons_sample.csv"
        
        if not seed_file.exists():
            print(f"Warning: {seed_file} not found, skipping persons")
            return
        
        with open(seed_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Check if person already exists
                existing = self._find_person_by_slug_dob(row['slug'], row.get('dob'))
                if existing:
                    print(f"Person already exists: {row['nome']} {row['cognome']}")
                    continue
                
                # Create new person
                person = {
                    'person_id': row['person_id'],
                    'nome': row['nome'],
                    'cognome': row['cognome'],
                    'slug': row['slug'],
                    'dob': row.get('dob') if row.get('dob') else None,
                    'sex': row.get('sex') if row.get('sex') else None,
                    'wikidata_qid': row.get('wikidata_qid') if row.get('wikidata_qid') else None,
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                
                self.persons.append(person)
                
                # Add crosswalk
                self._add_xref(
                    person['person_id'], 
                    row['source'], 
                    row['source_id'], 
                    row['url']
                )
                
                # Add aliases
                raw_name = f"{row['nome']} {row['cognome']}"
                norm_name = normalize_name(raw_name)
                if norm_name != raw_name.lower():
                    self._add_alias(person['person_id'], norm_name, 1.0)
                
                print(f"Added person: {person['nome']} {person['cognome']} ({person['slug']})")
    
    def _add_xref(self, person_id: str, source: str, source_id: str, url: str):
        """Add or update crosswalk entry."""
        now = datetime.now(timezone.utc)
        
        # Check if xref already exists
        mask = (self.xref['person_id'] == person_id) & (self.xref['source'] == source) & (self.xref['source_id'] == source_id)
        
        if mask.any():
            # Update last_seen
            self.xref.loc[mask, 'last_seen'] = now
        else:
            # Add new xref
            new_xref = pd.DataFrame([{
                'person_id': person_id,
                'source': source,
                'source_id': source_id,
                'url': url,
                'first_seen': now,
                'last_seen': now
            }])
            self.xref = pd.concat([self.xref, new_xref], ignore_index=True)
    
    def _add_alias(self, person_id: str, alias: str, confidence: float):
        """Add alias for person."""
        now = datetime.now(timezone.utc)
        
        # Check if alias already exists
        mask = (self.aliases['person_id'] == person_id) & (self.aliases['alias'] == alias)
        
        if not mask.any():
            new_alias = pd.DataFrame([{
                'person_id': person_id,
                'alias': alias,
                'from': now,
                'to': None,
                'confidence': confidence
            }])
            self.aliases = pd.concat([self.aliases, new_alias], ignore_index=True)
    
    def add_to_inbox(self, raw_name: str, norm_name: str, sample_text: str, source_url: str):
        """Add unmatched name to inbox."""
        now = datetime.now(timezone.utc)
        
        # Check if already in inbox
        existing = next((item for item in self.inbox if item['norm_name'] == norm_name), None)
        
        if existing:
            # Update last_seen
            existing['last_seen'] = now.isoformat()
            if sample_text not in existing.get('sample_texts', []):
                if 'sample_texts' not in existing:
                    existing['sample_texts'] = []
                existing['sample_texts'].append(sample_text)
        else:
            # Add new inbox entry
            inbox_entry = {
                'raw_name': raw_name,
                'norm_name': norm_name,
                'sample_text': sample_text,
                'source_url': source_url,
                'first_seen': now.isoformat(),
                'last_seen': now.isoformat()
            }
            self.inbox.append(inbox_entry)
    
    def _save_all(self):
        """Save all data to files."""
        # Save persons
        with open(self.persons_file, 'w', encoding='utf-8') as f:
            for person in self.persons:
                json.dump(person, f, ensure_ascii=False)
                f.write('\n')
        
        # Save xref
        self.xref.to_parquet(self.xref_file, index=False)
        
        # Save aliases
        self.aliases.to_parquet(self.aliases_file, index=False)
        
        # Save parties
        with open(self.parties_file, 'w', encoding='utf-8') as f:
            for party in self.parties:
                json.dump(party, f, ensure_ascii=False)
                f.write('\n')
        
        # Save inbox
        with open(self.inbox_file, 'w', encoding='utf-8') as f:
            for entry in self.inbox:
                json.dump(entry, f, ensure_ascii=False)
                f.write('\n')
        
        print(f"Data saved to {self.data_dir}")


def main():
    """Main function."""
    builder = RegistryBuilder()
    builder.build_from_seeds()


if __name__ == "__main__":
    main()
