# Restore Database - Moview Backend

Database saat ini dalam kondisi tidak konsisten karena migrate:fresh yang gagal. Berikut langkah untuk restore:

## Opsi 1: Import Backup Database (Tercepat)

Jika Anda memiliki backup database sebelum migrate:fresh, import saja:

```bash
mysql -u root -p apimoview < backup.sql
```

## Opsi 2: Perbaiki Manual (Jika tidak ada backup)

Jalankan perintah SQL berikut di MySQL:

```bash
mysql -u root -p apimoview
```

Kemudian jalankan SQL:

```sql
-- Drop database dan buat ulang
DROP DATABASE IF EXISTS apimoview;
CREATE DATABASE apimoview CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apimoview;
```

Lalu jalankan:

```bash
php artisan migrate
php artisan db:seed
```

## Opsi 3: Gunakan Laravel Migrate Refresh

```bash
# Hati-hati: Ini akan menghapus semua data!
php artisan migrate:refresh --seed
```

## Setelah Database Diperbaiki

Jalankan seeder untuk melengkapi data:

```bash
php artisan db:seed --class=MoviePersonSeeder
php artisan db:seed --class=CompleteMovieDataSeeder
```

## Verifikasi

Cek apakah data sudah lengkap:

```bash
php artisan tinker --execute="DB::table('movies')->count()"
php artisan tinker --execute="DB::table('persons')->count()"
php artisan tinker --execute="DB::table('movie_persons')->count()"
```

Harusnya:
- Movies: 7
- Persons: 20+
- Movie_persons: 30+
