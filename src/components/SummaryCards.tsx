import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, Image } from 'react-native';
import { generateShareCard } from '../lib/share-cards';

interface BeforeAfterData {
  id: string;
  crop: 'rice' | 'durian';
  issue: string;
  beforeSeverity: number; // 1-5 scale
  afterSeverity: number; // 1-5 scale
  daysToImprove: number;
  beforeImage?: string;
  afterImage?: string;
  treatment: string;
  timestamp: string;
}

interface MonthEndSummary {
  month: string;
  year: number;
  totalSavings: number; // in THB
  totalRai: number;
  issuesResolved: number;
  treatmentsApplied: number;
  topCrop: 'rice' | 'durian';
  efficiency: number; // percentage
}

interface SummaryCardsProps {
  beforeAfterData?: BeforeAfterData[];
  monthEndSummary?: MonthEndSummary;
  onShareCard?: (cardData: any) => void;
}

export function SummaryCards({ beforeAfterData, monthEndSummary, onShareCard }: SummaryCardsProps) {
  const [selectedCard, setSelectedCard] = useState<'before-after' | 'month-end' | null>(null);

  // Mock data - replace with real API calls
  const mockBeforeAfterData: BeforeAfterData[] = [
    {
      id: '1',
      crop: 'rice',
      issue: 'Brown Spot',
      beforeSeverity: 3,
      afterSeverity: 1,
      daysToImprove: 3,
      treatment: 'Fungicide application',
      timestamp: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      crop: 'durian',
      issue: 'Fruit Rot',
      beforeSeverity: 4,
      afterSeverity: 2,
      daysToImprove: 5,
      treatment: 'Pruning and fungicide',
      timestamp: '2024-01-10T14:30:00Z'
    }
  ];

  const mockMonthEndSummary: MonthEndSummary = {
    month: 'January',
    year: 2024,
    totalSavings: 180,
    totalRai: 5.2,
    issuesResolved: 8,
    treatmentsApplied: 12,
    topCrop: 'rice',
    efficiency: 85
  };

  const handleShareBeforeAfter = async (data: BeforeAfterData) => {
    try {
      const improvement = data.beforeSeverity - data.afterSeverity;
      const shareCard = await generateShareCard({
        type: 'before_after',
        title: `${data.issue} Improvement`,
        subtitle: `${data.crop} - ${improvement} point improvement`,
        message: `${data.issue} ${data.beforeSeverity} → ${data.afterSeverity} in ${data.daysToImprove} days`,
        beforeImage: data.beforeImage,
        afterImage: data.afterImage,
        treatment: data.treatment,
        crop: data.crop,
        improvement: improvement
      });

      const shareOptions = {
        title: 'Crop Improvement - RaiAI',
        message: `${data.issue} ${data.beforeSeverity} → ${data.afterSeverity} in ${data.daysToImprove} days`,
        url: shareCard.url
      };

      await Share.share(shareOptions);
      onShareCard?.(shareCard);
    } catch (error) {
      console.error('Failed to share before/after card:', error);
      Alert.alert('Error', 'Failed to share improvement card');
    }
  };

  const handleShareMonthEnd = async (data: MonthEndSummary) => {
    try {
      const shareCard = await generateShareCard({
        type: 'month_end',
        title: 'Monthly Summary',
        subtitle: `${data.month} ${data.year}`,
        message: `Saved ฿${data.totalSavings}/rai this month`,
        totalSavings: data.totalSavings,
        totalRai: data.totalRai,
        issuesResolved: data.issuesResolved,
        efficiency: data.efficiency,
        topCrop: data.topCrop
      });

      const shareOptions = {
        title: 'Monthly Summary - RaiAI',
        message: `Saved ฿${data.totalSavings}/rai this month`,
        url: shareCard.url
      };

      await Share.share(shareOptions);
      onShareCard?.(shareCard);
    } catch (error) {
      console.error('Failed to share month-end card:', error);
      Alert.alert('Error', 'Failed to share monthly summary');
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return '#FF3B30';
    if (severity >= 3) return '#FF9500';
    if (severity >= 2) return '#FFCC00';
    return '#34C759';
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 4) return 'Critical';
    if (severity >= 3) return 'High';
    if (severity >= 2) return 'Moderate';
    return 'Low';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary Cards</Text>
      
      {/* Before/After Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Before/After Improvements</Text>
        {mockBeforeAfterData.map((data) => (
          <TouchableOpacity
            key={data.id}
            style={styles.card}
            onPress={() => handleShareBeforeAfter(data)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{data.issue}</Text>
              <Text style={styles.cardCrop}>{data.crop}</Text>
            </View>
            
            <View style={styles.improvementRow}>
              <View style={styles.severityContainer}>
                <Text style={styles.severityLabel}>Before</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(data.beforeSeverity) }]}>
                  <Text style={styles.severityText}>{data.beforeSeverity}</Text>
                </View>
              </View>
              
              <Text style={styles.arrow}>→</Text>
              
              <View style={styles.severityContainer}>
                <Text style={styles.severityLabel}>After</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(data.afterSeverity) }]}>
                  <Text style={styles.severityText}>{data.afterSeverity}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.improvementText}>
              {data.beforeSeverity - data.afterSeverity} point improvement in {data.daysToImprove} days
            </Text>
            
            <Text style={styles.treatmentText}>Treatment: {data.treatment}</Text>
            <Text style={styles.timestampText}>{formatDate(data.timestamp)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Month-End Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleShareMonthEnd(mockMonthEndSummary)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{mockMonthEndSummary.month} {mockMonthEndSummary.year}</Text>
            <Text style={styles.efficiencyText}>{mockMonthEndSummary.efficiency}% efficiency</Text>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>฿{mockMonthEndSummary.totalSavings}</Text>
              <Text style={styles.summaryLabel}>Saved per rai</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{mockMonthEndSummary.totalRai}</Text>
              <Text style={styles.summaryLabel}>Total rai</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{mockMonthEndSummary.issuesResolved}</Text>
              <Text style={styles.summaryLabel}>Issues resolved</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{mockMonthEndSummary.treatmentsApplied}</Text>
              <Text style={styles.summaryLabel}>Treatments applied</Text>
            </View>
          </View>
          
          <Text style={styles.topCropText}>Top crop: {mockMonthEndSummary.topCrop}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  cardCrop: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  efficiencyText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  severityContainer: {
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
  },
  severityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 20,
    color: '#8e8e93',
    marginHorizontal: 16,
  },
  improvementText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  treatmentText: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  topCropText: {
    fontSize: 14,
    color: '#1d1d1f',
    textAlign: 'center',
  },
});
