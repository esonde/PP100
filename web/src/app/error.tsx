'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="text-center py-8">
      <div className="text-red-600 text-4xl mb-4">⚠️</div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Errore</h2>
      <p className="text-gray-600 mb-4">Si è verificato un errore imprevisto</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Riprova
      </button>
    </div>
  )
}
