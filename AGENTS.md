# PP100 — EVERYSESSION.md (Boot Prompt per Cursor)

> Scopo: allineare ogni sessione di lavoro sul progetto **PP100** (GitHub Pages + Actions, zero backend), imponendo lettura dei file guida e buone pratiche operative.  
> Questo file *non sostituisce* `CONTRIBUTING.md` ma lo integra con regole di esecuzione sessione-per-sessione.

---

## 0) Letture obbligatorie ad **inizio sessione**
1. Leggi e indicizza **IDEA.txt** e **ROADMAP.txt** (root).
2. Leggi **CONTRIBUTING.md** (root) per commit, PR, processi e semver.
3. Se presenti, leggi:
   - `schemas/*.json`
   - `public/data/manifest.json`
   - `identities/*` (registry SCD2)
   - `profiles/*` (profile pack)
   - `.github/workflows/*.yml`
4. Stampa un **riassunto di 8–12 righe** con: milestone corrente, deliverable, DoD e file che intendi toccare.

> Se i file richiesti non esistono, non inventare: proponi il set minimo da creare e chiedi conferma con un piano di 3–5 passi.

---

## 1) Golden rules (non negoziabili)
- **Zero backend**: solo file statici serviti da Pages; nessuna API o server.  
- **Data contracts**: non cambiare schemi senza seguire il *Process Schema Bump* di `CONTRIBUTING.md`.  
- **Determinismo**: output riproducibili in CI; cache e chiavi SHA stabili per ogni trasformazione.  
- **Fail-soft**: se una pipeline fallisce, pubblica comunque le parti sane e aggiorna `manifest.status`.  
- **Evidence-first**: niente card o badge senza `evidence_refs` e `span-check` validi (vedi IDEA/ROADMAP §5bis).  
- **Rispetto fonti**: http con ETag/If-Modified-Since, user-agent chiaro, backoff; nessun scraping aggressivo.

---

## 2) Piano operativo per ogni task (Template)
**Plan (breve, massimo 12 righe):**
- Obiettivo / DoD  
- File creati/modificati  
- Migrazioni dati (se schema)  
- Impatti su CI/Pages  
- Rischi + mitigazioni

**Execute (vertical slice):**
1. Preparazione (scaffold/dep)
2. Implementazione (minimo funzionale)
3. Test (unit + snapshot/golden)
4. Validazione schemi (`make validate`)
5. Build web + export
6. Aggiorna `manifest.json`
7. Commit/PR (una PR piccola e leggibile)

**Deliverables minimi:** codice, test, log di run locale, screenshot UI (se UI).

---

## 3) Accorgimenti pratici (evitare attriti)
- **Manifest come Feature Flag**  
  Mantieni `public/data/manifest.json` come *fonte di verità* per: file correnti, versioni, `status` per ogni fase (`ingest|enrich|scoring|insights`), e `registry.*`. Se una fase è degradata, impostala esplicitamente.
- **Schemi “stabili ma minimi”**  
  Aggiungi campi opzionali, non rimuovere required senza bump. Metti `version` e `generated_at` nei file pubblicabili.
- **Parquet vs JSON**  
  In CI su Actions, se Parquet dà problemi di runtime, serializza in JSON per la build UI, ma *non* cambiare i contratti: lo fai in step intermedio senza toccare gli schemi.
- **Spans**  
  Ogni split frase deve ricostruire il testo originale (property test). Non aggiungere trimming che rompa gli indici.
- **Registry identità (M1.5+)**  
  Determinismo prima di recall: normalizza nome → alias → persons; se non mappi, append in `identities_inbox.jsonl`. La membership si risolve *alla data `ts_start`* (SCD2).
- **LLM (M5+)**  
  Unico runner; output **JSON-only**. Gating `confidence≥0.66`. Validazioni deterministiche (schema, span, whitelist). Cache su chiave `sha256(task|prompt_ver|frase)`.
- **Costi/tempo CI**  
  Riduci corpus per fit (NMF, fastText) in CI; usa cache `actions/cache` per modelli/vectorizer. Niente download non necessari.
- **Provenance**  
  Inserisci `generated_by_commit` e `ruleset_version/pp_version` dove previsto. Log JSON strutturato su stdout.

---

## 4) Checklist PR (aggiuntiva a CONTRIBUTING)
- [ ] DoD esplicito nella descrizione PR
- [ ] Nessun breaking change schema senza bump + migrazione
- [ ] `make validate` e test verdi (incolla output in PR)
- [ ] `manifest.json` aggiornato (paths, status, versions)
- [ ] Screenshot `/metrics` o pagina interessata
- [ ] Job summary CI: conteggi record e durate step
- [ ] No segreti in chiaro; user-agent impostato per ingest

---

## 5) Convenzioni per pipeline & file
- **Ingest (P0)**: `interventions-YYYYMMDD.parquet` include `spans_frasi[]`, `source_url`, (M1.5+) `person_id`, `party_id_at_ts`, `group_id_aula_at_ts`.  
- **Enrich (P1–P2)**: `features-YYYYMMDD.parquet` con `gulpease`, `hedges_pct`, `topic_vec[8]`, `top_terms`.  
- **Triage (P3–P6)**: `arg-score-*.parquet`, `claims-cw-ranked-*.jsonl`, `duplicates-*.parquet`.  
- **LLM (P7)**: `llm-events-*.jsonl` (JSON-only) + `cards-*.jsonl`.  
- **Scoring (P9–P11)**: `scores-rolling.parquet`, `indicators-*.parquet`, `badges.jsonl`.  
- **Registry/Profili**: `persons.jsonl`, `person_xref.parquet`, `person_aliases.parquet`, `party_membership.parquet`, `roles.parquet`, `profiles/{person_id}.json`.

> Non duplicare la logica tra script: metti funzioni condivise in `utils/` (per ingest, identities, enrich, scoring).

---

## 6) Milestone cadence (promemoria)
- **M0** Skeleton ✅  
- **M1** Ingest live (HTML)  
- **M1.5** Registry & crosswalk (SCD2) + hook in P0  
- **M2** Stile/Topic + prime `person_features`  
- **M3** fastText triage  
- **M4** Near-duplicate + badges  
- **M5** LLM JSON-only + validator + cards  
- **M6** Stance, join voti, PP + Profile Pack  
- **M7** Insight/Blog + predictions  
- **M8** Nightly refine (XML) + qualità/audit

---

## 7) Antifragilità & fallback
- Se cambia l’HTML sorgente: mantieni **fixtures** e aggiungi un parser line-based di fallback.  
- Se una libreria Python crea problemi in Actions: pinna versione e apri issue tecnica con log.  
- Se un file cresce troppo: ruota per data, tieni **ultimo N giorni** in main e archivia su Releases.

---

## 8) Mini-comandi utili (DX)
```bash
make validate              # valida schemi + dati pubblici
make all                   # validate + build web + export
python ingest/run_ingest.py --day $(date -u +%F)
python enrich/run_enrich.py --day $(date -u +%F)
python scoring/run_scoring.py --window 60
9) Cosa NON fare
❌ Aggiungere endpoint, server o DB: Pages only.

❌ Pubblicare card senza link e span verificabili.

❌ Introdurre fuzzy-matching aggressivo sugli oratori in produzione.

❌ Cambiare uno schema “di nascosto” senza bump/documentazione/migrazione.

❌ Loggare dati sensibili o non pubblici.

10) Output iniziale di ogni sessione (template)
Milestone: Mx – <titolo>
Obiettivo/DoD: …
File toccati: …
Rischi/Mitigazioni: …
Piano 5 step: 1) … 2) … 3) … 4) … 5) …
Verifiche: make validate | build web | update manifest
Fine prompt. Prosegui con Plan → Execute e apri PR con checklist.