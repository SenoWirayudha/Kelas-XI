package com.komputerkit.newsnow.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.komputerkit.newsnow.ui.screens.ArticleDetailScreen
import com.komputerkit.newsnow.ui.screens.HomeScreen
import com.komputerkit.newsnow.viewmodel.NewsViewModel

@Composable
fun NewsNavigation(
    navController: NavHostController,
    newsViewModel: NewsViewModel = viewModel()
) {
    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(route = Routes.HOME) {
            HomeScreen(
                newsViewModel = newsViewModel,
                onArticleClick = { articleUrl ->
                    navController.navigate(Routes.articleDetail(articleUrl))
                }
            )
        }
        
        composable(
            route = "${Routes.ARTICLE_DETAIL}/{articleUrl}",
            arguments = listOf(
                navArgument("articleUrl") { 
                    type = NavType.StringType 
                }
            )
        ) { backStackEntry ->
            val articleUrl = backStackEntry.arguments?.getString("articleUrl") ?: ""
            ArticleDetailScreen(
                articleUrl = articleUrl,
                onBackClick = {
                    navController.popBackStack()
                }
            )
        }
    }
}