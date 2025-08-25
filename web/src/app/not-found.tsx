export default function NotFound() {
  return (
    <div className="text-center py-8">
      <div className="text-gray-400 text-4xl mb-4">🔍</div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pagina non trovata</h2>
      <p className="text-gray-600 mb-4">La pagina che stai cercando non esiste</p>
      <a
        href="/"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Torna alla home
      </a>
    </div>
  )
}
