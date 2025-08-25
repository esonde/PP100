// Asset configuration for PP100
export const ASSETS = {
  logo: {
    primary: '/PP100/images/logo/pp100-logo.svg',
    fallback: '/PP100/images/logo/pp100-logo.png',
    favicon: '/PP100/images/favicon/favicon.ico'
  },
  icons: {
    dashboard: '/PP100/images/icons/dashboard-icon.png',
    monitoring: '/PP100/images/icons/monitoring-icon.png',
    feed: '/PP100/images/icons/feed-icon.png',
    parliament: '/PP100/images/icons/parliament-icon.png'
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
