import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PP100 - Parlamento Live',
  description: 'Monitoraggio in tempo reale della qualità del dibattito parlamentare italiano',
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
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">PP100</h1>
            <p className="text-blue-100">Parlamento Live - Qualità del Dibattito</p>
            <nav className="mt-4">
              <ul className="flex space-x-6">
                <li><a href="/PP100/" className="hover:text-blue-200 transition-colors">Home</a></li>
                <li><a href="/PP100/feed/" className="hover:text-blue-200 transition-colors">Feed</a></li>
                <li><a href="/PP100/metrics/" className="hover:text-blue-200 transition-colors">Metriche</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-100 border-t mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-gray-600">
            <p>PP100 - Progetto open source per il monitoraggio parlamentare</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
