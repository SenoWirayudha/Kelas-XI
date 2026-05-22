# 📷 Image Placeholder Guide

Panduan untuk mengganti placeholder gambar dengan gambar asli Anda.

## 🎯 Lokasi Placeholder Images

### 1. **Home Page** (`src/pages/Home.jsx`)
```jsx
// Gallery items dengan class art-1 sampai art-6
{ id: 'post-1', title: 'Aura Flux', art: 'art-1' }
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.art-1`, `.art-2`, `.art-3`, `.art-4`, `.art-5`, `.art-6`
- Tambahkan `background-image: url('path/to/your/image.jpg');`

**Contoh:**
```css
.art-1 {
  --media-ratio: 110%;
  background-image: url('/src/assets/gallery-1.jpg');
  background-size: cover;
  background-position: center;
}
```

---

### 2. **Projects Page** (`src/pages/Projects.jsx`)
```jsx
// Project cards dengan class project-art-*
art: 'project-art-lumina'
art: 'project-art-concrete'
art: 'project-art-chromatic'
art: 'project-art-noir'
art: 'project-art-nexus'
art: 'project-art-orbital'
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.project-art-lumina`, `.project-art-concrete`, dll
- Tambahkan `background-image: url('path/to/your/image.jpg');`

**Contoh:**
```css
.project-art-lumina {
  background-image: url('/src/assets/project-lumina.jpg');
  background-size: cover;
  background-position: center;
  height: 220px;
}
```

---

### 3. **Boards Page** (`src/pages/Boards.jsx`)
```jsx
// Board thumbnails dengan class thumb-a, thumb-b, thumb-c, thumb-d
<div className="board-thumb thumb-a"></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.thumb-a`, `.thumb-b`, `.thumb-c`, `.thumb-d`
- Tambahkan `background-image: url('path/to/your/image.jpg');`

**Contoh:**
```css
.thumb-a {
  background-image: url('/src/assets/board-thumb-1.jpg');
  background-size: cover;
  background-position: center;
}
```

---

### 4. **Board Detail Page** (`src/pages/BoardDetail.jsx`)
```jsx
// Masonry grid assets
<div className={`placeholder-image ${asset.imageUrl}`}></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.placeholder-image.project-art-lumina`, `.placeholder-image.art-1`, dll
- Tambahkan `background-image: url('path/to/your/image.jpg');`

**Contoh:**
```css
.placeholder-image.project-art-lumina {
  background-image: url('/src/assets/asset-1.jpg');
  background-size: cover;
  background-position: center;
}
```

---

### 5. **Profile Page** (`src/pages/Profile.jsx`)

#### Profile Banner:
```jsx
<div className="profile-backdrop"></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.profile-backdrop`
- Ganti `--profile-backdrop` variable

**Contoh:**
```css
.profile-backdrop {
  --profile-backdrop: url('/src/assets/profile-banner.jpg');
  background-image: var(--profile-backdrop);
  background-size: cover;
  background-position: center;
}
```

#### Profile Avatar:
```jsx
<div className="profile-avatar"></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.profile-avatar`
- Tambahkan `background-image: url('path/to/your/avatar.jpg');`

**Contoh:**
```css
.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-image: url('/src/assets/avatar.jpg');
  background-size: cover;
  background-position: center;
  border: 4px solid rgb(18, 18, 18);
}
```

---

### 6. **Post Detail Page** (`src/pages/PostDetail.jsx`)

#### Main Post Image:
```jsx
<div className={`post-detail-image ${post.image}`}></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.post-detail-image`
- Tambahkan `background-image: url('path/to/your/image.jpg');`

**Contoh:**
```css
.post-detail-image {
  background-image: url('/src/assets/post-main.jpg');
  background-size: cover;
  background-position: center;
}
```

#### Author Avatar:
```jsx
<div className={`author-avatar ${post.author.avatar}`}></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.author-avatar`
- Tambahkan `background-image: url('path/to/your/avatar.jpg');`

**Contoh:**
```css
.author-avatar {
  background-image: url('/src/assets/author-avatar.jpg');
  background-size: cover;
  background-position: center;
}
```

#### Comment Avatars:
```jsx
<div className={`comment-avatar ${comment.avatar}`}></div>
```

**Cara mengganti:**
- Buka `src/App.css`
- Cari `.comment-avatar`
- Tambahkan `background-image: url('path/to/your/avatar.jpg');`

---

## 🎨 Tips Mengganti Gambar

### Metode 1: Menggunakan URL Eksternal
```css
.art-1 {
  background-image: url('https://images.unsplash.com/photo-xxx');
}
```

### Metode 2: Menggunakan File Lokal
1. Letakkan gambar di folder `public/images/`
2. Gunakan path relatif:
```css
.art-1 {
  background-image: url('/images/gallery-1.jpg');
}
```

### Metode 3: Import di Assets
1. Letakkan gambar di `src/assets/`
2. Import di component atau CSS

---

## 📋 Checklist Placeholder Images

### Home Page
- [ ] art-1 (Gallery Image 1)
- [ ] art-2 (Gallery Image 2)
- [ ] art-3 (Gallery Image 3)
- [ ] art-4 (Gallery Image 4)
- [ ] art-5 (Gallery Image 5)
- [ ] art-6 (Gallery Image 6)

### Projects Page
- [ ] project-art-lumina
- [ ] project-art-concrete
- [ ] project-art-chromatic
- [ ] project-art-noir
- [ ] project-art-nexus
- [ ] project-art-orbital

### Boards Page
- [ ] thumb-a (Board Thumbnail 1)
- [ ] thumb-b (Board Thumbnail 2)
- [ ] thumb-c (Board Thumbnail 3)
- [ ] thumb-d (Board Thumbnail 4)

### Board Detail Page
- [ ] Masonry grid assets (18 images)

### Profile Page
- [ ] profile-backdrop (Banner)
- [ ] profile-avatar (Avatar)
- [ ] Board thumbnails (4 images per board)

### Post Detail Page
- [ ] post-detail-image (Main image)
- [ ] author-avatar (Author avatar)
- [ ] comment-avatar (Comment avatars)
- [ ] recommended-image (Recommended posts)

---

## 🔧 Troubleshooting

### Gambar tidak muncul?
1. Pastikan path gambar benar
2. Cek console browser untuk error
3. Pastikan gambar sudah di-upload ke folder yang benar

### Gambar terlalu besar/kecil?
Tambahkan properti CSS:
```css
background-size: cover; /* atau contain */
background-position: center;
```

### Gambar terpotong?
Sesuaikan `aspect-ratio` atau `--media-ratio`:
```css
.art-1 {
  --media-ratio: 110%; /* Sesuaikan nilai ini */
}
```

---

## 📝 Notes

- Semua placeholder saat ini menampilkan emoji dan text untuk memudahkan identifikasi
- Setelah menambahkan `background-image`, placeholder text akan tetap muncul di atas gambar
- Untuk menghilangkan placeholder text, hapus atau comment out CSS `::after` di `src/App.css`
- Recommended image size: 1200x1500px untuk portrait, 1600x900px untuk landscape
