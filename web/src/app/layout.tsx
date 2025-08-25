import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Logo from './components/Logo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PP100 - Parlamento Live',
  description: 'Monitoraggio in tempo reale della qualità del dibattito parlamentare italiano',
  icons: {
    icon: '/images/favicon/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <header className="bg-blue-800 text-white shadow-lg">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <Logo size="lg" />
            {/* Navigation menu */}
            <nav className="mt-6">
              <ul className="flex flex-wrap gap-4 sm:gap-6 text-sm sm:text-base">
                <li><a href="/" className="hover:text-blue-200 transition-colors font-medium">🏠 Home</a></li>
                <li><a href="/feed/" className="hover:text-blue-200 transition-colors font-medium">📰 Feed</a></li>
                <li><a href="/metrics/" className="hover:text-blue-200 transition-colors font-medium">�� Metriche</a></li>
                <li><a href="/leaderboard/" className="hover:text-blue-200 transition-colors font-medium">🏆 Leaderboard</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
        <footer className="bg-gray-100 border-t mt-8 sm:mt-12">
          <div className="container mx-auto px-4 sm:py-6 text-center text-gray-600">
            <p>PP100 - Progetto open source per il monitoraggio parlamentare</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
