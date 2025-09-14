// Example usage of share captions in RaiAI components
import { useShareCaptions } from '@/hooks/use-share-captions';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

// Example: Scan Result Component
export const ScanResultExample = () => {
  const { getRandom, getFullShareText } = useShareCaptions();

  const handleShareScanResult = () => {
    const caption = getRandom('scan');
    const fullText = getFullShareText(caption.id);
    
    // Share to social media
    if (navigator.share) {
      navigator.share({
        title: 'RaiAI Scan Result',
        text: fullText,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(fullText);
    }
  };

  return (
    <Button onClick={handleShareScanResult} className="gap-2">
      <Share2 className="h-4 w-4" />
      Share Scan Result
    </Button>
  );
};

// Example: Progress Update Component
export const ProgressUpdateExample = () => {
  const { getRandom } = useShareCaptions();

  const handleShareProgress = () => {
    const caption = getRandom('progress');
    console.log('Sharing progress:', caption.text);
    // Implementation would share the caption
  };

  return (
    <div>
      <p>Your rice field health improved!</p>
      <Button onClick={handleShareProgress}>
        Share Progress Update
      </Button>
    </div>
  );
};

// Example: Shop Ticket Component
export const ShopTicketExample = () => {
  const { getRandom } = useShareCaptions();

  const handleShareShopTicket = () => {
    const caption = getRandom('shop');
    // Generate QR code and share with caption
    console.log('Shop ticket caption:', caption.text);
  };

  return (
    <div>
      <p>Show this QR at the shop</p>
      <Button onClick={handleShareShopTicket}>
        Share Shop Ticket
      </Button>
    </div>
  );
};

// Example: Monthly Summary Component
export const MonthlySummaryExample = () => {
  const { getRandom } = useShareCaptions();

  const handleShareSummary = () => {
    const caption = getRandom('summary');
    // Share monthly farming summary
    console.log('Monthly summary:', caption.text);
  };

  return (
    <div>
      <h3>Monthly Summary</h3>
      <p>Saved ฿180/rai this month</p>
      <Button onClick={handleShareSummary}>
        Share Monthly Results
      </Button>
    </div>
  );
};
