# Permissions API MVP Setup

## Quick Start

### 1. Install Dependencies
```bash
# For React Native/Expo projects
npm install expo-location

# For web fallback (optional)
npm install @types/geolocation
```

### 2. Start Server
```bash
npm run prices:server
# Permissions endpoints: /api/permissions/status, /api/permissions/location
```

### 3. Test Permissions API
```bash
# Check current permission status
curl "http://localhost:3000/api/permissions/status"

# Request location permission
curl -X POST "http://localhost:3000/api/permissions/location"
```

## API Reference

### GET /api/permissions/status

**Response:**
```json
{
  "status": "granted|denied|prompt",
  "type": "coarse|manual",
  "area_code": "TH-10-XX",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

### POST /api/permissions/location

**Response:**
```json
{
  "status": "granted|denied|prompt",
  "type": "coarse|manual",
  "area_code": "TH-10-XX",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

## Mobile Integration

### **React Native/Expo Setup**

#### 1. App Configuration
```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs access to location to show nearby shops and prices.",
          "locationAlwaysPermission": "This app needs access to location to show nearby shops and prices.",
          "locationWhenInUsePermission": "This app needs access to location to show nearby shops and prices.",
          "isIosBackgroundLocationEnabled": false,
          "isAndroidBackgroundLocationEnabled": false
        }
      ]
    ]
  }
}
```

#### 2. React Hook Usage
```typescript
import { useState, useEffect } from 'react';
import { usePermissions } from './hooks/usePermissions';

function LocationPermissionScreen() {
  const { status, requestPermission, lastKnownArea } = usePermissions();
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      await requestPermission();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Location Permission Status: {status}</Text>
      
      {status === 'prompt' && (
        <Button
          title="Enable Location"
          onPress={handleRequestPermission}
          disabled={isLoading}
        />
      )}
      
      {status === 'denied' && (
        <View>
          <Text>Location access denied. Please enable manually in settings.</Text>
          <Button
            title="Open Settings"
            onPress={() => Linking.openSettings()}
          />
        </View>
      )}
      
      {status === 'granted' && lastKnownArea && (
        <Text>Current Area: {lastKnownArea}</Text>
      )}
    </View>
  );
}
```

#### 3. Custom Hook Implementation
```typescript
// hooks/usePermissions.ts
import { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';

interface PermissionStatus {
  status: 'granted' | 'denied' | 'prompt';
  type: 'coarse' | 'manual';
  area_code?: string;
  updated_at: string;
}

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/permissions/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch permission status:', error);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/permissions/location`, {
        method: 'POST',
      });
      const data = await response.json();
      setStatus(data);
      
      if (data.status === 'denied') {
        Alert.alert(
          'Location Access Required',
          'This app needs location access to show nearby shops and prices. Please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('Error', 'Failed to request location permission');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status: status?.status || 'prompt',
    type: status?.type || 'manual',
    lastKnownArea: status?.area_code,
    isLoading,
    requestPermission,
    refreshStatus: fetchStatus
  };
}
```

## Web Fallback

### **Geolocation API Integration**
```typescript
// For web builds, fallback to browser geolocation
export async function requestLocationPermissionWeb(): Promise<PermissionRecord> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        status: 'denied',
        type: 'manual',
        updated_at: new Date().toISOString()
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // TODO: Reverse geocode to ADM2
        const area_code = await reverseGeocodeToAdm2(
          position.coords.latitude,
          position.coords.longitude
        );
        
        resolve({
          status: 'granted',
          type: 'coarse',
          area_code,
          updated_at: new Date().toISOString()
        });
      },
      (error) => {
        resolve({
          status: 'denied',
          type: 'manual',
          updated_at: new Date().toISOString()
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}
```

## Database Schema

### **Permissions Cache Table**
```sql
CREATE TABLE IF NOT EXISTS permissions_cache (
  key TEXT PRIMARY KEY,
  status TEXT,
  type TEXT,
  area_code TEXT,
  updated_at TEXT
);
```

### **Sample Data**
```sql
INSERT INTO permissions_cache (key, status, type, area_code, updated_at)
VALUES ('location', 'granted', 'coarse', 'TH-10-XX', '2024-01-01T10:00:00Z');
```

## Integration with Location Service

### **Reverse Geocoding Integration**
```typescript
// src/lib/permissions-service.ts
import { reverseGeocodeToAdm2 } from './location-service';

export async function requestLocationPermission(db?: Database): Promise<PermissionRecord> {
  // ... existing code ...
  
  try {
    const { status: sysStatus } = await Location.requestForegroundPermissionsAsync();
    if (sysStatus === "granted") {
      status = "granted";
      type = "coarse";

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low
      });

      // Reverse geocode to ADM2 code
      area_code = await reverseGeocodeToAdm2(
        loc.coords.latitude, 
        loc.coords.longitude
      );
    }
    // ... rest of the code ...
  }
}
```

## Error Handling

### **Permission States**
- **`prompt`** - User hasn't been asked yet
- **`granted`** - Permission granted, location available
- **`denied`** - Permission denied, fallback to manual area picker

### **Error Scenarios**
```typescript
// Network error - return cached status
if (!navigator.onLine) {
  return await getPermissionStatus(db);
}

// Location service error - fallback to manual
try {
  const loc = await Location.getCurrentPositionAsync();
  // ... process location
} catch (error) {
  console.warn('Location service error:', error);
  return {
    status: 'denied',
    type: 'manual',
    updated_at: new Date().toISOString()
  };
}
```

## Testing

### **Unit Tests**
```typescript
import { getPermissionStatus, requestLocationPermission } from './permissions-service';

describe('Permissions Service', () => {
  it('should return cached status', async () => {
    const status = await getPermissionStatus();
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('type');
  });

  it('should handle permission denial gracefully', async () => {
    // Mock denied permission
    jest.spyOn(Location, 'requestForegroundPermissionsAsync')
      .mockResolvedValue({ status: 'denied' });

    const result = await requestLocationPermission();
    expect(result.status).toBe('denied');
    expect(result.type).toBe('manual');
  });
});
```

### **Integration Tests**
```typescript
import request from 'supertest';
import app from './server';

describe('Permissions API', () => {
  it('should return permission status', async () => {
    const response = await request(app)
      .get('/api/permissions/status')
      .expect(200);
    
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('type');
  });

  it('should request location permission', async () => {
    const response = await request(app)
      .post('/api/permissions/location')
      .expect(200);
    
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('type');
  });
});
```

## Security Considerations

### **Privacy Protection**
- Only request coarse location (not fine GPS)
- No background location access
- Cache area codes, not exact coordinates
- Clear cache on app uninstall

### **Data Minimization**
```typescript
// Only store ADM2 codes, not exact coordinates
const area_code = await reverseGeocodeToAdm2(lat, lng);
// Don't store: lat, lng, address, etc.
```

## Performance Optimizations

### **Caching Strategy**
- Cache permission status locally
- Only request location when needed
- Use low accuracy for faster response
- Implement timeout for location requests

### **Offline Support**
- Return cached status when offline
- Graceful degradation to manual area picker
- No network dependency for permission checks

The permissions system provides a clean, offline-safe way to handle location permissions for your Thailand farming AI app!
