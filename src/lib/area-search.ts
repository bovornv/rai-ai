import { GeohashUtil } from './geohash-util';
import { thailandAreas } from './thailand-areas';

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

export class AreaSearchService {
  static async search(query: string): Promise<AdminArea[]> {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return [];

    return thailandAreas
      .filter(area => 
        area.name.toLowerCase().includes(normalizedQuery) ||
        area.province.toLowerCase().includes(normalizedQuery) ||
        area.district.toLowerCase().includes(normalizedQuery) ||
        area.subdistrict.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 20); // Limit results
  }

  static async getAreaFromCoords(lat: number, lng: number): Promise<AdminArea> {
    // Find the closest area by distance
    let closestArea = thailandAreas[0];
    let minDistance = GeohashUtil.distanceKm(lat, lng, closestArea.lat, closestArea.lng);

    for (const area of thailandAreas) {
      const distance = GeohashUtil.distanceKm(lat, lng, area.lat, area.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestArea = area;
      }
    }

    return closestArea;
  }

  static getAreaById(id: string): AdminArea | undefined {
    return thailandAreas.find(area => area.id === id);
  }

  static getProvinces(): string[] {
    const provinces = new Set(thailandAreas.map(area => area.province));
    return Array.from(provinces).sort();
  }

  static getDistrictsByProvince(province: string): string[] {
    const districts = new Set(
      thailandAreas
        .filter(area => area.province === province)
        .map(area => area.district)
    );
    return Array.from(districts).sort();
  }

  static getSubdistrictsByDistrict(province: string, district: string): AdminArea[] {
    return thailandAreas
      .filter(area => area.province === province && area.district === district)
      .sort((a, b) => a.subdistrict.localeCompare(b.subdistrict));
  }
}