# Panduan Pengembangan Aplikasi Moview

## Struktur Kode dan Penjelasan

### 1. Package Structure

```
com.komputerkit.moview/
├── data/                   # Data Layer
│   ├── model/             # Data Classes
│   └── repository/        # Data Access
├── ui/                    # Presentation Layer
│   ├── home/
│   ├── search/
│   ├── notification/
│   └── profile/
└── MainActivity.kt        # Entry Point
```

### 2. Model Classes

#### Movie.kt
Data class yang merepresentasikan informasi film:
- `id`: Unique identifier
- `title`: Judul film
- `posterUrl`: URL poster
- `averageRating`: Rating rata-rata (0-5)
- `genre`: Genre film
- `releaseYear`: Tahun rilis
- `description`: Deskripsi singkat

#### User.kt
Data class untuk informasi pengguna:
- `id`: Unique identifier
- `username`: Username unik
- `profilePhotoUrl`: URL foto profil
- `email`: Email pengguna
- `bio`: Bio/deskripsi singkat

#### Review.kt
Data class untuk review film:
- `id`: Unique identifier
- `userId`: ID user yang membuat review
- `movieId`: ID film yang direview
- `rating`: Rating yang diberikan
- `reviewText`: Teks review
- `timestamp`: Waktu review dibuat
- `likeCount`: Jumlah like
- `isRewatch`: Flag rewatch

#### FriendActivity.kt
Data class untuk aktivitas teman yang menggabungkan User, Movie, dan Review:
- `id`: Unique identifier
- `user`: Objek User
- `movie`: Objek Movie
- `rating`: Rating yang diberikan
- `likeCount`: Jumlah like
- `isRewatch`: Apakah rewatch
- `hasReview`: Apakah ada review text
- `reviewText`: Text review
- `timestamp`: Waktu aktivitas

### 3. Repository Pattern

#### MovieRepository.kt
Repository menyediakan abstraksi untuk sumber data:
- `getPopularMoviesThisWeek()`: Mengembalikan list film populer
- `getFriendActivities()`: Mengembalikan list aktivitas teman

**Keuntungan Repository Pattern:**
- Single source of truth
- Mudah untuk switch data source (dummy → API → database)
- Testable
- Separation of concerns

### 4. ViewModel

#### HomeViewModel.kt
ViewModel mengelola state UI dan logic:

```kotlin
private val _popularMovies = MutableLiveData<List<Movie>>()
val popularMovies: LiveData<List<Movie>> = _popularMovies
```

**Prinsip:**
- MutableLiveData (private): Hanya bisa diubah dari dalam ViewModel
- LiveData (public): Untuk observe dari Fragment
- Survive configuration changes
- Memisahkan UI logic dari View

### 5. RecyclerView Adapters

#### PopularMovieAdapter.kt
Adapter untuk horizontal list film populer:
- ViewHolder pattern untuk efisiensi
- OnClickListener untuk interaksi
- Glide untuk loading images

#### FriendActivityAdapter.kt
Adapter untuk vertical list aktivitas teman:
- Complex layout dengan conditional visibility
- Multiple click listeners (item, more menu)
- Dynamic UI based on data

**Best Practices:**
- ViewHolder pattern (reuse views)
- ViewBinding dalam adapter
- Efficient image loading dengan Glide
- Lambda untuk click handling

### 6. Fragments

#### HomeFragment.kt
Fragment utama dengan dua RecyclerView:

```kotlin
// ViewBinding
private var _binding: FragmentHomeBinding? = null
private val binding get() = _binding!!

// ViewModel delegation
private val viewModel: HomeViewModel by viewModels()
```

**Lifecycle:**
1. `onCreateView`: Inflate layout dengan ViewBinding
2. `onViewCreated`: Setup RecyclerViews dan observe ViewModel
3. `onDestroyView`: Clean up binding untuk avoid memory leak

### 7. Navigation Component

#### nav_graph.xml
Mendefinisikan navigation flow:
- Start destination: HomeFragment
- Destinations: Home, Search, Notification, Profile

#### MainActivity.kt
Setup Navigation dan BottomNavigationView:

```kotlin
binding.bottomNavigation.setupWithNavController(navController)
```

**Keuntungan:**
- Type-safe navigation
- Automatic back stack management
- Deep linking support
- Animation transitions

### 8. Layout Design

#### Material Design Components
- MaterialCardView: Untuk card-based UI
- BottomNavigationView: Standard bottom nav
- RecyclerView: Efficient scrolling lists
- ConstraintLayout: Flexible positioning

#### ViewBinding
Menggantikan findViewById:
```kotlin
binding.rvPopularMovies.adapter = adapter
```

**Benefits:**
- Type safety
- Null safety
- No findViewById boilerplate

### 9. Image Loading dengan Glide

```kotlin
Glide.with(itemView.context)
    .load(movie.posterUrl)
    .placeholder(R.color.placeholder_color)
    .error(R.color.placeholder_color)
    .into(posterImage)
```

**Features:**
- Automatic caching
- Memory management
- Placeholder dan error handling
- Transformations (e.g., circleCrop)

## Tips Pengembangan

### 1. Menambah Fitur Baru

1. **Buat Model** di `data/model/`
2. **Update Repository** untuk provide data
3. **Buat/Update ViewModel** untuk manage state
4. **Buat Layout XML** untuk UI
5. **Buat Fragment/Adapter** untuk display
6. **Update Navigation** jika perlu

### 2. Testing

```kotlin
// Unit Test ViewModel
@Test
fun testLoadMovies() {
    val viewModel = HomeViewModel()
    viewModel.popularMovies.observeForever { movies ->
        assertNotNull(movies)
        assertTrue(movies.isNotEmpty())
    }
}
```

### 3. Debugging

- Gunakan Logcat untuk logging
- Android Profiler untuk memory/performance
- Layout Inspector untuk UI debugging

### 4. Best Practices

1. **Separation of Concerns**: Data, Domain, Presentation
2. **Single Responsibility**: Setiap class satu tanggung jawab
3. **DRY (Don't Repeat Yourself)**: Reuse code
4. **SOLID Principles**: Terutama SRP dan DIP
5. **Naming Convention**: Clear dan descriptive

### 5. Code Organization

- Group by feature (bukan by layer)
- Package private untuk internal classes
- Extensions untuk utility functions
- Constants di companion object

## Troubleshooting

### Build Issues
```bash
# Clean project
./gradlew clean

# Rebuild
./gradlew build --refresh-dependencies
```

### Navigation Issues
- Pastikan ID di nav_graph.xml match dengan menu
- Check NavHost setup di MainActivity

### RecyclerView Issues
- Set layoutManager
- Check adapter attachment
- Verify data non-empty

### Image Loading Issues
- Check internet permission
- Verify URL format
- Check Glide setup

## Next Steps untuk Belajar

1. **Room Database**: Local persistence
2. **Retrofit**: API integration
3. **Coroutines**: Asynchronous programming
4. **Dependency Injection**: Dagger/Hilt
5. **Testing**: Unit & UI tests
6. **CI/CD**: Automated builds

## Resources

- [Android Developer Guide](https://developer.android.com/guide)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Material Design](https://material.io/design)
- [MVVM Architecture](https://developer.android.com/topic/architecture)
