"""
Unit tests for identity utilities.
Tests normalize_name, split_name, and slugify functions.
"""
import unittest
from identities.utils import normalize_name, split_name, slugify


class TestNormalizeName(unittest.TestCase):
    """Test name normalization functions."""
    
    def test_normalize_name_basic(self):
        """Test basic name normalization."""
        self.assertEqual(normalize_name("Mario Rossi"), "mario rossi")
        self.assertEqual(normalize_name("GIORGIA MELONI"), "giorgia meloni")
        self.assertEqual(normalize_name("  Carlo  Verdi  "), "carlo verdi")
    
    def test_normalize_name_honorifics(self):
        """Test removal of honorifics."""
        self.assertEqual(normalize_name("On. Mario Rossi"), "mario rossi")
        self.assertEqual(normalize_name("Ministro Giorgia Meloni"), "giorgia meloni")
        self.assertEqual(normalize_name("Pres. Carlo Verdi"), "carlo verdi")
        self.assertEqual(normalize_name("Senatore Matteo Salvini"), "matteo salvini")
        self.assertEqual(normalize_name("Deputato Elly Schlein"), "elly schlein")
    
    def test_normalize_name_accents(self):
        """Test accent removal with unidecode."""
        self.assertEqual(normalize_name("José María"), "jose maria")
        self.assertEqual(normalize_name("François"), "francois")
        self.assertEqual(normalize_name("João"), "joao")
    
    def test_normalize_name_punctuation(self):
        """Test punctuation removal."""
        self.assertEqual(normalize_name("Mario, Rossi."), "mario rossi")
        self.assertEqual(normalize_name("Carlo-Verdi"), "carlo verdi")
        self.assertEqual(normalize_name("Anna'Bianchi"), "anna bianchi")
    
    def test_normalize_name_edge_cases(self):
        """Test edge cases."""
        self.assertEqual(normalize_name(""), "")
        self.assertEqual(normalize_name("   "), "")
        self.assertEqual(normalize_name("A"), "a")
        self.assertEqual(normalize_name("123"), "123")
    
    def test_normalize_name_compound_honorifics(self):
        """Test compound honorifics."""
        self.assertEqual(normalize_name("Vice Presidente Matteo Salvini"), "matteo salvini")
        self.assertEqual(normalize_name("Sottosegretario Carlo Verdi"), "carlo verdi")


class TestSplitName(unittest.TestCase):
    """Test name splitting functions."""
    
    def test_split_name_basic(self):
        """Test basic name splitting."""
        self.assertEqual(split_name("mario rossi"), ("mario", "rossi"))
        self.assertEqual(split_name("giorgia meloni"), ("giorgia", "meloni"))
        self.assertEqual(split_name("carlo verdi"), ("carlo", "verdi"))
    
    def test_split_name_single_token(self):
        """Test single token names."""
        self.assertEqual(split_name("rossi"), ("", "rossi"))
        self.assertEqual(split_name("mario"), ("", "mario"))
    
    def test_split_name_compound_last_names(self):
        """Test compound last names with prepositions."""
        self.assertEqual(split_name("carlo de medici"), ("carlo de", "medici"))
        self.assertEqual(split_name("anna della rovere"), ("anna della", "rovere"))
        self.assertEqual(split_name("marco del monte"), ("marco del", "monte"))
        self.assertEqual(split_name("lucia dei conti"), ("lucia dei", "conti"))
    
    def test_split_name_hyphenated(self):
        """Test hyphenated names."""
        self.assertEqual(split_name("maria rosa-bianchi"), ("maria", "rosa-bianchi"))
        self.assertEqual(split_name("giuseppe rossi-verdi"), ("giuseppe", "rossi-verdi"))
    
    def test_split_name_edge_cases(self):
        """Test edge cases."""
        self.assertEqual(split_name(""), ("", ""))
        self.assertEqual(split_name("   "), ("", ""))
        self.assertEqual(split_name("a"), ("", "a"))
        self.assertEqual(split_name("a b"), ("a", "b"))


class TestSlugify(unittest.TestCase):
    """Test slug generation functions."""
    
    def test_slugify_basic(self):
        """Test basic slug generation."""
        self.assertEqual(slugify("mario", "rossi"), "rossi-mario")
        self.assertEqual(slugify("giorgia", "meloni"), "meloni-giorgia")
        self.assertEqual(slugify("carlo", "verdi"), "verdi-carlo")
    
    def test_slugify_accents(self):
        """Test slug generation with accents."""
        self.assertEqual(slugify("jose", "maria"), "maria-jose")
        self.assertEqual(slugify("francois", "dupont"), "dupont-francois")
    
    def test_slugify_special_chars(self):
        """Test slug generation with special characters."""
        self.assertEqual(slugify("carlo", "de-medici"), "de-medici-carlo")
        self.assertEqual(slugify("anna", "della rovere"), "della-rovere-anna")
    
    def test_slugify_length_limit(self):
        """Test slug length limit."""
        long_first = "a" * 30
        long_last = "b" * 30
        slug = slugify(long_first, long_last)
        self.assertLessEqual(len(slug), 60)
        # Check that both parts are included in some form
        self.assertIn("a", slug)
        self.assertIn("b", slug)
    
    def test_slugify_edge_cases(self):
        """Test edge cases."""
        self.assertEqual(slugify("", "rossi"), "rossi")
        self.assertEqual(slugify("mario", ""), "mario")
        self.assertEqual(slugify("", ""), "")


if __name__ == "__main__":
    unittest.main()
