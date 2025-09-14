# RaiAI Share Captions System

## Overview
The RaiAI app now includes a comprehensive share captions system for generating farmer-friendly Thai captions for social media sharing (LINE, TikTok, Facebook). The system provides randomized, contextual captions for different farming scenarios.

## Features

### 📝 Caption Categories
- **🌦️ Spray Window** - Weather-based spraying advice
- **🦠 Outbreak Radar** - Disease outbreak warnings
- **📷 Scan Result** - AI scan results and recommendations
- **📊 Progress** - Before/after improvement updates
- **💰 Summary** - Monthly cost savings and results
- **🛒 Shop Ticket** - Product recommendations for shops

### 🎯 Key Features
- **Randomized Templates** - Picks 1 caption at share-time from category
- **Short & Sweet** - All captions ≤60 characters for social media
- **RaiAI Branding** - Includes "แชร์จาก RaiAI" footer
- **Bilingual Support** - Thai and English versions
- **Easy Integration** - Simple hooks and components

## Files Structure

```
src/
├── lib/
│   └── share-captions.ts          # Main captions data and helpers
├── components/
│   └── ShareCardGenerator.tsx     # Share card UI component
├── hooks/
│   └── use-share-captions.ts      # React hook for easy access
└── examples/
    └── share-captions-usage.tsx   # Usage examples
```

## Usage Examples

### 1. Basic Hook Usage
```tsx
import { useShareCaptions } from '@/hooks/use-share-captions';

const MyComponent = () => {
  const { getRandom, getFullShareText } = useShareCaptions();

  const handleShare = () => {
    const caption = getRandom('spray');
    const fullText = getFullShareText(caption.id);
    
    if (navigator.share) {
      navigator.share({ text: fullText });
    } else {
      navigator.clipboard.writeText(fullText);
    }
  };

  return <Button onClick={handleShare}>Share</Button>;
};
```

### 2. Share Card Generator Component
```tsx
import ShareCardGenerator from '@/components/ShareCardGenerator';

const MyPage = () => {
  const [showShareCard, setShowShareCard] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowShareCard(true)}>
        Generate Share Card
      </Button>
      
      {showShareCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <ShareCardGenerator
            category="spray"
            onClose={() => setShowShareCard(false)}
          />
        </div>
      )}
    </div>
  );
};
```

### 3. Direct Caption Access
```tsx
import { getRandomCaption, getShareFooter } from '@/lib/share-captions';

const caption = getRandomCaption('outbreak', 'th');
const footer = getShareFooter('th');
const fullText = `${caption.text}\n\n${footer}`;
```

## Caption Categories & Examples

### 🌦️ Spray Window
- "วันนี้ปลอดภัย ฉีดพ่นได้ ✅"
- "ลมแรง ระวัง! 🚫 เลื่อนฉีดพ่นก่อน"
- "ฝนใกล้มา ☔ หลีกเลี่ยงฉีดพ่นวันนี้"

### 🦠 Outbreak Radar
- "โรคใบจุดน้ำตาลกำลังระบาดในรัศมี 3 กม. ระวัง!"
- "แจ้งเตือน! พบโรครากเน่าในทุเรียนใกล้สวนคุณ"
- "เพื่อนบ้านรายงานการระบาด แชร์เพื่อให้ทุกคนรู้ทัน!"

### 📷 Scan Result
- "ตรวจพบโรคใบไหม้ในข้าว รีบจัดการก่อนลุกลาม"
- "ต้นทุเรียนมีอาการรากเน่า แนะนำวิธีป้องกันแล้ว"
- "ผลสแกน: อาการไม่ชัดเจน รอ 2 วันแล้วลองใหม่"

### 📊 Progress
- "ใบข้าวจากโรค 3 → 1 ใน 3 วัน ดีขึ้นแล้ว 💪"
- "อาการทุเรียนดีขึ้นหลังทำตามคำแนะนำ 🎉"
- "เห็นผลจริง! สุขภาพแปลงดีขึ้นตามคำแนะนำ"

### 💰 Summary
- "เดือนนี้ประหยัดค่าใช้จ่าย ฿180/ไร่ 💵"
- "รายงานไร่: สุขภาพแปลงดีขึ้น + ต้นทุนลดลง"
- "ผลสรุปเดือนนี้: ทำตามแผนแล้วได้ผล!"

### 🛒 Shop Ticket
- "ใช้ QR นี้ที่ร้านใกล้บ้าน รับคำแนะนำตรงกับโรค"
- "ตั๋วร้านค้า: บอกประเภทสินค้าที่เหมาะสม"
- "แชร์ให้ร้านค้าสแกนแล้วรับสินค้าได้เลย"

## Integration Points

### Already Integrated
- ✅ **TodayPage** - Spray window and outbreak radar sharing
- ✅ **ShareCardGenerator** - Modal component for caption generation

### Ready for Integration
- 🔄 **ScanResult** - Add share button for scan results
- 🔄 **ProgressTracking** - Share before/after improvements
- 🔄 **MonthlySummary** - Share cost savings and results
- 🔄 **ShopTicket** - Share QR codes with product recommendations

## API Reference

### `useShareCaptions()` Hook
```tsx
const {
  getRandom,           // Get random caption by category
  getAllByCategory,    // Get all captions in category
  getById,            // Get specific caption by ID
  getFooter,          // Get RaiAI branding footer
  getFullShareText,   // Get caption + footer combined
  language            // Current language ('th' | 'en')
} = useShareCaptions();
```

### `ShareCardGenerator` Component
```tsx
<ShareCardGenerator
  category="spray" | "outbreak" | "scan" | "progress" | "summary" | "shop"
  onClose={() => void}
  className?: string
/>
```

### Direct Functions
```tsx
import { 
  getRandomCaption, 
  getAllCaptionsByCategory, 
  getCaptionById, 
  getShareFooter 
} from '@/lib/share-captions';
```

## Customization

### Adding New Captions
Edit `src/lib/share-captions.ts` and add new captions to the appropriate category:

```tsx
spray: [
  // ... existing captions
  {
    id: 'spray_new',
    text: 'Your new caption here',
    category: 'spray' as const,
    emoji: '🌤️'
  }
]
```

### Adding New Categories
1. Add category to the `ShareCaption` interface
2. Add captions to both `th` and `en` objects
3. Update the `ShareCardGenerator` component
4. Add category to the hook types

## Best Practices

1. **Keep captions short** - ≤60 characters for social media
2. **Use emojis** - Make captions more engaging
3. **Test both languages** - Ensure Thai and English work
4. **Randomize selection** - Use `getRandom()` for variety
5. **Include branding** - Always use `getShareFooter()`
6. **Handle fallbacks** - Check for `navigator.share` support

## Future Enhancements

- 📱 **QR Code Generation** - Generate QR codes for shop tickets
- 🖼️ **Image Overlays** - Add captions to images
- 📊 **Analytics** - Track which captions are most shared
- 🌍 **More Languages** - Add Vietnamese, Lao, etc.
- 🎨 **Custom Styling** - Theme-based caption styling
- 📈 **A/B Testing** - Test different caption variations
