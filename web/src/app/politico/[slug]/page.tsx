import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'

interface PersonData {
  person_id: string
  nome: string
  cognome: string
  slug: string
  dob?: string
  sex?: string
  wikidata_qid?: string
  created_at: string
}

interface PartyMembership {
  person_id: string
  party_id: string
  group_id_aula: string
  role_in_party: string
  valid_from: string
  valid_to?: string
  source_url: string
}

interface PartyData {
  party_id: string
  name: string
  acronym: string
  created_at: string
}

// Generate static params for build
export async function generateStaticParams() {
  try {
    // Read persons registry to generate all possible slugs
    const personsPath = path.join(process.cwd(), 'public/data/persons.jsonl')
    
    if (!fs.existsSync(personsPath)) {
      console.warn('Persons registry not found, returning empty params')
      return []
    }
    
    const personsText = fs.readFileSync(personsPath, 'utf-8')
    const persons = personsText.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
    
    // Return all slugs for static generation
    return persons.map(person => ({
      slug: person.slug
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

// Server component - no 'use client' needed
export default async function PoliticoPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  
  try {
    // Load persons registry
    const personsPath = path.join(process.cwd(), 'public/data/persons.jsonl')
    if (!fs.existsSync(personsPath)) {
      throw new Error('Persons registry not found')
    }
    
    const personsText = fs.readFileSync(personsPath, 'utf-8')
    const persons = personsText.trim().split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
    
    // Find person by slug
    const person = persons.find(p => p.slug === slug)
    if (!person) {
      notFound()
    }
    
    // Load party memberships (simplified for M1.5)
    let currentMembership: PartyMembership | null = null
    let partyData: PartyData | null = null
    
    try {
      const partiesPath = path.join(process.cwd(), 'public/data/party_registry.jsonl')
      if (fs.existsSync(partiesPath)) {
        const partiesText = fs.readFileSync(partiesPath, 'utf-8')
        const parties = partiesText.trim().split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line))
        
        // For M1.5, use placeholder membership data
        // In M6, this will read from party_membership.parquet
        currentMembership = {
          person_id: person.person_id,
          party_id: 'PARTY001',
          group_id_aula: 'PD-GROUP',
          role_in_party: 'Membro',
          valid_from: '2023-01-01T00:00:00Z',
          source_url: 'https://example.com'
        }
        
        const party = parties.find(p => p.party_id === currentMembership!.party_id)
        if (party) {
          partyData = party
        }
      }
    } catch (error) {
      console.warn('Could not load party data:', error)
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👤 {person.nome} {person.cognome}
          </h1>
          <p className="text-gray-600">
            Profilo politico e informazioni di membership
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Anagrafica */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Anagrafica</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="text-gray-900">{person.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Cognome:</span>
                  <span className="text-gray-900">{person.cognome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">ID:</span>
                  <span className="text-gray-900 font-mono">{person.person_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Slug:</span>
                  <span className="text-gray-900 font-mono">{person.slug}</span>
                </div>
                {person.dob && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Data di nascita:</span>
                    <span className="text-gray-900">
                      {new Date(person.dob).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}
                {person.sex && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Sesso:</span>
                    <span className="text-gray-900">{person.sex}</span>
                  </div>
                )}
                {person.wikidata_qid && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Wikidata:</span>
                    <a 
                      href={`https://www.wikidata.org/wiki/${person.wikidata_qid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {person.wikidata_qid}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Membership corrente */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏛️ Membership Corrente</h2>
              {currentMembership && partyData ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Partito:</span>
                    <span className="text-gray-900">{partyData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Acronimo:</span>
                    <span className="text-gray-900 font-mono">{partyData.acronym}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Ruolo:</span>
                    <span className="text-gray-900">{currentMembership.role_in_party}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Gruppo Aula:</span>
                    <span className="text-gray-900">{currentMembership.group_id_aula}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Dal:</span>
                    <span className="text-gray-900">
                      {new Date(currentMembership.valid_from).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Nessuna membership attiva</p>
              )}
            </div>
          </div>
        </div>

        {/* Note M1.5 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <div className="flex items-start">
            <div className="text-blue-600 text-xl mr-3">ℹ️</div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Milestone M1.5 - Registry & Crosswalk</h4>
              <p className="text-blue-800 text-sm">
                Questa è la versione stub del profilo politico. In M6 verrà implementato il sistema completo
                con storico membership, ruoli, interventi, e metriche personalizzate.
              </p>
              <p className="text-blue-800 text-sm mt-2">
                <strong>Funzionalità attuali:</strong> Anagrafica base e membership corrente
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading politico data:', error)
    notFound()
  }
}
