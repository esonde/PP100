"""
Identity matching module for the ingest pipeline.
Integrates with the registry to add person_id and membership to interventions.
"""
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from identities.utils import normalize_name, split_name
from identities.build_registry import RegistryBuilder


class IdentityMatcher:
    """Matches speaker names to registry persons and adds membership info."""
    
    def __init__(self, data_dir: str = "public/data"):
        self.data_dir = Path(data_dir)
        self.registry_builder = RegistryBuilder(str(data_dir))
        
        # Load registry data
        self.persons = self._load_persons()
        self.aliases = self._load_aliases()
        self.xref = self._load_xref()
        
        # Statistics
        self.matched_count = 0
        self.unmatched_count = 0
    
    def _load_persons(self) -> List[Dict]:
        """Load persons from registry."""
        persons_file = self.data_dir / "persons.jsonl"
        if persons_file.exists():
            with open(persons_file, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        return []
    
    def _load_aliases(self) -> pd.DataFrame:
        """Load aliases from registry."""
        aliases_file = self.data_dir / "person_aliases.parquet"
        if aliases_file.exists():
            return pd.read_parquet(aliases_file)
        return pd.DataFrame(columns=['person_id', 'alias', 'from', 'to', 'confidence'])
    
    def _load_xref(self) -> pd.DataFrame:
        """Load crosswalk from registry."""
        xref_file = self.data_dir / "person_xref.parquet"
        if xref_file.exists():
            return pd.read_parquet(xref_file)
        return pd.DataFrame(columns=['person_id', 'source', 'source_id', 'url', 'first_seen', 'last_seen'])
    
    def match_speaker(self, raw_name: str, source_url: str, sample_text: str = "") -> Optional[Dict]:
        """
        Match a speaker name to a registry person.
        
        Args:
            raw_name: Raw speaker name from intervention
            source_url: Source URL for provenance
            sample_text: Sample text for inbox if unmatched
            
        Returns:
            Dict with person_id, party_id_at_ts, group_id_at_ts, or None if unmatched
        """
        if not raw_name or not raw_name.strip():
            return None
        
        # Normalize name
        norm_name = normalize_name(raw_name)
        if not norm_name:
            return None
        
        # Try matching strategies in order of preference
        
        # 1. Try alias match first
        person_id = self._match_by_alias(norm_name)
        if person_id:
            self.matched_count += 1
            return self._get_membership_info(person_id, source_url)
        
        # 2. Try exact name match
        person_id = self._match_by_name(norm_name)
        if person_id:
            self.matched_count += 1
            return self._get_membership_info(person_id, source_url)
        
        # 3. Try crosswalk match (rare, but possible)
        person_id = self._match_by_xref(norm_name, source_url)
        if person_id:
            self.matched_count += 1
            return self._get_membership_info(person_id, source_url)
        
        # No match found - add to inbox
        self.unmatched_count += 1
        self.registry_builder.add_to_inbox(raw_name, norm_name, sample_text, source_url)
        
        return None
    
    def _match_by_alias(self, norm_name: str) -> Optional[str]:
        """Match by normalized alias."""
        if self.aliases.empty:
            return None
        
        # Find active aliases
        active_aliases = self.aliases[self.aliases['to'].isna()]
        
        # Look for exact match
        matches = active_aliases[active_aliases['alias'] == norm_name]
        
        if not matches.empty:
            # Return person_id with highest confidence
            best_match = matches.loc[matches['confidence'].idxmax()]
            return best_match['person_id']
        
        return None
    
    def _match_by_name(self, norm_name: str) -> Optional[str]:
        """Match by exact name (nome + cognome)."""
        nome, cognome = split_name(norm_name)
        
        if not nome or not cognome:
            return None
        
        # Look for exact match
        for person in self.persons:
            if (person['nome'].lower() == nome and 
                person['cognome'].lower() == cognome):
                return person['person_id']
        
        # Try reverse order (sometimes names are swapped)
        for person in self.persons:
            if (person['nome'].lower() == cognome and 
                person['cognome'].lower() == nome):
                return person['person_id']
        
        return None
    
    def _match_by_xref(self, norm_name: str, source_url: str) -> Optional[str]:
        """Match by crosswalk (rare, but possible for some sources)."""
        if self.xref.empty:
            return None
        
        # This is a simplified version - in practice, you might have
        # more sophisticated logic based on source-specific IDs
        
        # For now, return None as this is rarely available
        return None
    
    def _get_membership_info(self, person_id: str, source_url: str) -> Dict:
        """
        Get membership information for a person.
        
        Args:
            person_id: Person ID from registry
            source_url: Source URL for context
            
        Returns:
            Dict with membership info
        """
        # Load memberships
        membership_file = self.data_dir / "party_membership.parquet"
        if not membership_file.exists():
            return {
                'person_id': person_id,
                'party_id_at_ts': None,
                'group_id_aula_at_ts': None
            }
        
        memberships = pd.read_parquet(membership_file)
        
        # Find active membership for this person
        person_memberships = memberships[memberships['person_id'] == person_id]
        
        if person_memberships.empty:
            return {
                'person_id': person_id,
                'party_id_at_ts': None,
                'group_id_aula_at_ts': None
            }
        
        # Find current membership (valid_to is None)
        current = person_memberships[person_memberships['valid_to'].isna()]
        
        if current.empty:
            # No current membership, return person_id only
            return {
                'person_id': person_id,
                'party_id_at_ts': None,
                'group_id_aula_at_ts': None
            }
        
        # Return current membership info
        membership = current.iloc[0]
        return {
            'person_id': person_id,
            'party_id_at_ts': membership['party_id'],
            'group_id_aula_at_ts': membership.get('group_id_aula')
        }
    
    def enrich_interventions(self, interventions: List[Dict]) -> List[Dict]:
        """
        Enrich interventions with identity information.
        
        Args:
            interventions: List of intervention dictionaries
            
        Returns:
            Enriched interventions with person_id, party_id_at_ts, group_id_at_ts
        """
        print(f"Enriching {len(interventions)} interventions with identity data...")
        
        enriched = []
        
        for intervention in interventions:
            # Extract speaker name
            speaker = intervention.get('speaker', '')
            source_url = intervention.get('source_url', '')
            sample_text = intervention.get('text', '')[:200]  # First 200 chars for inbox
            
            # Try to match speaker
            identity_info = self.match_speaker(speaker, source_url, sample_text)
            
            # Create enriched intervention
            enriched_intervention = intervention.copy()
            
            if identity_info:
                enriched_intervention.update(identity_info)
            else:
                # No match - add null fields
                enriched_intervention.update({
                    'person_id': None,
                    'party_id_at_ts': None,
                    'group_id_aula_at_ts': None
                })
            
            enriched.append(enriched_intervention)
        
        # Save updated inbox
        self.registry_builder._save_all()
        
        print(f"Identity enrichment complete: {self.matched_count} matched, {self.unmatched_count} unmatched")
        
        return enriched
    
    def get_stats(self) -> Dict:
        """Get matching statistics."""
        return {
            'matched_count': self.matched_count,
            'unmatched_count': self.unmatched_count,
            'total_processed': self.matched_count + self.unmatched_count,
            'match_rate': self.matched_count / (self.matched_count + self.unmatched_count) if (self.matched_count + self.unmatched_count) > 0 else 0
        }
