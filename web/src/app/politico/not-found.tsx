export default function PoliticoNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Politico Non Trovato
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Il parlamentare che stai cercando non è presente nel nostro registry o non è stato ancora mappato.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🕵️ Cosa Significa?
            </h3>
            <div className="text-left space-y-3 text-gray-700">
              <p>• <strong>Il politico non è ancora nel nostro database</strong> - Potrebbe essere un nuovo parlamentare</p>
              <p>• <strong>Il nome non è stato mappato correttamente</strong> - Potrebbe esserci una variante del nome</p>
              <p>• <strong>Il politico non è più in carica</strong> - Potrebbe essere un ex parlamentare</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🔄 Aggiornamenti Automatici
            </h3>
            <p className="text-blue-800">
              Il nostro sistema si aggiorna automaticamente ogni 5 minuti. Se il politico dovrebbe essere presente, 
              riprova tra qualche minuto o contattaci per segnalare il problema.
            </p>
          </div>
          
          <div className="space-x-4">
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              🏠 Torna alla Home
            </a>
            <a
              href="/feed"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              📰 Vai al Feed
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
