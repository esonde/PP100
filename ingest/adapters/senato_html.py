#!/usr/bin/env python3
"""
Senato della Repubblica HTML Adapter
Fetches live HTML resoconti from Senato della Repubblica
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from bs4 import BeautifulSoup
from ingest.utils.http import fetch_with_etag
from ingest.utils.text import split_sentences
from ingest.utils.ids import intervention_id
from ingest.utils.time import parse_italian_timestamp, extract_session_date

logger = logging.getLogger(__name__)

class SenatoHTMLAdapter:
    """Adapter for Senato della Repubblica HTML resoconti"""
    
    def __init__(self):
        self.base_url = "https://www.senato.it"
        self.user_agent = "PP100Bot/0.1 (+https://github.com/ensound/PP100; contact: info@pp100.it)"
        
    def discover_latest(self, session) -> Dict[str, str]:
        """
        Discover the latest session and available URLs
        Returns: {"url_html": "...", "url_hot": "...", "url_xml": "..."}
        """
        try:
            # Step 1: Get the chronological list page
            list_url = f"{self.base_url}/lavori/assemblea/resoconti-elenco-cronologico"
            logger.info(f"Discovering latest session from {list_url}")
            
            response = session.get(list_url, headers={'User-Agent': self.user_agent})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find the first HTML row (most recent)
            html_rows = soup.find_all('tr')
            latest_html_row = None
            
            for row in html_rows:
                cells = row.find_all('td')
                if len(cells) >= 3:
                    # Look for the HTML cell
                    html_cell = cells[2]  # Assuming HTML is in the 3rd column
                    if html_cell and 'html' in html_cell.get_text().lower():
                        latest_html_row = row
                        break
            
            if not latest_html_row:
                raise ValueError("No HTML rows found")
            
            # Extract the HTML link
            html_link = latest_html_row.find('a', href=re.compile(r'show-doc.*tipodoc=Resaula'))
            if not html_link:
                raise ValueError("No HTML document link found")
                
            html_href = html_link.get('href', '')
            if not html_href.startswith('http'):
                html_href = f"{self.base_url}{html_href}"
            
            # Step 2: Check if there's a live session (hotresaula)
            url_hot = None
            try:
                # Look for "Resoconto in corso di seduta" link
                hot_link = soup.find('a', string=re.compile(r'Resoconto in corso di seduta', re.IGNORECASE))
                if hot_link:
                    hot_href = hot_link.get('href', '')
                    if not hot_href.startswith('http'):
                        hot_href = f"{self.base_url}{hot_href}"
                    url_hot = hot_href
                    logger.info("Found live session (hotresaula)")
            except Exception as e:
                logger.info(f"No live session found: {e}")
            
            # Step 3: Extract XML link from the same row
            xml_link = latest_html_row.find('a', href=re.compile(r'show-doc.*tipodoc=.*xml'))
            url_xml = None
            if xml_link:
                xml_href = xml_link.get('href', '')
                if not xml_href.startswith('http'):
                    xml_href = f"{self.base_url}{xml_href}"
                url_xml = xml_href
            
            discovery_result = {
                "url_html": html_href,
                "url_hot": url_hot,
                "url_xml": url_xml
            }
            
            logger.info(f"Discovery completed: {discovery_result}")
            return discovery_result
            
        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            # Fallback to a known working URL structure
            return {
                "url_html": f"{self.base_url}/leg19/1233?shadow_documento=resoconto_sommario",
                "url_hot": None,
                "url_xml": f"{self.base_url}/leg19/1233?shadow_documento=resoconto_xml"
            }

    def fetch_latest(self, session, last_etag: Optional[str] = None, 
                    last_modified: Optional[str] = None) -> Dict[str, str]:
        """
        Fetch the latest resoconto with ETag/If-Modified-Since support
        Prefers hotresaula if available, otherwise falls back to regular HTML
        Returns: {"html": "...", "etag": "...", "last_modified": "...", "url": "..."}
        """
        try:
            # Discover latest session
            discovery = self.discover_latest(session)
            
            # Try hotresaula first if available (live session)
            if discovery["url_hot"]:
                url = discovery["url_hot"]
                logger.info(f"Fetching from live session: {url}")
                
                result = fetch_with_etag(session, url, last_etag, last_modified)
                
                if result["status_code"] == 304:
                    logger.info("Live document not modified, using cached version")
                    return {
                        "html": "",
                        "etag": last_etag or "",
                        "last_modified": last_modified or "",
                        "url": url,
                        "not_modified": True
                    }
                
                return {
                    "html": result["content"],
                    "etag": result.get("etag"),
                    "last_modified": result.get("last_modified"),
                    "url": url
                }
            
            # Fallback to regular HTML document
            url = discovery["url_html"]
            logger.info(f"Fetching from regular HTML: {url}")
            
            result = fetch_with_etag(session, url, last_etag, last_modified)
            
            if result["status_code"] == 304:
                logger.info("HTML document not modified, using cached version")
                return {
                    "html": "",
                    "etag": last_etag or "",
                    "last_modified": last_modified or "",
                    "url": url,
                    "not_modified": True
                }
            
            return {
                "html": result["content"],
                "etag": result.get("etag"),
                "last_modified": result.get("last_modified"),
                "url": url
            }
            
        except Exception as e:
            logger.error(f"Error fetching latest: {e}")
            raise

    def parse_interventions(self, html: str, source_url: str) -> List[Dict]:
        """
        Parse interventions from HTML content
        Returns: list of intervention dictionaries
        """
        if not html:
            return []
            
        soup = BeautifulSoup(html, 'lxml')
        
        # Extract session info
        session_info = self._extract_session_info(soup)
        
        # Find intervention blocks
        intervention_blocks = self._find_intervention_blocks(soup)
        
        interventions = []
        for block in intervention_blocks:
            try:
                intervention = self._parse_intervention_block(block, session_info, source_url)
                if intervention:
                    interventions.append(intervention)
            except Exception as e:
                logger.warning(f"Error parsing intervention block: {e}")
                continue
        
        logger.info(f"Parsed {len(interventions)} interventions")
        return interventions

    def _extract_session_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract session information from the document"""
        session_info = {
            "seduta": "Seduta Assemblea",
            "ts_start": None
        }
        
        # Try to find session title/date
        title_elem = soup.find('h1') or soup.find('title')
        if title_elem:
            title_text = title_elem.get_text(strip=True)
            # Extract date if present
            date_match = re.search(r'(\d{1,2}\s+(?:gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+\d{4})', title_text, re.IGNORECASE)
            if date_match:
                try:
                    parsed_date = parse_italian_timestamp(date_match.group(1))
                    session_info["ts_start"] = parsed_date.isoformat()
                except:
                    pass
        
        return session_info

    def _find_intervention_blocks(self, soup: BeautifulSoup) -> List:
        """Find intervention blocks in the HTML"""
        # Senato resoconti have speaker headings followed by paragraphs
        
        # Method 1: Look for speaker headings
        speaker_headings = soup.find_all(['h2', 'h3', 'h4', 'strong'], 
                                       string=re.compile(r'^(PRESIDENTE|ZEDDA|relatore|[A-Z]+\s+[A-Z]+)', re.IGNORECASE))
        
        if speaker_headings:
            blocks = []
            for i, heading in enumerate(speaker_headings):
                # Get the heading text
                speaker_text = heading.get_text(strip=True)
                
                # Find content until next heading
                content_elements = []
                current = heading.find_next_sibling()
                
                while current and current != (speaker_headings[i + 1] if i + 1 < len(speaker_headings) else None):
                    if current.name in ['p', 'div'] and current.get_text(strip=True):
                        content_elements.append(current)
                    current = current.find_next_sibling()
                
                if content_elements:
                    blocks.append({
                        'heading': heading,
                        'content': content_elements
                    })
            
            if blocks:
                return blocks
        
        # Method 2: Fallback to line-based parsing
        # Split content by lines and look for speaker patterns
        text_content = soup.get_text()
        lines = text_content.split('\n')
        
        blocks = []
        current_speaker = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line starts a new intervention
            # Senato patterns: PRESIDENTE, ZEDDA, NOME COGNOME (GRUPPO), etc.
            speaker_match = re.match(r'^([A-Z][A-Z\s]+?)(?:\s+\(([^)]+)\))?', line)
            if speaker_match:
                # Save previous intervention if exists
                if current_speaker and current_content:
                    blocks.append({
                        'speaker': current_speaker,
                        'content': '\n'.join(current_content)
                    })
                
                # Start new intervention
                current_speaker = speaker_match.group(1).strip()
                current_content = [line]
            else:
                # Continue current intervention
                if current_speaker:
                    current_content.append(line)
        
        # Add last intervention
        if current_speaker and current_content:
            blocks.append({
                'speaker': current_speaker,
                'content': '\n'.join(current_content)
            })
        
        return blocks

    def _parse_intervention_block(self, block: Dict, session_info: Dict, source_url: str) -> Optional[Dict]:
        """Parse a single intervention block"""
        try:
            if 'heading' in block:
                # Method 1: Structured HTML parsing
                speaker_text = block['heading'].get_text(strip=True)
                content_elements = block['content']
                content_text = ' '.join([elem.get_text(strip=True) for elem in content_elements])
            else:
                # Method 2: Line-based parsing
                speaker_text = block['speaker']
                content_text = block['content']
            
            # Extract speaker and group
            speaker_info = self._extract_speaker_info(speaker_text)
            if not speaker_info['oratore']:
                return None
            
            # Extract timestamp if available
            timestamp = self._extract_timestamp(content_text)
            
            # Generate spans for sentences
            spans = split_sentences(content_text)
            
            # Generate stable ID
            intervention_id_str = intervention_id(
                source="senato",
                seduta=session_info["seduta"],
                ts_start=timestamp or session_info.get("ts_start", ""),
                oratore=speaker_info['oratore'],
                text_hash=hash(content_text)
            )
            
            intervention = {
                "id": intervention_id_str,
                "source": "senato",
                "seduta": session_info["seduta"],
                "ts_start": timestamp or session_info.get("ts_start", ""),
                "oratore": speaker_info['oratore'],
                "gruppo": speaker_info['gruppo'],
                "text": content_text,
                "spans_frasi": [{"start": start, "end": end} for start, end in spans],
                "source_url": source_url,
                "fetch_etag": None,  # Will be set by caller
                "fetch_last_modified": None,  # Will be set by caller
                "ingested_at": datetime.utcnow().isoformat()
            }
            
            return intervention
            
        except Exception as e:
            logger.warning(f"Error parsing intervention: {e}")
            return None

    def _extract_speaker_info(self, text: str) -> Dict[str, str]:
        """Extract speaker name and group from text"""
        # Senato patterns: "PRESIDENTE", "ZEDDA", "NOME COGNOME (GRUPPO)"
        
        # Extract group in parentheses
        group_match = re.search(r'\(([^)]+)\)', text)
        group = group_match.group(1) if group_match else ""
        
        # Remove group from speaker name
        speaker_name = re.sub(r'\s*\([^)]+\)\s*', '', text).strip()
        
        return {
            "oratore": speaker_name,
            "gruppo": group
        }

    def _extract_timestamp(self, text: str) -> Optional[str]:
        """Extract timestamp from intervention text"""
        # Look for time patterns like "Ore 16:30"
        time_match = re.search(r'Ore\s+(\d{1,2}:\d{2})', text)
        if time_match:
            time_str = time_match.group(1)
            # Convert to full timestamp (assuming today's date)
            today = datetime.now().strftime("%Y-%m-%d")
            return f"{today}T{time_str}:00"
        return None
