package com.komputerkit.easyshop.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material.icons.filled.Star
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.komputerkit.easyshop.model.BannerModel
import com.komputerkit.easyshop.model.CategoryModel
import com.komputerkit.easyshop.model.NavItem
import com.komputerkit.easyshop.model.ProductModel
import com.komputerkit.easyshop.ui.theme.EasyShopTheme
import com.komputerkit.easyshop.viewmodel.AuthViewModel
import com.komputerkit.easyshop.viewmodel.FavoriteViewModel
import com.komputerkit.easyshop.viewmodel.CartViewModel
import com.komputerkit.easyshop.ui.favorite.FavoriteScreen
import com.komputerkit.easyshop.ui.cart.CartScreen
import com.komputerkit.easyshop.ui.profile.ProfilePage
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.delay
import kotlinx.coroutines.tasks.await

/**
 * Layar Home utama dengan Bottom Navigation, Header, Banner Carousel, dan Categories
 */
@Composable
fun HomeScreen(
    onNavigateToSearch: () -> Unit = {},
    onNavigateToProductsList: (String?) -> Unit = {},
    onNavigateToProductDetail: (String) -> Unit = {},
    onNavigateToCheckout: () -> Unit = {},
    onNavigateToOrders: () -> Unit = {},
    onLogout: () -> Unit = {},
    favoriteViewModel: FavoriteViewModel = viewModel(),
    cartViewModel: CartViewModel = viewModel()
) {
    var selectedIndex by remember { mutableIntStateOf(0) }
    
    // Daftar item navigasi
    val navItems = remember {
        listOf(
            NavItem("Home", Icons.Outlined.Home, "home"),
            NavItem("Favorite", Icons.Outlined.FavoriteBorder, "favorite"),
            NavItem("Cart", Icons.Outlined.ShoppingCart, "cart"),
            NavItem("Profile", Icons.Outlined.Person, "profile")
        )
    }
    
    val filledIcons = listOf(
        Icons.Filled.Home,
        Icons.Filled.Favorite,
        Icons.Filled.ShoppingCart,
        Icons.Filled.Person
    )
    
    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            ) {
                navItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = selectedIndex == index,
                        onClick = { selectedIndex = index },
                        icon = {
                            Icon(
                                imageVector = if (selectedIndex == index) filledIcons[index] else item.icon,
                                contentDescription = item.title
                            )
                        },
                        label = { Text(item.title) }
                    )
                }
            }
        }
    ) { paddingValues ->
        // Konten berdasarkan selectedIndex
        when (selectedIndex) {
            0 -> HomeContent(
                paddingValues = paddingValues,
                onNavigateToSearch = onNavigateToSearch,
                onNavigateToProductsList = onNavigateToProductsList,
                onNavigateToProductDetail = onNavigateToProductDetail,
                favoriteViewModel = favoriteViewModel
            )
            1 -> FavoriteScreen(
                paddingValues = paddingValues,
                onProductClick = onNavigateToProductDetail,
                favoriteViewModel = favoriteViewModel
            )
            2 -> CartScreen(
                paddingValues = paddingValues,
                onCheckout = onNavigateToCheckout,
                cartViewModel = cartViewModel
            )
            3 -> ProfilePage(
                onNavigateToOrders = onNavigateToOrders,
                onLogout = onLogout
            )
        }
    }
}

/**
 * Konten utama Home dengan Header, Banner, dan Categories
 */
@Composable
fun HomeContent(
    paddingValues: PaddingValues,
    authViewModel: AuthViewModel = viewModel(),
    favoriteViewModel: FavoriteViewModel = viewModel(),
    onNavigateToSearch: () -> Unit = {},
    onNavigateToProductsList: (String?) -> Unit = {},
    onNavigateToProductDetail: (String) -> Unit = {}
) {
    val firestore = FirebaseFirestore.getInstance()
    val favoriteIds by favoriteViewModel.favoriteIds.collectAsState()
    
    var userName by remember { mutableStateOf("") }
    var banners by remember { mutableStateOf<List<BannerModel>>(emptyList()) }
    var categories by remember { mutableStateOf<List<CategoryModel>>(emptyList()) }
    var featuredProducts by remember { mutableStateOf<List<ProductModel>>(emptyList()) }
    var isLoadingBanners by remember { mutableStateOf(true) }
    var isLoadingCategories by remember { mutableStateOf(true) }
    var isLoadingProducts by remember { mutableStateOf(true) }
    
    // Ambil data user dari Firestore
    LaunchedEffect(Unit) {
        // Ambil nama user dari Firestore
        authViewModel.getCurrentUserData { user ->
            userName = user?.name ?: "Guest"
        }
        
        // Ambil banners dari Firestore
        try {
            val bannersSnapshot = firestore.collection("banners")
                .orderBy("order")
                .get()
                .await()
            
            banners = bannersSnapshot.documents.mapNotNull { doc ->
                doc.data?.let { BannerModel.fromMap(it) }
            }
            isLoadingBanners = false
        } catch (e: Exception) {
            println("Error loading banners: ${e.message}")
            isLoadingBanners = false
        }
        
        // Ambil categories dari Firestore
        try {
            val categoriesSnapshot = firestore.collection("categories")
                .get()
                .await()
            
            categories = categoriesSnapshot.documents.mapNotNull { doc ->
                doc.data?.let { CategoryModel.fromMap(it) }
            }
            isLoadingCategories = false
        } catch (e: Exception) {
            println("Error loading categories: ${e.message}")
            isLoadingCategories = false
        }
        
        // Ambil featured products (limit 10)
        try {
            val productsSnapshot = firestore.collection("products")
                .limit(10)
                .get()
                .await()
            
            featuredProducts = productsSnapshot.documents.mapNotNull { doc ->
                doc.data?.let { ProductModel.fromMap(it) }
            }
            isLoadingProducts = false
        } catch (e: Exception) {
            println("Error loading products: ${e.message}")
            isLoadingProducts = false
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        HeaderView(
            userName = userName,
            onSearchClick = onNavigateToSearch
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Banner Carousel
        if (isLoadingBanners) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            BannerView(banners = banners)
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Categories
        if (isLoadingCategories) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            CategoriesView(
                categories = categories,
                onCategoryClick = { categoryName ->
                    onNavigateToProductsList(categoryName)
                }
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Featured Products Section
        if (!isLoadingProducts && featuredProducts.isNotEmpty()) {
            FeaturedProductsView(
                products = featuredProducts,
                favoriteIds = favoriteIds,
                onProductClick = { product ->
                    onNavigateToProductDetail(product.id)
                },
                onFavoriteClick = { productId ->
                    favoriteViewModel.toggleFavorite(productId)
                },
                onViewAllClick = {
                    onNavigateToProductsList(null)
                }
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
    }
}

/**
 * Header dengan welcome text dan search icon
 */
@Composable
fun HeaderView(
    userName: String,
    onSearchClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Selamat Datang,",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = userName.ifEmpty { "Loading..." },
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
        
        IconButton(
            onClick = onSearchClick
        ) {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "Search",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

/**
 * Banner carousel dengan dots indicator
 */
@Composable
fun BannerView(banners: List<BannerModel>) {
    if (banners.isEmpty()) {
        // Placeholder saat loading
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .padding(horizontal = 16.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Text("No banners available", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }
    
    val pagerState = rememberPagerState(pageCount = { banners.size })
    
    Column {
        // Horizontal Pager
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxWidth()
        ) { page ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .padding(horizontal = 16.dp),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                AsyncImage(
                    model = banners[page].imageUrl,
                    contentDescription = banners[page].title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Dots Indicator
        DotsIndicator(
            totalDots = banners.size,
            selectedIndex = pagerState.currentPage,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
    }
}

/**
 * Dots indicator untuk banner carousel
 */
@Composable
fun DotsIndicator(
    totalDots: Int,
    selectedIndex: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        repeat(totalDots) { index ->
            Box(
                modifier = Modifier
                    .size(if (index == selectedIndex) 8.dp else 6.dp)
                    .clip(CircleShape)
                    .background(
                        if (index == selectedIndex)
                            MaterialTheme.colorScheme.primary
                        else
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                    )
            )
        }
    }
}

/**
 * Categories horizontal scrollable list
 */
@Composable
fun CategoriesView(
    categories: List<CategoryModel>,
    onCategoryClick: (String) -> Unit
) {
    Column {
        // Section Title
        Text(
            text = "Kategori Produk",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        if (categories.isEmpty()) {
            Text(
                text = "Loading categories...",
                modifier = Modifier.padding(horizontal = 16.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(categories) { category ->
                    CategoryItem(
                        category = category,
                        onClick = { onCategoryClick(category.name) }
                    )
                }
            }
        }
    }
}

/**
 * Individual category card item
 */
@Composable
fun CategoryItem(
    category: CategoryModel,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(120.dp)
            .height(140.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Category Image
            Card(
                modifier = Modifier.size(80.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                AsyncImage(
                    model = category.imageUrl,
                    contentDescription = category.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Category Name
            Text(
                text = category.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * Featured Products Section - Produk Pilihan
 */
@Composable
fun FeaturedProductsView(
    products: List<ProductModel>,
    favoriteIds: Set<String>,
    onProductClick: (ProductModel) -> Unit,
    onFavoriteClick: (String) -> Unit,
    onViewAllClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        // Section Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Produk Pilihan",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            TextButton(onClick = onViewAllClick) {
                Text("Lihat Semua")
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Products Horizontal List
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(products) { product ->
                ProductCardCompact(
                    product = product,
                    isFavorite = favoriteIds.contains(product.id),
                    onFavoriteClick = { onFavoriteClick(product.id) },
                    onClick = { onProductClick(product) }
                )
            }
        }
    }
}

/**
 * Compact Product Card untuk horizontal scroll
 */
@Composable
fun ProductCardCompact(
    product: ProductModel,
    isFavorite: Boolean,
    onFavoriteClick: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(150.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            // Product Image
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
            ) {
                AsyncImage(
                    model = product.images.firstOrNull() ?: "",
                    contentDescription = product.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                
                // Discount Badge (Top Left)
                if (product.hasDiscount()) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(8.dp)
                            .background(
                                Color.Red,
                                shape = RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "-${product.getDiscountPercentage()}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                
                // Favorite Button (Top Right)
                IconButton(
                    onClick = onFavoriteClick,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(4.dp)
                        .size(32.dp)
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = if (isFavorite) Color.Red else Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            
            // Product Info
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
            ) {
                Text(
                    text = product.title,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.Medium
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Price
                if (product.hasDiscount()) {
                    Text(
                        text = "Rp ${"%,.0f".format(product.actualPrice)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textDecoration = TextDecoration.LineThrough
                    )
                    Text(
                        text = "Rp ${"%,.0f".format(product.price)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                } else {
                    Text(
                        text = "Rp ${"%,.0f".format(product.price)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

/**
 * Profile Screen dengan informasi user dan tombol logout
 */
@Composable
fun ProfileScreen(
    paddingValues: PaddingValues,
    onLogout: () -> Unit,
    authViewModel: AuthViewModel = viewModel()
) {
    val firestore = FirebaseFirestore.getInstance()
    val auth = com.google.firebase.auth.FirebaseAuth.getInstance()
    var userName by remember { mutableStateOf("") }
    var userEmail by remember { mutableStateOf("") }
    
    LaunchedEffect(Unit) {
        val currentUser = auth.currentUser
        userEmail = currentUser?.email ?: ""
        
        // Get user data from Firestore
        authViewModel.getCurrentUserData { user ->
            if (user != null) {
                userName = user.name
            }
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))
        
        // Profile Icon
        Icon(
            imageVector = Icons.Filled.Person,
            contentDescription = "Profile",
            modifier = Modifier.size(100.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // User Name
        Text(
            text = userName.ifEmpty { "User" },
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // User Email
        Text(
            text = userEmail,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        // Logout Button
        Button(
            onClick = {
                authViewModel.signOut()
                onLogout()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = null
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Logout",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "EasyShop v1.0",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Placeholder untuk tab lain (Favorite, Cart, Profile)
 */
@Composable
fun PlaceholderContent(title: String, paddingValues: PaddingValues) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "🚧",
                style = MaterialTheme.typography.displayLarge
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "$title Screen",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Coming Soon!",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    EasyShopTheme {
        HomeScreen()
    }
}

@Preview(showBackground = true)
@Composable
fun HeaderViewPreview() {
    EasyShopTheme {
        HeaderView(userName = "Budi Santoso")
    }
}

@Preview(showBackground = true)
@Composable
fun CategoryItemPreview() {
    EasyShopTheme {
        CategoryItem(
            category = CategoryModel("1", "Elektronik", "https://picsum.photos/200"),
            onClick = {}
        )
    }
}