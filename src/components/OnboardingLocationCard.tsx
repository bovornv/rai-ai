import React from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { usePermissions } from "../hooks/usePermissions";

export function OnboardingLocationCard() {
  const { status, granted, record, request, setManualArea } = usePermissions();

  const handleManualAreaSelection = () => {
    // In a real app, you'd show a picker modal here
    // For demo, we'll set a sample area
    setManualArea("TH-10-1015", "บางนา, กรุงเทพมหานคร");
  };

  const handleRequestPermission = async () => {
    try {
      await request();
    } catch (error) {
      Alert.alert("Error", "Failed to request location permission");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่าพื้นที่</Text>
      
      {granted ? (
        <View style={styles.grantedContainer}>
          <Text style={styles.successText}>✅ ใช้ตำแหน่งอัตโนมัติ</Text>
          <Text style={styles.areaText}>
            พื้นที่: {record?.area_label ?? record?.area_code ?? "—"}
          </Text>
          {record?.lat && record?.lon && (
            <Text style={styles.coordsText}>
              ตำแหน่ง: {record.lat.toFixed(4)}, {record.lon.toFixed(4)}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.promptContainer}>
          <Text style={styles.description}>
            เราใช้ตำแหน่งของคุณเพื่อแสดงข้อมูลที่เกี่ยวข้องกับพื้นที่ใกล้เคียง
          </Text>
          
          <Button 
            title="ใช้ตำแหน่งอัตโนมัติ" 
            onPress={handleRequestPermission}
            color="#007AFF"
          />
          
          <Text style={styles.orText}>หรือเลือกพื้นที่เอง</Text>
          
          <Button 
            title="เลือกอำเภอ" 
            onPress={handleManualAreaSelection}
            color="#34C759"
          />
          
          {status === "denied" && (
            <Text style={styles.deniedText}>
              เปิดสิทธิ์ตำแหน่งได้ใน Settings หากต้องการ
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  grantedContainer: {
    alignItems: "center",
  },
  successText: {
    fontSize: 16,
    color: "#34C759",
    marginBottom: 8,
  },
  areaText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: "#666",
  },
  promptContainer: {
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  orText: {
    fontSize: 14,
    color: "#666",
    marginVertical: 12,
  },
  deniedText: {
    fontSize: 12,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 8,
  },
});
