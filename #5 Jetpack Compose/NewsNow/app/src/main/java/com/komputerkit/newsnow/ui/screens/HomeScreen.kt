package com.komputerkit.newsnow.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.komputerkit.newsnow.data.model.Article
import com.komputerkit.newsnow.ui.components.LoadingCard
import com.komputerkit.newsnow.ui.components.NewsCard
import com.komputerkit.newsnow.utils.Resource
import com.komputerkit.newsnow.utils.UrlUtils
import com.komputerkit.newsnow.viewmodel.NewsViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    newsViewModel: NewsViewModel,
    onArticleClick: (String) -> Unit
) {
    val topHeadlines by newsViewModel.topHeadlines.collectAsStateWithLifecycle()
    val searchResults by newsViewModel.searchResults.collectAsStateWithLifecycle()
    val selectedCategory by newsViewModel.selectedCategory.collectAsStateWithLifecycle()
    val isSearchMode by newsViewModel.isSearchMode.collectAsStateWithLifecycle()
    val searchQuery by newsViewModel.searchQuery.collectAsStateWithLifecycle()
    
    var searchText by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top App Bar
        TopAppBar(
            title = {
                Text(
                    text = "NewsNow",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
            },
            actions = {
                IconButton(
                    onClick = { 
                        if (isSearchMode) {
                            newsViewModel.clearSearch()
                            searchText = ""
                        } else {
                            newsViewModel.toggleSearchMode()
                        }
                    }
                ) {
                    Icon(
                        imageVector = if (isSearchMode) Icons.Default.Clear else Icons.Default.Search,
                        contentDescription = if (isSearchMode) "Clear search" else "Search"
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.primary,
                titleContentColor = MaterialTheme.colorScheme.onPrimary,
                actionIconContentColor = MaterialTheme.colorScheme.onPrimary
            )
        )
        
        // Search Bar (visible when search mode is active)
        if (isSearchMode) {
            OutlinedTextField(
                value = searchText,
                onValueChange = { 
                    searchText = it
                    // Real-time search dengan debouncing di ViewModel
                    newsViewModel.searchNews(it)
                },
                label = { Text("Search news...") },
                placeholder = { Text("Enter keywords (min 2 characters)") },
                trailingIcon = {
                    if (searchResults is Resource.Loading && searchText.isNotEmpty()) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(
                            onClick = { 
                                searchText = ""
                                newsViewModel.clearSearch()
                            }
                        ) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                singleLine = true
            )
        }
        
        // Category Filter (hidden when in search mode)
        if (!isSearchMode) {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // All categories chip
                item {
                    CategoryChip(
                        text = "All",
                        isSelected = selectedCategory == null,
                        onClick = { newsViewModel.selectCategory(null) }
                    )
                }
                
                // Individual category chips
                items(newsViewModel.categories) { (categoryKey, categoryName) ->
                    CategoryChip(
                        text = categoryName,
                        isSelected = selectedCategory == categoryKey,
                        onClick = { newsViewModel.selectCategory(categoryKey) }
                    )
                }
            }
        }
        
        // News Content
        val articles = if (isSearchMode) searchResults else topHeadlines
        
        when (articles) {
            is Resource.Loading -> {
                if (isSearchMode && searchText.isNotEmpty()) {
                    // Loading lebih ringan untuk search
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator()
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Searching for \"$searchText\"...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    // Loading normal untuk top headlines
                    LazyColumn {
                        items(3) { // Kurangi jumlah loading cards
                            LoadingCard()
                        }
                    }
                }
            }
            
            is Resource.Success -> {
                if (articles.data.isNotEmpty()) {
                    LazyColumn {
                        items(articles.data) { article ->
                            NewsCard(
                                article = article,
                                onArticleClick = { url -> 
                                    onArticleClick(UrlUtils.encodeUrl(url))
                                }
                            )
                        }
                        
                        // Bottom padding for last item
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                } else {
                    EmptyStateMessage(
                        message = if (isSearchMode) "No search results found" else "No news available"
                    )
                }
            }
            
            is Resource.Error -> {
                ErrorStateMessage(
                    message = articles.message,
                    onRetry = {
                        if (isSearchMode && searchQuery.isNotBlank()) {
                            newsViewModel.searchNews(searchQuery)
                        } else {
                            newsViewModel.getTopHeadlines(selectedCategory)
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun CategoryChip(
    text: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = { 
            Text(
                text = text,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
            )
        },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.primary,
            selectedLabelColor = MaterialTheme.colorScheme.onPrimary
        )
    )
}

@Composable
fun EmptyStateMessage(message: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun ErrorStateMessage(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Oops! Something went wrong",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text("Retry")
        }
    }
}