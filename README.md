# PP100 - Parlamento Live

Monitoraggio in tempo reale della qualità del dibattito parlamentare italiano tramite analisi automatica degli interventi.

## 🎯 Obiettivo

PP100 analizza automaticamente gli interventi parlamentari per rilevare:
- **Fallacie logiche** e argomentative
- **Spin politici** e manipolazione
- **Duplicazioni** e coordinamento messaggi
- **Coerenza** delle posizioni
- **Qualità generale** del dibattito

Il sistema calcola un **Punteggio PP (Parlamento Punteggio)** da 0 a 100 per ogni parlamentare basato su 5 componenti:
- **Q** - Quality (Argomentatività e chiarezza)
- **K** - Knowledge (Preparazione e citazioni corrette)
- **V** - Veracity (Accuratezza e evitare fallacie)
- **I** - Integrity (Coerenza e evitare spin)
- **R** - Respect (Civiltà e evitare attacchi personali)

## 🏗️ Architettura

```
PP100 è un sito statico su GitHub Pages che legge file JSON/Parquet pubblicati
senza backend, con pipeline automatizzate su GitHub Actions.

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Sorgenti     │    │   Pipeline      │    │   Frontend      │
│   Parlamento   │───▶│   GitHub        │───▶│   Next.js       │
│   (HTML/XML)   │    │   Actions       │    │   Static Export │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Data Files    │
                       │  public/data/   │
                       │  JSON/Parquet   │
                       └─────────────────┘
```

### Principi Guida

- **Walking skeleton**: prima un sito statico che legge file finti ma con schema definitivo
- **Data contracts**: ogni step scrive file con schema versionato e validato in CI
- **Idempotenza e cache**: ogni job ricalcola solo il necessario
- **Feature flags**: pubblicazione gated da `manifest.json`
- **Fail-soft**: se cade una pipeline, il job continua e pubblica ciò che è sano
- **Zero lock-in**: modelli e vettori in LFS/Release asset

## 🚀 M0 - Walking Skeleton

**Scopo**: vedere una pagina pubblica che legge `public/data/*.jsonl|parquet` fittizi.

### Definition of Done (M0)

- ✅ Sito statico builda ed è deployabile su Pages (artifact presente)
- ✅ `/feed` mostra almeno 3 card mock lette da `public/data/cards-*.jsonl`
- ✅ `/metrics` mostra un pannello con almeno una metrica mock da `scores-rolling.*`
- ✅ `scripts/validate_schemas.py` fallisce se rompo uno schema o un file in `public/data/`
- ✅ Workflows presenti: `ingest.yml` (main), `nightly.yml` (02:00), `insights.yml` (stub)
- ✅ README.md spiega come eseguire tutto localmente e come funzionano i contratti dati

## 🛠️ Setup Locale

### Prerequisiti

- **Node.js LTS** (18.x o superiore)
- **Python 3.11**
- **npm** (incluso con Node.js)

### Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/esonde/PP100.git
   cd PP100
   ```

2. **Installa dipendenze frontend**
   ```bash
   cd web
   npm install
   ```

3. **Installa dipendenze Python**
   ```bash
   pip install jsonschema
   ```

### Comandi Locali

```bash
# Validazione schemi
make validate

# Build frontend
make web

# Tutto (validate + web)
make all

# Oppure manualmente:
cd web
npm run dev      # Sviluppo locale
npm run build    # Build
npm run export   # Export statico
```

### Validazione Schemi

```bash
# Valida tutti i file in public/data/ contro gli schemi
python scripts/validate_schemas.py
```

## 📁 Struttura Progetto

```
.
├─ web/                     # Sito statico (Next.js con export)
│  ├─ src/                  # Pagine e componenti
│  ├─ package.json
│  └─ scripts/read_data.ts  # helper per leggere JSON/Parquet
├─ public/data/             # mock data
├─ public/plots/            # mock grafici
├─ schemas/                 # JSON Schema / pydantic json schema
├─ scripts/                 # utilità (es. validate_schemas.py)
├─ .github/workflows/       # actions
├─ README.md
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
├─ Makefile
└─ pre-commit-config.yaml
```

## 🔄 Contratti Dati

### Schemi Versionati

- `schemas/manifest.schema.json` - Gestione file pubblicati
- `schemas/cards.schema.json` - Eventi rilevati (fallacie, spin, etc.)
- `schemas/scores-rolling.schema.json` - Punteggi PP rolling

### Validazione CI

Ogni file in `public/data/` viene validato contro il suo schema corrispondente:
- Validazione automatica in ogni pipeline
- Fallimento del build se schemi non validi
- Supporto per JSON e JSONL

### Manifest

Il `manifest.json` traccia:
- File correnti e loro versioni
- Checksum SHA256 per integrità
- Status pipeline e degradazioni
- Timestamp generazione

## 🚀 CI/CD Pipeline

### Workflows

1. **`ingest.yml`** - Pipeline principale (ogni 5 minuti)
   - Setup → Validate → Build → Deploy Pages
   - Concurrency per evitare run sovrapposti
   - Job summary con conteggio record

2. **`nightly.yml`** - Refine notturno (02:00 Europe/Rome)
   - Validazione schemi esistenti
   - Placeholder per pipeline refine (M8)

3. **`insights.yml`** - Insights e blog (02:30 Europe/Rome)
   - Validazione integrità dati
   - Placeholder per framework agentico (M7)

### Deploy

- **GitHub Pages** da artifact generato
- Deploy automatico su push a `main`
- Build statico senza backend

## 📊 Roadmap

### M0 - Walking Skeleton ✅
- [x] Sito statico + contratti dati
- [x] Schemi JSON definitivi
- [x] Mock data coerenti
- [x] CI base con validazione

### M1 - P0 Ingest minimo
- [ ] Adapter Camera + Senato (HTML)
- [ ] Normalizzazione interventi
- [ ] Test unitari per parsing

### M2 - P1 Stile & P2 Topics "light"
- [ ] Analisi stile (Gulpease, hedges)
- [ ] Topic modeling (NMF 8 topic)
- [ ] Grafici base

### M3 - fastText triage
- [ ] Modelli per argomentatività
- [ ] Check-worthiness detection
- [ ] Gold set starter

### M4 - Near-duplicate & Agenda
- [ ] Cluster frasi simili
- [ ] Misura diffusione narrative
- [ ] Badge "Copia-incolla Radar"

### M5 - LLM ragionatore
- [ ] Estrazioni affidabili (JSON-only)
- [ ] Validatori deterministici
- [ ] Generazione cards feed

### M6 - Stance & PP scoring
- [ ] Modello stance (pro/contro/neutro)
- [ ] Join con votazioni/atti
- [ ] Calcolo PP e rolling scores

### M7 - Framework Agentico
- [ ] Orchestratore insight
- [ ] Generazione blog automatico
- [ ] Sistema RSS

### M8 - Nightly refine
- [ ] Parser XML/stenografico
- [ ] Ricalcolo scores raffinati
- [ ] Audit log qualità

## 🤝 Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md) per:
- Stile commit/PR
- Processo schema bump
- Etichette issue
- Guidelines sviluppo

## 📝 Licenza

Progetto open source - vedere file LICENSE per dettagli.

## 🔗 Link Utili

- **Sito**: [https://esonde.github.io/PP100](https://esonde.github.io/PP100)
- **Repository**: [https://github.com/esonde/PP100](https://github.com/esonde/PP100)
- **Issues**: [https://github.com/esonde/PP100/issues](https://github.com/esonde/PP100/issues)

---

*PP100 - Monitoraggio qualità dibattito parlamentare italiano* 🏛️
