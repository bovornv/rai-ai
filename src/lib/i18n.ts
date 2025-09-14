// i18n.ts
// Simple key-value localization (Thai + English fallback)

export const i18n = {
  th: {
    // Common
    ok: "ตกลง",
    cancel: "ยกเลิก",
    back: "ย้อนกลับ",
    retry: "ลองอีกครั้ง",
    offlineMode: "โหมดออฟไลน์",
    uncertain: "ยังไม่แน่ใจ แนะนำรอ 2 วันแล้วสแกนใหม่",

    // Today tab
    today: "วันนี้",
    sprayWindow_good: "ฉีดพ่นได้",
    sprayWindow_caution: "ระวัง",
    sprayWindow_dont: "หลีกเลี่ยงวันนี้",
    sprayReminder: "แจ้งเตือนให้ฉีดพ่น",

    outbreakRadar: "เรดาร์โรค",
    outbreakNearbyRice: "พบโรคข้าวเพิ่มในรัศมี 3 กม.",
    outbreakNearbyDurian: "พบโรคทุเรียนเพิ่มในรัศมี 3 กม.",
    outbreakShareCaption: "พบการระบาดในพื้นที่ ระวังการฉีดพ่นช่วงลมแรง",

    // Scan flow
    scan: "สแกน",
    scanning: "กำลังสแกน...",
    scanComplete: "ผลการสแกน",
    recheckIn2Days: "ตรวจสอบอีกครั้งใน 2 วัน",
    steps: "ขั้นตอน",
    step_spray: "ฉีดพ่นตามคำแนะนำ",
    step_wait: "รอก่อน",
    step_recheck: "สแกนใหม่ภายหลัง",
    ppeWarning: "สวมถุงมือและหน้ากากทุกครั้ง",

    // Spray Window
    sprayWindow_good: "ฉีดพ่นได้",
    sprayWindow_caution: "ระวัง",
    sprayWindow_dont: "ไม่ควรฉีดพ่น",

    mixingCalculator: "เครื่องคำนวณผสมยา",
    tankSize: "ขนาดถัง (ลิตร)",
    dosage: "ปริมาณสารเคมีที่ต้องใช้",

    // Prices
    prices: "ราคา",
    ricePrice: "ราคาข้าว (บาท/ตัน)",
    durianPrice: "ราคาทุเรียน (บาท/กก.)",
    priceAlert: "ตั้งการแจ้งเตือนราคา",
    priceAlertPro: "Pro เท่านั้น: การแจ้งเตือนราคาไม่จำกัด",
    buyerDirectory: "ผู้ซื้อ",
    callBuyer: "โทร",
    lineBuyer: "LINE",

    // Shop Ticket
    shopTicket: "ตั๋วร้านค้า",
    diagnosis: "การวินิจฉัย",
    recommendedProducts: "ประเภทสินค้าที่แนะนำ",
    showAtShop: "แสดง QR นี้ที่ร้านค้า",
    ticketFulfilled: "ยืนยันการขายแล้ว",

    // Pro upsell
    proFeature: "คุณสมบัติ Pro",
    proOnly: "สำหรับผู้ใช้ Pro",
    upgradeToPro: "อัปเกรดเป็น Pro",

    // Navigation
    home: "หน้าหลัก",
    fields: "แปลง/สวน",
    sell: "ขาย/ราคา",
    help: "ช่วยเหลือ/ชุมชน",
    settings: "ตั้งค่า",
    counter: "เคาน์เตอร์ร้านค้า",

    // App specific
    raiAI: "RaiAI",
    smartFarmer: "ผู้ช่วยเกษตรกรอัจฉริยะ",
    aiFarmingAssistant: "AI Farming Assistant",
    scanRiceLeaves: "สแกนใบข้าว",
    scanDurianLeaves: "สแกนใบทุเรียน",
    healthyScans: "Healthy Scans",
    totalScans: "Total Scans",
    diseasesFound: "Diseases Found",
    costs: "ต้นทุน",
    history: "ประวัติ",
    dataSharing: "การแชร์ข้อมูล",
    privacy: "ข้อมูลส่วนตัว",
    about: "เกี่ยวกับ",
    exportData: "ส่งออกข้อมูล",
    deleteAccount: "ลบบัญชี",
    version: "RaiAI v1.0.0",
    forThaiRiceFarmers: "สำหรับเกษตรกรข้าวไทย",
    forThaiRiceFarmersEn: "For Thai Rice Farmers",
    helpDevelopAI: "ช่วยพัฒนา AI โดยการแชร์ภาพแบบไม่ระบุตัวตน",
    enabled: "เปิดใช้งาน",

    // Share captions
    shareFromRaiAI: "แชร์จาก RaiAI",
    shareCaption: "แชร์ข้อความ",
    copyCaption: "คัดลอกข้อความ",
    shareToSocial: "แชร์ไปยังโซเชียล",
  },

  en: {
    // Common
    ok: "OK",
    cancel: "Cancel",
    back: "Back",
    retry: "Retry",
    offlineMode: "Offline Mode",
    uncertain: "Uncertain – wait 2 days and re-scan",

    // Today tab
    today: "Today",
    sprayWindow_good: "Good to spray",
    sprayWindow_caution: "Caution",
    sprayWindow_dont: "Don't spray today",
    sprayReminder: "Set spray reminder",

    outbreakRadar: "Outbreak Radar",
    outbreakNearbyRice: "Rice disease rising within 3 km",
    outbreakNearbyDurian: "Durian disease rising within 3 km",
    outbreakShareCaption: "Outbreak nearby. Avoid spraying in strong wind.",

    // Scan flow
    scan: "Scan",
    scanning: "Scanning...",
    scanComplete: "Scan Result",
    recheckIn2Days: "Recheck in 2 days",
    steps: "Steps",
    step_spray: "Spray as advised",
    step_wait: "Wait",
    step_recheck: "Re-scan later",
    ppeWarning: "Always wear gloves/mask",

    // Spray Window
    sprayWindow_good: "Good to Spray",
    sprayWindow_caution: "Caution",
    sprayWindow_dont: "Don't Spray",

    mixingCalculator: "Mixing Calculator",
    tankSize: "Tank size (liters)",
    dosage: "Required dosage",

    // Prices
    prices: "Prices",
    ricePrice: "Rice price (Baht/ton)",
    durianPrice: "Durian price (Baht/kg)",
    priceAlert: "Set price alert",
    priceAlertPro: "Pro only: Unlimited price alerts",
    buyerDirectory: "Buyers",
    callBuyer: "Call",
    lineBuyer: "LINE",

    // Shop Ticket
    shopTicket: "Shop Ticket",
    diagnosis: "Diagnosis",
    recommendedProducts: "Recommended product classes",
    showAtShop: "Show this QR at shop",
    ticketFulfilled: "Sale confirmed",

    // Pro upsell
    proFeature: "Pro Feature",
    proOnly: "Pro only",
    upgradeToPro: "Upgrade to Pro",

    // Navigation
    home: "Home",
    fields: "Fields",
    sell: "Sell & Prices",
    help: "Help & Community",
    settings: "Settings",
    counter: "Counter Mode",

    // App specific
    raiAI: "RaiAI",
    smartFarmer: "Smart Farmer Assistant",
    aiFarmingAssistant: "AI Farming Assistant",
    scanRiceLeaves: "Scan Rice Leaves",
    scanDurianLeaves: "Scan Durian Leaves",
    healthyScans: "Healthy Scans",
    totalScans: "Total Scans",
    diseasesFound: "Diseases Found",
    costs: "Costs",
    history: "History",
    dataSharing: "Data Sharing",
    privacy: "Privacy",
    about: "About",
    exportData: "Export Data",
    deleteAccount: "Delete Account",
    version: "RaiAI v1.0.0",
    forThaiRiceFarmers: "For Thai Rice Farmers",
    forThaiRiceFarmersEn: "For Thai Rice Farmers",
    helpDevelopAI: "Help develop AI by sharing anonymous images",
    enabled: "Enabled",

    // Share captions
    shareFromRaiAI: "Shared from RaiAI",
    shareCaption: "Share Caption",
    copyCaption: "Copy Caption",
    shareToSocial: "Share to Social",
  }
};

export type Language = 'th' | 'en';
export type I18nKey = keyof typeof i18n.th;

// Helper function to get translated text
export const t = (key: I18nKey, lang: Language = 'th'): string => {
  return i18n[lang][key] || i18n.en[key] || key;
};

// Detect system language (default to Thai for Thailand)
export const detectLanguage = (): Language => {
  if (typeof navigator !== 'undefined') {
    const systemLang = navigator.language.toLowerCase();
    if (systemLang.startsWith('th')) return 'th';
    if (systemLang.startsWith('en')) return 'en';
  }
  return 'th'; // Default to Thai for Thailand
};
