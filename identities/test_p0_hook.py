"""
Test P0 hook integration with registry.
Tests that interventions get person_id and membership correctly.
"""
import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import pandas as pd

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from identities.build_registry import RegistryBuilder
from identities.build_memberships import MembershipBuilder
from ingest.identity_matcher import IdentityMatcher


class TestP0Hook(unittest.TestCase):
    """Test P0 hook integration."""
    
    def setUp(self):
        """Set up test environment."""
        # Create temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        self.test_data_dir = Path(self.test_dir) / "public" / "data"
        self.test_data_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize builders
        self.registry_builder = RegistryBuilder(str(self.test_data_dir))
        self.membership_builder = MembershipBuilder(str(self.test_data_dir))
        self.identity_matcher = IdentityMatcher(str(self.test_data_dir))
    
    def tearDown(self):
        """Clean up test environment."""
        import shutil
        shutil.rmtree(self.test_dir)
    
    def test_registry_build_from_seeds(self):
        """Test that registry builds correctly from seeds."""
        # Build registry
        self.registry_builder.build_from_seeds()
        
        # Check that files were created
        self.assertTrue((self.test_data_dir / "persons.jsonl").exists())
        self.assertTrue((self.test_data_dir / "party_registry.jsonl").exists())
        self.assertTrue((self.test_data_dir / "person_xref.parquet").exists())
        self.assertTrue((self.test_data_dir / "person_aliases.parquet").exists())
        
        # Check person count
        with open(self.test_data_dir / "persons.jsonl", 'r') as f:
            persons = [json.loads(line) for line in f if line.strip()]
        self.assertGreater(len(persons), 0)
        
        # Check party count
        with open(self.test_data_dir / "party_registry.jsonl", 'r') as f:
            parties = [json.loads(line) for line in f if line.strip()]
        self.assertGreater(len(parties), 0)
    
    def test_membership_build_scd2(self):
        """Test that memberships are built with SCD2 logic."""
        # Build registry first
        self.registry_builder.build_from_seeds()
        
        # Build memberships
        self.membership_builder.build_sample_memberships()
        
        # Check that files were created
        self.assertTrue((self.test_data_dir / "party_membership.parquet").exists())
        self.assertTrue((self.test_data_dir / "roles.parquet").exists())
        
        # Check membership count
        memberships = pd.read_parquet(self.test_data_dir / "party_membership.parquet")
        self.assertGreater(len(memberships), 0)
        
        # Check that SCD2 fields exist
        self.assertIn('valid_from', memberships.columns)
        self.assertIn('valid_to', memberships.columns)
    
    def test_identity_matching(self):
        """Test identity matching on sample interventions."""
        # Build registry and memberships
        self.registry_builder.build_from_seeds()
        self.membership_builder.build_sample_memberships()
        
        # Reinitialize identity matcher to load the newly created data
        self.identity_matcher = IdentityMatcher(str(self.test_data_dir))
        
        # Sample interventions
        sample_interventions = [
            {
                'id': '1',
                'speaker': 'Elly Schlein',
                'text': 'Test intervention text',
                'source_url': 'https://test.camera.it/1',
                'ts_start': '2024-01-15T10:00:00Z'
            },
            {
                'id': '2',
                'speaker': 'Giorgia Meloni',
                'text': 'Another test intervention',
                'source_url': 'https://test.camera.it/2',
                'ts_start': '2024-01-15T11:00:00Z'
            },
            {
                'id': '3',
                'speaker': 'Unknown Person',
                'text': 'Unknown person intervention',
                'source_url': 'https://test.camera.it/2',
                'ts_start': '2024-01-15T12:00:00Z'
            }
        ]
        
        # Enrich interventions
        enriched = self.identity_matcher.enrich_interventions(sample_interventions)
        
        # Check that all interventions have identity fields
        for intervention in enriched:
            self.assertIn('person_id', intervention)
            self.assertIn('party_id_at_ts', intervention)
            self.assertIn('group_id_aula_at_ts', intervention)
        
        # Check that known persons were matched
        elly_intervention = next(i for i in enriched if i['speaker'] == 'Elly Schlein')
        self.assertIsNotNone(elly_intervention['person_id'])
        self.assertEqual(elly_intervention['person_id'], 'P000001')
        
        giorgia_intervention = next(i for i in enriched if i['speaker'] == 'Giorgia Meloni')
        self.assertIsNotNone(giorgia_intervention['person_id'])
        self.assertEqual(giorgia_intervention['person_id'], 'P000002')
        
        # Check that unknown person was not matched
        unknown_intervention = next(i for i in enriched if i['speaker'] == 'Unknown Person')
        self.assertIsNone(unknown_intervention['person_id'])
        
        # Check statistics
        stats = self.identity_matcher.get_stats()
        self.assertEqual(stats['matched_count'], 2)
        self.assertEqual(stats['unmatched_count'], 1)
        self.assertEqual(stats['match_rate'], 2/3)
        
        # Check that unmatched went to inbox
        self.assertTrue((self.test_data_dir / "identities_inbox.jsonl").exists())
        with open(self.test_data_dir / "identities_inbox.jsonl", 'r') as f:
            inbox = [json.loads(line) for line in f if line.strip()]
        self.assertEqual(len(inbox), 1)
        self.assertEqual(inbox[0]['raw_name'], 'Unknown Person')
    
    def test_name_normalization_integration(self):
        """Test that name normalization works correctly in the pipeline."""
        # Build registry
        self.registry_builder.build_from_seeds()
        
        # Reinitialize identity matcher to load the newly created data
        self.identity_matcher = IdentityMatcher(str(self.test_data_dir))
        
        # Test with various name formats
        test_cases = [
            ("On. Elly Schlein", "elly schlein", "P000001"),
            ("Ministro Giorgia Meloni", "giorgia meloni", "P000002"),
            ("Senatore Matteo Salvini", "matteo salvini", "P000003"),
            ("Pres. Silvio Berlusconi", "silvio berlusconi", "P000004"),
        ]
        
        for raw_name, expected_norm, expected_person_id in test_cases:
            # Create test intervention
            intervention = {
                'id': 'test',
                'speaker': raw_name,
                'text': 'Test text',
                'source_url': 'https://test.camera.it/test',
                'ts_start': '2024-01-15T10:00:00Z'
            }
            
            # Match identity
            identity_info = self.identity_matcher.match_speaker(
                raw_name, 
                intervention['source_url'], 
                intervention['text']
            )
            
            # Check that person was matched
            self.assertIsNotNone(identity_info)
            self.assertEqual(identity_info['person_id'], expected_person_id)


if __name__ == "__main__":
    unittest.main()
