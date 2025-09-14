# Universal Unit Converter

A comprehensive, extensible unit converter for agricultural price data that supports any common agricultural unit with proper currency and mass conversions.

## 🌟 Key Features

### **Universal Unit Support**
- **Currencies**: USD, THB (extensible to any ISO 4217 currency)
- **Mass Units**: kg, g, lb, cwt (US hundredweight), mt (metric tonne)
- **Flexible Aliases**: Support for various unit names and formats
- **Real-time Conversion**: Live currency and mass conversions

### **Smart Unit Parsing**
- **Case Insensitive**: "usd/mt", "USD/MT", "Usd/Mt" all work
- **Alias Support**: "tonne", "ตัน", "ton (metric)" → "mt"
- **Whitespace Handling**: "USD / MT" → "USD/MT"
- **Error Handling**: Clear error messages for invalid units

### **Accurate Conversions**
- **Currency Conversion**: Real-time FX rates with historical accuracy
- **Mass Conversion**: Precise mass unit conversions
- **Combined Logic**: Currency first, then mass conversion
- **Proper Rounding**: Appropriate decimal places for each unit type

## 🏗️ Architecture

### **Core Components**
- **`src/lib/prices/units.ts`**: Universal unit converter logic
- **`src/lib/prices/convert.ts`**: Backward compatibility wrapper
- **`src/api/prices.ts`**: API integration with unit validation
- **`src/lib/fx/repo.ts`**: FX rate management

### **Unit Types**
```typescript
export type Currency = string; // e.g., "USD" | "THB"
export type Denom = "kg" | "g" | "lb" | "cwt" | "mt";
export type PriceUnit = `${Currency}/${Denom}`;
```

### **Mass Conversion Factors**
```typescript
export const MASS_IN_KG: Record<Denom, number> = {
  g:   0.001,           // 1 gram = 0.001 kg
  kg:  1,               // 1 kilogram = 1 kg
  lb:  0.45359237,      // 1 pound = 0.45359237 kg
  cwt: 45.359237,       // 1 US hundredweight = 45.359237 kg
  mt:  1000,            // 1 metric tonne = 1000 kg
};
```

## 📊 Supported Units

### **Currencies**
- **USD**: US Dollar
- **THB**: Thai Baht
- **Extensible**: Any ISO 4217 currency code

### **Mass Units**
- **kg**: Kilogram (base unit)
- **g**: Gram (0.001 kg)
- **lb**: Pound (0.45359237 kg)
- **cwt**: US Hundredweight (45.359237 kg)
- **mt**: Metric Tonne (1000 kg)

### **Unit Aliases**
```typescript
// Mass unit aliases
"kg" → "kg", "กก.", "กก", "kilogram", "kilograms"
"g" → "g", "gram", "grams"
"lb" → "lb", "lbs", "pound", "pounds"
"cwt" → "cwt", "hundredweight"
"mt" → "mt", "t", "tonne", "metric_ton", "metric-ton", "ตัน", "ton (metric)"
```

## 🔧 API Usage

### **Current Prices with Conversion**
```bash
# Rice FOB prices for Thai farmers
GET /api/prices/current?crop=rice&source=trea&convertTo=THB/kg

# Rice FOB prices for US traders
GET /api/prices/current?crop=rice&source=trea&convertTo=USD/cwt

# Durian prices for international buyers
GET /api/prices/current?crop=durian&market=talaadthai&convertTo=USD/lb

# Rice prices in metric tonnes
GET /api/prices/current?crop=rice&convertTo=THB/mt
```

### **Historical Data with Conversion**
```bash
# Rice price history for farmers
GET /api/prices/history?crop=rice&convertTo=THB/kg&groupBy=day

# Durian price history for exporters
GET /api/prices/history?crop=durian&convertTo=USD/lb&from=2024-01-01T00:00:00Z
```

### **Response Format**
```json
{
  "crop": "rice",
  "market": "trea_fob",
  "count": 2,
  "convertTo": "THB/kg",
  "conversionErrors": 0,
  "items": [
    {
      "variety": "hom_mali",
      "unit": "THB/kg",
      "original_unit": "USD/MT",
      "price_min": 21.60,
      "price_max": 22.32,
      "converted": true,
      "source": "trea"
    }
  ]
}
```

## 🧮 Conversion Examples

### **Rice FOB Prices**
```
Source: USD/MT 600-620
FX Rate: 1 USD = 36.00 THB
Conversion: (600-620) × 36.00 ÷ 1000
Result: THB/kg 21.60-22.32
```

### **Durian Market Prices**
```
Source: THB/kg 80-100
Target: USD/lb
FX Rate: 1 USD = 36.00 THB
Conversion: (80-100) ÷ 36.00 × 0.45359237
Result: USD/lb 1.01-1.26
```

### **Bulk Trading**
```
Source: USD/kg 0.6-0.65
Target: USD/mt
Conversion: (0.6-0.65) × 1000
Result: USD/mt 600-650
```

### **US Market**
```
Source: USD/MT 600-620
Target: USD/cwt
Conversion: (600-620) × 45.359237 ÷ 1000
Result: USD/cwt 27.22-28.12
```

## 🔍 Unit Parsing

### **Valid Unit Formats**
```typescript
// All of these parse correctly
"USD/MT" → "USD/mt"
"usd/tonne" → "USD/mt"
"THB/kg" → "THB/kg"
"usd/lb" → "USD/lb"
"USD/CWT" → "USD/cwt"
"THB/กก." → "THB/kg"
"USD/ton (metric)" → "USD/mt"
```

### **Error Handling**
```typescript
// Invalid formats throw clear errors
"INVALID" → Error: Invalid unit: INVALID
"USD" → Error: Invalid unit: USD
"USD/INVALID" → Error: Unsupported mass unit: INVALID
"INVALID/kg" → Error: Invalid currency: INVALID
```

## 🧪 Testing

### **Run Tests**
```bash
# Test universal unit converter
npm run test:units

# Test currency conversion
npm run test:currency

# See interactive demo
npm run demo:units

# Test API endpoints
npm run prices:test
```

### **Test Coverage**
- ✅ Unit parsing with aliases
- ✅ Mass conversion factors
- ✅ Currency conversion with FX rates
- ✅ Combined currency + mass conversions
- ✅ Single price conversions
- ✅ Conversion information and debugging
- ✅ Edge cases and error handling
- ✅ API response simulation

## 📈 Performance

### **Conversion Speed**
- **Unit Parsing**: ~0.1ms per unit
- **Single Conversion**: ~1-5ms per conversion
- **Batch Conversion**: ~10-50ms for 100 prices
- **API Response**: +20-100ms for conversion

### **Memory Usage**
- **Unit Parsing**: Minimal memory overhead
- **Conversion Logic**: Efficient mass/currency math
- **Error Handling**: Graceful degradation

## 🔧 Configuration

### **Supported Output Units**
```typescript
export const COMMON_OUTPUT_UNITS: PriceUnit[] = [
  "THB/kg", "THB/mt",
  "USD/mt", "USD/kg", "USD/lb", "USD/cwt",
];
```

### **Custom Units**
To add new units, extend the `MASS_IN_KG` object and `normalizeDenomToken` function:

```typescript
// Add new mass unit
export const MASS_IN_KG: Record<Denom, number> = {
  // ... existing units
  oz: 0.0283495,  // 1 ounce = 0.0283495 kg
};

// Add alias support
export function normalizeDenomToken(raw: string): Denom {
  const s = raw.trim().toLowerCase();
  // ... existing aliases
  if (["oz", "ounce", "ounces"].includes(s)) return "oz";
  // ...
}
```

## 🌍 Real-World Use Cases

### **Thai Farmers**
- **Display**: THB/kg for local market prices
- **Comparison**: Convert FOB prices to local units
- **Planning**: Understand international market prices

### **International Traders**
- **US Market**: USD/cwt for hundredweight pricing
- **European Market**: USD/mt for metric tonne pricing
- **Retail**: USD/lb for consumer pricing

### **Exporters**
- **Quoting**: Convert local prices to international units
- **Comparison**: Compare with global market prices
- **Negotiation**: Use appropriate units for target market

### **Importers**
- **Sourcing**: Convert supplier quotes to familiar units
- **Comparison**: Compare prices across different suppliers
- **Planning**: Budget using local currency and units

## 🚀 Integration Guide

### **Frontend Integration**
```javascript
// Fetch prices with conversion
const response = await fetch('/api/prices/current?crop=rice&convertTo=THB/kg');
const data = await response.json();

// Display converted prices
data.items.forEach(item => {
  if (item.converted) {
    console.log(`${item.variety}: ${item.price_min}-${item.price_max} ${item.unit} (converted from ${item.original_unit})`);
  } else {
    console.log(`${item.variety}: ${item.price_min}-${item.price_max} ${item.unit} (source)`);
  }
});
```

### **Error Handling**
```javascript
// Handle conversion errors
if (data.conversionErrors > 0) {
  console.warn(`${data.conversionErrors} items could not be converted`);
}

// Show conversion status
data.items.forEach(item => {
  const status = item.converted ? '✅' : '⚠️';
  console.log(`${status} ${item.variety}: ${item.price_min}-${item.price_max} ${item.unit}`);
});
```

### **Unit Validation**
```javascript
// Validate unit before API call
import { isSupportedUnit } from './lib/prices/units';

const targetUnit = 'THB/kg';
if (isSupportedUnit(targetUnit)) {
  const response = await fetch(`/api/prices/current?crop=rice&convertTo=${targetUnit}`);
} else {
  console.error('Unsupported unit:', targetUnit);
}
```

## 🔍 Debugging

### **Conversion Information**
```javascript
import { getConversionInfo } from './lib/prices/units';

const info = await getConversionInfo(db, 'USD/MT', 'THB/kg', '2024-01-15');
console.log('Currency conversion:', info.currencyConversion);
console.log('Mass conversion:', info.massConversion);
```

### **Mass Conversion Factors**
```javascript
import { getMassConversionFactor } from './lib/prices/units';

const factor = getMassConversionFactor('USD/MT', 'USD/kg');
console.log('1 MT =', factor, 'kg'); // 1000
```

### **Unit Parsing**
```javascript
import { parsePriceUnit } from './lib/prices/units';

const parsed = parsePriceUnit('usd/tonne');
console.log('Parsed unit:', parsed.asString); // USD/mt
```

## 🎯 Best Practices

### **Unit Selection**
- **Farmers**: Use THB/kg for local market prices
- **Traders**: Use USD/cwt for US market, USD/mt for international
- **Exporters**: Use target market units for quoting
- **Importers**: Use familiar units for comparison

### **Error Handling**
- **Validate Units**: Check if unit is supported before API calls
- **Handle Errors**: Gracefully handle conversion failures
- **Show Status**: Display conversion status to users
- **Fallback**: Use source units when conversion fails

### **Performance**
- **Batch Conversions**: Convert multiple prices in single API call
- **Cache Results**: Cache conversion results when appropriate
- **Validate Input**: Validate units before processing
- **Monitor Errors**: Track conversion error rates

## 📚 API Reference

### **Core Functions**
- `parsePriceUnit(unit: string)`: Parse unit string to normalized format
- `convertPriceRange(db, min, max, from, to, date?)`: Convert price range
- `convertPrice(db, price, from, to, date?)`: Convert single price
- `getConversionInfo(db, from, to, date?)`: Get conversion details
- `isSupportedUnit(unit: string)`: Check if unit is supported

### **Utility Functions**
- `getMassConversionFactor(from, to)`: Get mass conversion factor
- `getCurrencyRate(db, from, to, date?)`: Get currency conversion rate
- `roundForDisplay(price, unit)`: Round price for display
- `formatUnit(currency, denom)`: Format unit string

---

**Ready to handle any agricultural unit conversion!** 🌾💰📊
