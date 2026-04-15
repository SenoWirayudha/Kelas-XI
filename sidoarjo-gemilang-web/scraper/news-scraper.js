/**
 * Sidoarjo News Scraper v2.1
 *
 * Perbaikan v2.1:
 * - Selector SPESIFIK: div.blog_img > a > img.img-thumbnail (dari inspeksi HTML asli)
 * - resolveImageUrl menggunakan new URL(href, base) agar "../images/post/xxx.jpg"
 *   di-resolve dengan benar terhadap URL halaman saat ini
 * - Deteksi link detail: new URL(href, base) menggantikan string concat manual
 *   sehingga "../001/xxxxxxxxxx" tidak lagi menjadi "domain../001/xxx"
 *
 * Cara menjalankan:
 *   npm run scrape
 *   node scraper/news-scraper.js
 */

import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Konfigurasi ──────────────────────────────────────────────────────────────
const OUTPUT_DIR  = path.join(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'sidoarjo-news.json');

// Maksimal berita yang di-fetch detail per kecamatan
const MAX_DETAIL_PER_DISTRICT = 10;

// Delay antar request (ms) — hindari rate limit
const REQUEST_DELAY = 800;

// ─── Daftar URL ───────────────────────────────────────────────────────────────
const BASE_URLS = {
  main : 'https://www.sidoarjokab.go.id',
  news : 'https://www.sidoarjokab.go.id/berita',
  districts: {
    balongbendo : 'https://balongbendo.sidoarjokab.go.id/001/',
    buduran     : 'https://buduran.sidoarjokab.go.id/001/',
    candi       : 'https://candi.sidoarjokab.go.id/001/',
    gedangan    : 'https://gedangan.sidoarjokab.go.id/001/',
    jabon       : 'https://jabon.sidoarjokab.go.id/001/',
    krembung    : 'https://krembung.sidoarjokab.go.id/001/',
    krian       : 'https://krian.sidoarjokab.go.id/001/',
    porong      : 'https://porong.sidoarjokab.go.id/001/',
    prambon     : 'https://prambon.sidoarjokab.go.id/001/',
    sedati      : 'https://sedati.sidoarjokab.go.id/001/',
    sidoarjo    : 'https://sidoarjo.sidoarjokab.go.id/001/',
    sukodono    : 'https://sukodono.sidoarjokab.go.id/001/',
    taman       : 'https://taman.sidoarjokab.go.id/001/',
    tanggulangin: 'https://tanggulangin.sidoarjokab.go.id/001/',
    tarik       : 'https://tarik.sidoarjokab.go.id/001/',
    tulangan    : 'https://tulangan.sidoarjokab.go.id/001/',
    waru        : 'https://waru.sidoarjokab.go.id/001/',
    wonoayu     : 'https://wonoayu.sidoarjokab.go.id/001/',
  },
};

// Kecamatan yang akan di-scrape — ubah sesuai kebutuhan
const DISTRICTS_TO_SCRAPE = [
  'buduran', 'gedangan', 'waru', 'tanggulangin',
  'sidoarjo', 'candi', 'krian', 'taman',
];

// ─── Utility: Fetch dengan timeout ───────────────────────────────────────────
async function fetchWithTimeout(url, timeout = 12000) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

    return await response.text();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`   ❌ Gagal fetch ${url} — ${err.message}`);
    return null;
  }
}

// ─── Utility: Delay ──────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Utility: href/src relatif → absolute URL ────────────────────────────────
/**
 * Mengonversi href atau src (bisa "../xxx", "/xxx", atau "https://xxx")
 * ke absolute URL yang benar menggunakan URL API bawaan Node.js.
 *
 * Contoh:
 *   toAbsolute("../images/post/foto.jpg", "https://buduran.sidoarjokab.go.id/001/")
 *   → "https://buduran.sidoarjokab.go.id/images/post/foto.jpg"  ✅
 *
 *   toAbsolute("../001/1536802599", "https://buduran.sidoarjokab.go.id/001/")
 *   → "https://buduran.sidoarjokab.go.id/001/1536802599"  ✅
 */
function toAbsolute(relativeOrAbsolute, baseUrl) {
  if (!relativeOrAbsolute) return null;
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return null;
  }
}

// ─── Utility: Resolve URL gambar dari elemen <img> ───────────────────────────
/**
 * Membaca src gambar dari berbagai atribut (lazy load support),
 * lalu konversi ke absolute URL menggunakan toAbsolute().
 */
function resolveImageUrl($img, pageUrl) {
  if (!$img || $img.length === 0) return null;

  // Cek semua atribut yang mungkin berisi URL gambar (termasuk lazy load)
  const srcAttrs = ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-img', 'data-url'];

  for (const attr of srcAttrs) {
    const val = $img.attr(attr);
    if (val && val.trim() && !val.startsWith('data:image')) {
      return toAbsolute(val.trim(), pageUrl);
    }
  }

  return null;
}

// ─── Utility: Heuristik apakah gambar adalah icon/logo ───────────────────────
function isIconOrLogo(url, $img) {
  const lower = url.toLowerCase();
  const skipWords = ['logo', 'icon', 'favicon', 'sprite', 'button',
                     'bg.', 'background', 'loading', 'placeholder', 'blank', 'pixel'];

  for (const w of skipWords) {
    if (lower.includes(w)) return true;
  }

  // Gambar kecil (icon biasanya < 80px)
  const w = parseInt($img.attr('width')  || '0', 10);
  const h = parseInt($img.attr('height') || '0', 10);
  if ((w > 0 && w < 80) || (h > 0 && h < 80)) return true;

  return false;
}

// ─── Utility: Cari gambar terbaik di halaman ─────────────────────────────────
/**
 * Strategi bertingkat:
 *
 * 1. Selector SPESIFIK website kecamatan sidoarjokab.go.id:
 *       div.blog_img img.img-thumbnail
 *    (dari inspeksi HTML: <div class="blog_img"><a href="#"><img class="img-thumbnail" src="../images/post/IMAGE-NEWS-xxx.jpg">)
 *    src-nya relative "../images/post/..." → toAbsolute() handle ini dengan benar
 *
 * 2. Area konten artikel secara umum
 * 3. Scan semua img (fallback terakhir)
 */
function findBestImage($, pageUrl) {

  // ── 1. Selector spesifik website kecamatan Sidoarjo ────────────────────────
  const specificSelectors = [
    'div.blog_img img.img-thumbnail',  // selector utama dari inspeksi HTML
    '.blog_img img',                   // variasi tanpa class img
    '.blog-img img',                   // variasi dengan dash
    'div[class*="blog"] img',          // variasi nama class blog lainnya
  ];

  for (const sel of specificSelectors) {
    const $img = $(sel).first();
    if (!$img.length) continue;

    const url = resolveImageUrl($img, pageUrl);
    if (url && !isIconOrLogo(url, $img)) {
      return url;
    }
  }

  // ── 2. Area konten artikel umum ─────────────────────────────────────────────
  const contentSelectors = [
    '.konten', '.content', '.isi-berita', '.isi',
    'article', '.detail-berita', '.berita-content',
    '.post-content', '.entry-content', '#konten', '#content',
    '.view-content', '.field-body',
  ];

  for (const sel of contentSelectors) {
    const $area = $(sel);
    if (!$area.length) continue;

    let found = null;
    $area.find('img').each((_, el) => {
      if (found) return;
      const $img = $(el);
      const url  = resolveImageUrl($img, pageUrl);
      if (url && !isIconOrLogo(url, $img)) found = url;
    });

    if (found) return found;
  }

  // ── 3. Fallback: semua img di halaman ───────────────────────────────────────
  let fallback = null;
  $('img').each((_, el) => {
    if (fallback) return;
    const $img = $(el);
    const url  = resolveImageUrl($img, pageUrl);
    if (url && !isIconOrLogo(url, $img)) fallback = url;
  });

  return fallback;
}

// ─── Scrape halaman detail satu berita ───────────────────────────────────────
async function scrapeNewsDetail(detailUrl, districtName) {
  const html = await fetchWithTimeout(detailUrl);
  if (!html) return null;

  const $ = cheerio.load(html);

  // --- Judul ---
  const title =
    $('h1.judul, h1.title, h1').first().text().trim() ||
    $('h2.judul, h2.title').first().text().trim()     ||
    $('title').text().replace(/[-|–].*/,'').trim();

  if (!title || title.length < 5) return null;

  // --- Tanggal ---
  let dateStr = $('[class*="tanggal"], [class*="date"], [class*="waktu"], time').first().text().trim();

  if (!dateStr) {
    // Regex cari pola tanggal Indonesia di teks halaman
    $('span, small, p, div, td').each((_, el) => {
      if (dateStr) return;
      const t = $(el).text().trim();
      const m = t.match(
        /\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}/i,
      );
      if (m) dateStr = m[0];
    });
  }

  // --- Gambar (menggunakan selector spesifik + fallback) ---
  const imageUrl = findBestImage($, detailUrl);

  // --- Excerpt ---
  const excerpt =
    $('.konten p, .content p, .isi p, article p')
      .filter((_, el) => $(el).text().trim().length > 40)
      .first().text().trim().substring(0, 280) ||
    $('p')
      .filter((_, el) => $(el).text().trim().length > 40)
      .first().text().trim().substring(0, 280);

  const imgStatus = imageUrl ? `🖼️  ${imageUrl.split('/').pop()}` : '(no image)';
  console.log(`      ✔ ${title.substring(0, 50)}...`);
  console.log(`        ${imgStatus}`);

  return {
    id       : `${districtName.toLowerCase().replace(/\s/g,'-')}-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
    title,
    url      : detailUrl,
    image    : imageUrl || null,
    excerpt  : excerpt || '',
    date     : dateStr || new Date().toISOString(),
    source   : new URL(detailUrl).host,
    category : 'Kecamatan',
    district : districtName,
    scrapedAt: new Date().toISOString(),
  };
}

// ─── Scrape halaman listing kecamatan ────────────────────────────────────────
async function scrapeDistrictNews(districtKey, listingUrl) {
  const districtName = districtKey.charAt(0).toUpperCase() + districtKey.slice(1);
  console.log(`\n🏘️  Kecamatan ${districtName}`);
  console.log(`   Listing: ${listingUrl}`);

  const html = await fetchWithTimeout(listingUrl);
  if (!html) {
    console.log(`   ⚠️  Halaman tidak dapat diakses, dilewati.`);
    return [];
  }

  const $ = cheerio.load(html);

  // ── Kumpulkan link detail berita ────────────────────────────────────────────
  // Website kecamatan punya dua pola href:
  //   (a) relative : "../001/1536802599"  ← paling umum
  //   (b) absolute : "https://buduran.sidoarjokab.go.id/template-1/001/1536802599"
  //
  // Gunakan toAbsolute(href, listingUrl) agar "../" di-resolve dengan benar.
  const detailUrlSet = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';

    // Cocokkan pola: mengandung /001/ diikuti angka minimal 8 digit (Unix timestamp)
    if (!/\/001\/\d{8,}/.test(href)) return;

    const full = toAbsolute(href, listingUrl);
    if (full) detailUrlSet.add(full);
  });

  let detailUrls = [...detailUrlSet].slice(0, MAX_DETAIL_PER_DISTRICT);
  console.log(`   🔗 ${detailUrls.length} link berita /001/ ditemukan`);

  // Fallback: pola /NNN/xxxxxxxxxx (any section, not just 001)
  if (detailUrls.length === 0) {
    console.log(`   ⚠️  Tidak ada link /001/, coba pola fallback...`);
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!/\/\d{3}\/\d{9,}/.test(href)) return;
      const full = toAbsolute(href, listingUrl);
      if (full) detailUrlSet.add(full);
    });
    detailUrls = [...detailUrlSet].slice(0, MAX_DETAIL_PER_DISTRICT);
    console.log(`   🔗 Fallback: ${detailUrls.length} link ditemukan`);
  }

  if (detailUrls.length === 0) {
    console.log(`   ⚠️  Tidak ada link detail yang terdeteksi.`);
    return [];
  }

  // ── Fetch tiap halaman detail ───────────────────────────────────────────────
  const news = [];
  for (const url of detailUrls) {
    const item = await scrapeNewsDetail(url, districtName);
    if (item) news.push(item);
    await delay(REQUEST_DELAY);
  }

  const withImg = news.filter((n) => n.image).length;
  console.log(`   ✅ ${news.length} berita, ${withImg} dengan gambar`);

  return news;
}

// ─── Scrape website utama Pemkab ─────────────────────────────────────────────
async function scrapeMainNews() {
  console.log('\n📰 Scraping website utama Pemkab...');
  console.log(`   URL: ${BASE_URLS.news}`);

  const html = await fetchWithTimeout(BASE_URLS.news);
  if (!html) {
    console.log('   ⚠️  Tidak dapat diakses.');
    return [];
  }

  const $ = cheerio.load(html);
  const news = [];

  // Kumpulkan link berita
  const detailUrlSet = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/\/(berita|post|artikel|news)\/[^/]+$/.test(href)) {
      const full = toAbsolute(href, BASE_URLS.main) || href;
      detailUrlSet.add(full);
    }
  });

  const detailUrls = [...detailUrlSet].slice(0, 10);

  if (detailUrls.length > 0) {
    console.log(`   🔗 ${detailUrls.length} link berita ditemukan`);
    for (const url of detailUrls) {
      const item = await scrapeNewsDetail(url, 'Pemkab Sidoarjo');
      if (item) news.push({ ...item, category: 'Umum', district: null });
      await delay(REQUEST_DELAY);
    }
  } else {
    // Fallback: scrape dari listing langsung
    console.log('   ℹ️  Scraping dari listing langsung...');
    const selectors = ['.news-item', 'article', '.post-item', '.card', '.item-berita'];
    for (const selector of selectors) {
      const els = $(selector);
      if (!els.length) continue;

      els.each((i, el) => {
        const $el   = $(el);
        const title = $el.find('h1,h2,h3,h4,.title,a').first().text().trim();
        const href  = $el.find('a').first().attr('href');
        const image = resolveImageUrl($el.find('div.blog_img img.img-thumbnail, img').first(), BASE_URLS.news);
        const excerpt = $el.find('.excerpt,.description,p').first().text().trim().substring(0, 250);
        const date  = $el.find('[class*="date"],[class*="tanggal"],time').first().text().trim();

        if (!title || title.length < 5) return;

        news.push({
          id       : `main-${i + 1}`,
          title,
          url      : toAbsolute(href, BASE_URLS.main) || href,
          image,
          excerpt,
          date     : date || new Date().toISOString(),
          source   : 'sidoarjokab.go.id',
          category : 'Umum',
          district : null,
          scrapedAt: new Date().toISOString(),
        });
      });

      if (news.length) break;
    }
  }

  const withImg = news.filter((n) => n.image).length;
  console.log(`   ✅ ${news.length} berita, ${withImg} dengan gambar`);
  return news;
}

// ─── Placeholder (fallback jika semua scraping gagal) ────────────────────────
function generatePlaceholderNews() {
  return [
    {
      id: 'placeholder-1', title: 'Pembangunan Infrastruktur di Sidoarjo Terus Digenjot',
      url: BASE_URLS.news, image: null,
      excerpt: 'Pemerintah Kabupaten Sidoarjo terus mempercepat pembangunan infrastruktur untuk mendukung pertumbuhan ekonomi daerah.',
      date: '2025-04-10', source: 'sidoarjokab.go.id', category: 'Infrastruktur', district: null,
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'placeholder-2', title: 'UMKM Sidoarjo Go Digital: Pelatihan E-Commerce Massal',
      url: BASE_URLS.news, image: null,
      excerpt: 'Dinas Koperasi dan UMKM Sidoarjo menggelar pelatihan e-commerce untuk mendorong transformasi digital pelaku usaha.',
      date: '2025-04-08', source: 'sidoarjokab.go.id', category: 'Ekonomi', district: null,
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'placeholder-3', title: 'Festival Budaya Sidoarjo 2025 Sukses Digelar',
      url: BASE_URLS.news, image: null,
      excerpt: 'Festival Budaya Sidoarjo 2025 berhasil menarik ribuan pengunjung dengan menampilkan kesenian dan produk UMKM lokal.',
      date: '2025-04-05', source: 'sidoarjokab.go.id', category: 'Budaya', district: null,
      scrapedAt: new Date().toISOString(),
    },
  ];
}

// ─── Simpan ke JSON ──────────────────────────────────────────────────────────
async function saveToJson(news) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const data = {
    metadata: {
      scrapedAt : new Date().toISOString(),
      totalNews : news.length,
      withImage : news.filter((n) => n.image).length,
      districts : [...new Set(news.map((n) => n.district).filter(Boolean))],
      sources   : [...new Set(news.map((n) => n.source))],
      version   : '2.1.0',
    },
    news,
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Disimpan ke: ${OUTPUT_FILE}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function runScraper() {
  console.log('🚀 Sidoarjo News Scraper v2.1');
  console.log('='.repeat(55));

  const allNews       = [];
  const processedUrls = new Set();

  // 1. Website utama Pemkab
  const mainNews = await scrapeMainNews();
  mainNews.forEach((n) => { allNews.push(n); processedUrls.add(n.url); });

  // 2. Tiap kecamatan
  for (const districtKey of DISTRICTS_TO_SCRAPE) {
    const listingUrl = BASE_URLS.districts[districtKey];
    if (!listingUrl) {
      console.warn(`\n⚠️  URL "${districtKey}" tidak ditemukan, dilewati.`);
      continue;
    }

    const districtNews = await scrapeDistrictNews(districtKey, listingUrl);

    let added = 0;
    for (const item of districtNews) {
      if (!processedUrls.has(item.url)) {
        allNews.push(item);
        processedUrls.add(item.url);
        added++;
      }
    }

    console.log(`   📥 +${added} berita unik (total: ${allNews.length})`);
  }

  // 3. Fallback placeholder
  if (allNews.length < 3) {
    console.log('\n⚠️  Data terlalu sedikit, menambahkan placeholder...');
    allNews.push(...generatePlaceholderNews());
  }

  // 4. Simpan
  await saveToJson(allNews);

  // 5. Ringkasan
  const withImg = allNews.filter((n) => n.image).length;
  const pct     = allNews.length ? Math.round((withImg / allNews.length) * 100) : 0;
  console.log('\n' + '='.repeat(55));
  console.log('✅ Scraper selesai!');
  console.log(`📊 Total berita   : ${allNews.length}`);
  console.log(`🖼️  Dengan gambar  : ${withImg} (${pct}%)`);
  console.log(`📁 Output         : ${OUTPUT_FILE}`);
}

runScraper().catch(console.error);