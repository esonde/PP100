# PP100 Identity Registry & Crosswalk (M1.5)

Sistema di registry delle persone e partiti con crosswalk verso le fonti e integrazione SCD2 per le membership temporali.

## Architettura

### Componenti Principali

- **`build_registry.py`**: Builder del registry delle persone e partiti
- **`build_memberships.py`**: Builder delle membership con logica SCD2
- **`utils.py`**: Funzioni di normalizzazione nomi e utilità
- **`identity_matcher.py`**: Integrazione con pipeline P0 per matching identità

### File di Output

- `persons.jsonl`: Registry canonico delle persone
- `party_registry.jsonl`: Registry dei partiti
- `person_xref.parquet`: Crosswalk verso le fonti
- `person_aliases.parquet`: Alias e nomi alternativi
- `party_membership.parquet`: Membership ai partiti (SCD2)
- `roles.parquet`: Ruoli e posizioni (SCD2)
- `identities_inbox.jsonl`: Nomi non mappati per review

## Funzionalità

### 1. Normalizzazione Nomi (Deterministica)

- **`normalize_name(raw: str) -> str`**: Rimuove onorificenze, accenti, punteggiatura
- **`split_name(norm: str) -> (nome, cognome)`**: Euristica semplice per split nomi
- **`slugify(nome, cognome) -> str`**: Genera slug URL-friendly

### 2. Registry Builder

- Carica dati da seed CSV/JSON
- Genera ID univoci (P000123, PARTY001)
- Mantiene crosswalk e alias
- Gestisce inbox per nomi non mappati

### 3. Membership Builder (SCD2)

- Implementa Slowly Changing Dimension 2
- `valid_from` / `valid_to` per membership e ruoli
- Chiusura automatica record precedenti
- Utility `get_membership_at(person_id, ts)`

### 4. Identity Matcher

- Hook nella pipeline P0 (ingest)
- Matching deterministico: alias → nome esatto → crosswalk
- Aggiunge `person_id`, `party_id_at_ts`, `group_id_at_ts`
- Fallback su `identities_inbox.jsonl`

## Utilizzo

### Build Registry

```bash
cd identities
python build_registry.py
```

### Build Memberships

```bash
python build_memberships.py
```

### Test

```bash
# Test utilità
python -m unittest test_utils -v

# Test integrazione P0
python -m unittest test_p0_hook -v
```

## Integrazione Pipeline P0

Il sistema si integra automaticamente nella pipeline di ingest:

1. **Parsing intervento** → estrazione `speaker`
2. **Normalizzazione** → `normalize_name(speaker)`
3. **Matching deterministico** → ricerca nel registry
4. **Enrichment** → aggiunta campi identità
5. **Fallback** → `identities_inbox.jsonl` se no match

## Schema Dati

### Persons (canonico)

```json
{
  "person_id": "P000123",
  "nome": "Elly",
  "cognome": "Schlein", 
  "slug": "schlein-elly",
  "dob": "1985-05-17",
  "sex": "F",
  "wikidata_qid": "Q123456",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Party Membership (SCD2)

```json
{
  "person_id": "P000123",
  "party_id": "PARTY001",
  "group_id_aula": "PD-GROUP",
  "role_in_party": "Segretario",
  "valid_from": "2023-03-12T00:00:00Z",
  "valid_to": null,
  "source_url": "https://..."
}
```

## CI/CD

- **`nightly.yml`**: Build automatico registry ogni giorno alle 2 AM UTC
- **Validazione schemi**: Controllo automatico conformità JSON
- **Artifacts**: Cache registry per pipeline ingest

## Milestone M1.5 - Definition of Done

✅ **Registry completo**: persons.jsonl, party_registry.jsonl, crosswalk, alias  
✅ **SCD2 implementato**: valid_from/valid_to per membership e ruoli  
✅ **Hook P0**: interventions con person_id, party_id_at_ts, group_id_at_ts  
✅ **UI /metrics**: Widget registry con % mappati e inbox  
✅ **CI green**: nightly.yml rigenera registry, validazione schemi  
✅ **Test coverage**: Unit test su normalizzazione e integrazione P0  

## Post-Merge TODO

- **M2**: Calcolo person_features (rolling 30d) + prime badge deterministiche
- **M6**: build_profile_pack.py completo + /politico/[slug] funzionale
- **Integrazione**: identities_inbox con issue template GitHub

## Rischi & Mitigazioni

- **Omografi**: Niente auto-join, richiedi alias manuale via person_aliases.parquet
- **Titoli onorifici**: Aggiorna lista HONORIFICS in utils.py man mano
- **Drift membership**: SCD2 gestito solo da build_memberships.py, P0 legge solo

## Esempi

### Normalizzazione Nomi

```python
from identities.utils import normalize_name, split_name

# Input: "On. Elly Schlein"
norm = normalize_name("On. Elly Schlein")  # → "elly schlein"
nome, cognome = split_name(norm)           # → ("elly", "schlein")
```

### Matching Identità

```python
from ingest.identity_matcher import IdentityMatcher

matcher = IdentityMatcher()
identity_info = matcher.match_speaker(
    "Ministro Giorgia Meloni", 
    "https://camera.it/...",
    "Testo intervento..."
)

# Output: {
#   'person_id': 'P000002',
#   'party_id_at_ts': 'PARTY002', 
#   'group_id_at_ts': 'FDI-GROUP'
# }
```
