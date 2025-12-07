package com.komputerkit.mycamera

import android.content.ContentValues
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.widget.Toast
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@Composable
fun CameraScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }
    var cameraProvider by remember { mutableStateOf<ProcessCameraProvider?>(null) }
    var previewView by remember { mutableStateOf<PreviewView?>(null) }
    
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    
    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Camera Preview
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    previewView = this
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Capture Button
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
        ) {
            CaptureButton(
                onCapture = {
                    imageCapture?.let { capture ->
                        capturePhoto(capture, context, cameraExecutor)
                    }
                }
            )
        }
    }

    // Initialize camera when component is composed
    LaunchedEffect(previewView) {
        previewView?.let { preview ->
            initializeCamera(
                context = context,
                lifecycleOwner = lifecycleOwner,
                previewView = preview,
                onImageCaptureReady = { capture ->
                    imageCapture = capture
                },
                onCameraProviderReady = { provider ->
                    cameraProvider = provider
                }
            )
        }
    }
}

@Composable
fun CaptureButton(
    onCapture: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onCapture,
        modifier = modifier
            .size(80.dp)
            .clip(CircleShape),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.White,
            contentColor = Color.Red
        ),
        contentPadding = PaddingValues(0.dp)
    ) {
        Canvas(
            modifier = Modifier.size(60.dp)
        ) {
            val canvasWidth = size.width
            val canvasHeight = size.height
            val center = Offset(canvasWidth / 2, canvasHeight / 2)
            val radius = minOf(canvasWidth, canvasHeight) / 3
            
            drawCircle(
                color = Color.Red,
                radius = radius,
                center = center
            )
        }
    }
}

private fun initializeCamera(
    context: Context,
    lifecycleOwner: LifecycleOwner,
    previewView: PreviewView,
    onImageCaptureReady: (ImageCapture) -> Unit,
    onCameraProviderReady: (ProcessCameraProvider) -> Unit
) {
    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    
    cameraProviderFuture.addListener({
        try {
            val cameraProvider = cameraProviderFuture.get()
            onCameraProviderReady(cameraProvider)
            
            // Preview use case
            val preview = Preview.Builder().build()
            preview.setSurfaceProvider(previewView.surfaceProvider)
            
            // ImageCapture use case
            val imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()
            onImageCaptureReady(imageCapture)
            
            // Camera selector (back camera)
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            // Unbind all use cases before rebinding
            cameraProvider.unbindAll()
            
            // Bind use cases to camera
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageCapture
            )
            
        } catch (exc: Exception) {
            Toast.makeText(
                context,
                "Gagal menginisialisasi kamera: ${exc.message}",
                Toast.LENGTH_SHORT
            ).show()
        }
    }, ContextCompat.getMainExecutor(context))
}

private fun capturePhoto(
    imageCapture: ImageCapture,
    context: Context,
    executor: ExecutorService
) {
    // Create time-stamped name for the image
    val name = SimpleDateFormat(
        "yyyy-MM-dd-HH-mm-ss-SSS",
        Locale.getDefault()
    ).format(System.currentTimeMillis())
    
    // Create content values for the image
    val contentValues = ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, name)
        put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
        put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/MyCameraImages")
    }
    
    // Create output options
    val outputOptions = ImageCapture.OutputFileOptions.Builder(
        context.contentResolver,
        MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
        contentValues
    ).build()
    
    // Set up image capture listener
    imageCapture.takePicture(
        outputOptions,
        executor,
        object : ImageCapture.OnImageSavedCallback {
            override fun onError(exception: ImageCaptureException) {
                // Run Toast on main thread
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(
                        context,
                        "Gagal mengambil foto: ${exception.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
            
            override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                // Run Toast on main thread
                Handler(Looper.getMainLooper()).post {
                    Toast.makeText(
                        context,
                        "Foto berhasil disimpan ke galeri!",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    )
}