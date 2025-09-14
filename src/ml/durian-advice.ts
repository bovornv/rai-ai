// Durian Disease Advice and Treatment Mapping
export interface DiseaseAdvice {
  ppe: string[];
  steps: string[];
  products: string[];
  recheckHours: number;
  tips?: string[];
  severity: "low" | "medium" | "high";
  urgency: "immediate" | "within_24h" | "within_48h" | "routine";
}

export interface DurianAdviceMap {
  [key: string]: DiseaseAdvice;
}

// Durian disease advice mapping
export const DURIAN_ADVICE: DurianAdviceMap = {
  "anthracnose": {
    ppe: [
      "ถุงมือยาง",
      "หน้ากากอนามัย",
      "เสื้อผ้าป้องกัน",
      "รองเท้าบูท"
    ],
    steps: [
      "ตัดแต่งส่วนที่ติดเชื้อออก",
      "ทำลายเศษพืชที่ติดเชื้อ",
      "พ่นสารเคมีป้องกันกำจัดเชื้อรา",
      "ปรับปรุงการระบายอากาศ",
      "ควบคุมความชื้นในแปลง"
    ],
    products: [
      "mancozeb",
      "copper_oxychloride",
      "propiconazole",
      "tebuconazole"
    ],
    recheckHours: 48,
    severity: "medium",
    urgency: "within_24h",
    tips: [
      "หลีกเลี่ยงการให้น้ำทางใบในช่วงเย็น",
      "เก็บเกี่ยวผลผลิตที่สุกแล้วทันที",
      "ทำความสะอาดเครื่องมือหลังใช้งาน"
    ]
  },
  "phytophthora_foot_rot": {
    ppe: [
      "ถุงมือยาง",
      "หน้ากากอนามัย",
      "เสื้อผ้าป้องกัน",
      "รองเท้าบูท",
      "แว่นตาป้องกัน"
    ],
    steps: [
      "ขุดดินรอบโคนต้นให้แห้ง",
      "ตัดแต่งรากที่เน่าเสีย",
      "ราดสารเคมีป้องกันกำจัดเชื้อรา",
      "ปรับปรุงการระบายน้ำ",
      "ใส่ปุ๋ยอินทรีย์เพื่อเพิ่มความแข็งแรง"
    ],
    products: [
      "phosphonate",
      "metalaxyl",
      "fosetyl_aluminium",
      "azoxystrobin"
    ],
    recheckHours: 48,
    severity: "high",
    urgency: "immediate",
    tips: [
      "หลีกเลี่ยงการให้น้ำมากเกินไป",
      "ตรวจสอบระบบระบายน้ำ",
      "ใช้ปุ๋ยที่มีฟอสฟอรัสสูง"
    ]
  },
  "leaf_spot": {
    ppe: [
      "ถุงมือยาง",
      "หน้ากากอนามัย",
      "เสื้อผ้าป้องกัน"
    ],
    steps: [
      "ตัดแต่งใบที่ติดเชื้อ",
      "พ่นสารเคมีป้องกันกำจัดเชื้อรา",
      "ปรับปรุงการระบายอากาศ",
      "ควบคุมความชื้นในแปลง"
    ],
    products: [
      "broad_spectrum_fungicide",
      "copper_oxychloride",
      "mancozeb",
      "chlorothalonil"
    ],
    recheckHours: 72,
    severity: "low",
    urgency: "within_48h",
    tips: [
      "หลีกเลี่ยงการให้น้ำทางใบ",
      "เก็บเศษใบที่ร่วงหล่น",
      "ตรวจสอบความชื้นในดิน"
    ]
  },
  "healthy": {
    ppe: [],
    steps: [],
    products: [],
    recheckHours: 72,
    severity: "low",
    urgency: "routine",
    tips: [
      "ติดตาม Spray Window",
      "เฝ้าระวัง 3–5 วัน",
      "ตรวจสอบความชื้นในดิน",
      "สังเกตอาการผิดปกติ"
    ]
  }
};

// Thai translations for UI
export const DURIAN_ADVICE_THAI = {
  "anthracnose": {
    name: "โรคแอนแทรคโนส",
    description: "โรคเชื้อราที่ทำให้เกิดจุดสีน้ำตาลบนผลและใบ",
    treatment: "ใช้สารเคมีป้องกันกำจัดเชื้อรา"
  },
  "phytophthora_foot_rot": {
    name: "โรครากเน่าไฟทอปธอรา",
    description: "โรคที่ทำให้รากและลำต้นเน่าเสีย",
    treatment: "ใช้สารเคมีป้องกันกำจัดเชื้อราและปรับปรุงการระบายน้ำ"
  },
  "leaf_spot": {
    name: "โรคใบจุด",
    description: "โรคที่ทำให้เกิดจุดบนใบ",
    treatment: "ใช้สารเคมีป้องกันกำจัดเชื้อรา"
  },
  "healthy": {
    name: "แข็งแรง",
    description: "ต้นทุเรียนแข็งแรง",
    treatment: "ดูแลรักษาต่อไป"
  }
};

// Product information for mixing calculator
export const DURIAN_PRODUCTS = {
  "mancozeb": {
    name: "แมนโคเซบ",
    dosage: "2-3 กรัม/ลิตร",
    interval: "7-10 วัน",
    category: "fungicide"
  },
  "copper_oxychloride": {
    name: "คอปเปอร์ออกซีคลอไรด์",
    dosage: "3-4 กรัม/ลิตร",
    interval: "7-14 วัน",
    category: "fungicide"
  },
  "propiconazole": {
    name: "โพรพิโคนาโซล",
    dosage: "1-2 มิลลิลิตร/ลิตร",
    interval: "10-14 วัน",
    category: "fungicide"
  },
  "tebuconazole": {
    name: "เทบูโคนาโซล",
    dosage: "1-2 มิลลิลิตร/ลิตร",
    interval: "10-14 วัน",
    category: "fungicide"
  },
  "phosphonate": {
    name: "ฟอสโฟเนต",
    dosage: "2-3 มิลลิลิตร/ลิตร",
    interval: "14-21 วัน",
    category: "systemic_fungicide"
  },
  "metalaxyl": {
    name: "เมทาลาซิล",
    dosage: "2-3 กรัม/ลิตร",
    interval: "14-21 วัน",
    category: "systemic_fungicide"
  },
  "fosetyl_aluminium": {
    name: "โฟเซทิลอะลูมิเนียม",
    dosage: "3-4 กรัม/ลิตร",
    interval: "14-21 วัน",
    category: "systemic_fungicide"
  },
  "azoxystrobin": {
    name: "อะซอกซีสโตรบิน",
    dosage: "1-2 มิลลิลิตร/ลิตร",
    interval: "7-10 วัน",
    category: "fungicide"
  },
  "broad_spectrum_fungicide": {
    name: "สารเคมีป้องกันกำจัดเชื้อราแบบกว้าง",
    dosage: "ตามฉลาก",
    interval: "7-14 วัน",
    category: "fungicide"
  },
  "chlorothalonil": {
    name: "คลอโรทาโลนิล",
    dosage: "2-3 มิลลิลิตร/ลิตร",
    interval: "7-10 วัน",
    category: "fungicide"
  }
};

// Get advice for a specific disease
export function getDurianAdvice(disease: string): DiseaseAdvice | null {
  return DURIAN_ADVICE[disease] || null;
}

// Get Thai translation for a disease
export function getDurianDiseaseThai(disease: string): { name: string; description: string; treatment: string } | null {
  return DURIAN_ADVICE_THAI[disease] || null;
}

// Get product information
export function getDurianProduct(productId: string): any {
  return DURIAN_PRODUCTS[productId] || null;
}

// Get all available diseases
export function getDurianDiseases(): string[] {
  return Object.keys(DURIAN_ADVICE);
}

// Get diseases by severity
export function getDurianDiseasesBySeverity(severity: "low" | "medium" | "high"): string[] {
  return Object.keys(DURIAN_ADVICE).filter(disease => 
    DURIAN_ADVICE[disease].severity === severity
  );
}

// Get diseases by urgency
export function getDurianDiseasesByUrgency(urgency: "immediate" | "within_24h" | "within_48h" | "routine"): string[] {
  return Object.keys(DURIAN_ADVICE).filter(disease => 
    DURIAN_ADVICE[disease].urgency === urgency
  );
}

// Generate treatment plan
export function generateDurianTreatmentPlan(disease: string): {
  disease: string;
  thai: { name: string; description: string; treatment: string };
  advice: DiseaseAdvice;
  products: any[];
} | null {
  const advice = getDurianAdvice(disease);
  const thai = getDurianDiseaseThai(disease);
  
  if (!advice || !thai) return null;
  
  const products = advice.products.map(productId => ({
    id: productId,
    ...getDurianProduct(productId)
  }));
  
  return {
    disease,
    thai,
    advice,
    products
  };
}

// Export default advice map
export default DURIAN_ADVICE;
