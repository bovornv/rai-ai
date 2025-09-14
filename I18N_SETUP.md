# RaiAI i18n Setup Guide

## Overview
Your RaiAI project now has a complete internationalization (i18n) system with Thai and English support. The system automatically detects the user's language preference and falls back to English if Thai translations are missing.

## Files Added/Modified

### New Files:
- `src/lib/i18n.ts` - Main i18n configuration with Thai/English translations
- `src/contexts/LanguageContext.tsx` - React context for language management
- `src/components/LanguageSwitcher.tsx` - Language toggle component
- `src/examples/i18n-usage.tsx` - Usage examples

### Modified Files:
- `src/App.tsx` - Added LanguageProvider wrapper
- `src/components/RaiAIApp.tsx` - Updated to use i18n translations
- `src/pages/RaiAI.tsx` - Updated to use i18n translations (renamed from GrowPlantAI.tsx)

## How to Use

### 1. Basic Usage in Components
```tsx
import { useLanguage } from "@/contexts/LanguageContext";

const MyComponent = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('raiAI')}</h1>
      <p>{t('smartFarmer')}</p>
      <button onClick={() => setLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
};
```

### 2. Direct Translation Function
```tsx
import { t } from "@/lib/i18n";

// Use in utility functions or outside React components
const greeting = t('smartFarmer', 'th'); // Returns Thai text
const greetingEn = t('smartFarmer', 'en'); // Returns English text
```

### 3. Adding New Translations
Edit `src/lib/i18n.ts` and add new keys to both `th` and `en` objects:

```tsx
export const i18n = {
  th: {
    // ... existing keys
    newFeature: "คุณสมบัติใหม่",
  },
  en: {
    // ... existing keys  
    newFeature: "New Feature",
  }
};
```

### 4. Language Detection
The system automatically:
- Detects system language on first visit
- Saves user preference to localStorage
- Defaults to Thai for Thailand users
- Falls back to English if translation missing

## Available Translation Keys

### Common Actions
- `ok`, `cancel`, `back`, `retry`
- `offlineMode`, `uncertain`

### Navigation
- `home`, `scan`, `fields`, `sell`, `help`, `settings`, `counter`

### App Content
- `raiAI`, `smartFarmer`, `aiFarmingAssistant`
- `scanRiceLeaves`, `scanDurianLeaves`
- `healthyScans`, `totalScans`, `diseasesFound`
- `costs`, `history`

### Settings
- `dataSharing`, `privacy`, `about`
- `exportData`, `deleteAccount`
- `version`, `forThaiRiceFarmers`

### Scan Flow
- `scanning`, `scanComplete`, `recheckIn2Days`
- `steps`, `step_spray`, `step_wait`, `step_recheck`
- `ppeWarning`

### Weather & Spraying
- `today`, `sprayWindow_good`, `sprayWindow_caution`, `sprayWindow_dont`
- `sprayReminder`, `outbreakRadar`

### Shop & Pricing
- `shopTicket`, `diagnosis`, `recommendedProducts`
- `prices`, `ricePrice`, `durianPrice`
- `priceAlert`, `buyerDirectory`

## Language Switcher
The `LanguageSwitcher` component is already added to the settings page. Users can toggle between Thai and English.

## Best Practices

1. **Always use the `t()` function** instead of hardcoded strings
2. **Keep keys descriptive** (e.g., `sprayWindow_good` not `swg`)
3. **Add both Thai and English** translations for new keys
4. **Test both languages** when adding new features
5. **Use consistent terminology** across the app

## Testing
1. Open the app and go to Settings
2. Use the language switcher to toggle between Thai/English
3. Verify all text changes appropriately
4. Refresh the page - language preference should persist

## Future Enhancements
- Add more languages (Vietnamese, Lao, etc.)
- Implement pluralization rules
- Add date/time formatting
- Add number formatting for different locales
