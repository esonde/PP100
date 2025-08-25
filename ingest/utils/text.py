"""Text utilities for sentence splitting and span management."""
import re
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def split_sentences(text: str) -> List[Tuple[int, int]]:
    """
    Split text into sentences and return spans (start, end).
    
    Uses regex for simple cases, syntok for complex ones.
    Returns list of (start, end) character positions.
    """
    # For simple text, use regex which is more reliable
    if len(text) < 500:  # Simple text threshold
        return _split_with_regex(text)
    
    # For now, always use regex as syntok has issues with Italian text
    return _split_with_regex(text)

def _split_with_syntok(text: str) -> List[Tuple[int, int]]:
    """Split using syntok library for better Italian language support."""
    from syntok import segmenter, tokenizer
    
    spans = []
    current_start = 0
    
    # Create tokenizer instance and tokenize the text
    tok = tokenizer.Tokenizer()
    tokens = tok.tokenize(text)
    
    # Use syntok segmenter to split into sentences
    sentences = segmenter.split(tokens)
    
    for sentence_tokens in sentences:
        # Convert tokens back to text
        sentence_text = ' '.join(str(token) for token in sentence_tokens)
        start = text.find(sentence_text, current_start)
        if start == -1:
            # Fallback: approximate position
            start = current_start
        
        end = start + len(sentence_text)
        # Ensure end doesn't exceed text length
        end = min(end, len(text))
        spans.append((start, end))
        current_start = end
    
    return spans

def _split_with_regex(text: str) -> List[Tuple[int, int]]:
    """Fallback regex-based sentence splitting for Italian."""
    # Italian sentence endings: . ! ? followed by whitespace (including newlines)
    sentence_pattern = r'[.!?]\s*'
    
    spans = []
    current_start = 0
    
    for match in re.finditer(sentence_pattern, text):
        # Find the actual sentence boundary (period, exclamation, question mark)
        sentence_end = match.start() + 1  # Just after the punctuation
        spans.append((current_start, sentence_end))
        current_start = sentence_end
    
    # Add the last sentence if there's remaining text
    if current_start < len(text):
        spans.append((current_start, len(text)))
    
    return spans

def test_span_coherence(text: str, spans) -> bool:
    """
    Test if spans can reconstruct the original text.
    
    Args:
        text: The original text
        spans: List of spans, either as tuples (start, end) or dicts {'start': start, 'end': end}
    
    Returns True if reconstruction is coherent.
    """
    if not spans:
        return len(text.strip()) == 0
    
    reconstructed = ""
    for span in spans:
        if isinstance(span, dict):
            start, end = span['start'], span['end']
        elif isinstance(span, tuple):
            start, end = span
        else:
            return False
            
        if start < 0 or end > len(text) or start >= end:
            return False
        reconstructed += text[start:end]
    
    # Remove trailing space and compare
    reconstructed = reconstructed.rstrip()
    original_clean = text.strip()
    

    
    return reconstructed == original_clean

def normalize_text(text: str) -> str:
    """Basic text normalization for consistency."""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text

def extract_speaker_info(text: str) -> Tuple[str, str]:
    """
    Extract speaker name and group from intervention text.
    
    Returns (speaker, group) tuple.
    """
    # This is a placeholder - actual implementation will depend on HTML structure
    # For now, return basic extraction
    lines = text.split('\n')
    if lines:
        first_line = lines[0].strip()
        # Remove common prefixes
        speaker = re.sub(r'^(On\.|Onorevole|Sen\.|Senatore)\s+', '', first_line)
        return speaker, "Gruppo Misto"  # Default fallback
    
    return "Oratore Sconosciuto", "Gruppo Misto"
