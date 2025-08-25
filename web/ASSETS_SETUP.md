# 🎨 Setup Guide per gli Asset Generati

## 📁 Dove Salvare le Immagini

### 1. **Logo PP100**
```
web/public/images/logo/
├── pp100-logo.svg    ← Logo principale (preferito)
└── pp100-logo.png    ← Fallback PNG
```

### 2. **Icone**
```
web/public/images/icons/
├── dashboard-icon.png    ← Per la sezione metriche
├── monitoring-icon.png   ← Icona generale
├── feed-icon.png        ← Per la sezione feed
└── parliament-icon.png  ← Tema generale
```

### 3. **Favicon**
```
web/public/images/favicon/
└── favicon.ico          ← Icona del browser
```

## 🚀 Come Attivare gli Asset

### **Passo 1: Genera le Immagini**
Usa i prompt forniti con DALL-E, Midjourney, o Stable Diffusion

### **Passo 2: Salva nelle Directory Corrette**
- Copia ogni immagine nella directory appropriata
- Mantieni i nomi file esatti

### **Passo 3: Attiva il Logo**
Nel file `web/src/app/components/Logo.tsx`:
```tsx
// Commenta questa riga:
<span className={`${textSizes[size]} font-bold text-blue-800`}>PP</span>

// Decommenta queste righe:
<Image 
  src={ASSETS.logo.primary} 
  alt="PP100 Logo" 
  width={64} 
  height={64}
  className="w-full h-full object-contain"
  onError={(e) => {
    const target = e.target as HTMLImageElement
    target.src = ASSETS.logo.fallback
  }}
/>
```

### **Passo 4: Attiva le Icone**
Sostituisci le emoji nelle pagine con le tue icone generate

## 🎯 Specifiche Tecniche

- **Logo**: 200x200px minimo, SVG preferito
- **Icone**: 64x64px (128x128px per 2x)
- **Favicon**: 32x32px, formato ICO
- **Formato**: PNG con sfondo trasparente
- **Colori**: Blu #1e40af come principale
- **Stile**: Pulito, moderno, professionale

## ✅ Verifica

1. **Salva le immagini** nelle directory corrette
2. **Attiva il logo** nel componente
3. **Fai un build**: `npm run build`
4. **Controlla che le immagini** si carichino correttamente
5. **Verifica il favicon** nella tab del browser

## 🔧 Personalizzazione

Puoi modificare i percorsi nel file `web/src/app/config/assets.ts` se vuoi usare nomi diversi per i file.

## 🌐 Percorsi Finali

Una volta generati, gli asset saranno accessibili a:
- **Logo**: `https://esonde.github.io/PP100/images/logo/pp100-logo.svg`
- **Icone**: `https://esonde.github.io/PP100/images/icons/[nome-icona].png`
- **Favicon**: `https://esonde.github.io/PP100/images/favicon/favicon.ico`
