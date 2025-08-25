'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PoliticoLinkProps {
  nome: string
  className?: string
  showIcon?: boolean
}

interface PersonData {
  person_id: string
  nome: string
  cognome: string
  slug: string
}

export default function PoliticoLink({ nome, className = '', showIcon = true }: PoliticoLinkProps) {
  const [personData, setPersonData] = useState<PersonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const findPersonByName = async () => {
      try {
        console.log(`PoliticoLink: Searching for "${nome}"`)
        
        // First try hardcoded mapping for testing
        const hardcodedMapping: { [key: string]: PersonData } = {
          // Politici reali dal registry
          'Elly Schlein': { person_id: 'P000001', nome: 'Elly', cognome: 'Schlein', slug: 'schlein-elly' },
          'Giorgia Meloni': { person_id: 'P000002', nome: 'Giorgia', cognome: 'Meloni', slug: 'meloni-giorgia' },
          'Matteo Salvini': { person_id: 'P000003', nome: 'Matteo', cognome: 'Salvini', slug: 'salvini-matteo' },
          'Silvio Berlusconi': { person_id: 'P000004', nome: 'Silvio', cognome: 'Berlusconi', slug: 'berlusconi-silvio' },
          'Giuseppe Conte': { person_id: 'P000005', nome: 'Giuseppe', cognome: 'Conte', slug: 'conte-giuseppe' },
          
          // Varianti con onorifici
          'On. Elly Schlein': { person_id: 'P000001', nome: 'Elly', cognome: 'Schlein', slug: 'schlein-elly' },
          'Onorevole Elly Schlein': { person_id: 'P000001', nome: 'Elly', cognome: 'Schlein', slug: 'schlein-elly' },
          'Ministro Giorgia Meloni': { person_id: 'P000002', nome: 'Giorgia', cognome: 'Meloni', slug: 'meloni-giorgia' },
          'Sottosegretario Matteo Salvini': { person_id: 'P000003', nome: 'Matteo', cognome: 'Salvini', slug: 'salvini-matteo' },
          
          // Nomi dai dati di test (feed/leaderboard)
          'Antonio Neri': { person_id: 'P000006', nome: 'Antonio', cognome: 'Neri', slug: 'neri-antonio' },
          'Elena Bianchi': { person_id: 'P000007', nome: 'Elena', cognome: 'Bianchi', slug: 'bianchi-elena' },
          'Giulia Verdi': { person_id: 'P000008', nome: 'Giulia', cognome: 'Verdi', slug: 'verdi-giulia' },
          'Mario Rossi': { person_id: 'P000009', nome: 'Mario', cognome: 'Rossi', slug: 'rossi-mario' },
          'Anna Bianchi': { person_id: 'P000010', nome: 'Anna', cognome: 'Bianchi', slug: 'bianchi-anna' },
          'Luca Verdi': { person_id: 'P000011', nome: 'Luca', cognome: 'Verdi', slug: 'verdi-luca' },
          'Marco Gialli': { person_id: 'P000012', nome: 'Marco', cognome: 'Gialli', slug: 'gialli-marco' },
          'Sofia Rossi': { person_id: 'P000013', nome: 'Sofia', cognome: 'Rossi', slug: 'rossi-sofia' }
        }
        
        // Check hardcoded mapping first
        const hardcodedMatch = hardcodedMapping[nome]
        if (hardcodedMatch) {
          console.log(`PoliticoLink: Found hardcoded match: ${hardcodedMatch.nome} ${hardcodedMatch.cognome}`)
          setPersonData(hardcodedMatch)
          setLoading(false)
          return
        }
        
        // Try to load from registry
        console.log(`PoliticoLink: No hardcoded match, trying registry...`)
        
        const response = await fetch('/data/persons.jsonl')
        if (!response.ok) {
          console.warn(`PoliticoLink: Failed to fetch persons registry: ${response.status}`)
          setLoading(false)
          return
        }
        
        const personsText = await response.text()
        console.log(`PoliticoLink: Loaded ${personsText.split('\n').filter(line => line.trim()).length} persons`)
        
        const persons = personsText.trim().split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line)
            } catch (e) {
              console.warn(`PoliticoLink: Failed to parse line: ${line}`)
              return null
            }
          })
          .filter(Boolean)
        
        // Clean the input name (remove honorifics, extra spaces)
        const cleanNome = nome.toLowerCase()
          .replace(/^(on\.|onorevole|ministro|sottosegretario|presidente|pres\.)\s+/i, '')
          .replace(/\s+/g, ' ')
          .trim()
        
        console.log(`PoliticoLink: Cleaned name: "${cleanNome}"`)
        
        // Try to find person by exact name match
        let person = persons.find(p => {
          const fullName = `${p.nome} ${p.cognome}`.toLowerCase()
          const reverseName = `${p.cognome} ${p.nome}`.toLowerCase()
          
          return fullName === cleanNome || reverseName === cleanNome
        })
        
        // If no exact match, try partial matches
        if (!person) {
          person = persons.find(p => {
            const fullName = `${p.nome} ${p.cognome}`.toLowerCase()
            const reverseName = `${p.cognome} ${p.nome}`.toLowerCase()
            
            // Check if the cleaned name is contained in either format
            return fullName.includes(cleanNome) || reverseName.includes(cleanNome) ||
                   cleanNome.includes(p.nome.toLowerCase()) || cleanNome.includes(p.cognome.toLowerCase())
          })
        }
        
        if (person) {
          console.log(`PoliticoLink: Found person in registry: ${person.nome} ${person.cognome} (${person.slug})`)
        } else {
          console.log(`PoliticoLink: No person found for "${nome}"`)
        }
        
        setPersonData(person || null)
        setLoading(false)
      } catch (error) {
        console.error('PoliticoLink: Error loading persons registry:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        setLoading(false)
      }
    }

    if (nome) {
      findPersonByName()
    }
  }, [nome])

  // If loading, show plain text
  if (loading) {
    return <span className={className}>{nome}</span>
  }

  // If error or no person found, show plain text
  if (error || !personData) {
    return <span className={className}>{nome}</span>
  }

  // If person found, show clickable link
  return (
    <Link 
      href={`/politico/${personData.slug}`}
      className={`text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className}`}
      title={`Vai al profilo di ${personData.nome} ${personData.cognome}`}
    >
      {showIcon && <span className="mr-1">👤</span>}
      {nome}
    </Link>
  )
}
