'use client'

import { useState, useEffect, useMemo } from 'react'
import Select from 'react-select'

interface Card {
  id: string
  type: 'fallacy' | 'spin' | 'duplicate' | 'stance' | 'metric'
  title: string
  description: string
  confidence: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_url: string
  created_at: string
  metadata: {
    oratore?: string
    gruppo?: string
    seduta?: string
    spans?: Array<{ start: number; end: number; text: string }>
    cluster_id?: string
    cluster_size?: number
  }
}

interface SelectOption {
  value: string
  label: string
}

export default function FeedPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtri
  const [filters, setFilters] = useState({
    gruppo: '',
    oratore: '',
    type: '',
    severity: ''
  })

  useEffect(() => {
    const fetchCards = async () => {
      try {
        // In produzione, questo dovrebbe leggere dal manifest per trovare il file corrente
        const response = await fetch('/data/cards-20250127.jsonl')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const text = await response.text()
        const lines = text.trim().split('\n')
        const parsedCards = lines.map(line => JSON.parse(line))
        
        setCards(parsedCards)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
        setLoading(false)
      }
    }

    fetchCards()
  }, [])

  // Estrai valori unici per i filtri
  const uniqueValues = useMemo(() => {
    const gruppi = Array.from(new Set(cards.map(card => card.metadata.gruppo).filter(Boolean)))
    const oratori = Array.from(new Set(cards.map(card => card.metadata.oratore).filter(Boolean)))
    const types = Array.from(new Set(cards.map(card => card.type)))
    const severities = Array.from(new Set(cards.map(card => card.severity)))
    
    return { gruppi, oratori, types, severities }
  }, [cards])

  // Converti in opzioni per react-select
  const selectOptions = useMemo(() => ({
    gruppi: [{ value: '', label: 'Tutti i gruppi' }, ...uniqueValues.gruppi.map(gruppo => ({ value: gruppo, label: gruppo }))],
    oratori: [{ value: '', label: 'Tutti i parlamentari' }, ...uniqueValues.oratori.map(oratore => ({ value: oratore, label: oratore }))],
    types: [{ value: '', label: 'Tutti i tipi' }, ...uniqueValues.types.map(type => ({ 
      value: type, 
      label: type === 'fallacy' ? 'Fallacia' :
             type === 'spin' ? 'Spin' :
             type === 'duplicate' ? 'Duplicato' :
             type === 'stance' ? 'Stance' :
             type === 'metric' ? 'Metrica' : type
    }))],
    severities: [
      { value: '', label: 'Tutte le gravità' },
      { value: 'low', label: '🟢 Bassa' },
      { value: 'medium', label: '🟡 Media' },
      { value: 'high', label: '🟠 Alta' },
      { value: 'critical', label: '🔴 Critica' }
    ].filter(option => option.value === '' || uniqueValues.severities.includes(option.value as any))
  }), [uniqueValues])

  // Applica filtri
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (filters.gruppo && card.metadata.gruppo !== filters.gruppo) return false
      if (filters.oratore && card.metadata.oratore !== filters.oratore) return false
      if (filters.type && card.type !== filters.type) return false
      if (filters.severity && card.severity !== filters.severity) return false
      return true
    })
  }, [cards, filters])

  const clearFilters = () => {
    setFilters({
      gruppo: '',
      oratore: '',
      type: '',
      severity: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '')

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'fallacy': return 'badge-fallacy'
      case 'spin': return 'badge-spin'
      case 'duplicate': return 'badge-duplicate'
      case 'stance': return 'badge-stance'
      case 'metric': return 'badge-metric'
      default: return 'badge'
    }
  }

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'low': return 'severity-low'
      case 'medium': return 'severity-medium'
      case 'high': return 'severity-high'
      case 'critical': return 'severity-critical'
      default: return ''
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento feed...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="text-red-600 text-4xl sm:text-6xl mb-4">⚠️</div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Errore nel caricamento</h2>
        <p className="text-gray-600 mb-4 px-2">{error}</p>
        <p className="text-sm text-gray-500 px-2">Verifica che i file di dati siano presenti in public/data/</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">📰 Feed Eventi</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Eventi rilevati automaticamente nel dibattito parlamentare
        </p>
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
          Mostrando {filteredCards.length} di {cards.length} eventi • Ultimo aggiornamento: {formatDate(cards[0]?.created_at || '')}
        </div>
      </div>

      {/* Filtri */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h3 className="text-lg font-medium text-gray-900">🔍 Filtri</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              ❌ Cancella tutti
            </button>
          )}
        </div>
        

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro per Gruppo/Partito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏛️ Gruppo/Partito</label>
                         <Select
               options={selectOptions.gruppi}
               value={selectOptions.gruppi.find(option => option.value === filters.gruppo)}
               onChange={(selectedOption) => setFilters(prev => ({ ...prev, gruppo: selectedOption?.value || '' }))}
               placeholder="Gruppo"
               className="w-full"
             />
          </div>

          {/* Filtro per Parlamentare */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">👤 Parlamentare</label>
                         <Select
               options={selectOptions.oratori}
               value={selectOptions.oratori.find(option => option.value === filters.oratore)}
               onChange={(selectedOption) => setFilters(prev => ({ ...prev, oratore: selectedOption?.value || '' }))}
               placeholder="Parlamentare"
               className="w-full"
             />
          </div>

          {/* Filtro per Tipo di Fallacia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Tipo Evento</label>
                         <Select
               options={selectOptions.types}
               value={selectOptions.types.find(option => option.value === filters.type)}
               onChange={(selectedOption) => setFilters(prev => ({ ...prev, type: selectedOption?.value || '' }))}
               placeholder="Tipo"
               className="w-full"
             />
          </div>

          {/* Filtro per Gravità */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">⚠️ Gravità</label>
                         <Select
               options={selectOptions.severities}
               value={selectOptions.severities.find(option => option.value === filters.severity)}
               onChange={(selectedOption) => setFilters(prev => ({ ...prev, severity: selectedOption?.value || '' }))}
               placeholder="Gravità"
               className="w-full"
             />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredCards.map((card) => (
          <div key={card.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`badge ${getBadgeClass(card.type)}`}>
                  {card.type.toUpperCase()}
                </span>
                <span className={`text-sm font-medium ${getSeverityClass(card.severity)}`}>
                  {card.severity.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {formatDate(card.created_at)}
                </div>
                <div className="text-xs text-gray-400">
                  Confidenza: {(card.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {card.title}
            </h3>

            <p className="text-gray-600 mb-4">
              {card.description}
            </p>

            {card.metadata.oratore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Oratore:</span>
                  <span className="ml-2 text-gray-600">{card.metadata.oratore}</span>
                </div>
                {card.metadata.gruppo && (
                  <div>
                    <span className="font-medium text-gray-700">Gruppo:</span>
                    <span className="ml-2 text-gray-600">{card.metadata.gruppo}</span>
                  </div>
                )}
                {card.metadata.seduta && (
                  <div>
                    <span className="font-medium text-gray-700">Seduta:</span>
                    <span className="ml-2 text-gray-600">{card.metadata.seduta}</span>
                  </div>
                )}
              </div>
            )}

            {card.metadata.cluster_size && card.metadata.cluster_size > 1 && (
              <div className="mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🔗 Cluster di {card.metadata.cluster_size} oratori
                </span>
              </div>
            )}

            {card.metadata.spans && card.metadata.spans.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Testo evidenziato:</div>
                <div className="text-sm text-gray-600 font-mono">
                  {card.metadata.spans.map((span, index) => (
                    <span key={index} className="bg-yellow-200 px-1 rounded">
                      {span.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <a
                href={card.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                🔗 Vedi fonte
              </a>
              <div className="text-xs text-gray-400">
                ID: {card.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {hasActiveFilters ? 'Nessun evento trovato' : 'Nessun evento'}
          </h2>
          <p className="text-gray-600">
            {hasActiveFilters 
              ? 'Prova a modificare i filtri applicati per vedere più risultati.' 
              : 'Non ci sono eventi da mostrare al momento.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
