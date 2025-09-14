import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import { generateShareCard } from '../lib/share-cards';

interface OutbreakAlert {
  id: string;
  disease: string;
  severity: 'low' | 'moderate' | 'high';
  distance: number; // in km
  location: string;
  detectedAt: string;
  action: string;
}

interface OutbreakRadarProps {
  onShareCard?: (cardData: any) => void;
}

export function OutbreakRadar({ onShareCard }: OutbreakRadarProps) {
  const { granted, record } = usePermissions();
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with real API call
  const mockAlerts: OutbreakAlert[] = [
    {
      id: '1',
      disease: 'Brown Spot',
      severity: 'high',
      distance: 2.3,
      location: 'Tambon Bang Kaeo',
      detectedAt: '2024-01-15T08:30:00Z',
      action: 'Apply fungicide within 24 hours'
    },
    {
      id: '2',
      disease: 'Rice Blast',
      severity: 'moderate',
      distance: 1.8,
      location: 'Tambon Bang Phli',
      detectedAt: '2024-01-15T07:15:00Z',
      action: 'Monitor closely, prepare treatment'
    }
  ];

  useEffect(() => {
    if (granted && record?.area_code) {
      fetchOutbreakAlerts();
    }
  }, [granted, record?.area_code]);

  const fetchOutbreakAlerts = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`/api/outbreaks?area=${record.area_code}&radius=5`);
      // const data = await response.json();
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to fetch outbreak alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareAlert = async (alert: OutbreakAlert) => {
    try {
      const shareCard = await generateShareCard({
        type: 'outbreak_alert',
        title: `${alert.disease} Alert`,
        subtitle: `Within ${alert.distance}km`,
        message: `${alert.disease} detected in ${alert.location}. ${alert.action}`,
        severity: alert.severity,
        location: alert.location,
        timestamp: alert.detectedAt
      });

      const shareOptions = {
        title: 'Outbreak Alert - RaiAI',
        message: `${alert.disease} rising within ${alert.distance} km. ${alert.action}`,
        url: shareCard.url
      };

      await Share.share(shareOptions);
      
      if (onShareCard) {
        onShareCard(shareCard);
      }
    } catch (error) {
      console.error('Failed to share alert:', error);
      Alert.alert('Error', 'Failed to share outbreak alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF3B30';
      case 'moderate': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'moderate': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (!granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Outbreak Radar</Text>
        <Text style={styles.subtitle}>Enable location to see nearby disease alerts</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Outbreak Radar</Text>
        <Text style={styles.subtitle}>Scanning for nearby outbreaks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outbreak Radar</Text>
      <Text style={styles.subtitle}>Area: {record?.area_label || 'Unknown'}</Text>
      
      {alerts.length === 0 ? (
        <View style={styles.noAlerts}>
          <Text style={styles.noAlertsText}>✅ No outbreaks detected nearby</Text>
          <Text style={styles.noAlertsSubtext}>Your area is clear of major diseases</Text>
        </View>
      ) : (
        <View style={styles.alertsList}>
          {alerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.severity) }]}
              onPress={() => handleShareAlert(alert)}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>{getSeverityIcon(alert.severity)}</Text>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertDisease}>{alert.disease}</Text>
                  <Text style={styles.alertDistance}>Within {alert.distance} km</Text>
                </View>
                <TouchableOpacity style={styles.shareButton}>
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.alertLocation}>{alert.location}</Text>
              <Text style={styles.alertAction}>{alert.action}</Text>
              
              <Text style={styles.alertTime}>
                Detected {new Date(alert.detectedAt).toLocaleString('th-TH')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 16,
  },
  noAlerts: {
    alignItems: 'center',
    padding: 24,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertDisease: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  alertDistance: {
    fontSize: 14,
    color: '#8e8e93',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  alertLocation: {
    fontSize: 14,
    color: '#1d1d1f',
    marginBottom: 4,
  },
  alertAction: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
});