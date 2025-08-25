# PP100 — Parlamento Live (CI Test)

Monitoraggio **in tempo reale** della qualità del dibattito parlamentare italiano tramite analisi automatica degli interventi. 100% **GitHub Pages + Actions**, **zero backend**.

<p align="left">
  <a href="https://github.com/esonde/PP100/actions/workflows/ingest.yml"><img alt="CI" src="https://github.com/esonde/PP100/actions/workflows/ingest.yml/badge.svg"></a>
  <a href="https://github.com/esonde/PP100/actions/workflows/nightly.yml"><img alt="Nightly" src="https://github.com/esonde/PP100/actions/workflows/nightly.yml/badge.svg"></a>
  <a href="https://github.com/esonde/PP100/actions/workflows/insights.yml"><img alt="Insights" src="https://github.com/esonde/PP100/actions/workflows/insights.yml/badge.svg"></a>
  <a href="https://img.shields.io/github/milestones/open/esonde/PP100"><img alt="Milestones" src="https://img.shields.io/github/milestones/open/esonde/PP100"></a>
  <a href="https://img.shields.io/github/license/esonde/PP100"><img alt="License" src="https://img.shields.io/github/license/esonde/PP100"></a>
</p>

---

## 📌 Sommario

* [Visióne rapida](#-visione-rapida)
* [Obiettivi](#-obiettivi)
* [Come funziona](#-come-funziona)
* [Architettura](#-architettura)
* [Contratti Dati](#-contratti-dati)
* [Setup Locale](#-setup-locale)
* [CI/CD](#-cicd)
* [Roadmap](#-roadmap)
* [Qualità, Etica e Trasparenza](#-qualità-etica-e-trasparenza)
* [Contribuire](#-contribuire)
* [Licenza](#-licenza)
* [Link utili](#-link-utili)

---

## 🔎 Visione rapida

**PP100** analizza automaticamente gli interventi parlamentari per rilevare:

* **Fallacie** logiche e retoriche
* **Spin**/propaganda e deriva del frame
* **Duplicazioni**/coordinamento (agenda adoption)
* **Coerenza** tra discorso e voto
* **Qualità** (chiarezza, specificità, densità di policy)

Il sistema calcola per ogni parlamentare un **Punteggio PP (0–100)** su finestra rolling (30–60 gg) composto da cinque elementi:

* **Q — Quality/Substance**: densità di policy, specificità, proposte
* **K — Credibilità**: accuratezza dei claim e follow‑through atti
* **V — Coerenza**: coerenza tra posizione dichiarata e voto
* **I — Influenza**: adozione dell’agenda, emendamenti
* **R — Retorica/Civiltà**: severità attacchi, chiarezza (Gulpease)

> **Nota**: definizioni e pesi sono versionati. Vedi sezione *Qualità, Etica e Trasparenza*.

---

## ⚙️ Come funziona

**Solo file statici** pubblicati in `public/data/`, letti dal frontend (Next.js export). L’elaborazione avviene su **GitHub Actions**:

* **Ogni 5 minuti**: ingest HTML live + enrich + scoring + build + deploy Pages
* **Nightly (02:00 Europe/Rome)**: refine con XML/stenografici, registry SCD2, ricalcoli
* **Insights (02:30)**: orchestratore agentico → report /blog + RSS

**Assenza di backend**: tutto è riproducibile da commit e tracciato nel manifest.

---

## 🏗️ Architettura

```
Sorgenti (Camera/Senato, HTML/XML) ─┐
                                    │  */5 ingest (P0)
                                    ▼
                         interventions-YYYYMMDD.parquet
                                    │  enrich (P1–P8)
                                    ▼
           features/duplicates/arg/claims/llm-events/join-votes …
                                    │  scoring (P9–P11)
                                    ▼
                    scores-rolling.parquet  cards-YYYYMMDD.jsonl
                                    │
                              GitHub Pages (web)
```

**Registry & Profili (SCD2)**: snapshot storici e **Profile Pack** per UI in `/politico/[slug]`.

**Principi guida**

* Walking skeleton → mock con schemi definitivi
* Data contracts versionati + validati in CI
* Idempotenza + cache deterministica (sha256)
* Feature flags via `manifest.json`
* Fail‑soft: degradi visibili, publish solo parti sane
* Zero lock‑in: modelli pin‑version, preferenza OSS

---

## 🧾 Contratti Dati

**File pubblici (estratto)** — tutti versionati e con `generated_at` (UTC):

* `manifest.json` — puntatori ai file correnti, checksum, status
* `interventions-YYYYMMDD.parquet` — testo normalizzato + `spans_frasi[]`
* `features-YYYYMMDD.parquet` — stile, topic, indicatori "light"
* `duplicates-YYYYMMDD.parquet` — cluster near‑duplicate
* `arg-score-YYYYMMDD.parquet` — triage argomentatività
* `claims-raw-YYYYMMDD.jsonl`, `claims-cw-ranked-YYYYMMDD.jsonl`
* `llm-events-YYYYMMDD.jsonl` — fallacies/claims/steelman/commitments (JSON‑only)
* `join-votes-YYYYMMDD.parquet` — mappatura discorsi↔voti/atti
* `scores-rolling.parquet` — PP e componenti (rolling)
* `cards-YYYYMMDD.jsonl` — feed pubblico (evidence‑first)
* `public/data/profiles/{person_id}.json` — Profile Pack per UI

**Registry (identità SCD2)**

* `persons.jsonl`, `person_xref.parquet`, `person_aliases.parquet`
* `party_registry.jsonl`, `party_membership.parquet`, `roles.parquet`

**Schemi** in `schemas/*.json` e validazione con `scripts/validate_schemas.py`. Qualsiasi breaking change segue il *Process Schema Bump* del **CONTRIBUTING**.

---

## 💻 Setup Locale

### Prerequisiti

* **Node.js LTS** (≥ 18)
* **Python 3.11**
* `make` (consigliato per comandi DX)

### Installazione

```bash
# Clona il repo
git clone https://github.com/esonde/PP100.git
cd PP100

# Frontend
cd web && npm ci && cd ..

# Python deps minime per validazione
pip install -r ingest/requirements.txt -r enrich/requirements.txt -r scoring/requirements.txt
pip install -r identities/requirements.txt
```

### Comandi utili

```bash
# Validazione schemi + dati pubblici
make validate

# Build + export frontend
make web

# Esecuzione end‑to‑end (sample)
make all   # validate + web

# Manuale
cd web && npm run dev       # sviluppo locale
cd web && npm run build && npm run export

# Script
python scripts/validate_schemas.py
```

> **Cadence**: su GitHub Actions la finestra minima è \*/5 (cron non garantito al minuto). I job Nightly e Insights sono schedulati alle 02:00/02:30 Europe/Rome.

---

## 🧪 CI/CD

**Workflows principali** (`.github/workflows/`):

* `ingest.yml` — pipeline principale (\*/5): setup → ingest → enrich → scoring → build web → deploy Pages. Concurrency anti‑overlap.
* `nightly.yml` — 02:00: registry SCD2 + refine XML + ricalcoli.
* `insights.yml` — 02:30: orchestratore agentico → blog + RSS.
* *(opz.) `pr.yml`* — full CI su ogni PR (dry‑run, no deploy) per bloccare merge se non passa.

**Deploy**: GitHub Pages da artifact statico. Nessun server.

**Job summary**: ogni run pubblica conteggi record, durate e degradi.

---

## 🗺️ Roadmap

Stato sintetico (M0→M8). La roadmap completa e versionata è in [`ROADMAP.md`](./ROADMAP.md).

* **M0 — Walking Skeleton** ✅

  * Sito statico + contratti dati + mock + CI base
* **M1 — Ingest (HTML live)** 🔜

  * Adapter Camera/Senato, Parquet `interventions-*`, spans
* **M2 — Stile & Topics**

  * Gulpease, hedges, NMF(8), prime `person_features`
* **M3 — fastText triage**

  * arg/cw ranking, aggiornamento `person_features`
* **M4 — Near‑duplicate & badges**

  * `duplicates-*`, Copia‑incolla Radar
* **M5 — LLM JSON‑only + validator**

  * `llm-events-*`, `cards-*`, provenance
* **M6 — Stance & PP + Profile Pack**

  * `join-votes-*`, `scores-rolling`, `/politico/[slug]`
* **M7 — Insights & Blog**

  * Report giornaliero + RSS + predictions
* **M8 — Nightly refine (XML) & Quality**

  * Riallineamenti, audit, backtest, “Come misuriamo”

---

## 🔒 Qualità, Etica e Trasparenza

* **Evidence‑first**: nessuna card senza URL della fonte + `span` verificabile.
* **Guardrail deterministici** (LLM):

  * output **JSON‑only** → validazione schema (pydantic), span‑check, whitelist variabili/unità/periodi
  * **confidence gating ≥ 0.66**
  * cache per evitare doppie chiamate
* **Registry SCD2**: ricostruzione membership/ruoli alla data dell’intervento.
* **Metriche di qualità**: gold‑set con κ di Cohen (fallacie/stance), backtest 12 mesi.
* **Trasparenza**:

  * `public/data/audit/*.jsonl` (pp\_version, ruleset\_version, rationale)
  * pagina **Come misuriamo** (formule PP e pesi versionati)

### Formula PP (estratto)

```python
def pp(Q,K,V,I,R,W_role,Penalty_gate):
    comp = 0.28*Q + 0.24*K + 0.18*V + 0.18*I + 0.12*R
    return 100*comp*W_role - Penalty_gate
```

---

## 🤝 Contribuire

Consulta **[CONTRIBUTING.md](./CONTRIBUTING.md)** per:

* Convenzioni commit (Conventional Commits)
* Processo schema bump (semver + migrazioni)
* Etichette issue e milestone (M0–M8)
* Linee guida per test, lint e PR

> Suggerimento: in `cursor/` trovi **EVERYSESSION.md** per allineare l’agente (Cursor) a IDEA/ROADMAP/CONTRIBUTING ad ogni sessione.

---

## 🧾 Licenza

Questo progetto è open source — vedi [LICENSE](./LICENSE) per i dettagli.

---

## 🔗 Link utili

* **Sito**: [https://esonde.github.io/PP100](https://esonde.github.io/PP100)
* **Repository**: [https://github.com/esonde/PP100](https://github.com/esonde/PP100)
* **Issues**: [https://github.com/esonde/PP100/issues](https://github.com/esonde/PP100/issues)
* **Roadmap**: [ROADMAP.md](./ROADMAP.md)

---

*PP100 — Monitoraggio della qualità del dibattito parlamentare italiano* 🏛️
