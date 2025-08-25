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
      {/* Logo - using generated asset */}
      <div className={`${sizeClasses[size]} bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden`}>
        <Image 
          src={ASSETS.logo.primary} 
          alt="PP100 Logo" 
          width={64} 
          height={64}
          className="w-full h-full object-contain"
        />
        {/* Fallback placeholder - commented out when logo is active */}
        {/* <span className={`${textSizes[size]} font-bold text-blue-800`}>PP</span> */}
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
