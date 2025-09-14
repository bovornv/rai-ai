import { useLanguage } from '@/contexts/LanguageContext';
import { getRandomCaption, getAllCaptionsByCategory, getCaptionById, getShareFooter } from '@/lib/share-captions';

export const useShareCaptions = () => {
  const { language } = useLanguage();

  const getRandom = (category: 'spray' | 'outbreak' | 'scan' | 'progress' | 'summary' | 'shop') => {
    return getRandomCaption(category, language);
  };

  const getAllByCategory = (category: 'spray' | 'outbreak' | 'scan' | 'progress' | 'summary' | 'shop') => {
    return getAllCaptionsByCategory(category, language);
  };

  const getById = (id: string) => {
    return getCaptionById(id, language);
  };

  const getFooter = () => {
    return getShareFooter(language);
  };

  const getFullShareText = (captionId: string) => {
    const caption = getById(captionId);
    if (!caption) return '';
    return `${caption.text}\n\n${getFooter()}`;
  };

  return {
    getRandom,
    getAllByCategory,
    getById,
    getFooter,
    getFullShareText,
    language
  };
};
