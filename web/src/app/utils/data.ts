// Utility per leggere e processare i dati PP100

export interface Intervention {
  id: string
  source: string
  seduta: string
  ts_start: string
  oratore: string
  gruppo: string
  text: string
  spans_frasi: Array<{ start: number; end: number }>
  source_url: string
  fetch_etag?: string
  fetch_last_modified?: string
  ingested_at?: string
}

export interface Person {
  person_id: string
  nome: string
  cognome: string
  slug: string
  dob?: string
  sex?: string
  wikidata_qid?: string
  created_at: string
}

export interface Party {
  party_id: string
  nome: string
  slug: string
  tipo: string
  created_at: string
}

export interface ManifestData {
  version: string
  generated_at: string
  files: {
    [key: string]: {
      filename: string
      version: string
      generated_at: string
      checksum: string
      record_count: number
      status: string
    }
  }
  status: {
    overall: string
    last_success: string
    degradations: string[]
    ingest: string
  }
  current: {
    interventions: string
  }
  sources: {
    camera: string
    senato: string
  }
  registry: {
    persons: string
    person_xref: string
    person_aliases: string
    party_registry: string
    party_membership: string
    roles: string
    inbox: string
  }
}

// Funzione per calcolare il prossimo aggiornamento (ogni 5 minuti)
export function calculateNextUpdate(lastUpdate: string): { nextUpdate: string; timeUntil: string } {
  const last = new Date(lastUpdate)
  const now = new Date()
  
  // Calcola il prossimo slot di 5 minuti
  const minutes = Math.ceil(now.getMinutes() / 5) * 5
  const next = new Date(now)
  next.setMinutes(minutes, 0, 0)
  
  // Se il prossimo slot è passato, prendi il prossimo
  if (next <= now) {
    next.setMinutes(next.getMinutes() + 5)
  }
  
  const timeUntil = next.getTime() - now.getTime()
  const minutesUntil = Math.ceil(timeUntil / (1000 * 60))
  
  return {
    nextUpdate: next.toLocaleString('it-IT'),
    timeUntil: `${minutesUntil} minuti`
  }
}

// Funzione per formattare la data in italiano
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Data non valida'
  }
}

// Funzione per ottenere il nome del file dalle path
export function getFileName(path: string): string {
  return path.split('/').pop() || 'N/A'
}

// Funzione per contare le righe di un file JSONL
export async function countJsonlRecords(url: string): Promise<number> {
  try {
    const response = await fetch(url)
    if (!response.ok) return 0
    
    const text = await response.text()
    return text.trim().split('\n').filter(line => line.trim()).length
  } catch {
    return 0
  }
}

// Funzione per leggere dati JSONL
export async function readJsonlData<T>(url: string): Promise<T[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    
    const text = await response.text()
    return text.trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
  } catch {
    return []
  }
}

// Funzione per ottenere statistiche del registry
export async function getRegistryStats(): Promise<{
  personsCount: number
  partiesCount: number
  inboxCount: number
  persons: Person[]
  parties: Party[]
  downloadUrls: {
    persons: string
    parties: string
    inbox: string
  }
}> {
  try {
    const [persons, parties, inbox] = await Promise.all([
      readJsonlData<Person>('/data/persons.jsonl'),
      readJsonlData<Party>('/data/party_registry.jsonl'),
      readJsonlData<any>('/data/identities_inbox.jsonl')
    ])
    
    return {
      personsCount: persons.length,
      partiesCount: parties.length,
      inboxCount: inbox.length,
      persons,
      parties,
      downloadUrls: {
        persons: '/data/persons.jsonl',
        parties: '/data/party_registry.jsonl',
        inbox: '/data/identities_inbox.jsonl'
      }
    }
  } catch {
    return {
      personsCount: 0,
      partiesCount: 0,
      inboxCount: 0,
      persons: [],
      parties: [],
      downloadUrls: {
        persons: '/data/persons.jsonl',
        parties: '/data/party_registry.jsonl',
        inbox: '/data/identities_inbox.jsonl'
      }
    }
  }
}

// Funzione per ottenere informazioni sugli interventi
export async function getInterventionsInfo(manifest: ManifestData): Promise<{
  count: number
  filename: string
  lastUpdate: string
  source: 'parquet' | 'json' | 'none'
  downloadUrl: string
}> {
  if (!manifest.current?.interventions) {
    return { count: 0, filename: 'N/A', lastUpdate: 'N/A', source: 'none', downloadUrl: '' }
  }
  
  const filename = getFileName(manifest.current.interventions)
  const lastUpdate = manifest.generated_at
  const downloadUrl = `/data/${filename}`
  
  // Per ora, se il file è parquet, non possiamo leggerlo nel browser
  // Ma possiamo mostrare che esiste e permettere il download
  if (filename.endsWith('.parquet')) {
    return {
      count: -1, // -1 significa "file esiste ma count sconosciuto"
      filename,
      lastUpdate: formatDate(lastUpdate),
      source: 'parquet',
      downloadUrl
    }
  }
  
  // Se è JSON, possiamo contarlo
  if (filename.endsWith('.json') || filename.endsWith('.jsonl')) {
    try {
      const count = await countJsonlRecords(`/data/${filename}`)
      return {
        count,
        filename,
        lastUpdate: formatDate(lastUpdate),
        source: 'json',
        downloadUrl
      }
    } catch {
      return {
        count: 0,
        filename,
        lastUpdate: formatDate(lastUpdate),
        source: 'json',
        downloadUrl
      }
    }
  }
  
  return {
    count: 0,
    filename,
    lastUpdate: formatDate(lastUpdate),
    source: 'none',
    downloadUrl: ''
  }
}
