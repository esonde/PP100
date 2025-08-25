# PP100 — Roadmap (Reorganized, GitHub‑only)

> **Goal**: ship **small, vertical slices** that keep the repo always deployable on **GitHub Pages + Actions (no backend)**. Every milestone emits **stable public files** (data contracts) read by the web.

---

## 0) Quick Index

* [Principles](#1-principles)
* [Milestones at a glance](#2-milestones-at-a-glance)
* [Milestone details M0 → M8](#3-milestone-details)
* [Cross-cutting checklists](#4-cross-cutting-checklists)
* [Repo structure](#5-repo-structure)
* [GitHub Actions](#6-github-actions)
* [Data contracts & validation](#7-data-contracts--validation)
* [Key risks & fallbacks](#8-key-risks--fallbacks)
* [Quality (Definition of Done)](#9-quality-definition-of-done)
* [Initial issue checklist](#10-initial-issues)
* [DX snippets](#11-dx-snippets)
* [UI notes](#12-ui-notes)
* [Next steps](#13-next-steps)

---

## 1) Principles

* **Walking skeleton** → static site reading **mock files with final schemas**; swap in real pipelines later.
* **Data contracts** → schemas versioned in `schemas/` + validated in CI. Any change requires bump + migration.
* **Idempotent + cached** → deterministic keys (sha256), cached embeddings/LLM.
* **Feature flags** → `manifest.json` toggles publishing of incomplete feeds/cards.
* **Fail‑soft** → if a pipeline fails, publish healthy parts and reflect status in manifest.
* **Zero lock‑in** → models/vectors pinned; prefer open-source options.

---

## 2) Milestones at a glance

| Milestone | Focus                          | Key outputs                                                           | UI touchpoint                     | Acceptance                                      |
| --------- | ------------------------------ | --------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| **M0**    | Walking skeleton               | `manifest.json`, mock `cards-*`, mock `scores-rolling` + schemas      | Home, `/feed`, `/metrics`         | Build+deploy ok; 3 mock cards + PP table        |
| **M1**    | P0 Ingest (live HTML)          | `interventions-YYYYMMDD.parquet` (+ spans, meta)                      | `/metrics` shows count            | ≥20 real interventions; manifest points to file |
| **M2**    | P1 Style & P2 Topics           | `features-YYYYMMDD.parquet`, plots, (init `person_features`)          | `/metrics` adds Gulpease + topics | Schema validated; UI updated                    |
| **M3**    | fastText triage                | `arg-score-*`, `claims-cw-ranked-*` (+ update `person_features`)      | badge “triage attivo”             | Rolling metrics coherent; badge visible         |
| **M4**    | Near-duplicate & Adoption      | `duplicates-*`, `badges.jsonl`                                        | `/feed` shows Copia‑incolla badge | Clusters detected; cache embeddings             |
| **M5**    | LLM JSON‑only + Validator      | `llm-events-*`, `cards-*` (+ provenance, `person_features`)           | `/feed` spans+evidence            | Gating ≥0.66; span‑proof passes                 |
| **M6**    | Stance, votes join, PP         | `join-votes-*`, `scores-rolling.parquet`, `profiles/{person_id}.json` | `/politico/[slug]`                | ≥10 orators with PP+CI                          |
| **M7**    | Agentic Insights & Blog        | `/web/content/blog/*`, `public/rss.xml`, `predictions.jsonl`          | Blog index + Transparenza         | ≥5 insights/day; predictions logged             |
| **M8**    | Nightly refine (XML) & Quality | XML parse → re‑compute outputs; audit                                 | Transparenza diffs                | Live vs refine differences shown + reproducible |

> Note: Registry/person features/profile pack are referenced in milestones and expanded in **cross‑cutting checklists** below.

---

## 3) Milestone details

### M0 — Walking Skeleton (site + data contracts)

**Objective**: public page reading `public/data/*.jsonl|parquet` (mock).

**Deliverables**

* `web/` (Next.js static export or SvelteKit static) with Home, `/feed` (reads `cards-YYYYMMDD.jsonl`), `/metrics` (reads mock `scores-rolling`).
* `public/data/manifest.json` (+ mock files). Schemas for: `interventions`, `features`, `cards`, `llm-events`, `scores-rolling`, `manifest`.
* CI base: Pages deploy, lint & schema validation. `Makefile`, `pre-commit`, `.env.example`, `CONTRIBUTING.md`.

**Acceptance**: build & deploy green; 3 mock cards + PP table.

**Risks/Mitigations**: Pages asset size — keep mocks small.

---

### M1 — P0 Ingest (live HTML only)

**Objective**: extract **normalized interventions** from Camera + Senato.

**Deliverables**

* `ingest/run_ingest.py` with adapters `camera_html.py`, `senato_html.py` (ETag/If‑Modified‑Since, backoff).
* Output: `interventions-YYYYMMDD.parquet` → `id, camera_senato, seduta, ts_start, oratore, gruppo, text, spans_frasi[], source_url`.
* Unit tests with real snapshots; structured logs.

**Acceptance**: manual run produces ≥20 real interventions today; `manifest.json` points to file.

**Risks**: HTML volatility → robust selectors + regex fallback; maintain fixtures.

---

### M2 — P1 Style & P2 Topics “light”

**Objective**: low‑cost, stable features; initialize **person\_features**.

**Deliverables**

* `enrich/run_enrich.py`; modules: `style.py` (Gulpease, len, %hedges, %citazioni), `topic_light.py` (tf‑idf + NMF k=8; weekly fit).

**Outputs**

* `features-YYYYMMDD.parquet` (incl. `topic_vec[8], top_terms`).
* `person_features.parquet` (first per‑person metrics: talk\_time\_share, pathos\_pct, policy\_density rolling 30d; `method_version`).
* PNG plots in `public/plots/`. UI: `/metrics` updated.

**Risks**: CPU on Actions → cache models/vectorizer.

---

### M3 — fastText triage (Argomentatività + Check‑worthiness)

**Objective**: reduce LLM cost by selecting candidates; log effects in **person\_features**.

**Deliverables**

* `fasttext/train_arg.py`, `train_cw.py`, `infer.py` (+ gold set).

**Outputs**

* `arg-score-YYYYMMDD.parquet`, `claims-cw-ranked-YYYYMMDD.jsonl`.
* Update `person_features` (arg\_rate\_rolling, cw\_hit\_rate). Acceptance: badge “triage attivo” visible; rolling consistency.

---

### M4 — Near‑duplicate & Agenda Adoption

**Objective**: cluster similar phrases to measure narrative diffusion; first **deterministic badges**.

**Deliverables**

* Prefilter cosine (fastText) + confirm with **E5‑small**; cache embeddings.

**Outputs**

* `duplicates-YYYYMMDD.parquet` (cluster\_id, leader\_id, lag, size). `badges.jsonl` (Copia‑incolla Radar p95, `ruleset_version`). UI: badge in `/feed`.

**Risks**: embeddings cost → on‑disk cache.

---

### M5 — LLM ragionatore (JSON‑only) + Validator

**Objective**: reliable extraction on subset with a single LLM; populate **claims/commitments** and profile signals.

**Deliverables**

* `enrich/llm_runner.py` (Appendix A1 prompt, sha cache, validator, gating ≥0.66).

**Outputs**

* `llm-events-YYYYMMDD.jsonl`, `cards-YYYYMMDD.jsonl`.
* `person_features` update (ad\_hominem\_rate, claim\_density, commitment\_count).
* Provenance & audit (`generated_by_commit`, `evidence_refs`). UI: `/feed` with span highlight.

**Risks**: hallucinations → span‑proof + whitelist + gating.

---

### M6 — Stance & join votes/acts + Indicators & PP

**Objective**: complete speech→vote→PP; initial **Profile Pack**.

**Deliverables**

* `models/stance.joblib` (3 classes), votes join → `join-votes-YYYYMMDD.parquet`.
* `scoring/run_scoring.py` for Q/K/V/I/R; rolling PP 30–60d → `scores-rolling.parquet`.
* `profiles/build_profile_pack.py` → `public/data/profiles/{person_id}.json` (PP, components, key signals, badges).

**UI**: `/politico/[slug]` uses Profile Pack; PP breakdown + CI. **Acceptance**: ≥10 orators with PP + CI.

**Risks**: noisy mapping → low‑confidence flags + temporal/keyword filters.

---

### M7 — Agentic Insights & Blog

**Objective**: auto daily reports + prediction registry; profile integration.

**Deliverables**

* `insights/run_insights.py` (Profiler→Ideatore→Tester→Curatore→Redattore→Archivista).

**Outputs**

* `/web/content/blog/YYYY-MM-DD.md(x)`, `public/rss.xml`, `predictions.jsonl`.
* Cross‑ref profile↔insight. UI: blog index + “Trasparenza” page with ex‑post errors (Brier/log‑loss).

**Risks**: multiple testing → Benjamini–Hochberg + temporal holdout.

---

### M8 — Nightly refine (XML/stenographic) & Quality

**Objective**: re‑process with “gold” sources; update **registry SCD2** before recomputations; quality/transparency.

**Deliverables**

* Pipeline: registry SCD2 → XML parse → span realignment → recompute llm‑events/PP.
* Full audit: `public/data/audit/*.jsonl` (`pp_version`, `ruleset_version`, rationale). Gold set ≥0.65 κ; 12‑month backtest; update “Come misuriamo”.

**Acceptance**: live vs refine differences shown/versioned; reproducible.

---

## 4) Cross‑cutting checklists

### Registry (identities)

* [ ] Schemas `persons/party/roles/memberships`
* [ ] Scripts `build_registry.py` / `build_memberships.py`
* [ ] Fixtures + tests for aliases/homographs

### Profile Pack

* [ ] `build_profile_pack.py`
* [ ] `schemas/profile_pack.schema.json`
* [ ] UI `/politico/[slug]` uses single fetch

### Feature Store

* [ ] `person_features.parquet` with `method_version` & CI
* [ ] `badges.jsonl` with `ruleset_version`

### Audit & Provenance

* [ ] `evidence_refs` wherever required
* [ ] `generated_by_commit` in publishable files
* [ ] `public/data/audit/*.jsonl` + transparenza page

---

## 5) Repo structure

```
.
├─ ingest/
│  ├─ adapters/{camera_html,senato_html,xml_*,pdf_*}.py
│  ├─ run_ingest.py
│  └─ tests/
├─ enrich/
│  ├─ style.py  topic_light.py  duplicates.py
│  ├─ fasttext/{train_*.py,infer.py,models/}
│  ├─ llm_runner.py  validators.py  cards.py
│  ├─ models/{stance.joblib,topic_nmf.joblib}
│  ├─ run_enrich.py
│  └─ tests/
├─ scoring/
│  ├─ run_scoring.py
│  └─ tests/
├─ insights/
│  ├─ run_insights.py  prompts/
│  └─ tests/
├─ web/
│  ├─ src/  package.json
│  └─ scripts/read_data.ts
├─ public/data/
├─ public/plots/
├─ identities/
│  ├─ build_registry.py
│  └─ build_memberships.py
├─ profiles/
│  └─ build_profile_pack.py
├─ schemas/
├─ .github/workflows/
│  ├─ ingest.yml
│  ├─ nightly.yml
│  └─ insights.yml
├─ Makefile  pre-commit-config.yaml
├─ README.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md
└─ .env.example
```

---

## 6) GitHub Actions

* **concurrency**: `group: pipeline-${{ github.ref }}` with `cancel-in-progress: true`.
* **jobs**: `setup → ingest → enrich → scoring → build_web → deploy_pages`.
* **cache**: pip + embeddings (`actions/cache`), Parquet artifacts for 1 day.
* **telemetry**: job summary (record counts), section for “Degradazioni disattivate”.

---

## 7) Data contracts & validation

* `schemas/*.json` + `scripts/validate_schemas.py` in CI.
* Every `public/data/*` file carries `version`, `generated_at` (UTC) + checksum in `manifest`.

---

## 8) Key risks & fallbacks

1. **Source HTML drift** → abstract adapters + fixtures + line‑based fallback/XPaths.
2. **Senato PDFs** → `pdfminer.six` + heuristics; postpone to M8 (XML night) if fragile.
3. **Cron limits** → consolidate jobs; move heavy steps to 15′ if needed.
4. **LLM costs** → aggressive gating (M3) + prompt caching; cap calls/job.
5. **Repo size** → rotate by date; keep last N days in `main`; archive on Releases.

---

## 9) Quality (Definition of Done)

* **Schema lock** → no breaking changes without bump.
* **Tests** → 80% for parsers/validators; 10 real golden samples on critical pipelines.
* **Calibration** → Cohen’s κ ≥ 0.65 (fallacies/stance) before publishing global metrics.
* **Transparency** → “Come misuriamo” page with PP formulas and versioned weights.

---

## 10) Initial issues

* [ ] M0: scaffold web + mock data + manifest + CI Pages
* [ ] M0: schemas + validation CI + Makefile + pre‑commit
* [ ] M1: adapter Camera (HTML) + tests
* [ ] M1: adapter Senato (HTML) + tests
* [ ] M1: Parquet normalization + sentence spans
* [ ] M1.5: registry persons/parties + schemas + fixtures
* [ ] M2: `style.py` + `topic_light.py` + NMF cache + `person_features`
* [ ] M3: fastText train/infer (arg, cw) + gold set + `person_features` update
* [ ] M4: duplicates (fastText avg → E5‑small) + embeddings cache + badges
* [ ] M5: `llm_runner` + validators + cards feed + provenance
* [ ] M6: stance tf‑idf + votes join + PP scoring + Profile Pack
* [ ] M7: insights orchestrator + blog + RSS + profile cross‑refs
* [ ] M8: XML refine + audit quality + registry SCD2

---

## 11) DX snippets

```bash
# Validate schemas before commit
make validate

# End‑to‑end (sample)
make run-all   # ingest → enrich → scoring → web build

# Regenerate feed with gating
python enrich/llm_runner.py --day 2025-08-24 --limit 300 --min-conf 0.66
python scoring/run_scoring.py --window 60
```

---

## 12) UI notes

* `/feed`: cards with badges (evidence, confidence, severity, cluster size).
* `/politico/[slug]`: orator page with rolling PP + Q/K/V/I/R breakdown.
* `/metodo`: methods, formulas, PP weights versioning.
* `/blog`: daily report + index + RSS.

---

## 13) Next steps

1. M0 done → keep schemas+mock+CI Pages locked.
2. Open all **Initial issues** (epics per milestone) and prioritize.
3. Proceed **M1 → M1.5** to get real data + base registry.
4. **Freeze data contracts** before enabling LLM (M5).

> This structure preserves implementation content while making the roadmap easier to scan, execute, and review.
