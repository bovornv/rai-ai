# Mobile App Features Setup

## Overview

This guide covers the implementation of key mobile app features for the RaiAI farming assistant:

1. **Outbreak Radar** - Hyperlocal disease alerts with share cards
2. **Shop Ticket** - Printable diagnosis tickets with QR codes
3. **Summary Cards** - Before/after and month-end summary cards
4. **Referral System** - Offline-friendly referral system with QR codes
5. **Counter Mode** - Co-op/shop counter mode webview

## Quick Start

### 1. Install Dependencies
```bash
# Core dependencies
npm install react-native-qrcode-svg react-native-qrcode-scanner

# For QR code generation and scanning
npm install react-native-svg
```

### 2. Import Components
```typescript
import { OutbreakRadar } from './src/components/OutbreakRadar';
import { ShopTicket } from './src/components/ShopTicket';
import { SummaryCards } from './src/components/SummaryCards';
import { ReferralSystem } from './src/components/ReferralSystem';
import { CounterMode } from './src/components/CounterMode';
```

## Feature Details

### 1. Outbreak Radar (Hyperlocal)

**Purpose**: Alert farmers about disease outbreaks within 3km radius with shareable cards for village LINE groups.

**Key Features**:
- Location-based disease alerts
- Severity indicators (low/moderate/high)
- One-line action recommendations
- Auto-generated share cards
- Offline-capable with cached data

**Usage**:
```typescript
<OutbreakRadar 
  onShareCard={(cardData) => {
    // Handle share card generation
    console.log('Share card:', cardData);
  }}
/>
```

**API Integration**:
```typescript
// Fetch outbreak alerts for user's area
const response = await fetch(`/api/outbreaks?area=${areaCode}&radius=5`);
const alerts = await response.json();
```

### 2. Shop Ticket (Counter Mode)

**Purpose**: Printable/shareable diagnosis tickets that agri-shops scan to recommend the right category of inputs.

**Key Features**:
- QR code generation for tickets
- Printable format for shops
- Diagnosis and treatment recommendations
- Severity indicators
- Expiration tracking
- Share functionality

**Usage**:
```typescript
<ShopTicket 
  ticketData={{
    id: 'TCKT-123',
    crop: 'rice',
    diagnosis: 'Brown Spot',
    severity: 'moderate',
    recommendedClasses: ['Fungicide A', 'Fungicide B'],
    dosageNote: 'Apply every 7 days',
    rai: 2.5,
    status: 'issued',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-01-22T10:00:00Z',
    qrCode: 'https://raiai.app/ticket/TCKT-123'
  }}
  onPrint={() => console.log('Print ticket')}
  onShare={() => console.log('Share ticket')}
/>
```

### 3. Summary Cards (Before/After & Month-end)

**Purpose**: Auto-generate image cards showing improvements and monthly savings for sharing to LINE/TikTok.

**Key Features**:
- Before/after improvement cards
- Month-end summary cards
- Visual severity indicators
- Treatment tracking
- Savings calculations
- One-tap sharing

**Usage**:
```typescript
<SummaryCards 
  beforeAfterData={[
    {
      id: '1',
      crop: 'rice',
      issue: 'Brown Spot',
      beforeSeverity: 3,
      afterSeverity: 1,
      daysToImprove: 3,
      treatment: 'Fungicide application',
      timestamp: '2024-01-15T10:00:00Z'
    }
  ]}
  monthEndSummary={{
    month: 'January',
    year: 2024,
    totalSavings: 180,
    totalRai: 5.2,
    issuesResolved: 8,
    treatmentsApplied: 12,
    topCrop: 'rice',
    efficiency: 85
  }}
  onShareCard={(cardData) => console.log('Share card:', cardData)}
/>
```

### 4. Referral System (Offline-friendly)

**Purpose**: "Bring 3 neighbors → PPE/discount at partner shop" with QR codes displayed at co-op/shop counters.

**Key Features**:
- QR code generation for referrals
- Partner shop integration
- Reward tracking
- Offline-capable
- Share functionality
- Progress tracking

**Usage**:
```typescript
<ReferralSystem 
  onShareQR={(qrData) => {
    // Handle QR code sharing
    console.log('Share QR:', qrData);
  }}
/>
```

**Referral Flow**:
1. User generates referral QR code
2. Shares with neighbors
3. Neighbors scan and join RaiAI
4. User earns rewards at partner shops
5. Shop tracks referrals via Counter Mode

### 5. Counter Mode (Co-op/Shop)

**Purpose**: Tiny webview for shops to scan Shop Tickets, count referrals, and print coupons.

**Key Features**:
- QR code scanning for tickets
- Referral counting
- Coupon generation and printing
- Shop-specific interface
- Offline-capable

**Usage**:
```typescript
<CounterMode 
  shopId="shop123"
  onTicketScanned={(ticket) => {
    // Handle scanned ticket
    console.log('Ticket scanned:', ticket);
  }}
  onReferralCounted={(referral) => {
    // Handle referral counting
    console.log('Referral counted:', referral);
  }}
/>
```

**Counter Mode Tabs**:
- **Scan Tickets**: QR scanner for shop tickets
- **Referrals**: Track and count referrals
- **Coupons**: Generate and print discount coupons

## Share Card System

### Share Card Types

1. **Outbreak Alert Cards**
   - Disease name and severity
   - Distance and location
   - Action recommendation
   - Timestamp

2. **Shop Ticket Cards**
   - Diagnosis and severity
   - Recommended products
   - QR code for shop scanning
   - Expiration date

3. **Before/After Cards**
   - Improvement visualization
   - Treatment details
   - Time to improvement
   - Before/after images

4. **Month-end Summary Cards**
   - Total savings per rai
   - Issues resolved
   - Efficiency metrics
   - Top performing crop

5. **Referral QR Cards**
   - Referral code
   - QR code for joining
   - Reward information
   - Partner shop details

### Share Card Generation

```typescript
import { generateShareCard } from './src/lib/share-cards';

// Generate outbreak alert card
const alertCard = await generateShareCard({
  type: 'outbreak_alert',
  title: 'Brown Spot Alert',
  subtitle: 'Within 2.3km',
  message: 'Brown spot detected in Tambon Bang Kaeo. Apply fungicide within 24 hours.',
  severity: 'high',
  location: 'Tambon Bang Kaeo',
  timestamp: '2024-01-15T08:30:00Z'
});

// Generate shop ticket card
const ticketCard = await generateShareCard({
  type: 'shop_ticket',
  title: 'Shop Ticket',
  subtitle: 'Rice - Brown Spot',
  message: 'Diagnosis: Brown Spot\nSeverity: moderate\nRecommended: Fungicide A, Fungicide B',
  qrCode: 'https://raiai.app/ticket/TCKT-123',
  ticketId: 'TCKT-123',
  status: 'issued'
});
```

## Integration with Existing Systems

### Location Integration
```typescript
import { usePermissions } from './src/hooks/usePermissions';

function MyScreen() {
  const { granted, record } = usePermissions();
  
  // Use location for outbreak alerts
  if (granted && record?.area_code) {
    // Fetch location-specific data
  }
}
```

### Offline Cache Integration
```typescript
import { useOfflineSync } from './src/mobile/offline/hooks';

function MyScreen() {
  const sync = useOfflineSync();
  
  // Sync data when online
  useEffect(() => {
    sync.mutate({ 
      user_id: 'user123', 
      areas: [record?.area_code], 
      crops: ['rice', 'durian'] 
    });
  }, []);
}
```

### Analytics Integration
```typescript
// Track feature usage
analytics.track('outbreak_alert_shared', {
  disease: 'Brown Spot',
  severity: 'high',
  distance: 2.3
});

analytics.track('shop_ticket_generated', {
  crop: 'rice',
  diagnosis: 'Brown Spot',
  severity: 'moderate'
});
```

## Styling and Theming

### Color Scheme
- **Primary**: #007AFF (Blue)
- **Success**: #34C759 (Green)
- **Warning**: #FF9500 (Orange)
- **Error**: #FF3B30 (Red)
- **Neutral**: #8E8E93 (Gray)

### Typography
- **Title**: 20px, Bold
- **Section Title**: 16px, SemiBold
- **Body**: 14px, Regular
- **Caption**: 12px, Regular

### Component Styling
All components use consistent styling patterns:
- Rounded corners (8px radius)
- Shadow effects for cards
- Consistent spacing (16px margins)
- TouchableOpacity for interactive elements

## Testing

### Unit Tests
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { OutbreakRadar } from './OutbreakRadar';

describe('OutbreakRadar', () => {
  it('should display outbreak alerts', () => {
    const { getByText } = render(<OutbreakRadar />);
    expect(getByText('Outbreak Radar')).toBeTruthy();
  });
});
```

### Integration Tests
```typescript
describe('Shop Ticket Flow', () => {
  it('should generate and share ticket', async () => {
    const mockTicket = { /* ticket data */ };
    const { getByText } = render(<ShopTicket ticketData={mockTicket} />);
    
    fireEvent.press(getByText('Share'));
    // Verify share functionality
  });
});
```

## Performance Considerations

### Image Optimization
- Compress images before sharing
- Use appropriate image formats
- Implement lazy loading for large lists

### QR Code Optimization
- Cache generated QR codes
- Use appropriate size for scanning
- Implement error correction

### Offline Support
- Cache critical data locally
- Implement sync when online
- Graceful degradation for offline mode

## Security Considerations

### QR Code Security
- Validate QR code data before processing
- Implement rate limiting for scanning
- Sanitize user input

### Share Card Security
- Validate share card data
- Implement expiration for sensitive data
- Use secure URLs for sharing

The mobile app features provide a comprehensive solution for Thailand farmers with offline-first capabilities and social sharing integration!
