'use client'

import { useState, useEffect } from 'react'
import { ManifestData, getInterventionsInfo, formatDate } from '../utils/data'

export default function InterventiPage() {
  const [manifestData, setManifestData] = useState<ManifestData | null>(null)
  const [interventionsInfo, setInterventionsInfo] = useState<{
    count: number
    filename: string
    lastUpdate: string
    source: 'parquet' | 'json' | 'none'
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const manifestResponse = await fetch(`/data/manifest.json?ts=${Date.now()}`)
        if (!manifestResponse.ok) {
          throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`)
        }
        
        const manifest = await manifestResponse.json()
        setManifestData(manifest)
        
        const interventionsInfo = await getInterventionsInfo(manifest)
        setInterventionsInfo(interventionsInfo)
        
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento interventi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-600 text-xl mr-3">❌</div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Errore nel caricamento</h3>
              <p className="text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interventi Parlamentari</h1>
        <p className="text-gray-600">
          Monitoraggio in tempo reale degli interventi dalla Camera e dal Senato
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Stato Pipeline</h3>
            <p className="text-2xl font-bold text-blue-600">
              {interventionsInfo?.count === -1 ? 'File disponibile' : 
               interventionsInfo?.count === 0 ? 'Nessun intervento' : 
               `${interventionsInfo?.count} interventi`}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              File: {interventionsInfo?.filename || 'N/A'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Ultimo aggiornamento: {interventionsInfo?.lastUpdate || 'N/A'}
            </p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      {/* File Type Info */}
      {interventionsInfo?.source === 'parquet' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="text-blue-600 text-xl mr-3">💡</div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">File Parquet Rilevato</h4>
              <p className="text-blue-800 text-sm mb-3">
                Gli interventi sono disponibili nel file <code className="bg-blue-100 px-2 py-1 rounded">
                  {interventionsInfo.filename}
                </code> ma non possono essere visualizzati direttamente nel browser.
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Prossimo step:</strong> Implementare pipeline di conversione Parquet → JSON 
                per visualizzazione web (M2 - Style & Topics).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Status */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stato Pipeline M1</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Ingest (P0):</span>
            <span className="ml-2 text-green-600">✅ Attivo</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Frequenza:</span>
            <span className="ml-2 text-gray-600">Ogni 5 minuti</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Formato:</span>
            <span className="ml-2 text-gray-600">Parquet + spans</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Fonti:</span>
            <span className="ml-2 text-gray-600">Camera + Senato</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-yellow-600 text-xl mr-3">🚀</div>
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Prossimi Step</h4>
            <div className="space-y-2 text-sm text-yellow-800">
                             <p><strong>M2:</strong> Stile &amp; Topics → conversione Parquet → JSON per web</p>
              <p><strong>M3:</strong> fastText triage → argomentatività e check-worthiness</p>
              <p><strong>M4:</strong> Near-duplicate detection → badge &ldquo;Copiaincolla Radar&rdquo;</p>
              <p><strong>M5:</strong> LLM ragionatore → fallacie, claims, steelman</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Metrics */}
      <div className="mt-8 text-center">
        <a 
          href="/metrics" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          ← Torna alle Metriche
        </a>
      </div>
    </div>
  )
}
