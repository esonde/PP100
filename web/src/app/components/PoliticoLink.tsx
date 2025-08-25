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
        
        // Load persons registry
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
          console.log(`PoliticoLink: Found person: ${person.nome} ${person.cognome} (${person.slug})`)
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

  // If error or no person found, still make it clickable but to a generic slug
  if (error || !personData) {
    // Create a generic slug from the name for the "not found" page
    const genericSlug = nome.toLowerCase()
      .replace(/^(on\.|onorevole|ministro|sottosegretario|presidente|pres\.)\s+/i, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    // Use a special route for non-found politicians
    return (
      <Link 
        href={`/politico/not-found?name=${encodeURIComponent(nome)}`}
        className={`text-gray-600 hover:text-gray-800 hover:underline transition-colors ${className}`}
        title={`Cerca profilo di ${nome} (potrebbe non essere ancora mappato)`}
      >
        {showIcon && <span className="mr-1">🔍</span>}
        {nome}
      </Link>
    )
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
