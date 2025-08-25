import PoliticoLink from '../components/PoliticoLink'

export default function TestPoliticoLinkPage() {
  const testNames = [
    'Elly Schlein',
    'On. Elly Schlein', 
    'Onorevole Elly Schlein',
    'Giorgia Meloni',
    'Ministro Giorgia Meloni',
    'Matteo Salvini',
    'Sottosegretario Matteo Salvini',
    'Nome Inesistente',
    'On. Mario Rossi'
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        🧪 Test Componente PoliticoLink
      </h1>
      
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">ℹ️ Come Funziona</h2>
        <p className="text-blue-800 mb-2">
          Questo componente rende cliccabili i nomi dei politici che esistono nel registry.
        </p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <strong>Nomi blu e sottolineati</strong> = Politico trovato nel registry (cliccabile)</li>
          <li>• <strong>Nomi neri</strong> = Politico non trovato (testo normale)</li>
          <li>• <strong>Rimozione onorifici</strong> = &quot;On. Elly Schlein&quot; → &quot;Elly Schlein&quot;</li>
          <li>• <strong>Matching intelligente</strong> = Trova corrispondenze anche con variazioni</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Test Nomi</h2>
        
        {testNames.map((name, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 w-32">Input:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{name}</code>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500 w-32">Risultato:</span>
              <div className="text-lg">
                <PoliticoLink nome={name} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Funzionalità Implementate</h3>
        <ul className="text-green-800 text-sm space-y-1">
          <li>• <strong>Feed</strong> (/feed) - Nomi oratori cliccabili</li>
          <li>• <strong>Leaderboard</strong> (/leaderboard) - Nomi politici cliccabili</li>
          <li>• <strong>Matching intelligente</strong> - Gestisce onorifici e variazioni</li>
          <li>• <strong>Fallback graceful</strong> - Nomi non trovati rimangono testo normale</li>
          <li>• <strong>Performance</strong> - Carica registry una volta per sessione</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <a 
          href="/feed" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🧪 Testa nel Feed
        </a>
        <a 
          href="/leaderboard" 
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors ml-4"
        >
          🏆 Testa nel Leaderboard
        </a>
      </div>
    </div>
  )
}
