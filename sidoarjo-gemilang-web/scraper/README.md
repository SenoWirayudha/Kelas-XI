# 📰 Sidoarjo News Scraper

Scraper untuk mengambil berita dari website resmi Pemerintah Kabupaten Sidoarjo dan website kecamatan.

## 📋 Fitur

- ✅ Scraping berita dari website utama `sidoarjokab.go.id`
- ✅ Scraping berita dari 18 website kecamatan
- ✅ Output dalam format JSON
- ✅ Include metadata (judul, URL, gambar, tanggal, sumber)
- ✅ Error handling & timeout
- ✅ Rate limiting protection
- ✅ Placeholder news jika scraping gagal

## 🚀 Cara Menggunakan

### 1. Install Dependencies

```bash
npm run scrape:install
```

atau manual:

```bash
cd scraper
npm install
```

### 2. Jalankan Scraper

**Opsi 1 - Dari root project:**
```bash
npm run scrape
```

**Opsi 2 - Jalankan dengan install otomatis:**
```bash
npm run scrape:run
```

**Opsi 3 - Manual dari folder scraper:**
```bash
cd scraper
npm install
node news-scraper.js
```

### 3. Hasil Scraping

Hasil scraping akan disimpan di:
```
public/data/sidoarjo-news.json
```

## 📊 Struktur Data Output

```json
{
  "metadata": {
    "scrapedAt": "2025-04-14T10:30:00.000Z",
    "totalNews": 50,
    "sources": ["sidoarjokab.go.id", "buduran.sidoarjokab.go.id"],
    "version": "1.0.0"
  },
  "news": [
    {
      "id": "main-1",
      "title": "Judul Berita",
      "url": "https://www.sidoarjokab.go.id/berita/...",
      "image": "https://www.sidoarjokab.go.id/images/...",
      "excerpt": "Ringkasan berita...",
      "date": "2025-04-14",
      "source": "sidoarjokab.go.id",
      "category": "Umum",
      "district": null,
      "scrapedAt": "2025-04-14T10:30:00.000Z"
    }
  ]
}
```

## 🏘️ Daftar Website Kecamatan yang Di-Scrape

| No | Kecamatan | URL |
|----|-----------|-----|
| 1 | Balongbendo | https://balongbendo.sidoarj
okab.go.id |
| 2 | Buduran | https://buduran.sidoarjokab.go.id |
| 3 | Candi | https://candi.sidoarjokab.go.id |
| 4 | Gedangan | https://gedangan.sidoarjokab.go.id |
| 5 | Jabon | https://jabon.sidoarjokab.go.id |
| 6 | Krembung | https://krembung.sidoarjokab.go.id |
| 7 | Krian | https://krian.sidoarjokab.go.id |
| 8 | Porong | https://porong.sidoarjokab.go.id |
| 9 | Prambon | https://prambon.sidoarjokab.go.id |
| 10 | Sedati | https://sedati.sidoarjokab.go.id |
| 11 | Sidoarjo | https://sidoarjo.sidoarjokab.go.id |
| 12 | Sukodono | https://sukodono.sidoarjokab.go.id |
| 13 | Taman | https://taman.sidoarjokab.go.id |
| 14 | Tanggulangin | https://tanggulangin.sidoarjokab.go.id |
| 15 | Tarik | https://tarik.sidoarjokab.go.id |
| 16 | Tulangan | https://tulangan.sidoarjokab.go.id |
| 17 | Waru | https://waru.sidoarjokab.go.id |
| 18 | Wonoayu | https://wonoayu.sidoarjokab.go.id |

## ⚙️ Konfigurasi

Edit file `scraper/news-scraper.js` untuk:

### Mengubah daftar kecamatan yang di-scrape:
```javascript
const districtsToScrape = ['buduran', 'gedangan', 'waru'];
```

### Mengubah timeout:
```javascript
const html = await fetchWithTimeout(newsUrl, 15000); // 15 detik
```

### Mengubah delay antar request:
```javascript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 detik
```

## 🔄 Auto Update (Scheduled)

Untuk menjalankan scraper secara otomatis, gunakan **Windows Task Scheduler** atau **cron job** (Linux/Mac).

### Windows Task Scheduler:
1. Buka Task Scheduler
2. Create Basic Task
3. Trigger: Daily/Weekly
4. Action: Start a program
   - Program: `node`
   - Arguments: `scraper/news-scraper.js`
   - Start in: `D:\KELAS-XI\Tugas PKL\sidoarjo-gemilang-web`

### Cron Job (Linux/Mac):
```bash
# Jalankan setiap hari jam 8 pagi
0 8 * * * cd /path/to/project && node scraper/news-scraper.js
```

## ⚠️ Catatan Penting

1. **CORS Policy**: Scraper ini dijalankan di server-side (Node.js), bukan di browser
2. **Rate Limiting**: Delay 1 detik antar request untuk menghindari blokir
3. **Struktur HTML**: Selector CSS di scraper harus disesuaikan dengan struktur HTML website
4. **Updates**: Jika struktur website berubah, update selector di `news-scraper.js`

## 🐛 Troubleshooting

### Error: "Cannot find module 'cheerio'"
```bash
cd scraper
npm install
```

### Error: "fetch is not defined"
- Pastikan menggunakan Node.js versi 18+
- Atau install `node-fetch`:
  ```bash
  npm install node-fetch
  ```

### Scraping menghasilkan 0 berita
- Periksa struktur HTML website target
- Update selector CSS di fungsi `scrapeMainNews()` dan `scrapeDistrictNews()`
- Cek apakah website memblokir scraping

### Timeout error
- Naikkan timeout di fungsi `fetchWithTimeout()`
- Periksa koneksi internet

## 📝 Dependencies

- **cheerio**: HTML parser (seperti jQuery untuk Node.js)
- **fetch API**: Built-in Node.js 18+

## 📄 License

MIT License - Feel free to use for your project!

## 👨‍💻 Author

Created for Sidoarjo Government Portal Project
