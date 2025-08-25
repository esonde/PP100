'use client'

import { useState, useEffect } from 'react'
import { ManifestData, getInterventionsInfo, formatDate, readParquetData } from '../utils/data'

export default function InterventiPage() {
  const [manifestData, setManifestData] = useState<ManifestData | null>(null)
  const [interventionsInfo, setInterventionsInfo] = useState<{
    count: number
    filename: string
    lastUpdate: string
    source: 'parquet' | 'json' | 'none'
    downloadUrl: string
  } | null>(null)
  const [interventionsData, setInterventionsData] = useState<any[]>([])
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
                
                // Se abbiamo un file Parquet, carica i dati
                if (interventionsInfo?.source === 'parquet' && interventionsInfo.downloadUrl) {
                  try {
                    const data = await readParquetData(interventionsInfo.downloadUrl, 20) // Primi 20 interventi
                    setInterventionsData(data)
                  } catch (err) {
                    console.warn('Failed to load Parquet data:', err)
                    setInterventionsData([])
                  }
                }
                
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interventi Live</h1>
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
              File: {interventionsInfo?.downloadUrl ? (
                <a 
                  href={interventionsInfo.downloadUrl} 
                  download={interventionsInfo.filename}
                  className="text-blue-600 hover:text-blue-800 underline hover:no-underline font-medium"
                  title={`Scarica ${interventionsInfo.filename}`}
                >
                  📥 {interventionsInfo.filename}
                </a>
              ) : (
                interventionsInfo?.filename || 'N/A'
              )}
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
                Gli interventi sono disponibili nel file{' '}
                {interventionsInfo.downloadUrl ? (
                  <a 
                    href={interventionsInfo.downloadUrl} 
                    download={interventionsInfo.filename}
                    className="text-blue-700 hover:text-blue-900 underline hover:no-underline font-medium"
                    title={`Scarica ${interventionsInfo.filename}`}
                  >
                    📥 {interventionsInfo.filename}
                  </a>
                ) : (
                  <code className="bg-blue-100 px-2 py-1 rounded">
                    {interventionsInfo.filename}
                  </code>
                )}{' '}
                e ora sono visualizzabili direttamente nella pagina!
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Funzionalità:</strong> Lettura diretta file Parquet nel browser tramite WebAssembly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interventi Data */}
      {interventionsData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Ultimi {interventionsData.length} Interventi
            </h3>
            <span className="text-sm text-gray-500">
              Dati letti direttamente dal file Parquet
            </span>
          </div>
          
          <div className="space-y-4">
            {interventionsData.map((intervention, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {intervention.oratore || 'Oratore sconosciuto'}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {intervention.gruppo || 'Gruppo N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {intervention.ts_start ? formatDate(intervention.ts_start) : 'Data N/A'}
                  </div>
                </div>
                
                <div className="mb-2">
                  <span className="text-xs text-gray-600">
                    Fonte: {intervention.source || 'N/A'} • Seduta: {intervention.seduta || 'N/A'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-800 leading-relaxed">
                  {intervention.text ? (
                    intervention.text.length > 200 ? (
                      <>
                        {intervention.text.substring(0, 200)}...
                        <span className="text-blue-600 text-xs ml-2">
                          ({intervention.text.length} caratteri)
                        </span>
                      </>
                    ) : (
                      intervention.text
                    )
                  ) : (
                    <span className="text-gray-400 italic">Testo non disponibile</span>
                  )}
                </div>
                
                {intervention.spans_frasi && intervention.spans_frasi.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">Spans frasi:</span> {intervention.spans_frasi.length} segmenti
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Mostrando i primi {interventionsData.length} interventi su {interventionsInfo?.count || '?'} totali
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per scaricare tutti i dati, clicca sul nome del file sopra
            </p>
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

      {/* Feed vs Interventi Live */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="text-green-600 text-xl mr-3">📋</div>
          <div>
            <h4 className="font-medium text-green-900 mb-2">Feed vs Interventi Live</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <h5 className="font-semibold mb-2">📊 Interventi Live (M1)</h5>
                <ul className="space-y-1">
                  <li>• Stato operativo pipeline</li>
                  <li>• File disponibili per download</li>
                  <li>• Metriche tecniche ingest</li>
                  <li>• Status Camera/Senato</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">📰 Feed (M2+)</h5>
                <ul className="space-y-1">
                  <li>• Interventi rielaborati semanticamente</li>
                  <li>• Ranking qualità argomentativa</li>
                  <li>• Badge e indicatori</li>
                  <li>• Organizzazione per temi</li>
                </ul>
              </div>
            </div>
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
