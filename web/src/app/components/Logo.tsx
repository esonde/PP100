import Image from 'next/image'
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
      {/* Logo - will use generated asset when available */}
      <div className={`${sizeClasses[size]} bg-white rounded-lg flex items-center justify-center shadow-md`}>
        {/* TODO: Uncomment when you have the generated logo */}
        {/* <Image 
          src={ASSETS.logo.primary} 
          alt="PP100 Logo" 
          width={64} 
          height={64}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to PNG if SVG fails
            const target = e.target as HTMLImageElement
            target.src = ASSETS.logo.fallback
          }}
        /> */}
        <span className={`${textSizes[size]} font-bold text-blue-800`}>PP</span>
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
