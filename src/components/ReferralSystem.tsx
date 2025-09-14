import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateShareCard } from '../lib/share-cards';

interface ReferralData {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  rewardsEarned: number;
  nextReward: number;
  qrCode: string;
  partnerShops: PartnerShop[];
}

interface PartnerShop {
  id: string;
  name: string;
  location: string;
  rewards: string[];
  distance: number;
  isActive: boolean;
}

interface ReferralSystemProps {
  onShareQR?: (qrData: any) => void;
}

export function ReferralSystem({ onShareQR }: ReferralSystemProps) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with real API call
  const mockReferralData: ReferralData = {
    userId: 'user123',
    referralCode: 'RAI123456',
    totalReferrals: 2,
    activeReferrals: 1,
    rewardsEarned: 150,
    nextReward: 50,
    qrCode: 'https://raiai.app/refer/RAI123456',
    partnerShops: [
      {
        id: '1',
        name: 'เกษตรกรไทย',
        location: 'Tambon Bang Kaeo',
        rewards: ['PPE Kit', '10% Discount'],
        distance: 2.3,
        isActive: true
      },
      {
        id: '2',
        name: 'ร้านปุ๋ยสมบูรณ์',
        location: 'Tambon Bang Phli',
        rewards: ['Free Consultation', '5% Discount'],
        distance: 3.1,
        isActive: true
      }
    ]
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`/api/referrals/${userId}`);
      // const data = await response.json();
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReferralData(mockReferralData);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareQR = async () => {
    if (!referralData) return;

    try {
      const shareCard = await generateShareCard({
        type: 'referral_qr',
        title: 'Join RaiAI',
        subtitle: 'Bring 3 neighbors → PPE/discount',
        message: `Scan QR code to join RaiAI and get rewards at partner shops`,
        qrCode: referralData.qrCode,
        referralCode: referralData.referralCode,
        rewards: ['PPE Kit', 'Shop Discounts', 'Free Consultation']
      });

      const shareOptions = {
        title: 'Join RaiAI - Get Rewards',
        message: `Bring 3 neighbors → PPE/discount at partner shop. Use code: ${referralData.referralCode}`,
        url: referralData.qrCode
      };

      await Share.share(shareOptions);
      onShareQR?.(shareCard);
    } catch (error) {
      console.error('Failed to share referral QR:', error);
      Alert.alert('Error', 'Failed to share referral QR');
    }
  };

  const handleCopyCode = () => {
    if (referralData) {
      // TODO: Implement clipboard copy
      Alert.alert('Copied', `Referral code: ${referralData.referralCode}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Referral System</Text>
        <Text style={styles.subtitle}>Loading referral data...</Text>
      </View>
    );
  }

  if (!referralData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Referral System</Text>
        <Text style={styles.subtitle}>Failed to load referral data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Referral System</Text>
      <Text style={styles.subtitle}>Bring 3 neighbors → PPE/discount at partner shop</Text>

      {/* Referral Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{referralData.totalReferrals}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{referralData.activeReferrals}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>฿{referralData.rewardsEarned}</Text>
          <Text style={styles.statLabel}>Rewards Earned</Text>
        </View>
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <Text style={styles.sectionTitle}>Your Referral QR Code</Text>
        <View style={styles.qrContainer}>
          <QRCode
            value={referralData.qrCode}
            size={120}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
        </View>
        <Text style={styles.referralCode}>Code: {referralData.referralCode}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
          <Text style={styles.copyButtonText}>Copy Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareQR}>
          <Text style={styles.shareButtonText}>Share QR</Text>
        </TouchableOpacity>
      </View>

      {/* Next Reward */}
      <View style={styles.rewardSection}>
        <Text style={styles.sectionTitle}>Next Reward</Text>
        <View style={styles.rewardCard}>
          <Text style={styles.rewardText}>
            ฿{referralData.nextReward} off at partner shops
          </Text>
          <Text style={styles.rewardSubtext}>
            {3 - referralData.activeReferrals} more referrals needed
          </Text>
        </View>
      </View>

      {/* Partner Shops */}
      <View style={styles.shopsSection}>
        <Text style={styles.sectionTitle}>Partner Shops</Text>
        {referralData.partnerShops.map((shop) => (
          <View key={shop.id} style={styles.shopCard}>
            <View style={styles.shopHeader}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopDistance}>{shop.distance} km</Text>
            </View>
            <Text style={styles.shopLocation}>{shop.location}</Text>
            <View style={styles.rewardsList}>
              {shop.rewards.map((reward, index) => (
                <Text key={index} style={styles.rewardItem}>• {reward}</Text>
              ))}
            </View>
            <View style={styles.shopStatus}>
              <View style={[styles.statusDot, { backgroundColor: shop.isActive ? '#34C759' : '#8E8E93' }]} />
              <Text style={styles.statusText}>
                {shop.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>How to Use</Text>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionNumber}>1</Text>
          <Text style={styles.instructionText}>Share your QR code with neighbors</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionNumber}>2</Text>
          <Text style={styles.instructionText}>They scan and join RaiAI</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionNumber}>3</Text>
          <Text style={styles.instructionText}>Visit partner shop for rewards</Text>
        </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: '#8E8E93',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  rewardSection: {
    marginBottom: 20,
  },
  rewardCard: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  rewardSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  shopsSection: {
    marginBottom: 20,
  },
  shopCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  shopDistance: {
    fontSize: 12,
    color: '#8e8e93',
  },
  shopLocation: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
  },
  rewardsList: {
    marginBottom: 8,
  },
  rewardItem: {
    fontSize: 14,
    color: '#1d1d1f',
    marginBottom: 2,
  },
  shopStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#1d1d1f',
    flex: 1,
  },
});
