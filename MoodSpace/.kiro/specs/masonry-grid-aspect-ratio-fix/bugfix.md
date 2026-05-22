# Bugfix Requirements Document

## Introduction

Masonry grid di semua halaman (Home, Projects, BoardDetail, Profile) tidak mengikuti ukuran/aspect ratio gambar sebenarnya. Grid menggunakan `padding-top` percentage yang fixed (seperti `--media-ratio: 110%`, `--media-ratio: 70%`, dll) sehingga tidak responsif terhadap ukuran gambar yang sebenarnya. Bug ini menyebabkan gambar dipaksa ke aspect ratio yang tidak sesuai dengan dimensi aslinya, menghasilkan tampilan yang tidak natural.

**Halaman yang Terpengaruh:**
- Home page (`.gallery` dengan `.gallery-art`)
- Projects page (`.projects-grid` dengan `.project-art`)
- BoardDetail page (`.board-masonry-grid` dengan `.masonry-card`)
- Profile page (menggunakan grid yang sama dengan Projects dan Home)
- PostDetail page (`.recommended-grid` dengan `.recommended-image`)

**Dampak:**
- Gambar tidak tampil dengan proporsi yang benar
- Jika gambar diganti, aspect ratio tetap sama (tidak fleksibel)
- Pengalaman visual yang tidak optimal karena gambar terdistorsi atau terpotong

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN gambar ditampilkan di masonry grid THEN sistem menggunakan `background-image` dengan `padding-top: var(--media-ratio, X%)` yang di-hardcode per class

1.2 WHEN gambar memiliki aspect ratio portrait (tinggi) THEN sistem tetap menampilkan dengan aspect ratio yang di-hardcode di CSS class (misalnya `.art-1` dengan `--media-ratio: 110%`)

1.3 WHEN gambar memiliki aspect ratio landscape (lebar) THEN sistem tetap menampilkan dengan aspect ratio yang di-hardcode di CSS class (misalnya `.art-2` dengan `--media-ratio: 70%`)

1.4 WHEN gambar diganti dengan gambar baru yang memiliki aspect ratio berbeda THEN sistem tidak menyesuaikan tampilan karena aspect ratio fixed di CSS

1.5 WHEN data asset memiliki property `aspectRatio` (seperti di `mockAssets.js`) THEN sistem tidak menggunakan nilai tersebut dan tetap menggunakan hardcoded CSS value

1.6 WHEN BoardDetail page menampilkan masonry grid THEN sistem menggunakan placeholder gradient dengan `grid-row-end: span` tapi gambar tidak mengikuti aspect ratio sebenarnya

### Expected Behavior (Correct)

2.1 WHEN gambar ditampilkan di masonry grid THEN sistem SHALL menggunakan aspect ratio natural dari gambar atau dari data `aspectRatio` property

2.2 WHEN gambar memiliki aspect ratio portrait (tinggi) THEN sistem SHALL menampilkan card dengan tinggi yang sesuai dengan proporsi gambar

2.3 WHEN gambar memiliki aspect ratio landscape (lebar) THEN sistem SHALL menampilkan card dengan tinggi yang lebih pendek sesuai proporsi gambar

2.4 WHEN gambar diganti dengan gambar baru yang memiliki aspect ratio berbeda THEN sistem SHALL otomatis menyesuaikan tampilan sesuai aspect ratio gambar baru

2.5 WHEN data asset memiliki property `aspectRatio` THEN sistem SHALL menggunakan nilai tersebut untuk menentukan tinggi card di masonry grid

2.6 WHEN BoardDetail page menampilkan masonry grid THEN sistem SHALL menggunakan `aspectRatio` dari data asset untuk menghitung `grid-row-end: span` value yang tepat

### Unchanged Behavior (Regression Prevention)

3.1 WHEN masonry grid ditampilkan dengan column layout THEN sistem SHALL CONTINUE TO menggunakan CSS column-count untuk layout responsif

3.2 WHEN card di-hover THEN sistem SHALL CONTINUE TO menampilkan hover effect (transform, box-shadow) yang sudah ada

3.3 WHEN gambar dimuat THEN sistem SHALL CONTINUE TO menampilkan background-size: cover dan background-position: center untuk memastikan gambar tidak terdistorsi

3.4 WHEN halaman Profile menampilkan tabs (Boards, Projects, Saved) THEN sistem SHALL CONTINUE TO menggunakan grid yang sama dengan halaman utama masing-masing

3.5 WHEN BoardDetail page menampilkan masonry grid THEN sistem SHALL CONTINUE TO menggunakan CSS Grid dengan `grid-auto-rows: 20px` untuk flexible row height

3.6 WHEN card memiliki badge atau overlay actions THEN sistem SHALL CONTINUE TO menampilkan elemen-elemen tersebut dengan positioning yang benar

3.7 WHEN masonry grid di-render THEN sistem SHALL CONTINUE TO mempertahankan gap spacing (18px untuk gallery, 20px untuk projects, 16px untuk board detail)

3.8 WHEN gambar belum dimuat THEN sistem SHALL CONTINUE TO menampilkan background placeholder atau gradient yang sudah ada
