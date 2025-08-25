'use client'

import { useState, useEffect } from 'react'
import PoliticoLink from '../components/PoliticoLink'
import { 
  ManifestData, 
  calculateNextUpdate, 
  formatDate, 
  getRegistryStats, 
  getInterventionsInfo 
} from '../utils/data'

export default function MetricsPage() {
  const [manifestData, setManifestData] = useState<ManifestData | null>(null)
  const [interventionsInfo, setInterventionsInfo] = useState<{
    count: number
    filename: string
    lastUpdate: string
    source: 'parquet' | 'json' | 'none'
    downloadUrl: string
  } | null>(null)
  const [registryStats, setRegistryStats] = useState<{
    personsCount: number
    partiesCount: number
    inboxCount: number
    persons: any[]
    parties: any[]
    downloadUrls: {
      persons: string
      parties: string
      inbox: string
    }
  } | null>(null)
  const [nextUpdate, setNextUpdate] = useState<{
    nextUpdate: string
    timeUntil: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch manifest first
        const manifestResponse = await fetch(`/data/manifest.json?ts=${Date.now()}`)
        if (!manifestResponse.ok) {
          throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`)
        }
        
        const manifest = await manifestResponse.json()
        setManifestData(manifest)
        
        // Get interventions info using utility
        const interventionsInfo = await getInterventionsInfo(manifest)
        setInterventionsInfo(interventionsInfo)
        
        // Get registry stats using utility
        const registryStats = await getRegistryStats()
        setRegistryStats(registryStats)
        
        // Calculate next update time
        if (manifest.generated_at) {
          const nextUpdateInfo = calculateNextUpdate(manifest.generated_at)
          setNextUpdate(nextUpdateInfo)
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
    if (!interventionsInfo) return null
    
    let statusText = 'Caricamento...'
    let statusColor = 'text-gray-500'
    let statusIcon = '📊'
    
    if (interventionsInfo.count === -1) {
      statusText = 'File disponibile (Parquet)'
      statusColor = 'text-green-600'
      statusIcon = '📊'
    } else if (interventionsInfo.count === 0) {
      statusText = 'Nessun intervento'
      statusColor = 'text-yellow-600'
      statusIcon = '⚠️'
    } else {
      statusText = `${interventionsInfo.count} interventi`
      statusColor = 'text-green-600'
      statusIcon = '✅'
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interventi Oggi</h3>
            <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            <p className="text-sm text-gray-600 mt-1">
              File: {interventionsInfo.downloadUrl ? (
                <a 
                  href={interventionsInfo.downloadUrl} 
                  download={interventionsInfo.filename}
                  className="text-blue-600 hover:text-blue-800 underline hover:no-underline"
                  title={`Scarica ${interventionsInfo.filename}`}
                >
                  {interventionsInfo.filename}
                </a>
              ) : (
                interventionsInfo.filename
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Ultimo aggiornamento: {interventionsInfo.lastUpdate}
            </p>
          </div>
          <div className="text-4xl">{statusIcon}</div>
        </div>
        {interventionsInfo.source === 'parquet' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 File Parquet: i dati sono disponibili ma non visualizzabili nel browser
          </div>
        )}
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
    } else if (sourceInfo && sourceInfo !== 'unknown') {
      statusText = 'Attivo'
      statusColor = 'text-green-600'
      icon = '✅'
    }
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {source === 'camera' ? 'Camera dei Deputati' : 'Senato della Repubblica'}
            </h3>
            <p className={`text-2xl font-bold ${statusColor}`}>{statusText}</p>
            <p className="text-sm text-gray-600 mt-1">
              {source === 'camera' ? 'Assemblea' : 'Aula'}
            </p>
          </div>
          <div className="text-4xl">{icon}</div>
        </div>
        {sourceInfo && sourceInfo !== 'unknown' && sourceInfo !== 'error' && sourceInfo !== 'no_data' && (
          <div className="mt-4 text-xs text-gray-500 break-all">
            <a href={sourceInfo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {sourceInfo}
            </a>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento metriche...</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Metriche Sistema</h1>
        <p className="text-gray-600">
          Monitoraggio in tempo reale della pipeline di ingest e dello stato del registry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {renderInterventionsCard()}
        {renderSourceCard('camera')}
        {renderSourceCard('senato')}

        {/* Registry Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Registry Identità</h3>
              {registryStats ? (
                <>
                  <p className="text-2xl font-bold text-indigo-600">
                    {registryStats.personsCount} persone
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {registryStats.partiesCount} partiti • {registryStats.inboxCount} in inbox
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="text-xs text-gray-500">
                      <a 
                        href={registryStats.downloadUrls.persons} 
                        download="persons.jsonl"
                        className="text-blue-600 hover:text-blue-800 underline hover:no-underline mr-3"
                        title="Scarica persone"
                      >
                        📥 persons.jsonl
                      </a>
                      <a 
                        href={registryStats.downloadUrls.parties} 
                        download="party_registry.jsonl"
                        className="text-blue-600 hover:text-blue-800 underline hover:no-underline mr-3"
                        title="Scarica partiti"
                      >
                        📥 party_registry.jsonl
                      </a>
                      <a 
                        href={registryStats.downloadUrls.inbox} 
                        download="identities_inbox.jsonl"
                        className="text-blue-600 hover:text-blue-800 underline hover:no-underline"
                        title="Scarica inbox"
                      >
                        📥 identities_inbox.jsonl
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-400">
                    Caricamento...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Contando persone e partiti...
                  </p>
                </>
              )}
            </div>
            <div className="text-4xl">👥</div>
          </div>
          {!registryStats && (
            <div className="mt-4 text-xs text-gray-500">
              Il registry viene aggiornato automaticamente ogni 5 minuti
            </div>
          )}
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
              <strong>Prossimo aggiornamento:</strong> {nextUpdate ? 
                `${nextUpdate.nextUpdate} (tra ${nextUpdate.timeUntil})` : 
                'Calcolo in corso...'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
