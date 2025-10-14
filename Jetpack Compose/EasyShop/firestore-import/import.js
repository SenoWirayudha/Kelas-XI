import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Inisialisasi Firebase Admin SDK
// PENTING: Download service account key dari Firebase Console
// Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ==================== DATA PRODUCTS ====================

const products = [
  // Kategori: Film (4K Disc)
  {
    id: 'film-001',
    title: 'Dreams 4K Disc',
    description: 'Dreams (夢, Yume) adalah film drama Jepang tahun 1990 yang disutradarai oleh Akira Kurosawa. Film ini terdiri dari delapan segmen yang masing-masing menggambarkan mimpi yang berbeda.',
    price: 450000,
    actualPrice: 550000,
    category: 'Film',
    images: [
      'https://s3.amazonaws.com/criterion-production/films/e9fc8a91b2f9ebe10efb6edde367dffe/LRIg86I1YijdtiaQ7G1aWN6USnhprt_small.jpg'
    ]
  },
  {
    id: 'film-002',
    title: 'Barry Lyndon 4K Disc',
    description: 'Barry Lyndon adalah film drama epik tahun 1975 yang disutradarai oleh Stanley Kubrick. Film ini menceritakan kisah seorang petualang Irlandia di abad ke-18.',
    price: 480000,
    actualPrice: 600000,
    category: 'Film',
    images: [
      'https://s3.amazonaws.com/criterion-production/films/6008ef33f62d3c513d3e8690eabad3ab/DWFlkJcNJFhPgwcZ2cXGytqtSHsPCZ_small.jpg'
    ]
  },
  {
    id: 'film-003',
    title: 'Chungking Express 4K Disc',
    description: 'Chungking Express (重慶森林) adalah film Hong Kong tahun 1994 yang disutradarai oleh Wong Kar-wai. Film romantis ini mengikuti dua cerita cinta paralel yang berlatar di Hong Kong.',
    price: 420000,
    actualPrice: 520000,
    category: 'Film',
    images: [
      'https://s3.amazonaws.com/criterion-production/films/2e4a085f40d596d24e8d171a92bc2567/8BbreVEmhjgBpsnjSy0hb0d2rUp0Ic_small.jpg'
    ]
  },
  {
    id: 'film-004',
    title: 'Flow 4K Disc',
    description: 'Flow adalah film animasi yang memenangkan berbagai penghargaan internasional. Menampilkan visual yang memukau dalam kualitas 4K Ultra HD.',
    price: 390000,
    actualPrice: 490000,
    category: 'Film',
    images: [
      'https://s3.amazonaws.com/criterion-production/films/58af11c9e0933492c227a0f6bc42fcb5/Kknn0rzbae43wtmBwvemdtega0BMS7_small.jpg'
    ]
  },
  {
    id: 'film-005',
    title: 'In the Mood for Love 4K Disc',
    description: 'In the Mood for Love (花樣年華) adalah film drama romantis Hong Kong tahun 2000 yang disutradarai oleh Wong Kar-wai. Film ini dianggap sebagai salah satu film terbaik sepanjang masa.',
    price: 460000,
    actualPrice: 580000,
    category: 'Film',
    images: [
      'https://s3.amazonaws.com/criterion-production/films/a3541a5f0da15d52f1e0698447349d88/0xRtJdrJILjqJQKskAYnvPQxoKCXn8_small.jpg'
    ]
  },

  // Kategori: Buku
  {
    id: 'buku-001',
    title: 'Laut Bercerita',
    description: 'Novel karya Leila S. Chudori yang bercerita tentang kisah aktivis mahasiswa yang hilang pada masa Orde Baru. Sebuah karya yang menyentuh tentang perjuangan dan kemanusiaan.',
    price: 95000,
    actualPrice: 120000,
    category: 'Buku',
    images: [
      'https://online.fliphtml5.com/ylalu/lhnx/files/large/1.webp?1643271188&1643271188'
    ]
  },
  {
    id: 'buku-002',
    title: 'Seperti Dendam, Rindu Harus Dibayar Tuntas',
    description: 'Novel karya Eka Kurniawan yang menceritakan kisah Ajo Kawir, seorang pemuda yang mengalami trauma dan pencarian jati diri. Pemenang berbagai penghargaan sastra internasional.',
    price: 85000,
    actualPrice: 110000,
    category: 'Buku',
    images: [
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSre8rj4eD3Frp9ezQH1FsxkNaqjuutshi9BA&s'
    ]
  },
  {
    id: 'buku-003',
    title: 'Bumi Manusia',
    description: 'Novel pertama dari Tetralogi Buru karya Pramoedya Ananta Toer. Mengisahkan kehidupan Minke, seorang pribumi yang berjuang melawan kolonialisme di awal abad ke-20.',
    price: 90000,
    actualPrice: 115000,
    category: 'Buku',
    images: [
      'https://static.mizanstore.com/d/img/book/cover/bumi-manusia.jpg'
    ]
  },
  {
    id: 'buku-004',
    title: 'Gadis Kretek',
    description: 'Novel karya Ratih Kumala yang mengisahkan kisah cinta dan sejarah industri kretek di Indonesia. Sebuah saga keluarga yang penuh warna dan emosi.',
    price: 88000,
    actualPrice: 112000,
    category: 'Buku',
    images: [
      'https://www.gramedia.com/blog/content/images/2025/08/gk-1.jpg'
    ]
  },
  {
    id: 'buku-005',
    title: 'Namaku Alam',
    description: 'Novel yang mengangkat isu lingkungan dan perubahan iklim dengan cara yang menyentuh. Mengajak pembaca untuk lebih peduli terhadap alam dan masa depan bumi.',
    price: 82000,
    actualPrice: 105000,
    category: 'Buku',
    images: [
      'https://www.gramedia.com/blog/content/images/2024/11/Namaku-Alam.jpg'
    ]
  }
];

// ==================== DATA CATEGORIES ====================

const categories = [
  {
    id: 'cat-001',
    name: 'Film',
    imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop'
  },
  {
    id: 'cat-002',
    name: 'Buku',
    imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop'
  },
  {
    id: 'cat-003',
    name: 'Elektronik',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop'
  },
  {
    id: 'cat-004',
    name: 'Fashion',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop'
  },
  {
    id: 'cat-005',
    name: 'Makanan',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop'
  },
  {
    id: 'cat-006',
    name: 'Olahraga',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop'
  }
];

// ==================== DATA BANNERS ====================

const banners = [
  {
    id: 'banner-001',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=600&fit=crop',
    title: 'Koleksi Film 4K Terbaru',
    link: 'category/Film',
    order: 1
  },
  {
    id: 'banner-002',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop',
    title: 'Buku Pilihan Bulan Ini',
    link: 'category/Buku',
    order: 2
  },
  {
    id: 'banner-003',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=600&fit=crop',
    title: 'Diskon Akhir Tahun',
    link: 'promo/end-year',
    order: 3
  },
  {
    id: 'banner-004',
    imageUrl: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&h=600&fit=crop',
    title: 'Gratis Ongkir Seluruh Indonesia',
    link: 'promo/free-shipping',
    order: 4
  }
];

// ==================== IMPORT FUNCTIONS ====================

async function importProducts() {
  console.log('🔄 Importing products...');
  const batch = db.batch();
  
  products.forEach((product) => {
    const docRef = db.collection('products').doc(product.id);
    batch.set(docRef, product);
  });
  
  await batch.commit();
  console.log(`✅ Successfully imported ${products.length} products`);
}

async function importCategories() {
  console.log('🔄 Importing categories...');
  const batch = db.batch();
  
  categories.forEach((category) => {
    const docRef = db.collection('categories').doc(category.id);
    batch.set(docRef, category);
  });
  
  await batch.commit();
  console.log(`✅ Successfully imported ${categories.length} categories`);
}

async function importBanners() {
  console.log('🔄 Importing banners...');
  const batch = db.batch();
  
  banners.forEach((banner) => {
    const docRef = db.collection('banners').doc(banner.id);
    batch.set(docRef, banner);
  });
  
  await batch.commit();
  console.log(`✅ Successfully imported ${banners.length} banners`);
}

// ==================== MAIN EXECUTION ====================

async function main() {
  try {
    console.log('🚀 Starting Firestore data import...\n');
    
    await importCategories();
    await importBanners();
    await importProducts();
    
    console.log('\n🎉 All data imported successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Banners: ${banners.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Total documents: ${categories.length + banners.length + products.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

main();
