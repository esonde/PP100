'use client'

import { useState, useEffect } from 'react'

interface InterventionsData {
  id: string
  source: string
  seduta: string
  ts_start: string
  oratore: string
  gruppo: string
  text: string
  spans_frasi: Array<{ start: number; end: number }>
  source_url: string
  fetch_etag: string | null
  fetch_last_modified: string | null
  ingested_at: string
}

interface ManifestData {
  version: string
  generated_at: string
  current: {
    interventions: string
  }
  status: {
    ingest: string
  }
  sources: {
    camera: string
    senato: string
  }
}

export default function MetricsPage() {
  const [manifestData, setManifestData] = useState<ManifestData | null>(null)
  const [interventionsCount, setInterventionsCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch manifest first
        const manifestResponse = await fetch('/data/manifest.json')
        if (!manifestResponse.ok) {
          throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`)
        }
        
        const manifest = await manifestResponse.json()
        setManifestData(manifest)
        
        // If interventions file exists, try to get count
        if (manifest.current?.interventions) {
          try {
            const interventionsResponse = await fetch(`/data/${manifest.current.interventions.split('/').pop()}`)
            if (interventionsResponse.ok) {
              // For Parquet files, we can't read directly in the browser
              // But we can check if the file exists and show that
              setInterventionsCount(-1) // -1 means file exists but count unknown
            }
          } catch (e) {
            // Interventions file not accessible, that's ok
            setInterventionsCount(0)
          }
        } else {
          setInterventionsCount(0)
        }
        
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const renderInterventionsCard = () => {
    if (interventionsCount === null) return null
    
    let statusText = 'Caricamento...'
    let statusColor = 'text-gray-500'
    
    if (interventionsCount === -1) {
      statusText = 'File disponibile'
      statusColor = 'text-green-600'
    } else if (interventionsCount === 0) {
      statusText = 'Nessun intervento'
      statusColor = 'text-yellow-600'
    } else {
      statusText = `${interventionsCount} interventi`
      statusColor = 'text-green-600'
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interventi Oggi</h3>
            <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            <p className="text-sm text-gray-600 mt-1">
              {manifestData?.current?.interventions ? 
                `File: ${manifestData.current.interventions.split('/').pop()}` : 
                'Nessun file disponibile'
              }
            </p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Ultimo aggiornamento: {manifestData?.generated_at ? 
            new Date(manifestData.generated_at).toLocaleString('it-IT') : 
            'Sconosciuto'
          }
        </div>
      </div>
    )
  }

  const renderSourceCard = (source: 'camera' | 'senato') => {
    const sourceInfo = manifestData?.sources?.[source]
    const isError = sourceInfo === 'error'
    const isNoData = sourceInfo === 'no_data'
    const isUnknown = !sourceInfo || sourceInfo === 'unknown'
    
    let statusText = 'Sconosciuto'
    let statusColor = 'text-gray-500'
    let icon = '❓'
    
    if (isError) {
      statusText = 'Errore'
      statusColor = 'text-red-600'
      icon = '❌'
    } else if (isNoData) {
      statusText = 'Nessun dato'
      statusColor = 'text-yellow-600'
      icon = '⚠️'
    } else if (!isUnknown) {
      statusText = 'OK'
      statusColor = 'text-green-600'
      icon = '✅'
    }
    
    const sourceName = source === 'camera' ? 'Camera dei Deputati' : 'Senato della Repubblica'
    const sourceShort = source === 'camera' ? 'Camera' : 'Senato'

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{sourceName}</h3>
            <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            <p className="text-sm text-gray-600 mt-1">
              {isUnknown ? 'Stato sconosciuto' : 
               isError ? 'Errore nel fetch' :
               isNoData ? 'Nessun intervento oggi' :
               'Dati disponibili'
              }
            </p>
            {!isUnknown && !isError && !isNoData && (
              <p className="text-xs text-gray-500 mt-2 break-all">
                {sourceInfo}
              </p>
            )}
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento metriche...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Errore nel caricamento</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500">Verifica che i file di dati siano presenti in public/data/</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Dashboard Metriche</h1>
        <p className="text-gray-600">
          Monitoraggio in tempo reale della qualità del dibattito parlamentare
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Interventions Card */}
        {renderInterventionsCard()}
        
        {/* Camera Source Card */}
        {renderSourceCard('camera')}
        
        {/* Senato Source Card */}
        {renderSourceCard('senato')}
        
        {/* Ingest Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stato Ingest</h3>
              <p className={`text-2xl font-bold ${
                manifestData?.status?.ingest === 'ok' ? 'text-green-600' : 
                manifestData?.status?.ingest === 'error' ? 'text-red-600' :
                manifestData?.status?.ingest === 'no_data' ? 'text-yellow-600' :
                'text-gray-500'
              }`}>
                {manifestData?.status?.ingest === 'ok' ? 'OK' : 
                 manifestData?.status?.ingest === 'error' ? 'Errore' :
                 manifestData?.status?.ingest === 'no_data' ? 'Nessun dato' :
                 manifestData?.status?.ingest || 'Sconosciuto'
                }
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Pipeline di ingest
              </p>
            </div>
            <div className="text-4xl">
              {manifestData?.status?.ingest === 'ok' ? '✅' : 
               manifestData?.status?.ingest === 'error' ? '❌' :
               manifestData?.status?.ingest === 'no_data' ? '⚠️' :
               '❓'
              }
            </div>
          </div>
        </div>

        {/* Schema Version Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Versione Schema</h3>
              <p className="text-2xl font-bold text-purple-600">
                {manifestData?.version || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Schema dati
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        {/* Last Update Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ultimo Aggiornamento</h3>
              <p className="text-lg font-bold text-orange-600">
                {manifestData?.generated_at ? 
                  new Date(manifestData.generated_at).toLocaleString('it-IT') : 
                  'N/A'
                }
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Timestamp UTC
              </p>
            </div>
            <div className="text-4xl">🕒</div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Architettura:</span>
            <span className="ml-2 text-gray-600">GitHub-only (Pages + Actions)</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Pipeline:</span>
            <span className="ml-2 text-gray-600">Ingest ogni 5 minuti</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Formato Dati:</span>
            <span className="ml-2 text-gray-600">Parquet + JSON</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Validazione:</span>
            <span className="ml-2 text-gray-600">Schema JSON + CI/CD</span>
          </div>
        </div>
      </div>

      {/* Note about dynamic data */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
        <div className="flex items-start">
          <div className="text-blue-600 text-xl mr-3">ℹ️</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Dati Dinamici</h4>
            <p className="text-blue-800 text-sm">
              Questa pagina mostra dati in tempo reale dalla pipeline di ingest. I file vengono aggiornati 
              automaticamente ogni 5 minuti tramite GitHub Actions. Per i dettagli completi degli interventi, 
              consulta i file Parquet in <code className="bg-blue-100 px-1 rounded">public/data/</code>.
            </p>
            <p className="text-blue-800 text-sm mt-2">
              <strong>Prossimo aggiornamento:</strong> La pipeline gira ogni 5 minuti tramite cron.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
