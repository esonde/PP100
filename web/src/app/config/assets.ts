// Asset configuration for PP100
export const ASSETS = {
  logo: {
    primary: '/images/logo/pp100-logo.png',
    fallback: '/images/logo/pp100-logo.png',
    favicon: '/images/favicon/favicon.ico'
  },
  icons: {
    dashboard: '/images/icons/dashboard-icon.png',
    monitoring: '/images/icons/monitoring-icon.png',
    feed: '/images/icons/feed-icon.png',
    parliament: '/images/icons/parliament-icon.png'
  }
} as const

// Icon mapping for different sections
export const SECTION_ICONS = {
  objective: '🎯',
  monitoring: '🔍',
  metrics: '📊',
  feed: '📰',
  parliament: '🏛️'
} as const

// Fallback icons (emojis) when custom icons are not available
export const FALLBACK_ICONS = {
  dashboard: '📊',
  monitoring: '🔍',
  feed: '📰',
  parliament: '🏛️',
  objective: '🎯',
  metrics: '📈'
} as const
