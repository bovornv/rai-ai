# Mobile Permissions Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
# Install required packages
expo install expo-location
npm install react-native-mmkv
```

### 2. Configure App Permissions
The `app.config.js` file is already configured with the necessary permission strings:

```javascript
export default {
  expo: {
    ios: {
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We use your approximate location to show weather, spray window, and nearby buyers. We never track your precise location."
      }
    },
    android: {
      permissions: [
        "ACCESS_COARSE_LOCATION"
      ]
    },
    plugins: [
      "expo-location"
    ]
  }
};
```

### 3. Use the Hook
```typescript
import { usePermissions } from "./src/hooks/usePermissions";

function MyScreen() {
  const { status, granted, record, request, setManualArea } = usePermissions();
  
  return (
    <View>
      {granted ? (
        <Text>Area: {record?.area_label}</Text>
      ) : (
        <Button title="Enable Location" onPress={request} />
      )}
    </View>
  );
}
```

## API Reference

### **usePermissions Hook**

#### **Return Values**
```typescript
{
  record: PermissionRecord | null;     // Full permission record
  status: PermissionStatus;            // "granted" | "denied" | "prompt"
  type: PermType;                      // "coarse" | "manual"
  granted: boolean;                    // true if location granted
  request: () => Promise<PermissionRecord>;        // Request permission
  refreshStatus: () => Promise<PermissionRecord>;  // Refresh OS status
  setManualArea: (code: string, label?: string) => PermissionRecord; // Set manual area
  reset: () => void;                   // Clear cache (debug)
}
```

#### **PermissionRecord Type**
```typescript
{
  status: "granted" | "denied" | "prompt";
  type: "coarse" | "manual";
  area_code?: string;        // ADM2/TIS-1099 code
  area_label?: string;       // Human-readable area name
  updated_at: string;        // ISO timestamp
  lat?: number;              // Last known latitude (coarse)
  lon?: number;              // Last known longitude (coarse)
}
```

## Usage Examples

### **Basic Usage**
```typescript
import { usePermissions } from "./src/hooks/usePermissions";

function LocationScreen() {
  const { status, granted, record, request } = usePermissions();

  if (granted) {
    return (
      <View>
        <Text>✅ Location enabled</Text>
        <Text>Area: {record?.area_label}</Text>
        <Text>Code: {record?.area_code}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>Location permission: {status}</Text>
      <Button title="Enable Location" onPress={request} />
    </View>
  );
}
```

### **Onboarding Flow**
```typescript
function OnboardingScreen() {
  const { status, granted, request, setManualArea } = usePermissions();

  const handleLocationRequest = async () => {
    try {
      await request();
    } catch (error) {
      console.error("Permission request failed:", error);
    }
  };

  const handleManualSelection = () => {
    // Show area picker modal
    setManualArea("TH-10-1015", "บางนา, กรุงเทพมหานคร");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่าพื้นที่</Text>
      
      {granted ? (
        <Text>✅ พื้นที่ตั้งค่าเรียบร้อย</Text>
      ) : (
        <View>
          <Button title="ใช้ตำแหน่งอัตโนมัติ" onPress={handleLocationRequest} />
          <Button title="เลือกพื้นที่เอง" onPress={handleManualSelection} />
        </View>
      )}
    </View>
  );
}
```

### **Weather Screen Integration**
```typescript
function WeatherScreen() {
  const { granted, record } = usePermissions();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (granted && record?.area_code) {
      // Fetch weather for specific area
      fetchWeather(record.area_code);
    }
  }, [granted, record?.area_code]);

  return (
    <View>
      <Text>Weather for: {record?.area_label || "Unknown Area"}</Text>
      {/* Weather content */}
    </View>
  );
}
```

### **Prices Screen Integration**
```typescript
function PricesScreen() {
  const { granted, record } = usePermissions();
  const [prices, setPrices] = useState([]);

  useEffect(() => {
    if (granted && record?.area_code) {
      // Fetch prices for specific area
      fetchPrices(record.area_code);
    }
  }, [granted, record?.area_code]);

  return (
    <View>
      <Text>Prices for: {record?.area_label || "Unknown Area"}</Text>
      {/* Prices content */}
    </View>
  );
}
```

## Advanced Usage

### **Custom Area Picker**
```typescript
function AreaPickerModal({ visible, onSelect, onClose }) {
  const [areas, setAreas] = useState([]);
  const { setManualArea } = usePermissions();

  const handleAreaSelect = (area) => {
    setManualArea(area.code, area.label);
    onSelect(area);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modal}>
        <Text style={styles.title}>เลือกพื้นที่</Text>
        <FlatList
          data={areas}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleAreaSelect(item)}>
              <Text>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
        <Button title="ปิด" onPress={onClose} />
      </View>
    </Modal>
  );
}
```

### **Server Integration (Optional)**
```typescript
import { getPermissionStatus, postRequestLocation } from "./src/lib/api/permissionsClient";

function useServerPermissions() {
  const localPermissions = usePermissions();
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    // Sync with server on app start
    getPermissionStatus().then(setServerStatus);
  }, []);

  const syncWithServer = async () => {
    try {
      const serverRecord = await postRequestLocation();
      // Update local cache with server response
      localPermissions.setManualArea(serverRecord.area_code, serverRecord.area_label);
    } catch (error) {
      console.error("Server sync failed:", error);
    }
  };

  return {
    ...localPermissions,
    serverStatus,
    syncWithServer
  };
}
```

## Privacy & Security

### **Permission Levels**
- **Coarse Location Only** - City/area level, not precise GPS
- **No Background Access** - Only when app is active
- **No Fine GPS** - Low accuracy for privacy
- **Manual Fallback** - Area picker when permission denied

### **Data Storage**
- **MMKV Storage** - Fast, encrypted local storage
- **No Server Sync** - All data stays on device
- **Clear on Uninstall** - No persistent data

### **Android 12+ Support**
- **Accuracy Dialog** - System shows accuracy chooser
- **Approximate Location** - Works with coarse permission
- **No Background** - Foreground only

## Error Handling

### **Permission States**
```typescript
const { status } = usePermissions();

switch (status) {
  case "prompt":
    // Show permission request UI
    break;
  case "granted":
    // Show location-based content
    break;
  case "denied":
    // Show manual area picker
    break;
}
```

### **Error Scenarios**
```typescript
const { request } = usePermissions();

const handleRequest = async () => {
  try {
    await request();
  } catch (error) {
    if (error.code === "PERMISSION_DENIED") {
      Alert.alert("Permission Denied", "Please enable location in settings");
    } else {
      Alert.alert("Error", "Failed to request location permission");
    }
  }
};
```

## Testing

### **Unit Tests**
```typescript
import { renderHook, act } from "@testing-library/react-native";
import { usePermissions } from "./usePermissions";

describe("usePermissions", () => {
  it("should initialize with prompt status", () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.status).toBe("prompt");
  });

  it("should handle permission request", async () => {
    const { result } = renderHook(() => usePermissions());
    
    await act(async () => {
      await result.current.request();
    });
    
    expect(result.current.status).toBe("granted");
  });
});
```

### **Integration Tests**
```typescript
import { render, fireEvent } from "@testing-library/react-native";
import { OnboardingLocationCard } from "./OnboardingLocationCard";

describe("OnboardingLocationCard", () => {
  it("should show permission request button", () => {
    const { getByText } = render(<OnboardingLocationCard />);
    expect(getByText("ใช้ตำแหน่งอัตโนมัติ")).toBeTruthy();
  });
});
```

## Troubleshooting

### **Common Issues**

#### **Permission Not Requested**
- Check `app.config.js` has correct permission strings
- Ensure `expo-location` plugin is installed
- Rebuild app after config changes

#### **Location Not Working**
- Check device location services are enabled
- Verify app has location permission
- Try manual area selection as fallback

#### **MMKV Storage Issues**
- Ensure `react-native-mmkv` is properly installed
- Check storage permissions on device
- Clear app data if needed

### **Debug Commands**
```typescript
const { reset, record } = usePermissions();

// Clear all cached data
reset();

// Check current record
console.log("Current record:", record);
```

The mobile permissions system provides a complete offline-first location handling solution for your Thailand farming AI app!
