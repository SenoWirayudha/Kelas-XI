# 🎮 Panduan Penggunaan Aplikasi Earning Quiz App

## 📱 Cara Menggunakan Aplikasi

### 1. Pertama Kali Membuka Aplikasi

**Splash Screen**
- Aplikasi akan menampilkan logo dan nama "Earning Quiz App"
- Tunggu 3 detik, aplikasi akan otomatis masuk ke halaman login

### 2. Membuat Akun Baru (Sign Up)

1. Pada halaman Authentication, klik tab **"Sign Up"**
2. Isi form pendaftaran:
   - **Username**: Nama yang akan ditampilkan di aplikasi
   - **Email**: Email valid Anda
   - **Password**: Minimal 6 karakter
3. Klik tombol **"Sign Up"**
4. Anda akan mendapat **bonus 100 koin** 🎁
5. Otomatis masuk ke Halaman Beranda

### 3. Login (Jika Sudah Punya Akun)

1. Pada halaman Authentication, tab **"Login"** (default)
2. Masukkan:
   - **Email**: Email yang terdaftar
   - **Password**: Password Anda
3. Klik tombol **"Login"**
4. Masuk ke Halaman Beranda

### 4. Halaman Beranda (Home Screen)

**Fitur yang Tersedia:**

#### a. Header
- Sapaan personal: "Halo, [Nama Anda]!"
- Total koin Anda ditampilkan dengan icon 🪙

#### b. Kategori Kuis
Pilih salah satu dari 8 kategori:
- 🔬 **Sains** - Pertanyaan seputar sains
- 📜 **Sejarah** - Fakta sejarah dunia
- 💻 **Teknologi** - Tech & gadget
- 🔢 **Matematika** - Soal matematika
- 📚 **Bahasa** - Bahasa & sastra
- 🌍 **Geografi** - Tempat & negara
- ⚽ **Olahraga** - Sport facts
- 🎨 **Seni** - Seni & budaya

*Klik card kategori untuk memulai kuis (fitur ini akan dikembangkan)*

#### c. Bottom Navigation
Navigasi cepat ke 3 halaman utama:
- **Beranda** (icon view) - Halaman utama
- **Spin Wheel** (icon compass) - Bonus koin
- **Penarikan** (icon send) - Withdraw dana

### 5. Spin Wheel (Dapatkan Bonus Koin) 🎡

**Cara Menggunakan:**
1. Klik icon **Spin Wheel** di bottom navigation
2. Lihat total koin Anda di header
3. Klik tombol **"SPIN"**
4. Roda akan berputar selama 3 detik 🎰
5. Anda akan mendapat **10-100 koin** secara random!
6. Koin langsung ditambahkan ke saldo Anda
7. Spin lagi untuk mendapat lebih banyak koin!

**Tips:**
- Tidak ada batasan spin per hari
- Semakin banyak spin, semakin banyak koin!
- Gunakan koin untuk withdraw

### 6. Penarikan Dana (Withdrawal) 💰

**Syarat & Ketentuan:**
- Minimal penarikan: **1000 koin**
- Konversi: **1000 koin = Rp 10.000**
- Proses: **1-3 hari kerja**

**Langkah-langkah:**

1. Klik icon **Penarikan** di bottom navigation
2. Lihat **koin tersedia** di bagian atas
3. Isi form penarikan:

   **a. Jumlah Koin**
   - Masukkan jumlah koin yang ingin ditarik
   - Minimal 1000 koin
   - Tidak boleh lebih dari saldo Anda

   **b. Metode Pembayaran**
   - Pilih dari dropdown:
     - DANA
     - OVO
     - GoPay
     - ShopeePay
     - LinkAja
     - Bank Transfer (BCA)
     - Bank Transfer (Mandiri)
     - Bank Transfer (BRI)
     - Bank Transfer (BNI)

   **c. Nomor Akun/Telepon**
   - Masukkan nomor yang sesuai dengan metode:
     - E-wallet: Nomor HP yang terdaftar
     - Bank: Nomor rekening

4. Klik tombol **"Tarik Sekarang"**
5. Akan muncul **dialog konfirmasi**:
   - Review detail penarikan Anda
   - Klik **"Ya, Tarik"** untuk melanjutkan
   - Atau **"Batal"** untuk membatalkan

6. Jika berhasil:
   - Koin dikurangi dari saldo Anda
   - Muncul dialog sukses ✅
   - Form otomatis dikosongkan

**Contoh Perhitungan:**
```
Koin: 5000
Konversi: 5000 ÷ 1000 × 10.000 = Rp 50.000

Koin: 10000
Konversi: 10000 ÷ 1000 × 10.000 = Rp 100.000
```

## 🎯 Tips & Trik

### Cara Cepat Mengumpulkan Koin:
1. **Daftar** → Dapat 100 koin gratis
2. **Spin Wheel** → 10-100 koin per spin (unlimited!)
3. **Main Kuis** → Koin per jawaban benar *(coming soon)*
4. **Daily Bonus** → Login setiap hari *(coming soon)*

### Strategi Withdrawal:
- Kumpulkan minimal 10.000 koin (Rp 100.000) untuk withdraw yang worth it
- Pastikan data pembayaran sudah benar sebelum submit
- Catat nomor transaksi untuk tracking

## ❓ FAQ (Frequently Asked Questions)

**Q: Berapa koin yang saya dapat saat sign up?**
A: 100 koin gratis! 🎁

**Q: Apakah ada batasan spin wheel?**
A: Tidak ada batasan! Spin sesuka Anda! 🎡

**Q: Berapa lama proses withdrawal?**
A: 1-3 hari kerja (dalam aplikasi simulasi)

**Q: Berapa minimal withdrawal?**
A: Minimal 1000 koin (Rp 10.000)

**Q: Apakah data saya aman?**
A: Data disimpan lokal di device menggunakan SharedPreferences

**Q: Bagaimana cara logout?**
A: Fitur logout akan ditambahkan di profile screen *(coming soon)*

## 🐛 Troubleshooting

**Masalah: Aplikasi tidak bisa login**
- Pastikan email dan password benar
- Jika lupa, sign up dengan email baru

**Masalah: Koin tidak bertambah setelah spin**
- Tunggu animasi selesai (3 detik)
- Cek di halaman home untuk melihat update

**Masalah: Withdrawal tidak bisa**
- Pastikan koin minimal 1000
- Pilih metode pembayaran yang valid
- Isi nomor akun dengan benar

## 📞 Support

Jika ada pertanyaan atau masalah, hubungi developer atau check dokumentasi lengkap di `README.md`.

---

**Selamat menikmati Earning Quiz App!** 🎉
Kumpulkan koin sebanyak-banyaknya dan withdraw ke rekening Anda!
