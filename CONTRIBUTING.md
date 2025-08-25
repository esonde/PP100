# Contribuire a PP100

Grazie per il tuo interesse a contribuire a PP100! Questo documento ti guiderà attraverso il processo di contribuzione.

## 🚀 Quick Start

1. **Fork** il repository
2. **Crea un branch** per la tua feature: `git checkout -b feat/nome-feature`
3. **Committa** le modifiche: `git commit -m "feat: add new feature"`
4. **Pusha** al branch: `git push origin feat/nome-feature`
5. **Apri una Pull Request**

## 📝 Stile Commit

Utilizziamo [Conventional Commits](https://www.conventionalcommits.org/) per mantenere una cronologia pulita e generare changelog automatici.

### Formato

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Tipi di Commit

- **`feat`**: Nuova feature
- **`fix`**: Bug fix
- **`docs`**: Documentazione
- **`style`**: Formattazione, semicolon mancanti, etc.
- **`refactor`**: Refactoring codice
- **`test`**: Aggiunta o modifica test
- **`chore`**: Aggiornamento build, dipendenze, etc.
- **`ci`**: Modifiche a CI/CD
- **`perf`**: Miglioramenti performance
- **`revert`**: Revert di commit precedenti

### Esempi

```bash
feat(web): add /feed page with event cards
fix(scripts): resolve schema validation error
docs(readme): update setup instructions
style(web): format components with prettier
refactor(schemas): simplify manifest structure
test(scripts): add unit tests for validator
chore(deps): update jsonschema to v4.0.0
ci(workflows): add nightly refine pipeline
perf(web): optimize image loading
revert: revert "feat: add experimental feature"
```

### Scope (opzionale)

- **`web`**: Frontend Next.js
- **`scripts`**: Script Python
- **`schemas`**: JSON Schema
- **`ci`**: GitHub Actions
- **`docs`**: Documentazione

## 🔄 Pull Request

### Template PR

```markdown
## 📋 Descrizione

Breve descrizione delle modifiche apportate.

## 🎯 Tipo di Modifica

- [ ] Bug fix
- [ ] Nuova feature
- [ ] Breaking change
- [ ] Documentazione
- [ ] Refactoring

## ✅ Checklist

- [ ] Codice segue le convenzioni del progetto
- [ ] Test passano localmente
- [ ] Documentazione aggiornata
- [ ] Commit seguono Conventional Commits
- [ ] Branch aggiornato con main

## 🔍 Test

Descrivi come testare le modifiche:

1. Setup locale
2. Comandi da eseguire
3. Risultati attesi

## 📸 Screenshot (se applicabile)

Aggiungi screenshot per modifiche UI.

## 🔗 Issue Correlate

Closes #123
Relates to #456
```

### Processo Review

1. **Draft PR**: Inizia con una draft PR per feedback iniziale
2. **Self-review**: Rivedi il tuo codice prima di richiedere review
3. **Tests**: Assicurati che tutti i test passino
4. **Documentation**: Aggiorna README e documentazione correlata
5. **Request review**: Richiedi review a maintainer

## 🏷️ Etichette Issue

### Priorità
- **`P0`**: Critico - Blocca sviluppo
- **`P1`**: Alto - Feature importante
- **`P2`**: Medio - Feature utile
- **`P3`**: Basso - Nice to have

### Tipo
- **`bug`**: Bug report
- **`enhancement`**: Richiesta feature
- **`documentation`**: Miglioramento docs
- **`good first issue`**: Per nuovi contributor
- **`help wanted`**: Richiede aiuto

### Milestone
- **`M0`**: Walking Skeleton
- **`M1`**: P0 Ingest minimo
- **`M2`**: P1 Stile & P2 Topics
- **`M3`**: fastText triage
- **`M4`**: Near-duplicate & Agenda
- **`M5`**: LLM ragionatore
- **`M6`**: Stance & PP scoring
- **`M7`**: Framework Agentico
- **`M8`**: Nightly refine

### Esempio Etichette

```
P1 enhancement M1
bug M0
documentation good first issue
```

## 🔧 Process Schema Bump

Quando modifichi uno schema JSON, segui questo processo:

### 1. Bump Versione

```json
{
  "version": "1.0.0"  // Incrementa secondo semver
}
```

### 2. Aggiorna Manifest

```json
{
  "files": {
    "cards": {
      "version": "1.0.0",  // Aggiorna qui
      "filename": "cards-YYYYMMDD.jsonl"
    }
  }
}
```

### 3. Migrazione Dati

- Crea script di migrazione se necessario
- Aggiorna mock data per testare nuovo schema
- Documenta breaking changes

### 4. Test Validazione

```bash
# Testa nuovo schema
python scripts/validate_schemas.py

# Verifica retrocompatibilità se possibile
```

### 5. Commit

```bash
feat(schemas): bump cards schema to v1.0.0

- Add new required field 'metadata.cluster_size'
- Update validation rules for confidence scores
- Breaking change: confidence now required

Closes #123
```

## 🧪 Testing

### Test Locali

```bash
# Validazione schemi
make validate

# Frontend
cd web
npm run lint
npm run type-check
npm run build
npm run export

# Tutto insieme
make all
```

### Test CI

- Ogni PR triggera pipeline CI
- Verifica build, lint, type-check
- Validazione schemi automatica
- Deploy preview su branch

## 📚 Guidelines Sviluppo

### Frontend (Next.js)

- **TypeScript**: Usa sempre tipi espliciti
- **Components**: Funzionali con hooks
- **Styling**: Tailwind CSS per consistenza
- **Responsive**: Mobile-first design
- **Accessibility**: ARIA labels e semantic HTML

### Script Python

- **Type hints**: Usa sempre type hints
- **Docstrings**: Documenta funzioni e classi
- **Error handling**: Gestisci errori gracefully
- **Logging**: Log strutturati per debugging
- **Testing**: Unit test per funzioni critiche

### Schemi JSON

- **Versioning**: Semver per breaking changes
- **Validation**: Regole chiare e specifiche
- **Documentation**: Descrizioni dettagliate
- **Examples**: Esempi di uso corretto
- **Backward compatibility**: Mantieni quando possibile

## 🐛 Bug Report

### Template Bug Report

```markdown
## 🐛 Descrizione Bug

Descrizione chiara e concisa del bug.

## 🔄 Steps to Reproduce

1. Vai a '...'
2. Clicca su '...'
3. Scorri fino a '...'
4. Vedi errore

## ✅ Comportamento Atteso

Descrizione di cosa dovrebbe succedere.

## 📸 Screenshot

Se applicabile, aggiungi screenshot.

## 🖥️ Ambiente

- OS: [es. Ubuntu 22.04]
- Browser: [es. Chrome 120]
- Versione: [es. commit hash]

## 📋 Logs

Aggiungi logs rilevanti.
```

## 💡 Feature Request

### Template Feature Request

```markdown
## 💡 Descrizione Feature

Descrizione chiara della feature richiesta.

## 🎯 Problema da Risolvere

Descrivi il problema che questa feature risolverebbe.

## 💭 Soluzione Proposta

Descrivi la soluzione che hai in mente.

## 🔄 Alternative Considerate

Descrivi alternative che hai considerato.

## 📚 Informazioni Aggiuntive

Aggiungi qualsiasi altra informazione rilevante.
```

## 🤝 Community

### Comportamento

- **Rispetto**: Tratta tutti con rispetto
- **Costruttivo**: Feedback costruttivo e utile
- **Inclusivo**: Accogli contributor di tutti i livelli
- **Collaborativo**: Lavora insieme per migliorare il progetto

### Canali

- **Issues**: Bug report e feature request
- **Discussions**: Domande e discussioni generali
- **Pull Requests**: Contributi di codice
- **Wiki**: Documentazione estesa

## 📞 Supporto

Se hai domande o bisogno di aiuto:

1. **Controlla** la documentazione esistente
2. **Cerca** nelle issues e discussions
3. **Apri** una issue per bug o feature request
4. **Partecipa** alle discussions per domande

---

*Grazie per contribuire a PP100! 🏛️*
