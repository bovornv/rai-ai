// Example usage of the i18n system
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

// Example component showing how to use i18n
export const ExampleComponent = () => {
  const { language, setLanguage, t: translate } = useLanguage();

  return (
    <div>
      <h1>{translate('raiAI')}</h1>
      <p>{translate('smartFarmer')}</p>
      <button onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}>
        Switch to {language === 'th' ? 'English' : 'ไทย'}
      </button>
    </div>
  );
};

// Direct usage without hook (for utility functions)
export const getGreeting = (lang: 'th' | 'en' = 'th') => {
  return t('smartFarmer', lang);
};
