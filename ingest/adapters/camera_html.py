#!/usr/bin/env python3
"""
Camera dei Deputati HTML Adapter
Fetches live HTML resoconti from Camera dei Deputati
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

class CameraHTMLAdapter:
    """Adapter for Camera dei Deputati HTML resoconti"""
    
    def __init__(self):
        self.base_url = "https://www.camera.it"
        self.user_agent = "PP100Bot/0.1 (+https://github.com/ensound/PP100; contact: info@pp100.it)"
        
    def discover_latest(self, session) -> Dict[str, str]:
        """
        Discover the latest session and available URLs
        Returns: {"id_seduta": "...", "url_summary": "...", "url_full": "...", "url_xml": "..."}
        """
        try:
            # Step 1: Get the sessions list page
            sessions_url = f"{self.base_url}/leg19/207"
            logger.info(f"Discovering latest session from {sessions_url}")
            
            response = session.get(sessions_url, headers={'User-Agent': self.user_agent})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find the first session shown (most recent)
            session_link = soup.find('a', href=re.compile(r'idSeduta=\d+'))
            if not session_link:
                raise ValueError("No session links found")
                
            # Extract session ID from href
            href = session_link.get('href', '')
            session_id_match = re.search(r'idSeduta=(\d+)', href)
            if not session_id_match:
                raise ValueError("Could not extract session ID")
                
            session_id = session_id_match.group(1)
            logger.info(f"Found session ID: {session_id}")
            
            # Step 2: Get the session page to find "Vai al resoconto" link
            session_url = f"{self.base_url}{href}"
            response = session.get(session_url, headers={'User-Agent': self.user_agent})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find "Vai al resoconto" link
            resoconto_link = soup.find('a', string=re.compile(r'Vai al resoconto', re.IGNORECASE))
            if not resoconto_link:
                raise ValueError("No 'Vai al resoconto' link found")
                
            resoconto_href = resoconto_link.get('href', '')
            if not resoconto_href.startswith('http'):
                resoconto_href = f"{self.base_url}{resoconto_href}"
                
            # Step 3: Get the resoconto page to find Sommario link
            response = session.get(resoconto_href, headers={'User-Agent': self.user_agent})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find Sommario link
            sommario_link = soup.find('a', string=re.compile(r'Sommario', re.IGNORECASE))
            if not sommario_link:
                raise ValueError("No Sommario link found")
                
            sommario_href = sommario_link.get('href', '')
            if not sommario_href.startswith('http'):
                sommario_href = f"{self.base_url}{sommario_href}"
                
            # Step 4: Construct URLs
            url_summary = f"{self.base_url}/leg19/410?idSeduta={session_id}&tipo=sommario"
            url_full = f"https://documenti.camera.it/apps/commonServices/getDocumento.ashx?idLegislatura=19&idSeduta={session_id}&sezione=assemblea&tipoDoc=sommario"
            url_xml = f"{self.base_url}/leg19/410?idSeduta={session_id}&tipo=xml"
            
            discovery_result = {
                "id_seduta": session_id,
                "url_summary": url_summary,
                "url_full": url_full,
                "url_xml": url_xml
            }
            
            logger.info(f"Discovery completed: {discovery_result}")
            return discovery_result
            
        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            # Fallback to a known working URL structure
            return {
                "id_seduta": "1233",
                "url_summary": f"{self.base_url}/leg19/1233?shadow_documento=resoconto_sommario",
                "url_full": f"https://documenti.camera.it/apps/commonServices/getDocumento.ashx?idLegislatura=19&idSeduta=1233&sezione=assemblea&tipoDoc=sommario",
                "url_xml": f"{self.base_url}/leg19/1233?shadow_documento=resoconto_xml"
            }

    def fetch_latest(self, session, last_etag: Optional[str] = None, 
                    last_modified: Optional[str] = None) -> Dict[str, str]:
        """
        Fetch the latest resoconto with ETag/If-Modified-Since support
        Returns: {"html": "...", "etag": "...", "last_modified": "...", "url": "..."}
        """
        try:
            # Discover latest session
            discovery = self.discover_latest(session)
            
            # Try the full document URL first (more stable)
            url = discovery["url_full"]
            logger.info(f"Fetching from {url}")
            
            result = fetch_with_etag(session, url, last_etag, last_modified)
            
            if result["status_code"] == 304:
                logger.info("Document not modified, using cached version")
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
            # Fallback to summary URL
            try:
                url = discovery["url_summary"]
                logger.info(f"Fallback to summary URL: {url}")
                
                result = fetch_with_etag(session, url, last_etag, last_modified)
                
                return {
                    "html": result["content"],
                    "etag": result.get("etag"),
                    "last_modified": result.get("last_modified"),
                    "url": url
                }
                
            except Exception as fallback_error:
                logger.error(f"Fallback also failed: {fallback_error}")
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
        # Look for intervention patterns in the text
        # Camera resoconti often have patterns like "Interviene ... (GRUPPO)"
        
        # Method 1: Look for specific intervention markers
        intervention_markers = soup.find_all(string=re.compile(r'Interviene\s+', re.IGNORECASE))
        
        if intervention_markers:
            blocks = []
            for marker in intervention_markers:
                # Get the parent element and find the intervention content
                parent = marker.parent
                if parent:
                    # Look for the next few paragraphs as intervention content
                    content_elements = []
                    current = parent.find_next_sibling()
                    count = 0
                    while current and count < 5:  # Limit to next 5 elements
                        if current.name in ['p', 'div'] and current.get_text(strip=True):
                            content_elements.append(current)
                            count += 1
                        current = current.find_next_sibling()
                    
                    if content_elements:
                        blocks.append({
                            'marker': marker,
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
            speaker_match = re.match(r'^(?:Interviene\s+)?([A-Z][A-Z\s]+?)(?:\s+\(([^)]+)\))?', line)
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
            if 'marker' in block:
                # Method 1: Structured HTML parsing
                speaker_text = block['marker'].get_text(strip=True)
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
                source="camera",
                seduta=session_info["seduta"],
                ts_start=timestamp or session_info.get("ts_start", ""),
                oratore=speaker_info['oratore'],
                text_hash=hash(content_text)
            )
            
            intervention = {
                "id": intervention_id_str,
                "source": "camera",
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
        # Pattern: "Interviene NOME COGNOME (GRUPPO)" or just "NOME COGNOME (GRUPPO)"
        text = text.replace("Interviene", "").strip()
        
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
        # Look for time patterns like "Ore 14:30"
        time_match = re.search(r'Ore\s+(\d{1,2}:\d{2})', text)
        if time_match:
            time_str = time_match.group(1)
            # Convert to full timestamp (assuming today's date)
            today = datetime.now().strftime("%Y-%m-%d")
            return f"{today}T{time_str}:00"
        return None
