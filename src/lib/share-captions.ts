// Share Card Captions for RaiAI MVP
// Thai captions grouped by feature for social media sharing

export interface ShareCaption {
  id: string;
  text: string;
  category: 'spray' | 'outbreak' | 'scan' | 'progress' | 'summary' | 'shop';
  emoji?: string;
}

export const shareCaptions = {
  th: {
    spray: [
      {
        id: 'spray_safe',
        text: 'วันนี้ปลอดภัย ฉีดพ่นได้ ✅',
        category: 'spray' as const,
        emoji: '✅'
      },
      {
        id: 'spray_wind',
        text: 'ลมแรง ระวัง! 🚫 เลื่อนฉีดพ่นก่อน',
        category: 'spray' as const,
        emoji: '🚫'
      },
      {
        id: 'spray_rain',
        text: 'ฝนใกล้มา ☔ หลีกเลี่ยงฉีดพ่นวันนี้',
        category: 'spray' as const,
        emoji: '☔'
      }
    ],
    outbreak: [
      {
        id: 'outbreak_brown_spot',
        text: 'โรคใบจุดน้ำตาลกำลังระบาดในรัศมี 3 กม. ระวัง!',
        category: 'outbreak' as const,
        emoji: '🦠'
      },
      {
        id: 'outbreak_root_rot',
        text: 'แจ้งเตือน! พบโรครากเน่าในทุเรียนใกล้สวนคุณ',
        category: 'outbreak' as const,
        emoji: '⚠️'
      },
      {
        id: 'outbreak_neighbor',
        text: 'เพื่อนบ้านรายงานการระบาด แชร์เพื่อให้ทุกคนรู้ทัน!',
        category: 'outbreak' as const,
        emoji: '📢'
      }
    ],
    scan: [
      {
        id: 'scan_leaf_blight',
        text: 'ตรวจพบโรคใบไหม้ในข้าว รีบจัดการก่อนลุกลาม',
        category: 'scan' as const,
        emoji: '🔍'
      },
      {
        id: 'scan_durian_rot',
        text: 'ต้นทุเรียนมีอาการรากเน่า แนะนำวิธีป้องกันแล้ว',
        category: 'scan' as const,
        emoji: '🌳'
      },
      {
        id: 'scan_uncertain',
        text: 'ผลสแกน: อาการไม่ชัดเจน รอ 2 วันแล้วลองใหม่',
        category: 'scan' as const,
        emoji: '❓'
      }
    ],
    progress: [
      {
        id: 'progress_rice_improved',
        text: 'ใบข้าวจากโรค 3 → 1 ใน 3 วัน ดีขึ้นแล้ว 💪',
        category: 'progress' as const,
        emoji: '💪'
      },
      {
        id: 'progress_durian_better',
        text: 'อาการทุเรียนดีขึ้นหลังทำตามคำแนะนำ 🎉',
        category: 'progress' as const,
        emoji: '🎉'
      },
      {
        id: 'progress_field_health',
        text: 'เห็นผลจริง! สุขภาพแปลงดีขึ้นตามคำแนะนำ',
        category: 'progress' as const,
        emoji: '✨'
      }
    ],
    summary: [
      {
        id: 'summary_savings',
        text: 'เดือนนี้ประหยัดค่าใช้จ่าย ฿180/ไร่ 💵',
        category: 'summary' as const,
        emoji: '💵'
      },
      {
        id: 'summary_report',
        text: 'รายงานไร่: สุขภาพแปลงดีขึ้น + ต้นทุนลดลง',
        category: 'summary' as const,
        emoji: '📊'
      },
      {
        id: 'summary_results',
        text: 'ผลสรุปเดือนนี้: ทำตามแผนแล้วได้ผล!',
        category: 'summary' as const,
        emoji: '🏆'
      }
    ],
    shop: [
      {
        id: 'shop_qr',
        text: 'ใช้ QR นี้ที่ร้านใกล้บ้าน รับคำแนะนำตรงกับโรค',
        category: 'shop' as const,
        emoji: '📱'
      },
      {
        id: 'shop_ticket',
        text: 'ตั๋วร้านค้า: บอกประเภทสินค้าที่เหมาะสม',
        category: 'shop' as const,
        emoji: '🎫'
      },
      {
        id: 'shop_scan',
        text: 'แชร์ให้ร้านค้าสแกนแล้วรับสินค้าได้เลย',
        category: 'shop' as const,
        emoji: '🛒'
      }
    ]
  },
  en: {
    spray: [
      {
        id: 'spray_safe',
        text: 'Safe to spray today ✅',
        category: 'spray' as const,
        emoji: '✅'
      },
      {
        id: 'spray_wind',
        text: 'Strong wind warning! 🚫 Delay spraying',
        category: 'spray' as const,
        emoji: '🚫'
      },
      {
        id: 'spray_rain',
        text: 'Rain coming ☔ Avoid spraying today',
        category: 'spray' as const,
        emoji: '☔'
      }
    ],
    outbreak: [
      {
        id: 'outbreak_brown_spot',
        text: 'Brown spot disease outbreak within 3km radius. Be careful!',
        category: 'outbreak' as const,
        emoji: '🦠'
      },
      {
        id: 'outbreak_root_rot',
        text: 'Alert! Root rot found in durian near your farm',
        category: 'outbreak' as const,
        emoji: '⚠️'
      },
      {
        id: 'outbreak_neighbor',
        text: 'Neighbor reports outbreak. Share to keep everyone informed!',
        category: 'outbreak' as const,
        emoji: '📢'
      }
    ],
    scan: [
      {
        id: 'scan_leaf_blight',
        text: 'Detected rice leaf blight. Act quickly before it spreads',
        category: 'scan' as const,
        emoji: '🔍'
      },
      {
        id: 'scan_durian_rot',
        text: 'Durian tree shows root rot symptoms. Prevention tips provided',
        category: 'scan' as const,
        emoji: '🌳'
      },
      {
        id: 'scan_uncertain',
        text: 'Scan result: Symptoms unclear. Wait 2 days and try again',
        category: 'scan' as const,
        emoji: '❓'
      }
    ],
    progress: [
      {
        id: 'progress_rice_improved',
        text: 'Rice leaves: disease 3 → 1 in 3 days. Getting better 💪',
        category: 'progress' as const,
        emoji: '💪'
      },
      {
        id: 'progress_durian_better',
        text: 'Durian symptoms improved after following advice 🎉',
        category: 'progress' as const,
        emoji: '🎉'
      },
      {
        id: 'progress_field_health',
        text: 'Real results! Field health improved with recommendations',
        category: 'progress' as const,
        emoji: '✨'
      }
    ],
    summary: [
      {
        id: 'summary_savings',
        text: 'This month saved ฿180/rai in costs 💵',
        category: 'summary' as const,
        emoji: '💵'
      },
      {
        id: 'summary_report',
        text: 'Farm report: Field health improved + costs reduced',
        category: 'summary' as const,
        emoji: '📊'
      },
      {
        id: 'summary_results',
        text: 'Monthly summary: Following the plan works!',
        category: 'summary' as const,
        emoji: '🏆'
      }
    ],
    shop: [
      {
        id: 'shop_qr',
        text: 'Use this QR at nearby shop for disease-specific advice',
        category: 'shop' as const,
        emoji: '📱'
      },
      {
        id: 'shop_ticket',
        text: 'Shop ticket: Shows recommended product types',
        category: 'shop' as const,
        emoji: '🎫'
      },
      {
        id: 'shop_scan',
        text: 'Share with shop to scan and get products instantly',
        category: 'shop' as const,
        emoji: '🛒'
      }
    ]
  }
};

// Helper functions for caption management
export const getRandomCaption = (category: keyof typeof shareCaptions.th, language: 'th' | 'en' = 'th'): ShareCaption => {
  const captions = shareCaptions[language][category];
  const randomIndex = Math.floor(Math.random() * captions.length);
  return captions[randomIndex];
};

export const getAllCaptionsByCategory = (category: keyof typeof shareCaptions.th, language: 'th' | 'en' = 'th'): ShareCaption[] => {
  return shareCaptions[language][category];
};

export const getCaptionById = (id: string, language: 'th' | 'en' = 'th'): ShareCaption | undefined => {
  for (const category of Object.keys(shareCaptions[language]) as Array<keyof typeof shareCaptions.th>) {
    const caption = shareCaptions[language][category].find(c => c.id === id);
    if (caption) return caption;
  }
  return undefined;
};

// Branding footer for share cards
export const getShareFooter = (language: 'th' | 'en' = 'th'): string => {
  return language === 'th' ? 'แชร์จาก RaiAI' : 'Shared from RaiAI';
};
