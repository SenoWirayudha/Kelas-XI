/**
 * Utility untuk load dan mapping data berita hasil scraping
 * ke popup informasi kecamatan
 */

export type ScrapedNews = {
  id: string;
  title: string;
  url: string;
  image: string | null;
  excerpt: string;
  date: string;
  source: string;
  category: string;
  district: string | null;
  scrapedAt: string;
};

export type NewsByDistrict = Record<string, ScrapedNews[]>;

/**
 * Load data berita dari JSON file
 */
export async function loadScrapedNews(): Promise<ScrapedNews[]> {
  try {
    const response = await fetch('/data/sidoarjo-news.json');
    
    if (!response.ok) {
      console.warn('⚠️  Gagal load data berita:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('❌ Error loading news data:', error);
    return [];
  }
}

/**
 * Mapping berita berdasarkan kecamatan
 */
export function mapNewsByDistrict(news: ScrapedNews[]): NewsByDistrict {
  const districtMap: NewsByDistrict = {};

  news.forEach((item) => {
    if (item.district) {
      const district = item.district.toUpperCase();
      
      if (!districtMap[district]) {
        districtMap[district] = [];
      }
      
      districtMap[district].push(item);
    }
  });

  // Sort setiap kecamatan berdasarkan date (terbaru dulu)
  Object.keys(districtMap).forEach((district) => {
    districtMap[district].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  return districtMap;
}

/**
 * Get berita untuk kecamatan tertentu
 */
export function getNewsForDistrict(
  districtName: string,
  newsByDistrict: NewsByDistrict,
  limit: number = 2
): Array<{ title: string; description: string; image: string; imageAlt: string; url: string }> {
  const district = districtName.toUpperCase();
  const news = newsByDistrict[district] || [];

  // Ambil berita sesuai limit, fallback jika tidak ada
  const selectedNews = news.length > 0 ? news.slice(0, limit) : getFallbackNews(district);

  return selectedNews.map((item) => ({
    title: item.title,
    description: item.excerpt || 'Klik untuk membaca selengkapnya...',
    image: item.image || '/images/news/placeholder.jpg',
    imageAlt: item.title,
    url: item.url,
  }));
}

/**
 * Fallback news jika tidak ada data scraping
 */
function getFallbackNews(district: string): ScrapedNews[] {
  return [
    {
      id: `fallback-${district}-1`,
      title: `Pembangunan dan Pelayanan di ${district} Terus Ditingkatkan`,
      url: '#',
      image: null,
      excerpt: `Pemerintah Kecamatan ${district} terus meningkatkan pelayanan publik dan pembangunan infrastruktur untuk kesejahteraan masyarakat.`,
      date: new Date().toISOString(),
      source: 'sidoarjokab.go.id',
      category: 'Umum',
      district: district,
      scrapedAt: new Date().toISOString(),
    },
    {
      id: `fallback-${district}-2`,
      title: `Program Inovatif Kecamatan ${district} untuk Masyarakat`,
      url: '#',
      image: null,
      excerpt: `Berbagai program inovatif diluncurkan Kecamatan ${district} untuk memudahkan akses layanan publik dan mendorong pertumbuhan ekonomi lokal.`,
      date: new Date().toISOString(),
      source: 'sidoarjokab.go.id',
      category: 'Inovasi',
      district: district,
      scrapedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Helper untuk normalisasi nama kecamatan
 */
export function normalizeDistrictName(name: string): string {
  const normalizationMap: Record<string, string> = {
    'KECAMATAN ': '',
    'KABUPATEN ': '',
  };

  let normalized = name.toUpperCase();
  
  Object.entries(normalizationMap).forEach(([key, value]) => {
    normalized = normalized.replace(key, value);
  });

  return normalized.trim();
}
