Parlamento Live 

Meme + utilità + rigore — 100% GitHub (Pages + Actions), zero backend 

Questo repository consente di ricostruire l’intero progetto: scraping gentile dei resoconti, feature “fast” locali, selezione candidati, un solo LLM ragionatore (JSON-only) con validazioni deterministiche, indicatori, PP – Punti Politico, pipeline insight agentica e report/Blog statici generati automaticamente. 
 Aggiornamento ogni 5 minuti (limite GitHub Actions); refine notturno con XML. 

Scopo: capacitare chi legge (capire come si argomenta, cosa si promette, quanto è credibile) mantenendo un formato “meme-ready” ma sempre con Prova (link + span nel resoconto). 

 

0) Indice rapido 

1) Architettura (GitHub-only) 

2) Sorgenti & licenze 

2bis) Registry persone/partiti & crosswalk (identità temporale)
Obiettivo: identità robuste, storicizzate, e join deterministici.

• persons.jsonl (canonico, quasi immutabile): 
  {"person_id","nome","cognome","slug","dob","sex","wikidata_qid","created_at"}
  – person_id: preferenza ID ufficiale, altrimenti hash stabile.
• person_xref.parquet (crosswalk): 
  {"person_id","source","source_id","url","first_seen","last_seen"}
• person_aliases.parquet (varianti nome): 
  {"person_id","alias","from","to","confidence"}
• party_registry.jsonl / party_xref.parquet: anagrafica partiti e gruppi.
• party_membership.parquet (SCD2): 
  {"person_id","party_id","group_id_aula","role_in_party","valid_from","valid_to","source_url"}
• roles.parquet (incarichi di governo/commissioni, SCD2): 
  {"person_id","role_type","org","title","grade","valid_from","valid_to","source_url"}
• contact_channels.parquet (pubblici, opzionale): 
  {"person_id","type","handle","url","valid_from","valid_to"}

Note: tutte le tabelle "variabili nel tempo" hanno valid_from/valid_to per ricostruire snapshot a data t.

3) Pipeline indipendenti (P0–P11) 

Ogni pipeline è modulare, idempotente e scrive output dedicati. Gli step girano in sequenza nello stesso job "*/5". 

P0 — Ingest & Normalizzazione 

In: Sommario/Comunicato live (ETag/If-Modified-Since); notturno: XML/HTML. 

Out: interventions-YYYYMMDD.parquet → id, camera_senato, seduta, ts_start, oratore, gruppo, text, spans_frasi[], source_url. 

Freq: */5; nightly refine. 

P1 — Stile & Statistiche base 

Gulpease, parole/frasi, % frasi lunghe, % hedges, intensificatori, citazioni normative/numeriche. 

Out: features-style-YYYYMMDD.parquet. 

P2 — Topic "light" (coarse) 

tf-idf + NMF (fit settimanale; inferenza day-of). 

Out: features-topic-YYYYMMDD.parquet (topic_vec[8], top_terms). 

P3 — Near-duplicate & Agenda Adoption 

Prefiltro fastText sentence-avg cosine → conferma con E5-small (o MPNet-mini). 

Out: duplicates-YYYYMMDD.parquet (cluster_id, leader_id, lags). 

P4 — Argomentatività (fastText) 

Classifica arg vs non-arg a livello turno/frase. 

Out: arg-score-YYYYMMDD.parquet. 

P5 — Claim numerici (regex → normalize) 

Regex robuste, normalizzazione unità/periodi. 

Out: claims-raw-YYYYMMDD.jsonl (span, value, unit, period, var?). 

P6 — Check-worthiness (fastText) + ranking 

fastText CW per ordinare i candidati claim e frasi "notiziabili". 

Out: claims-cw-ranked-YYYYMMDD.jsonl. 

P7 — LLM ragionatore (unico, JSON-only) 

Input: subset da P3/P4/P6 (~10–20% frasi). 

Output JSON: fallacies[] | claims[] | steelman | commitments[] + confidence + span. 

Validazioni deterministiche (schema, span, whitelist). 

Out: llm-events-YYYYMMDD.jsonl. 

P8 — Stance (coarse) & Join con voti/atti 

SVM/logistic su tf-idf (pro/contro/neutro), mapping intervento↔atto (tempo/keywords). 

Out: stance-YYYYMMDD.parquet, join-votes-YYYYMMDD.parquet. 

P9 — Indicatori & Insight (numerici) 

Pathos/Policy, disciplina lessicale, drift frame, adoption, change-point, regressioni semplici. 

Out: indicators-YYYYMMDD.parquet, insights.jsonl (preliminare). 

P10 — Scoring PP (rolling 30–60 gg) 

Q/K/V/I/R + W_role + Penalty_gate (per 1000 parole; winsorize). 

Out: scores-rolling.parquet. 

P11 — Cards & Feed 

Regole di pubblicazione (soglie + evidence). 

Out: cards-YYYYMMDD.jsonl, manifest.json. 

4) Usi di fastText (triage a basso costo) 

fastText non decide nulla "forte": filtra/ordina. Soglie conservative; nessuna pubblicazione senza conferme o regole. 

Argomentatività (arg / non-arg) — principale. 

Check-worthiness (cw / non-cw) — ranking claims. 

Commitment (commit / non-commit) — promesse/tempi. 

Attacco personale (coarse) (ad_hominem / policy_critique). 

Domande retoriche (rhetorical_q / other). 

Topic macro (8–12) (fisco, lavoro, sanità, energia, …). 

Stance "coarse" (backup). 

Pathos alto/basso. 

Frame seed (sicurezza/economia/diritti/morale/competenza). 

Near-duplicate prefilter (vector media). 

Newsworthiness "light". 

"Claimness" (claim vs opinione senza cifra). 

Training tip: __label__arg Testo… (supervised), -dim 200 -epoch 20 -wordNgrams 2 -loss ova. Calibrazione opzionale (Platt/temperature). Validazione rolling temporale. 

5) LLM ragionatore (JSON-only) + validazioni deterministiche 

Un solo LLM (nessun "verifier" addizionale). Produci solo JSON con schema rigido: 

{ 
  "id":"<id_intervento>", 
  "fallacies":[{"type":"ad_hominem|strawman|slippery_slope|false_cause|red_herring|appeal_to_authority|cherry_picking", 
                "span":[start,end], "explain":"...", "confidence":0.0}], 
  "claims":[{"span":[s,e], "var":"PIL|inflazione|disoccupazione|...","value":0.0,"unit":"%|pp|mld€|...","period":"YYYY|YYYY-MM|range","definition":"...", "confidence":0.0}], 
  "steelman":{"span":[s,e], "text":"60-80 parole", "confidence":0.0}, 
  "commitments":[{"span":[s,e],"type":"stanziamento|assunzioni|riduzione_tasse|...","qty":10000,"deadline_days":180}] 
} 
 

Guardrail deterministici: 

Schema-validation (pydantic/cerberus) → rigetta record malformati. 

Span-check → [start,end] devono esistere nel testo originale. 

Whitelist variabili/unità/periodi; mapping a dizionari controllati. 

Confidence gating → pubblica solo se confidence ≥ 0.66. 

Cache → chiave sha256(task|prompt_ver|frase) evita doppie chiamate. 

5bis) Provenance & audit (SHA, evidence, versioni)
• Ogni record "pubblicabile" include: evidence_refs[] (URL ufficiali + span), generated_by_commit (SHA git), ruleset_version/pp_version.
• Audit: public/data/audit/*.jsonl con changelog pesi PP e regole cards.
• Regola d'oro: niente card senza evidence_refs e span-check valido.

6) Indicatori & PP – Punti Politico 

Q — Substance/Qualità (0–1) 
 Q = 0.5·PolicyDensity + 0.3·Specificità + 0.2·Proposte 

PolicyDensity: citazioni normative + numeri con unità per 1000 parole. 

Specificità: 1 − hedges_pct (calibrata). 

Proposte: #commitments normalizzati. 

K — Credibilità (0–1) 
 K = 0.65·CA + 0.35·PF (+0.05 se rettifica volontaria) 

CA: match claims vs dataset locali (Bayes Beta(1,1), pesi per n). 

PF: annunci→atto→approvato→G.U., bonus se nei tempi dichiarati. 

V — Coerenza discorso→voto (0–1) 
 V = BA(stance, voto) * (1 − penalty_def_non_giust) 

I — Influenza (0–1) 
 I = 0.6·AgendaAdoption + 0.4·Emendamenti 

R — Retorica/Civiltà (0–1) 
 R = 0.7·exp(−λ·severity_rate) + 0.3·Chiarezza(Gulpease_norm) 

Correzioni: W_role (ruolo/commissione), Penalty_gate (misinfo grave −5/−15; ad hominem seriale −5). 
 PP (0–100) 
 PP = 100 · [0.28·Q + 0.24·K + 0.18·V + 0.18·I + 0.12·R] · W_role − Penalty_gate 

Per 1000 parole, rolling 30–60gg, winsorize (1°–99° pct), PP ± CI (bootstrap). 

Cards (principali) 

Fallacia del minuto: confidence≥0.66, severity > p90, span valido. 

Spin-o-metro: pathos/policy > soglia e in crescita su 30–60m. 

Copiaincolla Radar: cluster≥3 oratori entro 72h. 

Promessa vs Oggi: nuovo commitment o stato aggiornato. 

Whip Radar: stance≠linea gruppo + storico defezioni. 

Badge & Tag (derivati, deterministici)
• Spin-o-metro Alto, Copiaincolla p95, Accuratezza claims p80+, Chiarezza alta (Gulpease_norm>p85), ecc.
• Regole versionate (ruleset_version), con motivazione "why" + evidence.

7) Framework Agentico per Insight & Blog 

Un "orchestratore" notturno trasforma i dati in ipotesi → test → selezione → report. L'LLM propone e spiega; i test sono in Python. Il sistema predice, si corregge e mantiene storia & scoring. 

7.1 Ruoli (agenti logici) 

Profiler (Python): profila dataset (NA, quantili, corr), change-point, regressioni rapide (OLS/Logit con effetti fissi). 

Ideatore (LLM): genera ipotesi testabili (JSON) su base riassunti numerici, non sui raw. 

Tester (Python): esegue test, corregge per multipli (Benjamini–Hochberg), calcola effetti e CI; holdout temporale. 

Curatore (Python): calcola interestingness = novelty * effect_size * robustness * actionability, seleziona top-N. 

Redattore (LLM): scrive schede insight (headline, 2–3 frasi, caveat). 

Archivista (Python): pubblica report giornaliero (Markdown/MDX), aggiorna indice blog, collega post passati, aggiorna registro previsioni con scoring ex-post. 

7.2 Flusso operativo (notturno + weekly) 

Input: features-*.parquet, votes-*.parquet, llm-events-*.jsonl, scores-rolling.parquet. 

Profiling & Stats: corr, pivot, change-point, logit/OLS (con FE oratore/partito). 

Ideazione (LLM): max 20 ipotesi JSON con test_spec (VD, regressori, controlli, finestra). 

Testing (Python): esegue specifiche, calcola effetti minimi, p-adjusted, robustezza su finestre adiacenti. 

Selezione: ordina per interestingness, sceglie 5–15 insight pubblicabili. 

Report giornaliero: genera /web/content/blog/YYYY-MM-DD.md(x) con: 

Executive summary, grafici public/plots/*.png, insight con link a card/evidence. 

Previsioni (esplicite): create/aggiornate in public/data/predictions.jsonl. 

Correzioni (onestà operativa): "ieri abbiamo stimato X; si è verificato Y, errore Z, motivo…". 

Indice & RSS: aggiorna /web/content/blog/index.json + feed /public/rss.xml. 

Weekly (domenica): post settimanale con meta-analisi, top PP, drift frame, promesse→follow-through. 

7.3 Previsioni & auto-correzione 

Registro predictions.jsonl: 

{"pred_id":"P-2025-08-24-001","date":"2025-08-24","horizon_days":7, 
 "target":"defezioni_voto_su_C1234", 
 "forecast":{"prob":0.32,"threshold":null,"direction":null}, 
 "rationale":"aumento pathos_pct + contraddizioni", 
 "status":"open"} 
 

Scoring ex-post: Brier score/log-loss, outcome, nota. 

Apprendimento: tuning soglie se Brier peggiora; trasparenza su errori nel report. 

7.4 Viste profilo (Profile Pack) — supporto al blog e alle pagine oratore
Generiamo snapshot materializzati per il frontend:
• public/data/profiles/{person_id}.json
  {
    "person_id":"P123","snapshot_date":"YYYY-MM-DD",
    "anagrafica":{"nome":"…","cognome":"…","slug":"…","wikidata_qid":"Q…"},
    "party":{"party_id":"…","group_id_aula":"…","since":"YYYY-MM-DD"},
    "roles":[{"title":"…","since":"YYYY-MM-DD"}],
    "pp":{"score":NN,"window_days":60,"components":{"Q":…},"ci":[lo,hi]},
    "signals":{"pathos_pct":x,"policy_density":y},
    "badges":[{"badge":"…","since":"…"}],
    "links":{"feed":"/politico/slug","source":"/data/…"},
    "generated_by_commit":"<SHA>"
  }

8) Token budget, gating & costi API 

8.1 Gating pratico (come riduciamo i token) 

Split in frasi; scarta frasi cerimoniali/brevissime. 

Tieni solo frasi che matchano almeno uno di: 

numeri/unità/date (regex robuste), 

citazioni normative ("art.", "comma", "D.L."…), 

argomentatività fastText arg≥0.7, 

check-worthiness fastText cw≥0.7, 

semiologie retoriche (slippery/ad hominem "light"), 

seed di near-duplicate (prefiltro fastText → conferma E5-small), 

±30′ da un voto oppure oratori "alti" (capigruppo/ministri). 

Dedup per hash (stessa frase + stesso prompt = 0 chiamate). 

Finestra corta: 1–2 frasi prima/dopo (no full-speech). 

Limiter: cap giornaliero di chiamate e soglie adattive nei giorni "pesanti". 

8.2 Volumi realistici (giorno tipo) 

Assumi 20 parole/frase e ~1.3 token/parola. 

LOW — 60k parole ⇒ 3k frasi ⇒ candidati 15% = 450 
 • input ~300 tok/call, output ~120 → 135k in / 54k out 
 • gpt-5-mini ≈ $0.14 / giorno 

MEDIUM — 180k parole ⇒ 9k frasi ⇒ candidati 15% = 1,350 
 • 405k in / 162k out → $0.42 / giorno (mini) 

HIGH — 400k parole ⇒ 20k frasi ⇒ candidati 15% = 3,000 
 • 900k in / 360k out → $0.95 / giorno (mini) 

Stringendo il contesto a ~220 token e/o alzando i cut-off al 10%, i costi scendono di ~30–40%. 

8.3 Routing modelli (qualità/costi) 

gpt-5-nano — micro-task cheap: normalizzazioni semplici (unità/periodi), estrazioni banali, titoletti card, triage extra. 

gpt-5-mini — default: fallacies/steelman/commitments/claims sui candidati; redazione card/riassunti. 

gpt-5 — escalation premium: segmenti di capigruppo/ministri o pre-voto critici; report giornalieri/settimanali lunghi. 

Mix consigliato (MEDIUM: 1,350 snippet/giorno) 

20–40% nano, 60–75% mini, 0–5% gpt-5 → tipicamente < 1 $/giorno. 

Report giornaliero con gpt-5 (≈12k in + 2.5k out): ~$0.04. 

Prompt caching (blocco istruzioni condiviso) riduce ulteriormente l'input-cost. 

9) File & contratti dati (public/data/)  [esteso con registry/profili]
 manifest.json → puntatori ai file giornalieri correnti + checksum. 

interventions-YYYYMMDD.parquet → testo normalizzato + spans. 

features-YYYYMMDD.parquet → stile, pathos, topic, ecc. 

duplicates-YYYYMMDD.parquet → cluster near-duplicate. 

arg-score-YYYYMMDD.parquet → fastText arg/non-arg. 

claims-raw-YYYYMMDD.jsonl → span numerici grezzi. 

claims-cw-ranked-YYYYMMDD.jsonl → ranking CW. 

llm-events-YYYYMMDD.jsonl → output LLM (fallacies/claims/steelman/commitments). 

stance-YYYYMMDD.parquet, join-votes-YYYYMMDD.parquet. 

indicators-YYYYMMDD.parquet, insights.jsonl. 

scores-rolling.parquet → PP e componenti. 

cards-YYYYMMDD.jsonl → feed pubblicazione. 

predictions.jsonl → registro previsioni. 

blog-index.json → indice post (titolo, slug, tag, link). 

Grafici: public/plots/*.png. 

Registry & profili:
 persons.jsonl (canonico), person_xref.parquet, person_aliases.parquet,
 party_registry.jsonl, party_xref.parquet, party_membership.parquet (SCD2),
 roles.parquet (SCD2), contact_channels.parquet (opz.),
 person_features.parquet (misure per-persona con method_version e CI),
 badges.jsonl (tag pubblicabili con ruleset_version),
 profiles/{person_id}.json (vista materializzata per UI),
 graph/edges.parquet (opzionale, mini-grafo), audit/*.jsonl (versioni/regole).

10) Layout repo & workflow GitHub Actions 

. 
├─ ingest/                 # P0 
│  ├─ run_ingest.py 
│  └─ requirements.txt 
├─ enrich/                 # P1–P8 (feature, fastText, LLM, join) 
│  ├─ run_enrich.py 
│  ├─ fasttext/ (train/infer arg, cw, commit, pathos, topic) 
│  ├─ models/ (vectorizers, SVM/logistic stance) 
│  └─ requirements.txt 
├─ scoring/                # P9–P11 (indicatori, PP, cards) 
│  ├─ run_scoring.py 
│  └─ requirements.txt 
├─ insights/               # Orchestratore agentico 
│  ├─ run_insights.py 
│  ├─ prompts/ 
│  └─ requirements.txt 
├─ web/                    # Next.js/SvelteKit static 
│  ├─ package.json 
│  └─ src/… 
├─ public/data/            # JSON/Parquet pubblicati 
├─ public/plots/           # grafici png 
├─ identities/             # sync registry & SCD2 (persons/parties/roles)
│  ├─ build_registry.py    # aggiorna persons/person_xref/aliases/party_*
│  └─ build_memberships.py # aggiorna party_membership/roles
├─ profiles/               # materializzazione viste profilo
│  └─ build_profile_pack.py
├─ .github/workflows/ 
│  ├─ ingest.yml           # */5 — ingest + enrich + scoring + build + deploy 
│  ├─ nightly.yml          # 02:00 — registry SCD2 + refine XML + ricalcoli 
│  └─ insights.yml         # 02:30 — agentic report + blog + RSS + deploy 
└─ README.md 

Workflow ingest.yml (*/5, esempio) 

setup python → ingest → enrich → scoring → build web → deploy Pages (artifact). 

Workflow nightly.yml (02:00 Europe/Rome) 

registry SCD2 (persons/parties/roles), parse XML, riallinea offset, ricalcola fallacie/claims/steelman e PP, rebuild sito. 

Workflow insights.yml (02:30 Europe/Rome) 

orchestratore agentico: profiling → ideazione (LLM) → testing → selezione → report/Blog → RSS → deploy. 

11) Riproduzione — come partire 

Fork la repo. 

Secrets (opzionale): LLM_API_KEY. 

Abilita Pages e Actions (workflow: ingest, nightly, insights). 

Attendi 5–10 minuti per il primo ciclo; verifica public/data/manifest.json. 

Sviluppo locale: 

python -m venv .venv && source .venv/bin/activate 
pip install -r ingest/requirements.txt -r enrich/requirements.txt -r scoring/requirements.txt -r insights/requirements.txt 
python ingest/run_ingest.py && python enrich/run_enrich.py && python scoring/run_scoring.py 
python insights/run_insights.py 
cd web && npm ci && npm run dev 

12) Etica, limiti, qualità 

Etica: diritto di replica (issue template), evidence obbligatoria (URL + span), incertezze visibili (CI, confidenza). 

Limiti GitHub-only: cadence a 5 minuti (cron non garantiti al minuto); evitare file enormi (compatta/ruota). 

Qualità: gold set (300–500 frasi) per fallacie/claims/stance (κ di Cohen), backtest 12 mesi, calibrazione soglie. 

Trasparenza: pagina "Come misuriamo", versionamento pesi PP (pp_version), audit log per cambi di metodo. 

Diritto di replica & correzioni
• Issue template dedicato "Correzione profilo" (richiede fonte) → patch su overrides.yaml con motivazione.
• Ogni modifica manuale è tracciata in audit/*.jsonl con SHA autore e link issue/PR.

Appendice A: Prompt & schemi 

A1) LLM ragionatore — estrazione JSON 

Sei un analista di argomentazione. Dato TESTO ITALIANO di un intervento parlamentare, 
restituisci SOLO JSON conforme allo schema: 
 
{ 
 "id":"<id_intervento>", 
 "fallacies":[{"type":"ad_hominem|strawman|slippery_slope|false_cause|red_herring|appeal_to_authority|cherry_picking", 
               "span":[start,end],"explain":"max 40 parole","confidence":0-1}], 
 "claims":[{"span":[s,e],"var":"PIL|inflazione|disoccupazione|...","value":number,"unit":"%|pp|mld€|...","period":"YYYY|YYYY-MM|range","definition":"breve","confidence":0-1}], 
 "steelman":{"span":[s,e],"text":"60-80 parole, versione migliore della tesi opposta","confidence":0-1}, 
 "commitments":[{"span":[s,e],"type":"stanziamento|assunzioni|riduzione_tasse|...","qty":number|null,"deadline_days":int|null}] 
} 
 
Regole: indica SEMPRE gli indici di carattere `span` relativi al TESTO dato. 
Se incerto, ometti. Nessun testo fuori dal JSON. Lingua: ITA. 

A2) Generatore di ipotesi (Ideatore) 

Hai SOLO questi riassunti numerici (profilo, correlazioni, regressioni rapide, change-point). 
Genera al massimo 20 IPOTESI TESTABILI sul dataset politico italiano: 
 
Output JSON: 
[{"title":"...","hypothesis":"...", "test_spec":{"model":"logit|ols", 
"dep":"...", "regs":["..."], "controls":["..."], "window":"YYYY-MM-DD..YYYY-MM-DD"},  
"slice":{"filtro":"opzionale"}, "expected_direction":"+/−/?", "why_interesting":"..."}] 
 
Niente p-value, niente testo extra; evita duplicati; rendi le ipotesi falsificabili. 

A3) Redazione card (Redattore) 

Dato il risultato statistico (coeff, CI, p_adj, n, controllo confondenti) e un'immagine grafico, 
scrivi una CARD di 2–3 frasi, neutra e chiara, con un caveat e invito a monitorare. 
Output JSON: {"headline":"...", "dek":"...", "caveat":"..."}. 

A4) PP — formula in codice (estratto Python) 

def pp(Q,K,V,I,R,W_role,Penalty_gate): 
    comp = 0.28*Q + 0.24*K + 0.18*V + 0.18*I + 0.12*R 
    return 100*comp*W_role - Penalty_gate 

Appendice B: Schemi registry & profili (estratti)
• schemas/persons.schema.json
  {"type":"object","required":["person_id","slug","created_at"],
   "properties":{"person_id":{"type":"string","pattern":"^P[0-9]+$"},
                 "wikidata_qid":{"type":"string","pattern":"^Q[0-9]+$"}}}
• schemas/party_membership.schema.json
  {"required":["person_id","party_id","valid_from"],
   "properties":{"valid_to":{"type":["string","null"]}}}
• schemas/person_features.schema.json
  {"required":["person_id","feature","value","valid_on","method_version"],
   "properties":{"ci_low":{"type":["number","null"]},"ci_high":{"type":["number","null"]}}}
• schemas/profile_pack.schema.json
  {"required":["person_id","snapshot_date","pp","anagrafica"],"properties":{"generated_by_commit":{"type":"string"}}}

Contributi & contatti 
 PR e issue sono benvenute. Prima di contribuire, leggere "Come misuriamo" e la "Carta etica". 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 