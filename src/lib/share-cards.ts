interface ShareCardData {
  type: 'outbreak_alert' | 'shop_ticket' | 'before_after' | 'month_end' | 'referral_qr';
  title: string;
  subtitle: string;
  message: string;
  [key: string]: any; // Additional properties based on type
}

export async function generateShareCard(data: ShareCardData): Promise<{ url: string; imageUrl?: string }> {
  try {
    // TODO: Implement actual share card generation
    // This could use a service like Cloudinary, Canvas API, or a custom image generation service
    
    // For now, return a mock URL
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.raiai.app';
    const cardId = generateCardId();
    
    // Store card data (in a real implementation, this would be stored in a database)
    await storeCardData(cardId, data);
    
    return {
      url: `${baseUrl}/share/${cardId}`,
      imageUrl: `${baseUrl}/share/${cardId}/image`
    };
  } catch (error) {
    console.error('Failed to generate share card:', error);
    throw new Error('Failed to generate share card');
  }
}

function generateCardId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function storeCardData(cardId: string, data: ShareCardData): Promise<void> {
  // TODO: Implement actual data storage
  // This could store the card data in a database or cache
  console.log(`Storing card data for ${cardId}:`, data);
}

export function generateOutbreakAlertCard(alert: {
  disease: string;
  distance: number;
  location: string;
  action: string;
  severity: 'low' | 'moderate' | 'high';
}): ShareCardData {
  return {
    type: 'outbreak_alert',
    title: `${alert.disease} Alert`,
    subtitle: `Within ${alert.distance}km`,
    message: `${alert.disease} detected in ${alert.location}. ${alert.action}`,
    severity: alert.severity,
    location: alert.location,
    timestamp: new Date().toISOString()
  };
}

export function generateShopTicketCard(ticket: {
  id: string;
  crop: string;
  diagnosis: string;
  severity: string;
  recommendedClasses: string[];
  qrCode: string;
}): ShareCardData {
  return {
    type: 'shop_ticket',
    title: 'Shop Ticket',
    subtitle: `${ticket.crop} - ${ticket.diagnosis}`,
    message: `Diagnosis: ${ticket.diagnosis}\nSeverity: ${ticket.severity}\nRecommended: ${ticket.recommendedClasses.join(', ')}`,
    qrCode: ticket.qrCode,
    ticketId: ticket.id,
    status: 'issued'
  };
}

export function generateBeforeAfterCard(improvement: {
  issue: string;
  crop: string;
  beforeSeverity: number;
  afterSeverity: number;
  daysToImprove: number;
  treatment: string;
  beforeImage?: string;
  afterImage?: string;
}): ShareCardData {
  const improvementPoints = improvement.beforeSeverity - improvement.afterSeverity;
  return {
    type: 'before_after',
    title: `${improvement.issue} Improvement`,
    subtitle: `${improvement.crop} - ${improvementPoints} point improvement`,
    message: `${improvement.issue} ${improvement.beforeSeverity} → ${improvement.afterSeverity} in ${improvement.daysToImprove} days`,
    beforeImage: improvement.beforeImage,
    afterImage: improvement.afterImage,
    treatment: improvement.treatment,
    crop: improvement.crop,
    improvement: improvementPoints
  };
}

export function generateMonthEndCard(summary: {
  month: string;
  year: number;
  totalSavings: number;
  totalRai: number;
  issuesResolved: number;
  efficiency: number;
  topCrop: string;
}): ShareCardData {
  return {
    type: 'month_end',
    title: 'Monthly Summary',
    subtitle: `${summary.month} ${summary.year}`,
    message: `Saved ฿${summary.totalSavings}/rai this month`,
    totalSavings: summary.totalSavings,
    totalRai: summary.totalRai,
    issuesResolved: summary.issuesResolved,
    efficiency: summary.efficiency,
    topCrop: summary.topCrop
  };
}

export function generateReferralCard(referral: {
  referralCode: string;
  qrCode: string;
  rewards: string[];
}): ShareCardData {
  return {
    type: 'referral_qr',
    title: 'Join RaiAI',
    subtitle: 'Bring 3 neighbors → PPE/discount',
    message: `Scan QR code to join RaiAI and get rewards at partner shops`,
    qrCode: referral.qrCode,
    referralCode: referral.referralCode,
    rewards: referral.rewards
  };
}
