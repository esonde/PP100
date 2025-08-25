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

  useEffect(() => {
    const findPersonByName = async () => {
      try {
        // Load persons registry
        const response = await fetch('/data/persons.jsonl')
        if (!response.ok) {
          setLoading(false)
          return
        }
        
        const personsText = await response.text()
        const persons = personsText.trim().split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line))
        
        // Clean the input name (remove honorifics, extra spaces)
        const cleanNome = nome.toLowerCase()
          .replace(/^(on\.|onorevole|ministro|sottosegretario|presidente|pres\.)\s+/i, '')
          .replace(/\s+/g, ' ')
          .trim()
        
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
        
        setPersonData(person || null)
        setLoading(false)
      } catch (error) {
        console.warn('Could not load persons registry for PoliticoLink:', error)
        setLoading(false)
      }
    }

    if (nome) {
      findPersonByName()
    }
  }, [nome])

  // If loading or no person found, show plain text
  if (loading || !personData) {
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
