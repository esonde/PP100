"""
Build party memberships and roles with SCD2 (Slowly Changing Dimension 2).
Generates party_membership.parquet and roles.parquet with valid_from/valid_to.
"""
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from identities.utils import normalize_name


class MembershipBuilder:
    """Builds and maintains party memberships and roles with SCD2."""
    
    def __init__(self, data_dir: str = "public/data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # File paths
        self.persons_file = self.data_dir / "persons.jsonl"
        self.parties_file = self.data_dir / "party_registry.jsonl"
        self.membership_file = self.data_dir / "party_membership.parquet"
        self.roles_file = self.data_dir / "roles.parquet"
        
        # Load existing data
        self.persons = self._load_persons()
        self.parties = self._load_parties()
        self.memberships = self._load_memberships()
        self.roles = self._load_roles()
    
    def _load_persons(self) -> List[Dict]:
        """Load persons from JSONL."""
        if self.persons_file.exists():
            with open(self.persons_file, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        return []
    
    def _load_parties(self) -> List[Dict]:
        """Load parties from JSONL."""
        if self.parties_file.exists():
            with open(self.parties_file, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        return []
    
    def _load_memberships(self) -> pd.DataFrame:
        """Load existing memberships from Parquet."""
        if self.membership_file.exists():
            return pd.read_parquet(self.membership_file)
        return pd.DataFrame(columns=[
            'person_id', 'party_id', 'group_id_aula', 'role_in_party', 
            'valid_from', 'valid_to', 'source_url'
        ])
    
    def _load_roles(self) -> pd.DataFrame:
        """Load existing roles from Parquet."""
        if self.roles_file.exists():
            return pd.read_parquet(self.roles_file)
        return pd.DataFrame(columns=[
            'person_id', 'role_type', 'org', 'title', 'grade', 
            'valid_from', 'valid_to', 'source_url'
        ])
    
    def build_sample_memberships(self):
        """Build sample memberships for testing (M1.5)."""
        print("Building sample memberships...")
        
        # Sample membership data (in real scenario, this would come from external sources)
        sample_memberships = [
            {
                'person_id': 'P000001',  # Elly Schlein
                'party_id': 'PARTY001',  # PD
                'group_id_aula': 'PD-GROUP',
                'role_in_party': 'Segretario',
                'valid_from': '2023-03-12T00:00:00Z',
                'source_url': 'https://www.partitodemocratico.it/'
            },
            {
                'person_id': 'P000002',  # Giorgia Meloni
                'party_id': 'PARTY002',  # FdI
                'group_id_aula': 'FDI-GROUP',
                'role_in_party': 'Presidente',
                'valid_from': '2022-10-22T00:00:00Z',
                'source_url': 'https://www.fratelli-italia.it/'
            },
            {
                'person_id': 'P000003',  # Matteo Salvini
                'party_id': 'PARTY003',  # Lega
                'group_id_aula': 'LEGA-GROUP',
                'role_in_party': 'Segretario',
                'valid_from': '2013-12-15T00:00:00Z',
                'source_url': 'https://www.lega.it/'
            },
            {
                'person_id': 'P000004',  # Silvio Berlusconi
                'party_id': 'PARTY004',  # FI
                'group_id_aula': 'FI-GROUP',
                'role_in_party': 'Presidente',
                'valid_from': '2013-11-16T00:00:00Z',
                'valid_to': '2023-06-12T00:00:00Z',  # Deceased
                'source_url': 'https://www.forza-italia.it/'
            },
            {
                'person_id': 'P000005',  # Giuseppe Conte
                'party_id': 'PARTY006',  # IV
                'group_id_aula': 'IV-GROUP',
                'role_in_party': 'Presidente',
                'valid_from': '2019-09-18T00:00:00Z',
                'source_url': 'https://www.italiaviva.it/'
            }
        ]
        
        # Apply SCD2 logic
        self._apply_scd2_memberships(sample_memberships)
        
        # Build sample roles
        self._build_sample_roles()
        
        # Save data
        self._save_all()
        
        print(f"Memberships built: {len(self.memberships)} records")
        print(f"Roles built: {len(self.roles)} records")
    
    def _apply_scd2_memberships(self, new_memberships: List[Dict]):
        """Apply SCD2 logic to memberships."""
        # Convert existing memberships to list for easier manipulation
        existing = self.memberships.to_dict('records')
        
        # Process each new membership
        for new_membership in new_memberships:
            person_id = new_membership['person_id']
            party_id = new_membership['party_id']
            valid_from = new_membership['valid_from']
            
            # Find existing active membership for this person+party
            for existing_membership in existing:
                if (existing_membership['person_id'] == person_id and 
                    existing_membership['party_id'] == party_id and
                    existing_membership['valid_to'] is None):
                    
                    # Close existing membership
                    existing_membership['valid_to'] = self._day_before(valid_from)
                    break
            
            # Add new membership
            existing.append(new_membership)
        
        # Convert back to DataFrame
        self.memberships = pd.DataFrame(existing)
    
    def _build_sample_roles(self):
        """Build sample roles for testing."""
        sample_roles = [
            {
                'person_id': 'P000002',  # Giorgia Meloni
                'role_type': 'minister',
                'org': 'Governo Italiano',
                'title': 'Presidente del Consiglio dei Ministri',
                'grade': 1,
                'valid_from': '2022-10-22T00:00:00Z',
                'source_url': 'https://www.governo.it/'
            },
            {
                'person_id': 'P000003',  # Matteo Salvini
                'role_type': 'minister',
                'org': 'Governo Italiano',
                'title': 'Vice Presidente del Consiglio dei Ministri',
                'grade': 2,
                'valid_from': '2022-10-22T00:00:00Z',
                'source_url': 'https://www.governo.it/'
            },
            {
                'person_id': 'P000001',  # Elly Schlein
                'role_type': 'deputy',
                'org': 'Camera dei Deputati',
                'title': 'Deputata',
                'grade': None,
                'valid_from': '2022-10-13T00:00:00Z',
                'source_url': 'https://www.camera.it/'
            }
        ]
        
        # Apply SCD2 logic
        self._apply_scd2_roles(sample_roles)
    
    def _apply_scd2_roles(self, new_roles: List[Dict]):
        """Apply SCD2 logic to roles."""
        # Convert existing roles to list for easier manipulation
        existing = self.roles.to_dict('records')
        
        # Process each new role
        for new_role in new_roles:
            person_id = new_role['person_id']
            role_type = new_role['role_type']
            org = new_role['org']
            valid_from = new_role['valid_from']
            
            # Find existing active role for this person+role_type+org
            for existing_role in existing:
                if (existing_role['person_id'] == person_id and 
                    existing_role['role_type'] == role_type and
                    existing_role['org'] == org and
                    existing_role['valid_to'] is None):
                    
                    # Close existing role
                    existing_role['valid_to'] = self._day_before(valid_from)
                    break
            
            # Add new role
            existing.append(new_role)
        
        # Convert back to DataFrame
        self.roles = pd.DataFrame(existing)
    
    def _day_before(self, date_str: str) -> str:
        """Get the day before a given date string."""
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            day_before = dt - timedelta(days=1)
            return day_before.isoformat()
        except:
            # Fallback: return original date
            return date_str
    
    def get_membership_at(self, person_id: str, ts: datetime) -> Optional[Dict]:
        """
        Get party membership for a person at a specific timestamp.
        
        Args:
            person_id: Person ID
            ts: Timestamp to check membership at
            
        Returns:
            Membership dict or None if not found
        """
        # Filter memberships for this person
        person_memberships = self.memberships[self.memberships['person_id'] == person_id]
        
        if person_memberships.empty:
            return None
        
        # Find active membership at timestamp
        for _, membership in person_memberships.iterrows():
            valid_from = pd.to_datetime(membership['valid_from'])
            valid_to = pd.to_datetime(membership['valid_to']) if pd.notna(membership['valid_to']) else None
            
            if valid_from <= ts and (valid_to is None or ts <= valid_to):
                return membership.to_dict()
        
        return None
    
    def get_role_at(self, person_id: str, ts: datetime) -> Optional[Dict]:
        """
        Get role for a person at a specific timestamp.
        
        Args:
            person_id: Person ID
            ts: Timestamp to check role at
            
        Returns:
            Role dict or None if not found
        """
        # Filter roles for this person
        person_roles = self.roles[self.roles['person_id'] == person_id]
        
        if person_roles.empty:
            return None
        
        # Find active role at timestamp
        for _, role in person_roles.iterrows():
            valid_from = pd.to_datetime(role['valid_from'])
            valid_to = pd.to_datetime(role['valid_to']) if pd.notna(role['valid_to']) else None
            
            if valid_from <= ts and (valid_to is None or ts <= valid_to):
                return role.to_dict()
        
        return None
    
    def _save_all(self):
        """Save all data to files."""
        # Save memberships
        self.memberships.to_parquet(self.membership_file, index=False)
        
        # Save roles
        self.roles.to_parquet(self.roles_file, index=False)
        
        print(f"Data saved to {self.data_dir}")


def main():
    """Main function."""
    builder = MembershipBuilder()
    builder.build_sample_memberships()


if __name__ == "__main__":
    main()
