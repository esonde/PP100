'use client'

import { useState, useEffect } from 'react'

interface Score {
  oratore: string
  gruppo: string
  pp_score: number
  last_updated: string
  confidence_interval?: {
    lower: number
    upper: number
  }
  components: {
    Q: number
    K: number
    V: number
    I: number
    R: number
  }
  metrics: {
    interventions_count: number
    fallacies_detected: number
    duplicates_count: number
    stance_consistency: number
  }
}

interface ScoresData {
  version: string
  generated_at: string
  window_days: number
  scores: Score[]
}

export default function MetricsPage() {
  const [scoresData, setScoresData] = useState<ScoresData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'pp_score' | 'oratore' | 'gruppo'>('pp_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await fetch('/data/scores-rolling-20250127.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ScoresData = await response.json()
        setScoresData(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
        setLoading(false)
      }
    }

    fetchScores()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const sortedScores = scoresData?.scores ? [...scoresData.scores].sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]
    
    if (sortBy === 'pp_score') {
      aValue = a.pp_score
      bValue = b.pp_score
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  }) : []

  const handleSort = (field: 'pp_score' | 'oratore' | 'gruppo') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento metriche...</p>
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

  if (!scoresData) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📊</div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Nessun dato</h2>
        <p className="text-gray-600 px-2">Non ci sono metriche da mostrare al momento.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">📊 Metriche PP (Punti Politico)</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Punteggi PP (Punti Politico) per i parlamentari
        </p>
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
          Finestra rolling: {scoresData.window_days} giorni • 
          Ultimo aggiornamento: {formatDate(scoresData.generated_at)} • 
          {scoresData.scores.length} parlamentari monitorati
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {scoresData.scores.length}
          </div>
          <div className="text-sm text-gray-600">Parlamentari</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {(scoresData.scores.reduce((sum, s) => sum + s.pp_score, 0) / scoresData.scores.length).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">PP (Punti Politico) Medio</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {scoresData.scores.filter(s => s.pp_score >= 80).length}
          </div>
          <div className="text-sm text-gray-600">Eccellenti (≥80)</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {scoresData.scores.filter(s => s.pp_score < 60).length}
          </div>
          <div className="text-sm text-gray-600">Critici (&lt;60)</div>
        </div>
      </div>

      {/* Scores Table */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Classifica PP (Punti Politico)</h2>
          <div className="flex space-x-4 text-sm">
            <button
              onClick={() => handleSort('pp_score')}
              className={`px-3 py-1 rounded ${sortBy === 'pp_score' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              PP Score {sortBy === 'pp_score' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('oratore')}
              className={`px-3 py-1 rounded ${sortBy === 'oratore' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Nome {sortBy === 'oratore' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('gruppo')}
              className={`px-3 py-1 rounded ${sortBy === 'gruppo' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Gruppo {sortBy === 'gruppo' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Pos</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Parlamentare</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Gruppo</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">PP Score</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Componenti</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Metriche</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((score, index) => (
                <tr key={score.oratore} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-500">#{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{score.oratore}</div>
                    <div className="text-xs text-gray-500">
                      Aggiornato: {formatDate(score.last_updated)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{score.gruppo}</td>
                  <td className="py-3 px-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(score.pp_score)}`}>
                      {score.pp_score.toFixed(1)}
                    </div>
                    {score.confidence_interval && (
                      <div className="text-xs text-gray-500">
                        {score.confidence_interval.lower.toFixed(1)} - {score.confidence_interval.upper.toFixed(1)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      <div className="text-center">
                        <div className={`font-bold ${getScoreColor(score.components.Q)}`}>Q</div>
                        <div className="text-gray-600">{score.components.Q}</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${getScoreColor(score.components.K)}`}>K</div>
                        <div className="text-gray-600">{score.components.K}</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${getScoreColor(score.components.V)}`}>V</div>
                        <div className="text-gray-600">{score.components.V}</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${getScoreColor(score.components.I)}`}>I</div>
                        <div className="text-gray-600">{score.components.I}</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold ${getScoreColor(score.components.R)}`}>R</div>
                        <div className="text-gray-600">{score.components.R}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Interventi: {score.metrics.interventions_count}</div>
                      <div>Fallacie: {score.metrics.fallacies_detected}</div>
                      <div>Duplicati: {score.metrics.duplicates_count}</div>
                      <div>Coerenza: {(score.metrics.stance_consistency * 100).toFixed(0)}%</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">📋 Legenda Componenti PP (Punti Politico)</h3>
        <div className="grid md:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="font-bold text-blue-600">Q - Quality:</span>
            <div className="text-gray-600">Argomentatività e chiarezza</div>
          </div>
          <div>
            <span className="font-bold text-green-600">K - Knowledge:</span>
            <div className="text-gray-600">Preparazione e citazioni corrette</div>
          </div>
          <div>
            <span className="font-bold text-yellow-600">V - Veracity:</span>
            <div className="text-gray-600">Accuratezza e evitare fallacie</div>
          </div>
          <div>
            <span className="font-bold text-purple-600">I - Integrity:</span>
            <div className="text-gray-600">Coerenza e evitare spin</div>
          </div>
          <div>
            <span className="font-bold text-red-600">R - Respect:</span>
            <div className="text-gray-600">Civiltà e evitare attacchi personali</div>
          </div>
        </div>
      </div>
    </div>
  )
}
