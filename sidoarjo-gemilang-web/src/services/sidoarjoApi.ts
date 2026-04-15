/**
 * Service untuk mengambil data dari Open Data Kabupaten Sidoarjo
 * API Documentation: https://opendata.sidoarjokab.go.id/api/3/action/help
 */

const API_BASE = 'https://opendata.sidoarjokab.go.id/api/3/action';

// Resource IDs dari Open Data Sidoarjo
const RESOURCE_IDS = {
  POPULATION: '28ec4a65-e555-4342-bc87-519304f72b59', // Data penduduk per kecamatan
  AREA: '2b123ce8-81c0-4077-ae2a-d77a5c0cca97', // Luas daerah per kecamatan
};

export interface PopulationData {
  kecamatan: string;
  laki_laki: number;
  perempuan: number;
  jumlah: number;
}

export interface AreaData {
  kecamatan: string;
  ibukota: string;
  luas_daerah: string;
}

/**
 * Fetch semua data penduduk dari API
 */
export async function fetchAllPopulationData(): Promise<PopulationData[]> {
  try {
    const response = await fetch(
      `${API_BASE}/datastore_search?resource_id=${RESOURCE_IDS.POPULATION}&limit=500`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.result?.records) {
      return data.result.records.map((record: any) => ({
        kecamatan: record.KECAMATAN_DESA_KELURAHAN?.toUpperCase() || '',
        laki_laki: parseInt(record.LAKI_LAKI) || 0,
        perempuan: parseInt(record.PEREMPUAN) || 0,
        jumlah: parseInt(record.JUMLAH) || 0,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching population data:', error);
    return [];
  }
}

/**
 * Fetch semua data luas wilayah dari API
 */
export async function fetchAllAreaData(): Promise<AreaData[]> {
  try {
    const response = await fetch(
      `${API_BASE}/datastore_search?resource_id=${RESOURCE_IDS.AREA}&limit=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.result?.records) {
      return data.result.records.map((record: any) => ({
        kecamatan: record.KECAMATAN?.toUpperCase() || '',
        ibukota: record['IBUKOTA KECAMATAN'] || '',
        luas_daerah: record['LUAS DAERAH'] || '',
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching area data:', error);
    return [];
  }
}

/**
 * Fetch dan gabungkan data population dan area per kecamatan
 * Returns map dengan key nama kecamatan
 */
export async function fetchDistrictData(): Promise<
  Record<
    string,
    {
      population: string;
      area: string;
    }
  >
> {
  const [populationData, areaData] = await Promise.all([
    fetchAllPopulationData(),
    fetchAllAreaData(),
  ]);

  const districtMap: Record<
    string,
    {
      population: string;
      area: string;
    }
  > = {};

  // Map population data
  populationData.forEach((pop) => {
    const key = pop.kecamatan;
    if (!districtMap[key]) {
      districtMap[key] = { population: '0', area: '-' };
    }
    districtMap[key].population = pop.jumlah.toLocaleString('id-ID');
  });

  // Map area data
  areaData.forEach((area) => {
    const key = area.kecamatan;
    if (!districtMap[key]) {
      districtMap[key] = { population: '0', area: '-' };
    }
    // Parse luas area (biasanya dalam format "XX,XX km²" atau "XX.XX")
    const luasArea = area.luas_daerah.replace(/[^\d.,]/g, '').trim();
    districtMap[key].area = luasArea ? `${luasArea} km²` : '-';
  });

  return districtMap;
}

/**
 * Helper untuk normalisasi nama kecamatan
 * Beberapa data mungkin memiliki format yang berbeda
 */
export function normalizeDistrictName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}
