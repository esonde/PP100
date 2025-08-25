import Image from 'next/image'
import { ASSETS } from './config/assets'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          PP100
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Monitoraggio in tempo reale della qualità del dibattito parlamentare italiano
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="/PP100/feed/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Image 
              src={ASSETS.icons.feed} 
              alt="Feed Icon" 
              width={24} 
              height={24}
              className="w-6 h-6"
            />
            <span>Vedi Feed</span>
          </a>
          <a 
            href="/PP100/metrics/" 
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Image 
              src={ASSETS.icons.dashboard} 
              alt="Metrics Icon" 
              width={24} 
              height={24}
              className="w-6 h-6"
            />
            <span>Esplora Metriche</span>
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image 
                src={ASSETS.icons.parliament} 
                alt="Objective Icon" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Obiettivo</h2>
          </div>
          <p className="text-gray-600">
            PP100 analizza automaticamente gli interventi parlamentari per rilevare 
            fallacie logiche, spin politici, duplicazioni e misurare la qualità 
            del dibattito democratico.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Image 
                src={ASSETS.icons.monitoring} 
                alt="Monitoring Icon" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Cosa Monitoriamo</h2>
          </div>
          <ul className="text-gray-600 space-y-2">
            <li>• Fallacie logiche e argomentative</li>
            <li>• Spin politici e manipolazione</li>
            <li>• Duplicazioni e coordinamento messaggi</li>
            <li>• Coerenza delle posizioni</li>
            <li>• Qualità generale del dibattito</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Image 
              src={ASSETS.icons.dashboard} 
              alt="Metrics Icon" 
              width={24} 
              height={24}
              className="w-6 h-6"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Punteggio PP (Punti Politico)</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Il sistema calcola un punteggio da 0 a 100 per ogni parlamentare basato su:
        </p>
        <div className="grid md:grid-cols-5 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">Q</div>
            <div className="text-sm text-gray-600">Quality</div>
            <div className="text-xs text-gray-500">Argomentatività</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">K</div>
            <div className="text-sm text-gray-600">Knowledge</div>
            <div className="text-xs text-gray-500">Preparazione</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">V</div>
            <div className="text-sm text-gray-600">Veracity</div>
            <div className="text-xs text-gray-500">Accuratezza</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">I</div>
            <div className="text-sm text-gray-600">Integrity</div>
            <div className="text-xs text-gray-500">Coerenza</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">R</div>
            <div className="text-sm text-gray-600">Respect</div>
            <div className="text-xs text-gray-500">Civiltà</div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-gray-500">
        <p>🚧 Progetto in fase di sviluppo - M0 Walking Skeleton</p>
        <p className="text-sm">Dati attualmente mock per dimostrazione</p>
      </div>
    </div>
  )
}
