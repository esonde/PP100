"""Tests for Senato HTML adapter."""
import unittest
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ingest.adapters.senato_html import SenatoHTMLAdapter
from ingest.utils.text import test_span_coherence

class TestSenatoHTMLAdapter(unittest.TestCase):
    """Test cases for Senato HTML adapter."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.adapter = SenatoHTMLAdapter()
        self.fixtures_dir = Path(__file__).parent / "fixtures"
        
    def test_parse_interventions_sample(self):
        """Test parsing interventions from sample HTML."""
        sample_file = self.fixtures_dir / "senato_sample.html"
        
        with open(sample_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        interventions = self.adapter.parse_interventions(html)
        
        # Should find 3 interventions
        self.assertEqual(len(interventions), 3)
        
        # Check first intervention
        first = interventions[0]
        self.assertEqual(first['source'], 'senato')
        self.assertEqual(first['oratore'], 'Neri Paolo')
        self.assertEqual(first['gruppo'], 'Gruppo Progressista')
        self.assertIn('sanità pubblica', first['text'])
        
        # Check spans coherence
        self.assertTrue(test_span_coherence(first['text'], first['spans_frasi']))
    
    def test_extract_speaker_info(self):
        """Test speaker and group extraction."""
        text = "Sen. Neri Paolo (Gruppo Progressista)\nOre 16:30 - Testo intervento..."
        
        speaker, group = self.adapter._extract_speaker_info(text)
        
        self.assertEqual(speaker, 'Neri Paolo')
        self.assertEqual(group, 'Gruppo Progressista')
    
    def test_extract_timestamp(self):
        """Test timestamp extraction."""
        text = "Sen. Neri Paolo\nOre 16:30 - Testo intervento..."
        
        timestamp = self.adapter._extract_timestamp(text)
        
        self.assertIsNotNone(timestamp)
        self.assertEqual(timestamp.hour, 15)  # UTC conversion
        self.assertEqual(timestamp.minute, 30)
    
    def test_session_info_extraction(self):
        """Test session information extraction."""
        sample_file = self.fixtures_dir / "senato_sample.html"
        
        with open(sample_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        
        session_info = self.adapter._extract_session_info(soup)
        
        self.assertIn('15 gennaio 2025', session_info['seduta'])
        self.assertEqual(session_info['date'], '2025-01-15')
    
    def test_intervention_id_generation(self):
        """Test that intervention IDs are generated correctly."""
        sample_file = self.fixtures_dir / "senato_sample.html"
        
        with open(sample_file, 'r', encoding='utf-8') as f:
            html = f.read()
        
        interventions = self.adapter.parse_interventions(html)
        
        for intervention in interventions:
            # Check ID format (16 hex chars)
            self.assertRegex(intervention['id'], r'^[a-f0-9]{16}$')
            
            # Check ID uniqueness
            ids = [i['id'] for i in interventions]
            self.assertEqual(len(ids), len(set(ids)))
    
    def test_senato_specific_patterns(self):
        """Test Senato-specific speaker patterns."""
        patterns = [
            "Il Sen. Bianchi Maria (Gruppo Conservatore)",
            "Sen. Rossi Alessandro (Gruppo Misto)",
            "Senatore Neri Paolo (Gruppo Progressista)"
        ]
        
        for pattern in patterns:
            self.assertTrue(self.adapter._looks_like_speaker_start(pattern))

if __name__ == '__main__':
    unittest.main()
