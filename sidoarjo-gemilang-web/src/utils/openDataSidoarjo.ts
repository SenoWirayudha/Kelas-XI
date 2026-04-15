/**
 * Utility untuk fetch data dari Open Data Sidoarjo (CKAN API)
 * 
 * API Base: https://opendata.sidoarjokab.go.id/api/3/action/
 */

export type DistrictData = {
  district: string;
  population?: number;
  area?: number; // in km²
  year?: number;
};

type CKANResource = {
  id: string;
  name: string;
  url: string;
  format: string;
  description?: string;
};

type CKANPackage = {
  id: string;
  name: string;
  title: string;
  resources: CKANResource[];
};

type CKANResponse<T> = {
  help: string;
  success: boolean;
  result: T;
};

const OPEN_DATA_ORIGIN = 'https://opendata.sidoarjokab.go.id';
const OPEN_DATA_PROXY_PREFIX = '/opendata-proxy';
const CKAN_BASE_URL = import.meta.env.DEV
  ? `${OPEN_DATA_PROXY_PREFIX}/api/3/action`
  : `${OPEN_DATA_ORIGIN}/api/3/action`;

function normalizeOpenDataUrl(url: string): string {
  if (!import.meta.env.DEV) {
    return url;
  }

  if (url.startsWith(OPEN_DATA_PROXY_PREFIX)) {
    return url;
  }

  if (url.startsWith(OPEN_DATA_ORIGIN)) {
    return `${OPEN_DATA_PROXY_PREFIX}${url.slice(OPEN_DATA_ORIGIN.length)}`;
  }

  return url;
}

/**
 * Fetch CSV dari URL dan parse menjadi array of objects
 */
export async function fetchAndParseCSV(csvUrl: string): Promise<Record<string, string>[]> {
  try {
    const response = await fetch(normalizeOpenDataUrl(csvUrl));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('❌ Error fetching CSV:', error);
    return [];
  }
}

/**
 * Simple CSV parser
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : 
                    firstLine.includes('\t') ? '\t' : ',';

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      result.push(row);
    }
  }

  return result;
}

/**
 * Search dataset di CKAN
 */
export async function searchDatasets(query: string): Promise<CKANPackage[]> {
  try {
    const url = `${CKAN_BASE_URL}/package_search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data: CKANResponse<{ results: CKANPackage[] }> = await response.json();

    if (data.success) {
      return data.result.results;
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error searching datasets:', error);
    return [];
  }
}

/**
 * Get dataset details by ID
 */
export async function getDatasetById(id: string): Promise<CKANPackage | null> {
  try {
    const url = `${CKAN_BASE_URL}/package_show?id=${id}`;
    const response = await fetch(url);
    const data: CKANResponse<CKANPackage> = await response.json();

    if (data.success) {
      return data.result;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting dataset:', error);
    return null;
  }
}

/**
 * Fetch data populasi per kecamatan
 */
export async function fetchPopulationData(): Promise<DistrictData[]> {
  console.log('📊 Fetching population data from Open Data Sidoarjo...');

  // Try to fetch from known dataset
  const datasetId = 'jumlah-penduduk-menurut-kecamatan';
  
  try {
    const dataset = await getDatasetById(datasetId);
    
    if (dataset && dataset.resources.length > 0) {
      // Get first CSV resource
      const csvResource = dataset.resources.find(r => r.format.toLowerCase() === 'csv') || dataset.resources[0];
      
      if (csvResource) {
        console.log(`📥 Downloading: ${csvResource.name}`);
        const csvData = await fetchAndParseCSV(csvResource.url);
        
        // Parse CSV data to structured format
        return parsePopulationData(csvData);
      }
    }
  } catch (error) {
    console.error('⚠️  Failed to fetch population data from API, using fallback:', error);
  }

  // Fallback: search for dataset
  return searchAndParsePopulationData();
}

/**
 * Search dan parse data populasi
 */
async function searchAndParsePopulationData(): Promise<DistrictData[]> {
  try {
    const datasets = await searchDatasets('penduduk kecamatan');
    
    if (datasets.length > 0) {
      const dataset = datasets[0];
      const csvResource = dataset.resources.find(r => r.format.toLowerCase() === 'csv');
      
      if (csvResource) {
        const csvData = await fetchAndParseCSV(csvResource.url);
        return parsePopulationData(csvData);
      }
    }
  } catch (error) {
    console.error('❌ Error searching population data:', error);
  }

  return [];
}

/**
 * Parse CSV data ke format DistrictData
 */
function parsePopulationData(csvData: Record<string, string>[]): DistrictData[] {
  if (csvData.length === 0) return [];

  console.log(`📋 Parsed ${csvData.length} rows from population CSV`);
  
  // Try to detect column names
  const firstRow = csvData[0];
  const keys = Object.keys(firstRow);
  
  console.log('📊 CSV Columns:', keys);

  // Map columns (flexible detection)
  const districtKey = keys.find(k => 
    k.toLowerCase().includes('kecamatan') || 
    k.toLowerCase().includes('district')
  ) || keys[0];

  const populationKey = keys.find(k => 
    k.toLowerCase().includes('penduduk') ||
    k.toLowerCase().includes('jumlah') ||
    k.toLowerCase().includes('population') ||
    k.toLowerCase().includes('jiwa')
  ) || keys[1];

  const yearKey = keys.find(k => 
    k.toLowerCase().includes('tahun') ||
    k.toLowerCase().includes('year')
  );

  return csvData
    .filter(row => row[districtKey] && row[districtKey].toUpperCase() !== 'JUMLAH')
    .map(row => ({
      district: normalizeDistrictName(row[districtKey]),
      population: parseInt(row[populationKey]?.replace(/[,.]/g, '') || '0'),
      year: yearKey ? parseInt(row[yearKey] || '0') : undefined,
    }))
    .filter(d => d.population > 0);
}

/**
 * Fetch data luas wilayah per kecamatan
 */
export async function fetchAreaData(): Promise<DistrictData[]> {
  console.log('📐 Fetching area data from Open Data Sidoarjo...');

  // Try known dataset patterns
  const searchQueries = [
    'luas wilayah kecamatan',
    'luas daerah kecamatan',
    'wilayah kecamatan'
  ];

  for (const query of searchQueries) {
    try {
      const datasets = await searchDatasets(query);
      
      if (datasets.length > 0) {
        const dataset = datasets[0];
        const csvResource = dataset.resources.find(r => r.format.toLowerCase() === 'csv');
        
        if (csvResource) {
          console.log(`📥 Downloading: ${csvResource.name}`);
          const csvData = await fetchAndParseCSV(csvResource.url);
          const parsed = parseAreaData(csvData);
          
          if (parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed for query "${query}":`, error);
    }
  }

  return [];
}

/**
 * Parse CSV area data ke format DistrictData
 */
function parseAreaData(csvData: Record<string, string>[]): DistrictData[] {
  if (csvData.length === 0) return [];

  console.log(`📋 Parsed ${csvData.length} rows from area CSV`);

  const firstRow = csvData[0];
  const keys = Object.keys(firstRow);
  
  console.log('📊 CSV Columns:', keys);

  // Map columns
  const districtKey = keys.find(k => 
    k.toLowerCase().includes('kecamatan') || 
    k.toLowerCase().includes('district')
  ) || keys[0];

  const areaKey = keys.find(k => 
    k.toLowerCase().includes('luas') ||
    k.toLowerCase().includes('area') ||
    k.toLowerCase().includes('wilayah') ||
    k.toLowerCase().includes('km')
  ) || keys[1];

  const yearKey = keys.find(k => 
    k.toLowerCase().includes('tahun') ||
    k.toLowerCase().includes('year')
  );

  return csvData
    .filter(row => row[districtKey] && row[districtKey].toUpperCase() !== 'JUMLAH')
    .map(row => {
      // Parse area value (handle "41,03" or "41.03" format)
      const areaStr = row[areaKey]?.replace(',', '.').replace(/[^\d.]/g, '') || '0';
      const area = parseFloat(areaStr);

      return {
        district: normalizeDistrictName(row[districtKey]),
        area: area > 0 ? area : undefined,
        year: yearKey ? parseInt(row[yearKey] || '0') : undefined,
      };
    })
    .filter(d => d.area && d.area > 0);
}

/**
 * Normalize nama kecamatan
 */
function normalizeDistrictName(name: string): string {
  return name
    .toUpperCase()
    .replace(/^KECAMATAN\s+/i, '')
    .replace(/^KABUPATEN\s+/i, '')
    .trim();
}

/**
 * Fetch semua data (populasi + luas wilayah)
 */
export async function fetchAllDistrictData(): Promise<Record<string, DistrictData>> {
  console.log('\n🚀 Fetching all district data from Open Data Sidoarjo...\n');

  const [populationData, areaData] = await Promise.all([
    fetchPopulationData(),
    fetchAreaData()
  ]);

  console.log(`\n✅ Population data: ${populationData.length} districts`);
  console.log(`✅ Area data: ${areaData.length} districts`);

  // Merge data by district
  const merged: Record<string, DistrictData> = {};

  // Add population data
  populationData.forEach(d => {
    merged[d.district] = {
      district: d.district,
      population: d.population,
      year: d.year,
    };
  });

  // Merge area data
  areaData.forEach(d => {
    if (merged[d.district]) {
      merged[d.district].area = d.area;
      merged[d.district].year = d.year || merged[d.district].year;
    } else {
      merged[d.district] = {
        district: d.district,
        area: d.area,
        year: d.year,
      };
    }
  });

  console.log(`\n📊 Merged data for ${Object.keys(merged).length} districts\n`);

  return merged;
}
