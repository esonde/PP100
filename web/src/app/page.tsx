import Image from 'next/image'
import { ASSETS } from './config/assets'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
          PP100
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
          Monitoraggio in tempo reale della qualità del dibattito parlamentare italiano
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <a 
            href="/feed/" 
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 sm:py-1 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:min-w-[200px]"
          >
            <div className="flex items-center justify-center w-14 h-14">
              <Image 
                src={ASSETS.icons.feed} 
                alt="Feed Icon" 
                width={56} 
                height={56}
                className="w-14 h-14"
              />
            </div>
            <span>Vedi Feed</span>
          </a>
          <a 
            href="/metrics/" 
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-1 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2 w-full sm:min-w-[200px]"
          >
            <div className="flex items-center justify-center w-14 h-14">
              <Image 
                src={ASSETS.icons.dashboard} 
                alt="Metrics Icon" 
                width={48} 
                height={48}
                className="w-12 h-12"
              />
            </div>
            <span>Esplora Metriche</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Image 
                src={ASSETS.icons.parliament} 
                alt="Objective Icon" 
                width={48} 
                height={48}
                className="w-12 h-12"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Obiettivo</h2>
          </div>
          <p className="text-gray-600">
            PP100 nasce per <strong>capacitare i cittadini</strong> a comprendere meglio la qualità 
            del dibattito parlamentare. Analizziamo automaticamente gli interventi per rivelare 
            come si argomenta, cosa si promette e quanto è credibile, mantenendo sempre 
            la prova diretta con link ai resoconti originali.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Image 
                src={ASSETS.icons.monitoring} 
                alt="Monitoring Icon" 
                width={48} 
                height={48}
                className="w-12 h-12"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Cosa Monitoriamo</h2>
          </div>
          <ul className="text-gray-600 space-y-2">
            <li>• <strong>Fallacie logiche</strong> (ad hominem, strawman, slippery slope)</li>
            <li>• <strong>Claim numerici</strong> con verifica automatica vs dati ufficiali</li>
            <li>• <strong>Near-duplicate</strong> per rilevare coordinamento messaggi</li>
            <li>• <strong>Commitment tracking</strong> (promesse → fatti → risultati)</li>
            <li>• <strong>Stance analysis</strong> e coerenza discorso→voto</li>
          </ul>
        </div>
      </div>

      <div className="card">
                  <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Image 
                src={ASSETS.icons.dashboard} 
                alt="Metrics Icon" 
                width={48} 
                height={48}
                className="w-12 h-12"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Punteggio PP (Punti Politico)</h2>
          </div>
        <p className="text-gray-600 mb-4">
          Il sistema calcola un punteggio da 0 a 100 per ogni parlamentare basato su:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-center">
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
