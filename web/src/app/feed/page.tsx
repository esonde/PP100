'use client'

import { useState, useEffect } from 'react'

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

export default function FeedPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento feed...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Errore nel caricamento</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500">Verifica che i file di dati siano presenti in public/data/</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📰 Feed Eventi</h1>
        <p className="text-gray-600">
          Eventi rilevati automaticamente nel dibattito parlamentare
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {cards.length} eventi • Ultimo aggiornamento: {formatDate(cards[0]?.created_at || '')}
        </div>
      </div>

      <div className="space-y-6">
        {cards.map((card) => (
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
              <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
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

      {cards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nessun evento</h2>
          <p className="text-gray-600">Non ci sono eventi da mostrare al momento.</p>
        </div>
      )}
    </div>
  )
}
