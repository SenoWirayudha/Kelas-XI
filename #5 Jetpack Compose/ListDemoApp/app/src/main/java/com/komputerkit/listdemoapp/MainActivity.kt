package com.komputerkit.listdemoapp

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.komputerkit.listdemoapp.ui.theme.ListDemoAppTheme

// Data class for Marvel character
data class MarvelCharacter(
    val name: String,
    val realName: String,
    val imageRes: Int = 0 // Using 0 as placeholder since we don't have actual images
)

// Function to create sample Marvel characters
fun getMarvelCharacters(): List<MarvelCharacter> {
    return listOf(
        MarvelCharacter(
            name = "Thor",
            realName = "Thor Odinson"
        ),
        MarvelCharacter(
            name = "Iron Man",
            realName = "Tony Stark"
        ),
        MarvelCharacter(
            name = "Captain America",
            realName = "Steve Rogers"
        ),
        MarvelCharacter(
            name = "Hulk",
            realName = "Bruce Banner"
        ),
        MarvelCharacter(
            name = "Black Widow",
            realName = "Natasha Romanoff"
        ),
        MarvelCharacter(
            name = "Spider-Man",
            realName = "Peter Parker"
        ),
        MarvelCharacter(
            name = "Doctor Strange",
            realName = "Stephen Strange"
        )
    )
}

@Composable
fun MarvelCharacterItem(
    character: MarvelCharacter,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable {
                Toast.makeText(context, "Clicked: ${character.name}", Toast.LENGTH_SHORT).show()
            },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Placeholder image (using icon since we don't have actual images)
            Image(
                imageVector = Icons.Default.Person,
                contentDescription = "Character image",
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.primary)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    text = character.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = character.realName,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
}

@Composable
fun MarvelCharacterListScreen(
    modifier: Modifier = Modifier
) {
    val characters = getMarvelCharacters()
    
    Column(
        modifier = modifier.fillMaxSize()
    ) {
        Text(
            text = "Marvel Characters",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(16.dp)
        )
        
        LazyColumn {
            items(characters) { character ->
                MarvelCharacterItem(character = character)
            }
        }
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ListDemoAppTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    MarvelCharacterListScreen(
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun MarvelCharacterListPreview() {
    ListDemoAppTheme {
        MarvelCharacterListScreen()
    }
}