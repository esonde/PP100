"""
Utility functions for name normalization and processing.
Deterministic approach: no fuzzy matching, only exact normalization.
"""
import re
import unicodedata
from typing import Tuple
from unidecode import unidecode


# Lista onorificenze da rimuovere (aggiornabile)
HONORIFICS = {
    'on', 'onorevole', 'ministro', 'sottosegretario', 'presidente', 
    'pres', 'vicepresidente', 'vice', 'senatore', 'deputato',
    'dottore', 'dott', 'professore', 'prof', 'avvocato', 'avv',
    'ingegnere', 'ing', 'architetto', 'arch'
}


def normalize_name(raw: str) -> str:
    """
    Normalize a raw name string deterministically.
    
    Args:
        raw: Raw name string
        
    Returns:
        Normalized name string
    """
    if not raw:
        return ""
    
    # Convert to lowercase
    norm = raw.lower()
    
    # Remove accents (unidecode)
    norm = unidecode(norm)
    
    # Remove honorifics
    for honorific in HONORIFICS:
        # Use word boundaries to avoid partial matches
        norm = re.sub(r'\b' + re.escape(honorific) + r'\b', '', norm)
    
    # Clean up extra spaces after honorific removal
    norm = re.sub(r'\s+', ' ', norm)
    
    # Remove extra punctuation and normalize spaces
    norm = re.sub(r'[^\w\s-]', ' ', norm)
    # Convert hyphens to spaces for better name handling
    norm = norm.replace('-', ' ')
    norm = re.sub(r'\s+', ' ', norm)
    
    # Strip leading/trailing whitespace
    norm = norm.strip()
    
    # Remove leading/trailing hyphens
    norm = norm.strip('-')
    
    return norm


def split_name(norm: str) -> Tuple[str, str]:
    """
    Split normalized name into first name and last name.
    Simple heuristic: last token = last name, rest = first name.
    
    Args:
        norm: Normalized name string
        
    Returns:
        Tuple of (first_name, last_name)
    """
    if not norm:
        return "", ""
    
    tokens = norm.split()
    
    if len(tokens) == 0:
        return "", ""
    elif len(tokens) == 1:
        return "", tokens[0]
    elif len(tokens) == 2:
        return tokens[0], tokens[1]
    else:
        # Simple approach: last token is last name, rest is first name
        # This handles most cases correctly without complex logic
        first_name = ' '.join(tokens[:-1])
        last_name = tokens[-1]
        
        return first_name, last_name


def slugify(nome: str, cognome: str) -> str:
    """
    Create a URL-friendly slug from first and last name.
    
    Args:
        nome: First name
        cognome: Last name
        
    Returns:
        URL-friendly slug
    """
    # Combine and normalize
    full_name = f"{cognome}-{nome}".lower()
    
    # Remove non-alphanumeric characters except hyphens, but preserve spaces
    slug = re.sub(r'[^a-z0-9\s-]', '', full_name)
    # Convert spaces to hyphens
    slug = re.sub(r'\s+', '-', slug)
    
    # Collapse multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    # Limit length to 60 characters
    if len(slug) > 60:
        # Try to keep both parts if possible
        if len(cognome) + 1 + len(nome) <= 60:
            slug = f"{cognome}-{nome}".lower()
        else:
            # Truncate but keep structure
            max_cognome = min(len(cognome), 30)
            max_nome = min(len(nome), 29)  # Leave room for hyphen
            slug = f"{cognome[:max_cognome]}-{nome[:max_nome]}".lower()
    
    return slug


def generate_person_id(counter: int) -> str:
    """
    Generate a unique person ID.
    
    Args:
        counter: Sequential counter
        
    Returns:
        Person ID in format P000123
    """
    return f"P{counter:06d}"


def generate_party_id(counter: int) -> str:
    """
    Generate a unique party ID.
    
    Args:
        counter: Sequential counter
        
    Returns:
        Party ID in format PARTY001
    """
    return f"PARTY{counter:03d}"
