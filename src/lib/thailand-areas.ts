import { GeohashUtil } from './geohash-util';

export interface AdminArea {
  id: string;
  name: string;
  province: string;
  district: string;
  subdistrict: string;
  lat: number;
  lng: number;
  geohash: string;
}

// Compressed Thailand admin areas (sample data for major rice/durian growing regions)
export const thailandAreas: AdminArea[] = [
  // Suphan Buri (Rice)
  {
    id: '72-01-01',
    name: 'ต.บางปลาม้า, อ.เมืองสุพรรณบุรี, จ.สุพรรณบุรี',
    province: 'สุพรรณบุรี',
    district: 'เมืองสุพรรณบุรี',
    subdistrict: 'บางปลาม้า',
    lat: 14.4745,
    lng: 100.1217,
    geohash: GeohashUtil.encode(14.4745, 100.1217, 6)
  },
  {
    id: '72-01-02',
    name: 'ต.รั้วใหญ่, อ.เมืองสุพรรณบุรี, จ.สุพรรณบุรี',
    province: 'สุพรรณบุรี',
    district: 'เมืองสุพรรณบุรี',
    subdistrict: 'รั้วใหญ่',
    lat: 14.4535,
    lng: 100.0981,
    geohash: GeohashUtil.encode(14.4535, 100.0981, 6)
  },
  {
    id: '72-02-01',
    name: 'ต.ด่านช้าง, อ.ด่านช้าง, จ.สุพรรณบุรี',
    province: 'สุพรรณบุรี',
    district: 'ด่านช้าง',
    subdistrict: 'ด่านช้าง',
    lat: 14.6138,
    lng: 99.9263,
    geohash: GeohashUtil.encode(14.6138, 99.9263, 6)
  },

  // Ayutthaya (Rice)
  {
    id: '14-01-01',
    name: 'ต.ประสาท, อ.เมืองพระนครศรีอยุธยา, จ.พระนครศรีอยุธยา',
    province: 'พระนครศรีอยุธยา',
    district: 'เมืองพระนครศรีอยุธยา',
    subdistrict: 'ประสาท',
    lat: 14.3692,
    lng: 100.5877,
    geohash: GeohashUtil.encode(14.3692, 100.5877, 6)
  },
  {
    id: '14-02-01',
    name: 'ต.บางไผ่, อ.บางไผ่, จ.พระนครศรีอยุธยา',
    province: 'พระนครศรีอยุธยา',
    district: 'บางไผ่',
    subdistrict: 'บางไผ่',
    lat: 14.2297,
    lng: 100.5136,
    geohash: GeohashUtil.encode(14.2297, 100.5136, 6)
  },

  // Chanthaburi (Durian)
  {
    id: '22-01-01',
    name: 'ต.ตลาด, อ.เมืองจันทบุรี, จ.จันทบุรี',
    province: 'จันทบุรี',
    district: 'เมืองจันทบุรี',
    subdistrict: 'ตลาด',
    lat: 12.6103,
    lng: 102.1038,
    geohash: GeohashUtil.encode(12.6103, 102.1038, 6)
  },
  {
    id: '22-02-01',
    name: 'ต.มะขาม, อ.มะขาม, จ.จันทบุรี',
    province: 'จันทบุรี',
    district: 'มะขาม',
    subdistrict: 'มะขาม',
    lat: 12.6531,
    lng: 102.2144,
    geohash: GeohashUtil.encode(12.6531, 102.2144, 6)
  },
  {
    id: '22-03-01',
    name: 'ต.ท่าใหม่, อ.ท่าใหม่, จ.จันทบุรี',
    province: 'จันทบุรี',
    district: 'ท่าใหม่',
    subdistrict: 'ท่าใหม่',
    lat: 12.4851,
    lng: 102.1094,
    geohash: GeohashUtil.encode(12.4851, 102.1094, 6)
  },

  // Rayong (Durian)
  {
    id: '21-01-01',
    name: 'ต.เนินคล้า, อ.เมืองระยอง, จ.ระยอง',
    province: 'ระยอง',
    district: 'เมืองระยอง',
    subdistrict: 'เนินคล้า',
    lat: 12.6806,
    lng: 101.2647,
    geohash: GeohashUtil.encode(12.6806, 101.2647, 6)
  },
  {
    id: '21-02-01',
    name: 'ต.บ้านค่าย, อ.บ้านค่าย, จ.ระยอง',
    province: 'ระยอง',
    district: 'บ้านค่าย',
    subdistrict: 'บ้านค่าย',
    lat: 12.9267,
    lng: 101.3303,
    geohash: GeohashUtil.encode(12.9267, 101.3303, 6)
  },

  // Trat (Durian)
  {
    id: '23-01-01',
    name: 'ต.วังกระแจะ, อ.เมืองตราด, จ.ตราด',
    province: 'ตราด',
    district: 'เมืองตราด',
    subdistrict: 'วังกระแจะ',
    lat: 12.2436,
    lng: 102.5153,
    geohash: GeohashUtil.encode(12.2436, 102.5153, 6)
  },
  {
    id: '23-02-01',
    name: 'ต.บ่อไร่, อ.บ่อไร่, จ.ตราด',
    province: 'ตราด',
    district: 'บ่อไร่',
    subdistrict: 'บ่อไร่',
    lat: 12.0617,
    lng: 102.5744,
    geohash: GeohashUtil.encode(12.0617, 102.5744, 6)
  },

  // Pathum Thani (Rice)
  {
    id: '13-01-01',
    name: 'ต.บางพูน, อ.เมืองปทุมธานี, จ.ปทุมธานี',
    province: 'ปทุมธานี',
    district: 'เมืองปทุมธานี',
    subdistrict: 'บางพูน',
    lat: 14.0208,
    lng: 100.5258,
    geohash: GeohashUtil.encode(14.0208, 100.5258, 6)
  },
  {
    id: '13-02-01',
    name: 'ต.คลองหลวง, อ.คลองหลวง, จ.ปทุมธานี',
    province: 'ปทุมธานี',
    district: 'คลองหลวง',
    subdistrict: 'คลองหลวง',
    lat: 14.0742,
    lng: 100.6597,
    geohash: GeohashUtil.encode(14.0742, 100.6597, 6)
  },

  // Nonthaburi (Rice)
  {
    id: '12-01-01',
    name: 'ต.สวนใหญ่, อ.เมืองนนทบุรี, จ.นนทบุรี',
    province: 'นนทบุรี',
    district: 'เมืองนนทบุรี',
    subdistrict: 'สวนใหญ่',
    lat: 13.8611,
    lng: 100.5144,
    geohash: GeohashUtil.encode(13.8611, 100.5144, 6)
  },
  {
    id: '12-02-01',
    name: 'ต.บางบัวทอง, อ.บางบัวทอง, จ.นนทบุรี',
    province: 'นนทบุรี',
    district: 'บางบัวทอง',
    subdistrict: 'บางบัวทอง',
    lat: 13.9483,
    lng: 100.4269,
    geohash: GeohashUtil.encode(13.9483, 100.4269, 6)
  }
];