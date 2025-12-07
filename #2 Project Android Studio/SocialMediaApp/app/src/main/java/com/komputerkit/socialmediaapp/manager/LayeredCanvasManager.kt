package com.komputerkit.socialmediaapp.manager

import android.graphics.*
import android.util.Log
import android.view.ViewGroup
import com.komputerkit.socialmediaapp.view.DrawingView
import com.komputerkit.socialmediaapp.view.MovableTextView
import android.util.Base64
import java.io.ByteArrayOutputStream

class LayeredCanvasManager {
    
    // Layer 1: Background image (dapat di-crop dan rotate)
    private var backgroundBitmap: Bitmap? = null
    private var backgroundRotation = 0f
    
    // Layer 2: Overlay (text + drawing) - selalu lurus
    private var overlayBitmap: Bitmap? = null
    
    // Relative positions for overlay elements (0.0 to 1.0)
    private val textPositions = mutableMapOf<String, Pair<Float, Float>>()
    private val drawingPaths = mutableListOf<RelativePathData>()
    
    data class RelativePathData(
        val path: Path,
        val paint: Paint,
        val relativePoints: List<Pair<Float, Float>>
    )
    
    fun setBackgroundBitmap(bitmap: Bitmap, rotation: Float = 0f) {
        // 🔧 Set background bitmap fresh (tidak merge dengan yang lama)
        backgroundBitmap = bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false) // Immutable copy
        backgroundRotation = rotation
        Log.d("LayeredCanvasManager", "Background bitmap set: ${bitmap.width}x${bitmap.height}, rotation: $rotation")
    }
    
    fun getBackgroundBitmap(): Bitmap? = backgroundBitmap
    
    fun rotateBackground(additionalRotation: Float) {
        backgroundRotation = (backgroundRotation + additionalRotation) % 360f
        Log.d("LayeredCanvasManager", "Background rotated to: $backgroundRotation degrees")
    }
    
    fun rotateBackgroundBitmap() {
        backgroundBitmap?.let { bitmap ->
            try {
                // Create rotation matrix
                val matrix = Matrix().apply {
                    postRotate(90f)
                }
                
                // Create rotated bitmap
                val rotatedBitmap = Bitmap.createBitmap(
                    bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true
                )
                
                // Update background bitmap
                backgroundBitmap = rotatedBitmap
                
                // Update rotation tracking
                backgroundRotation = (backgroundRotation + 90f) % 360f
                
                Log.d("LayeredCanvasManager", "Background bitmap rotated 90°, new rotation: $backgroundRotation")
                
            } catch (e: Exception) {
                Log.e("LayeredCanvasManager", "Error rotating background bitmap", e)
            }
        }
    }
    
    fun cropBackground(cropRect: RectF): Bitmap? {
        return backgroundBitmap?.let { bitmap ->
            // Validasi dan normalisasi koordinat crop
            val bitmapWidth = bitmap.width
            val bitmapHeight = bitmap.height
            
            // Convert relative coordinates (0.0-1.0) to absolute pixels
            var x = (cropRect.left * bitmapWidth).toInt()
            var y = (cropRect.top * bitmapHeight).toInt()
            var width = ((cropRect.right - cropRect.left) * bitmapWidth).toInt()
            var height = ((cropRect.bottom - cropRect.top) * bitmapHeight).toInt()
            
            // Validasi koordinat crop untuk mencegah IllegalArgumentException
            // 1. Pastikan x >= 0, y >= 0
            x = maxOf(0, x)
            y = maxOf(0, y)
            
            // 2. Pastikan x + width <= bitmap.width
            if (x + width > bitmapWidth) {
                width = bitmapWidth - x
            }
            
            // 3. Pastikan y + height <= bitmap.height  
            if (y + height > bitmapHeight) {
                height = bitmapHeight - y
            }
            
            // 4. Pastikan width > 0 dan height > 0
            width = maxOf(1, width)
            height = maxOf(1, height)
            
            Log.d("LayeredCanvasManager", "Crop validation - Original bitmap: ${bitmapWidth}x${bitmapHeight}")
            Log.d("LayeredCanvasManager", "Crop rect: x=$x, y=$y, width=$width, height=$height")
            
            try {
                val croppedBitmap = Bitmap.createBitmap(bitmap, x, y, width, height)
                backgroundBitmap = croppedBitmap
                
                // Adjust all overlay positions after crop
                adjustOverlayPositionsAfterCrop(cropRect)
                
                Log.d("LayeredCanvasManager", "Crop successful - Result: ${width}x${height}")
                croppedBitmap
            } catch (e: IllegalArgumentException) {
                Log.e("LayeredCanvasManager", "Crop failed despite validation: ${e.message}")
                Log.e("LayeredCanvasManager", "Bitmap: ${bitmapWidth}x${bitmapHeight}, Crop: x=$x, y=$y, w=$width, h=$height")
                null
            }
        }
    }
    
    private fun adjustOverlayPositionsAfterCrop(cropRect: RectF) {
        // Adjust text positions
        val adjustedTextPositions = mutableMapOf<String, Pair<Float, Float>>()
        textPositions.forEach { (id, position) ->
            val adjustedX = (position.first - cropRect.left) / (cropRect.right - cropRect.left)
            val adjustedY = (position.second - cropRect.top) / (cropRect.bottom - cropRect.top)
            
            // Only keep positions that are still within bounds
            if (adjustedX in 0f..1f && adjustedY in 0f..1f) {
                adjustedTextPositions[id] = Pair(adjustedX, adjustedY)
            }
        }
        textPositions.clear()
        textPositions.putAll(adjustedTextPositions)
        
        Log.d("LayeredCanvasManager", "Adjusted ${adjustedTextPositions.size} text positions after crop")
    }
    
    fun updateTextPosition(textViewId: String, relativeX: Float, relativeY: Float) {
        textPositions[textViewId] = Pair(relativeX, relativeY)
        Log.d("LayeredCanvasManager", "Text position updated: $textViewId -> ($relativeX, $relativeY)")
    }
    
    fun removeTextPosition(textViewId: String) {
        textPositions.remove(textViewId)
        Log.d("LayeredCanvasManager", "Text position removed: $textViewId")
    }
    
    fun addDrawingPath(path: Path, paint: Paint, relativePoints: List<Pair<Float, Float>>) {
        val pathData = RelativePathData(Path(path), Paint(paint), relativePoints)
        drawingPaths.add(pathData)
        Log.d("LayeredCanvasManager", "Drawing path added with ${relativePoints.size} points")
    }
    
    fun clearDrawing() {
        drawingPaths.clear()
        Log.d("LayeredCanvasManager", "All drawing paths cleared")
    }
    
    fun generateFinalBitmap(
        textViews: List<MovableTextView>,
        drawingView: DrawingView,
        finalWidth: Int,
        finalHeight: Int
    ): Bitmap? {
        
        val backgroundBmp = backgroundBitmap ?: return null
        
        // Create final bitmap with transparent background
        val finalBitmap = Bitmap.createBitmap(finalWidth, finalHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(finalBitmap)
        
        // 🔧 CLEAR final canvas untuk memastikan background transparent
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
        
        // Layer 1: Draw background (canvasImage) - with rotation/crop
        drawBackgroundLayer(canvas, backgroundBmp, finalWidth, finalHeight)
        
        // Layer 2: Draw overlay (canvasOverlay) - text + drawing, always straight
        drawOverlayLayer(canvas, textViews, drawingView, finalWidth, finalHeight)
        
        Log.d("LayeredCanvasManager", "Final bitmap generated: ${finalWidth}x${finalHeight}")
        return finalBitmap
    }
    
    private fun drawBackgroundLayer(canvas: Canvas, bitmap: Bitmap, width: Int, height: Int) {
        // 🔧 CLEAR CANVAS sebelum menggambar background untuk mencegah gambar dobel
        canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
        
        val matrix = Matrix()
        
        // Scale to fit the output size
        val scaleX = width.toFloat() / bitmap.width
        val scaleY = height.toFloat() / bitmap.height
        val scale = minOf(scaleX, scaleY)
        
        matrix.setScale(scale, scale)
        
        // Apply rotation if needed
        if (backgroundRotation != 0f) {
            matrix.postRotate(backgroundRotation, width / 2f, height / 2f)
        }
        
        // Center the image
        val scaledWidth = bitmap.width * scale
        val scaledHeight = bitmap.height * scale
        val translateX = (width - scaledWidth) / 2f
        val translateY = (height - scaledHeight) / 2f
        matrix.postTranslate(translateX, translateY)
        
        // Draw ONLY current bitmap (tidak menumpuk dengan yang lama)
        canvas.drawBitmap(bitmap, matrix, null)
    }
    
    private fun drawOverlayLayer(
        canvas: Canvas,
        textViews: List<MovableTextView>,
        drawingView: DrawingView,
        width: Int,
        height: Int
    ) {
        // Draw text overlays using stored relative positions
        textViews.forEach { textView ->
            val position = textPositions[textView.textViewId]
            if (position != null) {
                val absoluteX = position.first * width
                val absoluteY = position.second * height
                drawTextAtPosition(canvas, textView, absoluteX, absoluteY)
            }
        }
        
        // Draw brush strokes using stored relative positions
        drawingPaths.forEach { pathData ->
            val absolutePath = Path()
            var isFirst = true
            
            pathData.relativePoints.forEach { (relX, relY) ->
                val absoluteX = relX * width
                val absoluteY = relY * height
                
                if (isFirst) {
                    absolutePath.moveTo(absoluteX, absoluteY)
                    isFirst = false
                } else {
                    absolutePath.lineTo(absoluteX, absoluteY)
                }
            }
            
            canvas.drawPath(absolutePath, pathData.paint)
        }
    }
    
    private fun drawTextAtPosition(
        canvas: Canvas,
        textView: MovableTextView,
        x: Float,
        y: Float
    ) {
        // Create text bitmap and draw at position
        val textBitmap = textView.getTextOverlayBitmap(200, 100)
        canvas.drawBitmap(textBitmap, x, y, null)
    }
    
    fun getCurrentState(): String {
        return "LayeredCanvasManager - Background: ${backgroundBitmap?.let { "${it.width}x${it.height}" } ?: "null"}, " +
                "Rotation: $backgroundRotation°, Texts: ${textPositions.size}, Drawings: ${drawingPaths.size}"
    }
}
