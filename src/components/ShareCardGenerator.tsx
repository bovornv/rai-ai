import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, RefreshCw, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRandomCaption, getShareFooter, ShareCaption } from '@/lib/share-captions';
import { toast } from '@/hooks/use-toast';

interface ShareCardGeneratorProps {
  category: 'spray' | 'outbreak' | 'scan' | 'progress' | 'summary' | 'shop';
  onClose?: () => void;
  className?: string;
}

const ShareCardGenerator: React.FC<ShareCardGeneratorProps> = ({ 
  category, 
  onClose,
  className = '' 
}) => {
  const { t, language } = useLanguage();
  const [currentCaption, setCurrentCaption] = useState<ShareCaption>(() => 
    getRandomCaption(category, language)
  );

  const generateNewCaption = () => {
    const newCaption = getRandomCaption(category, language);
    setCurrentCaption(newCaption);
  };

  const copyToClipboard = async () => {
    const fullText = `${currentCaption.text}\n\n${getShareFooter(language)}`;
    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: t('copyCaption'),
        description: "Caption copied to clipboard!",
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = async () => {
    const shareData = {
      title: 'RaiAI',
      text: `${currentCaption.text}\n\n${getShareFooter(language)}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying to clipboard
        await copyToClipboard();
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to copying to clipboard
      await copyToClipboard();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spray': return 'bg-green-100 text-green-800 border-green-200';
      case 'outbreak': return 'bg-red-100 text-red-800 border-red-200';
      case 'scan': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'summary': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shop': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'spray': return '🌦️ Spray Window';
      case 'outbreak': return '🦠 Outbreak Radar';
      case 'scan': return '📷 Scan Result';
      case 'progress': return '📊 Progress';
      case 'summary': return '💰 Summary';
      case 'shop': return '🛒 Shop Ticket';
      default: return category;
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('shareCaption')}</CardTitle>
          <Badge className={getCategoryColor(category)}>
            {getCategoryLabel(category)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Caption Display */}
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
          <div className="text-center space-y-2">
            <div className="text-lg font-medium text-gray-900">
              {currentCaption.emoji && <span className="mr-2">{currentCaption.emoji}</span>}
              {currentCaption.text}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {getShareFooter(language)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateNewCaption}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            New
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button
            size="sm"
            onClick={shareToSocial}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* RaiAI Branding */}
        <div className="text-center pt-2 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">R</span>
            </div>
            <span>RaiAI</span>
          </div>
        </div>

        {onClose && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareCardGenerator;
