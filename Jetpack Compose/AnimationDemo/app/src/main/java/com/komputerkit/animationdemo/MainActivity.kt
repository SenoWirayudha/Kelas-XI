package com.komputerkit.animationdemo

import android.os.Bundle
import android.view.animation.OvershootInterpolator
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.Easing
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.animation.doOnEnd
import com.komputerkit.animationdemo.ui.theme.AnimationDemoTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AnimationDemoTheme {
                SimpleAnimationPage()
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Composable
fun SimpleAnimationPage() {
    // 1. Create scale variable using remember and Animatable with initial value 0f
    val scale = remember { Animatable(0f) }
    
    // Create rotation variable for rotation animation
    val rotation = remember { Animatable(0f) }
    
    // 2. Create animateAgain variable as mutableStateOf(false) as key for LaunchedEffect
    val animateAgain = remember { mutableStateOf(false) }
    
    // Get coroutine scope for button click
    val coroutineScope = rememberCoroutineScope()
    
    // 3. Place Image and Button in Column with specified modifiers
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 4. Apply scale and rotation modifiers to Image
        Image(
            painter = painterResource(id = R.drawable.flow),
            contentDescription = "Animated Flow Image",
            modifier = Modifier
                .size(200.dp)
                .scale(scale.value)
                .rotate(rotation.value)
        )
        
        Button(
            onClick = {
                // 6. On Button click, use rememberCoroutineScope to launch coroutine
                coroutineScope.launch {
                    // a. Reset scale and rotation to 0f
                    scale.snapTo(0f)
                    rotation.snapTo(0f)
                    // b. Toggle animateAgain to trigger LaunchedEffect
                    animateAgain.value = !animateAgain.value
                }
            }
        ) {
            Text("Animate")
        }
    }
    
    // 5. Implement LaunchedEffect with animateAgain as key
    LaunchedEffect(key1 = animateAgain.value) {
        // Animate both scale and rotation simultaneously
        launch {
            // Animate scale to 1f with tween animation
            scale.animateTo(
                targetValue = 1f,
                animationSpec = tween(
                    durationMillis = 1000,
                    easing = Easing { fraction ->
                        val interpolator = OvershootInterpolator(2f)
                        interpolator.getInterpolation(fraction)
                    }
                )
            )
        }
        launch {
            // Animate rotation to 360 degrees (full rotation)
            rotation.animateTo(
                targetValue = 360f,
                animationSpec = tween(
                    durationMillis = 1000,
                    easing = Easing { fraction ->
                        val interpolator = OvershootInterpolator(2f)
                        interpolator.getInterpolation(fraction)
                    }
                )
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
fun SimpleAnimationPagePreview() {
    AnimationDemoTheme {
        SimpleAnimationPage()
    }
}