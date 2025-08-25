// import Image from 'next/image'
import { ASSETS } from '../config/assets'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Logo - using regular img tag temporarily */}
      <div className={`${sizeClasses[size]} bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden border-2 border-blue-200`}>
        <img 
          src={ASSETS.logo.primary} 
          alt="PP100 Logo" 
          className="w-full h-full object-contain p-1"
        />
      </div>
      
      {showText && (
        <div>
          <h1 className={`${size === 'lg' ? 'text-4xl' : 'text-3xl'} font-bold text-white`}>
            PP100
          </h1>
          <p className="text-blue-100 text-sm">Parlamento Live - Qualità del Dibattito</p>
        </div>
      )}
    </div>
  )
}
