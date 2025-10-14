package com.komputerkit.easyshop.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.google.firebase.auth.FirebaseAuth
import com.komputerkit.easyshop.ui.auth.LoginScreen
import com.komputerkit.easyshop.ui.auth.SignupScreen
import com.komputerkit.easyshop.ui.checkout.CheckoutScreen
import com.komputerkit.easyshop.ui.home.HomeScreen
import com.komputerkit.easyshop.ui.order.OrderHistoryScreen
import com.komputerkit.easyshop.ui.product.ProductDetailScreen
import com.komputerkit.easyshop.ui.product.ProductsListScreen
import com.komputerkit.easyshop.ui.search.SearchScreen
import com.komputerkit.easyshop.viewmodel.CartViewModel

/**
 * Sealed class untuk mendefinisikan rute navigasi aplikasi
 */
sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Signup : Screen("signup")
    data object Home : Screen("home")
    data object Search : Screen("search")
    data object ProductsList : Screen("products_list?category={category}") {
        fun createRoute(category: String? = null): String {
            return if (category != null) "products_list?category=$category" else "products_list"
        }
    }
    data object ProductDetail : Screen("product_detail/{productId}") {
        fun createRoute(productId: String): String = "product_detail/$productId"
    }
    data object Checkout : Screen("checkout")
    data object Orders : Screen("orders")
}

/**
 * NavHost utama aplikasi yang mengelola navigasi antar layar
 *
 * @param navController Controller untuk navigasi
 */
@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController()
) {
    // Check Firebase Auth state untuk menentukan start destination
    val auth = FirebaseAuth.getInstance()
    val isUserLoggedIn = auth.currentUser != null
    val startDestination = if (isUserLoggedIn) Screen.Home.route else Screen.Login.route
    
    // CartViewModel dibuat di level NavHost agar shared across screens
    val cartViewModel: CartViewModel = viewModel()
    
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Layar Login
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToSignup = {
                    navController.navigate(Screen.Signup.route)
                },
                onNavigateToHome = {
                    navController.navigate(Screen.Home.route) {
                        // Hapus login dari back stack agar user tidak bisa kembali
                        popUpTo(Screen.Login.route) {
                            inclusive = true
                        }
                    }
                }
            )
        }
        
        // Layar Signup
        composable(Screen.Signup.route) {
            SignupScreen(
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onNavigateToHome = {
                    navController.navigate(Screen.Home.route) {
                        // Hapus signup dan login dari back stack
                        popUpTo(Screen.Login.route) {
                            inclusive = true
                        }
                    }
                }
            )
        }
        
        // Layar Home
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToSearch = {
                    navController.navigate(Screen.Search.route)
                },
                onNavigateToProductsList = { category ->
                    navController.navigate(Screen.ProductsList.createRoute(category))
                },
                onNavigateToProductDetail = { productId ->
                    navController.navigate(Screen.ProductDetail.createRoute(productId))
                },
                onNavigateToCheckout = {
                    navController.navigate(Screen.Checkout.route)
                },
                onNavigateToOrders = {
                    navController.navigate(Screen.Orders.route)
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        // Clear back stack sampai ke login
                        popUpTo(0) {
                            inclusive = true
                        }
                    }
                },
                cartViewModel = cartViewModel
            )
        }
        
        // Layar Search
        composable(Screen.Search.route) {
            SearchScreen(
                onBackClick = {
                    navController.popBackStack()
                },
                onProductClick = { product ->
                    navController.navigate(Screen.ProductDetail.createRoute(product.id))
                }
            )
        }
        
        // Layar Products List (dengan optional category parameter)
        composable(
            route = Screen.ProductsList.route,
            arguments = listOf(
                navArgument("category") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val category = backStackEntry.arguments?.getString("category")
            ProductsListScreen(
                category = category,
                onBackClick = {
                    navController.popBackStack()
                },
                onProductClick = { product ->
                    navController.navigate(Screen.ProductDetail.createRoute(product.id))
                }
            )
        }
        
        // Layar Product Detail
        composable(
            route = Screen.ProductDetail.route,
            arguments = listOf(
                navArgument("productId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: ""
            ProductDetailScreen(
                productId = productId,
                onBackClick = {
                    navController.popBackStack()
                },
                cartViewModel = cartViewModel
            )
        }
        
        // Layar Checkout
        composable(Screen.Checkout.route) {
            CheckoutScreen(
                onBackClick = {
                    navController.popBackStack()
                },
                onCheckoutSuccess = {
                    // Kembali ke Home setelah checkout berhasil
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) {
                            inclusive = false
                        }
                    }
                },
                cartViewModel = cartViewModel
            )
        }
        
        // Layar Order History
        composable(Screen.Orders.route) {
            OrderHistoryScreen(
                onBackClick = {
                    navController.popBackStack()
                }
            )
        }
    }
}