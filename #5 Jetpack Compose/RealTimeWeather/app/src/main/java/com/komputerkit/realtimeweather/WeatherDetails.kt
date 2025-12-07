package com.komputerkit.realtimeweather

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.komputerkit.realtimeweather.api.WeatherModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeatherDetails(data: WeatherModel) {
    // Mengganti 64x64 dengan 128x128 untuk kualitas gambar lebih baik
    val iconUrl = "https:${data.current.condition.icon}".replace("64x64", "128x128")
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Location dengan ikon
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Start,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.LocationOn,
                contentDescription = "Location",
                modifier = Modifier.size(40.dp)
            )
            Text(
                text = "${data.location.name}, ${data.location.country}",
                fontSize = 20.sp,
                fontWeight = FontWeight.Medium
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Temperature
        Text(
            text = "${data.current.tempC}°C",
            fontSize = 56.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        
        // Weather Icon
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(iconUrl)
                .crossfade(true)
                .build(),
            contentDescription = "Weather Icon",
            contentScale = ContentScale.Crop,
            modifier = Modifier.size(120.dp)
        )
        
        // Weather Description
        Text(
            text = data.current.condition.text,
            fontSize = 20.sp,
            textAlign = TextAlign.Center,
            color = Color.Gray
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Weather Details Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                // Row 1: Humidity and Wind Speed
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    WeatherKeyVal("Humidity", "${data.current.humidity}%")
                    WeatherKeyVal("Wind Speed", "${data.current.windKph} km/h")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Row 2: UV and Precipitation  
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    WeatherKeyVal("UV", data.current.uv)
                    WeatherKeyVal("Precipitation", "${data.current.precipMm} mm")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Row 3: Local Time
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    WeatherKeyVal("Local Time", data.location.localtime)
                }
            }
        }
    }
}

@Composable
fun WeatherKeyVal(key: String, value: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(8.dp)
    ) {
        Text(
            text = value,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = key,
            fontWeight = FontWeight.SemiBold,
            color = Color.Gray
        )
    }
}