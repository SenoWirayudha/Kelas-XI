// Sample data for WavesofFood Firebase import

const sampleUsers = [
  {
    id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+62812345678901",
    address: "Jl. Sudirman No. 123, Jakarta",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    role: "user"
  },
  {
    id: "user2", 
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+62812345678902",
    address: "Jl. Thamrin No. 456, Jakarta",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b332c2c0?w=150",
    role: "user"
  },
  {
    id: "admin1",
    name: "Admin User",
    email: "admin@wavesoffood.com",
    phone: "+62812345678900",
    address: "Jl. Admin No. 1, Jakarta",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "admin"
  }
];

const sampleAddresses = [
  {
    userId: "user1",
    addresses: [
      {
        id: "addr1",
        label: "Home",
        fullAddress: "Jl. Sudirman No. 123, RT 01/RW 02, Menteng, Jakarta Pusat 10310",
        recipientName: "John Doe",
        phone: "+62812345678901",
        notes: "Rumah warna putih, pagar hijau",
        isDefault: true
      },
      {
        id: "addr2",
        label: "Office",
        fullAddress: "Jl. HR Rasuna Said No. 789, Kuningan, Jakarta Selatan 12940",
        recipientName: "John Doe",
        phone: "+62812345678901",
        notes: "Gedung lantai 15, meja dekat jendela",
        isDefault: false
      }
    ]
  },
  {
    userId: "user2",
    addresses: [
      {
        id: "addr3",
        label: "Home",
        fullAddress: "Jl. Thamrin No. 456, RT 05/RW 03, Tanah Abang, Jakarta Pusat 10230",
        recipientName: "Jane Smith",
        phone: "+62812345678902",
        notes: "Apartemen tower B lantai 8",
        isDefault: true
      }
    ]
  }
];

const sampleFoods = [
  {
    id: "food1",
    name: "Nasi Goreng Spesial",
    description: "Nasi goreng dengan telur, ayam, dan udang segar. Dilengkapi dengan kerupuk dan acar.",
    price: 25000,
    category: "Nasi",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
    isAvailable: true,
    rating: 4.5,
    reviewCount: 128,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food2",
    name: "Mie Ayam Bakso",
    description: "Mie ayam dengan bakso sapi, pangsit goreng, dan sayuran segar.",
    price: 18000,
    category: "Mie",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    isAvailable: true,
    rating: 4.3,
    reviewCount: 95,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food3",
    name: "Ayam Bakar Taliwang",
    description: "Ayam bakar khas Lombok dengan bumbu taliwang yang pedas dan gurih.",
    price: 35000,
    category: "Ayam",
    imageUrl: "https://images.unsplash.com/photo-1598515213692-d872ac66c6ca?w=400",
    isAvailable: true,
    rating: 4.7,
    reviewCount: 203,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food4",
    name: "Gado-Gado Jakarta",
    description: "Sayuran segar dengan bumbu kacang khas Jakarta, dilengkapi lontong dan kerupuk.",
    price: 15000,
    category: "Sayuran",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
    isAvailable: true,
    rating: 4.2,
    reviewCount: 67,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food5",
    name: "Sate Ayam Madura",
    description: "Sate ayam dengan bumbu kacang khas Madura, dilengkapi lontong dan sambal.",
    price: 22000,
    category: "Sate",
    imageUrl: "https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=400",
    isAvailable: true,
    rating: 4.6,
    reviewCount: 156,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food6",
    name: "Es Teh Manis",
    description: "Teh manis dingin segar untuk menghilangkan dahaga.",
    price: 5000,
    category: "Minuman",
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    isAvailable: true,
    rating: 4.0,
    reviewCount: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food7",
    name: "Jus Alpukat",
    description: "Jus alpukat segar dengan susu kental manis dan es batu.",
    price: 12000,
    category: "Minuman",
    imageUrl: "https://images.unsplash.com/photo-1623065422902-4076c6d19dec?w=400",
    isAvailable: true,
    rating: 4.4,
    reviewCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "food8",
    name: "Rendang Daging",
    description: "Rendang daging sapi khas Minang dengan bumbu rempah yang kaya.",
    price: 45000,
    category: "Daging",
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400",
    isAvailable: true,
    rating: 4.8,
    reviewCount: 312,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleReviews = [
  {
    foodId: "food1",
    reviews: [
      {
        id: "review1",
        userId: "user1",
        userName: "John Doe",
        rating: 5,
        comment: "Nasi gorengnya enak banget! Porsi besar dan bumbu pas.",
        createdAt: new Date("2024-01-15")
      },
      {
        id: "review2",
        userId: "user2",
        userName: "Jane Smith",
        rating: 4,
        comment: "Rasanya enak, cuma agak kemanisan untuk saya.",
        createdAt: new Date("2024-01-20")
      }
    ]
  },
  {
    foodId: "food3",
    reviews: [
      {
        id: "review3",
        userId: "user1",
        userName: "John Doe",
        rating: 5,
        comment: "Ayam bakarnya juara! Pedasnya pas dan dagingnya empuk.",
        createdAt: new Date("2024-01-18")
      }
    ]
  },
  {
    foodId: "food8",
    reviews: [
      {
        id: "review4",
        userId: "user2",
        userName: "Jane Smith",
        rating: 5,
        comment: "Rendang terenak yang pernah saya coba! Bumbunya meresap sempurna.",
        createdAt: new Date("2024-01-25")
      }
    ]
  }
];

const sampleOrders = [
  {
    id: "order1",
    userId: "user1",
    items: [
      {
        foodId: "food1",
        name: "Nasi Goreng Spesial",
        price: 25000,
        quantity: 2,
        totalPrice: 50000
      },
      {
        foodId: "food6",
        name: "Es Teh Manis",
        price: 5000,
        quantity: 2,
        totalPrice: 10000
      }
    ],
    deliveryAddress: {
      fullAddress: "Jl. Sudirman No. 123, RT 01/RW 02, Menteng, Jakarta Pusat 10310",
      recipientName: "John Doe",
      phone: "+62812345678901",
      notes: "Rumah warna putih, pagar hijau"
    },
    status: "DELIVERED",
    subtotal: 60000,
    deliveryFee: 5000,
    total: 65000,
    paymentMethod: "CASH",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  {
    id: "order2",
    userId: "user2",
    items: [
      {
        foodId: "food8",
        name: "Rendang Daging",
        price: 45000,
        quantity: 1,
        totalPrice: 45000
      },
      {
        foodId: "food7",
        name: "Jus Alpukat",
        price: 12000,
        quantity: 1,
        totalPrice: 12000
      }
    ],
    deliveryAddress: {
      fullAddress: "Jl. Thamrin No. 456, RT 05/RW 03, Tanah Abang, Jakarta Pusat 10230",
      recipientName: "Jane Smith",
      phone: "+62812345678902",
      notes: "Apartemen tower B lantai 8"
    },
    status: "ON_THE_WAY",
    subtotal: 57000,
    deliveryFee: 8000,
    total: 65000,
    paymentMethod: "ONLINE",
    createdAt: new Date("2024-01-28"),
    updatedAt: new Date("2024-01-28")
  },
  {
    id: "order3",
    userId: "user1",
    items: [
      {
        foodId: "food3",
        name: "Ayam Bakar Taliwang",
        price: 35000,
        quantity: 1,
        totalPrice: 35000
      }
    ],
    deliveryAddress: {
      fullAddress: "Jl. HR Rasuna Said No. 789, Kuningan, Jakarta Selatan 12940",
      recipientName: "John Doe",
      phone: "+62812345678901",
      notes: "Gedung lantai 15, meja dekat jendela"
    },
    status: "PENDING",
    subtotal: 35000,
    deliveryFee: 10000,
    total: 45000,
    paymentMethod: "ONLINE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

module.exports = {
  sampleUsers,
  sampleAddresses,
  sampleFoods,
  sampleReviews,
  sampleOrders
};
