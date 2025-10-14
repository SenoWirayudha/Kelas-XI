package com.komputerkit.socialmediaapp.activity

import android.graphics.*
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.komputerkit.socialmediaapp.R
import com.komputerkit.socialmediaapp.manager.TextOverlayManager
import com.komputerkit.socialmediaapp.manager.ImageCoordinateProvider
import com.komputerkit.socialmediaapp.manager.CropModeProvider
import com.komputerkit.socialmediaapp.manager.LayeredCanvasManager
import com.komputerkit.socialmediaapp.view.MovableTextView
import com.komputerkit.socialmediaapp.view.DrawingView
import com.komputerkit.socialmediaapp.view.CropRotateView
import com.komputerkit.socialmediaapp.repository.FirebaseRepository
import java.io.InputStream

class StoryEditorActivity : AppCompatActivity(), ImageCoordinateProvider, CropModeProvider {

    private lateinit var imageView: ImageView
    private lateinit var drawingView: DrawingView
    private lateinit var cropRotateView: CropRotateView
    private lateinit var textOverlayContainer: FrameLayout
    private lateinit var textOverlayManager: TextOverlayManager
    private lateinit var layeredCanvasManager: LayeredCanvasManager
    
    // Buttons
    private lateinit var btnText: ImageButton
    private lateinit var btnDraw: ImageButton
    private lateinit var btnCrop: ImageButton
    private lateinit var btnRotate: ImageButton
    private lateinit var btnClose: ImageButton
    private lateinit var btnCancel: Button
    private lateinit var btnUpload: Button
    private lateinit var btnDeleteText: Button
    
    // Text editing controls
    private lateinit var textToolsContainer: LinearLayout
    private lateinit var textSizeSeekBar: SeekBar
    private lateinit var textSizeLabel: TextView
    private lateinit var btnFontDefault: Button
    private lateinit var btnFontSerif: Button
    private lateinit var btnFontMonospace: Button
    private lateinit var btnFontCasual: Button
    private lateinit var btnFontCursive: Button
    private lateinit var fontButtons: List<Button>
    private lateinit var colorViews: List<View>
    
    // Drawing tools
    private lateinit var drawingToolsContainer: LinearLayout
    private lateinit var brushSizeSeekBar: SeekBar
    
    // Crop/Rotate tools
    private lateinit var cropRotateToolsContainer: LinearLayout
    private lateinit var btnCropToggle: Button
    private lateinit var btnApplyCrop: Button
    
    private var currentSelectedTextView: MovableTextView? = null
    
    private enum class EditMode {
        NONE, TEXT, DRAW, CROP_ROTATE
    }
    
    private var currentMode = EditMode.NONE
    
    private var imageUri: Uri? = null
    private val firebaseRepository = FirebaseRepository()

    companion object {
        const val EXTRA_IMAGE_URI = "extra_image_uri"
        private const val TAG = "StoryEditorActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_story_editor)
        
        imageView = findViewById(R.id.imageView)
        drawingView = findViewById(R.id.drawingView)
        cropRotateView = findViewById(R.id.cropRotateView)
        textOverlayContainer = findViewById(R.id.textOverlayContainer)
        
        // Initialize buttons
        btnText = findViewById(R.id.btnText)
        btnDraw = findViewById(R.id.btnDraw) 
        btnCrop = findViewById(R.id.btnCrop)
        btnRotate = findViewById(R.id.btnRotate)
        btnClose = findViewById(R.id.btnClose)
        btnCancel = findViewById(R.id.btnCancel)
        btnUpload = findViewById(R.id.btnUpload)
        btnDeleteText = findViewById(R.id.btnDeleteText)
        
        // Initialize text editing controls
        textToolsContainer = findViewById(R.id.textToolsContainer)
        textSizeSeekBar = findViewById(R.id.textSizeSeekBar)
        textSizeLabel = findViewById(R.id.textSizeLabel)
        btnFontDefault = findViewById(R.id.btnFontDefault)
        btnFontSerif = findViewById(R.id.btnFontSerif)
        btnFontMonospace = findViewById(R.id.btnFontMonospace)
        btnFontCasual = findViewById(R.id.btnFontCasual)
        btnFontCursive = findViewById(R.id.btnFontCursive)
        
        fontButtons = listOf(
            btnFontDefault,
            btnFontSerif,
            btnFontMonospace,
            btnFontCasual,
            btnFontCursive
        )
        
        colorViews = listOf(
            findViewById<View>(R.id.colorRed),
            findViewById<View>(R.id.colorBlue),
            findViewById<View>(R.id.colorGreen),
            findViewById<View>(R.id.colorYellow),
            findViewById<View>(R.id.colorWhite)
        )
        
        // Initialize drawing tools
        drawingToolsContainer = findViewById(R.id.drawingToolsContainer)
        brushSizeSeekBar = findViewById(R.id.brushSizeSeekBar)
        
        // Initialize crop/rotate tools
        cropRotateToolsContainer = findViewById(R.id.cropRotateToolsContainer)
        btnCropToggle = findViewById(R.id.btnCropToggle)
        btnApplyCrop = findViewById(R.id.btnApplyCrop)
        
        textOverlayManager = TextOverlayManager(this, textOverlayContainer)
        textOverlayManager.setOnTextViewSelectedListener { selectedTextView ->
            currentSelectedTextView = selectedTextView
            if (selectedTextView != null && currentMode == EditMode.TEXT) {
                updateTextSizeControls()
            }
        }
        
        // Set up position change listener to save text position to bitmap
        textOverlayManager.setOnTextViewPositionChangedListener { textView ->
            Log.d(TAG, "Text view position changed, saving to bitmap - ID: ${textView.textViewId}")
            // Trigger bitmap update when text position changes
            updateImageViewWithEditedBitmap()
        }
        
        // Initialize layered canvas manager
        layeredCanvasManager = LayeredCanvasManager()
        
        // Setup crop/rotate view
        cropRotateView.setOnImageChangedListener(object : CropRotateView.OnImageChangedListener {
            override fun onImageRotated(rotation: Float) {
                layeredCanvasManager.rotateBackground(rotation)
                updateImageViewWithEditedBitmap()
                Log.d(TAG, "Image rotated: $rotation degrees")
            }
            
            override fun onImageCropped(cropRect: RectF) {
                layeredCanvasManager.cropBackground(cropRect)
                updateImageViewWithEditedBitmap()
                Log.d(TAG, "Image cropped: $cropRect")
            }
        })
        
        // Initially disable drawing
        drawingView.setDrawingEnabled(false)
        
        setupListeners()
        setupDrawingTools()
        setupCropRotateTools()
        
        imageUri = intent.getParcelableExtra(EXTRA_IMAGE_URI)
        loadImage()
    }
    
    private fun loadImage() {
        imageUri?.let { uri ->
            try {
                Log.d(TAG, "Loading image from URI: $uri")
                val inputStream: InputStream? = contentResolver.openInputStream(uri)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                inputStream?.close()
                
                if (bitmap != null) {
                    // Set bitmap with consistent matrix
                    imageView.setImageBitmap(bitmap)
                    
                    // Wait for ImageView to be measured, then set matrix
                    imageView.post {
                        val matrix = calculateImageMatrix(bitmap)
                        imageView.imageMatrix = matrix
                    }
                    
                    // Initialize layered canvas with the loaded bitmap
                    layeredCanvasManager.setBackgroundBitmap(bitmap)
                    
                    // Set bitmap to crop/rotate view
                    cropRotateView.setOriginalBitmap(bitmap)
                    
                    Log.d(TAG, "Image loaded successfully: ${bitmap.width}x${bitmap.height}")
                } else {
                    Log.e(TAG, "Failed to decode bitmap from URI")
                    Toast.makeText(this, "Failed to load image", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading image: ${e.message}")
                Toast.makeText(this, "Error loading image", Toast.LENGTH_SHORT).show()
                finish()
            }
        } ?: run {
            Log.e(TAG, "No image URI provided")
            Toast.makeText(this, "No image selected", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
    
    private fun calculateImageMatrix(bitmap: Bitmap): Matrix {
        val matrix = Matrix()
        
        // Get container dimensions
        val containerWidth = imageView.width.toFloat()
        val containerHeight = imageView.height.toFloat()
        
        if (containerWidth == 0f || containerHeight == 0f) {
            return matrix // Return identity matrix if container not measured yet
        }
        
        val bitmapWidth = bitmap.width.toFloat()
        val bitmapHeight = bitmap.height.toFloat()
        
        // Calculate scale to fit bitmap in container while maintaining aspect ratio
        val scaleX = containerWidth / bitmapWidth
        val scaleY = containerHeight / bitmapHeight
        val scale = minOf(scaleX, scaleY)
        
        // Calculate translation to center the bitmap
        val scaledWidth = bitmapWidth * scale
        val scaledHeight = bitmapHeight * scale
        val translateX = (containerWidth - scaledWidth) / 2f
        val translateY = (containerHeight - scaledHeight) / 2f
        
        matrix.setScale(scale, scale)
        matrix.postTranslate(translateX, translateY)
        
        Log.d(TAG, "Image matrix calculated: scale=$scale, translateX=$translateX, translateY=$translateY")
        Log.d(TAG, "Container: ${containerWidth}x${containerHeight}, Bitmap: ${bitmapWidth}x${bitmapHeight}")
        
        return matrix
    }
    
    private fun updateImageViewWithEditedBitmap() {
        // Update ImageView with the current edited bitmap from LayeredCanvasManager
        val editedBitmap = layeredCanvasManager.getBackgroundBitmap()
        if (editedBitmap != null) {
            imageView.setImageBitmap(editedBitmap)
            
            // Set consistent matrix for the bitmap (use post to ensure view is measured)
            imageView.post {
                val matrix = calculateImageMatrix(editedBitmap)
                imageView.imageMatrix = matrix
            }
            
            Log.d(TAG, "ImageView updated with edited bitmap: ${editedBitmap.width}x${editedBitmap.height}")
        }
    }
    
    override fun getImageMatrix(): Matrix {
        // Return the current image matrix for coordinate mapping
        return imageView.imageMatrix ?: Matrix()
    }
    
    override fun getImageBounds(): RectF {
        // Calculate the actual bounds of the displayed bitmap
        val bitmap = layeredCanvasManager.getBackgroundBitmap() ?: return RectF()
        val matrix = getImageMatrix()
        
        val bounds = RectF(0f, 0f, bitmap.width.toFloat(), bitmap.height.toFloat())
        matrix.mapRect(bounds)
        
        return bounds
    }
    
    private fun setupListeners() {
        btnClose.setOnClickListener { 
            Log.d(TAG, "Close button clicked")
            finish() 
        }
        
        btnCancel.setOnClickListener { 
            Log.d(TAG, "Cancel button clicked")
            finish() 
        }
        
        btnUpload.setOnClickListener {
            Log.d(TAG, "Upload button clicked")
            
            // Show loading state
            btnUpload.isEnabled = false
            btnUpload.text = "Uploading..."
            
            try {
                // Capture final canvas dengan menyembunyikan EditText boxes
                val canvasBitmap = captureFinalCanvas(findViewById(R.id.editorContainer))
                
                if (canvasBitmap != null) {
                    // Resize ke aspect ratio 9:16 untuk story format
                    val finalBitmap = resizeToStoryAspect(canvasBitmap)
                    
                    // Convert ke base64 dengan proper encoding dan prefix
                    val base64String = bitmapToBase64WithPrefix(finalBitmap)
                    
                    Log.d(TAG, "Final canvas captured successfully. Original size: ${canvasBitmap.width}x${canvasBitmap.height}")
                    Log.d(TAG, "Story aspect bitmap size: ${finalBitmap.width}x${finalBitmap.height}")
                    Log.d(TAG, "Base64 size with prefix: ${base64String.length} characters")
                    
                    // Upload ke Firestore menggunakan fungsi uploadStory
                    firebaseRepository.uploadStory(base64String) { success ->
                        runOnUiThread {
                            // Reset button state
                            btnUpload.isEnabled = true
                            btnUpload.text = "Upload"
                            
                            if (success) {
                                Log.d(TAG, "Story uploaded successfully!")
                                Toast.makeText(this, "Story uploaded successfully!", Toast.LENGTH_SHORT).show()
                                finish() // Kembali ke activity sebelumnya
                            } else {
                                Log.e(TAG, "Failed to upload story")
                                Toast.makeText(this, "Failed to upload story. Please try again.", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                } else {
                    Log.e(TAG, "Failed to capture final canvas")
                    Toast.makeText(this, "Failed to capture canvas", Toast.LENGTH_SHORT).show()
                    
                    // Reset button state
                    btnUpload.isEnabled = true
                    btnUpload.text = "Upload"
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error capturing final canvas: ${e.message}")
                Toast.makeText(this, "Error capturing canvas", Toast.LENGTH_SHORT).show()
                
                // Reset button state
                btnUpload.isEnabled = true
                btnUpload.text = "Upload"
            }
        }
        
        btnText.setOnClickListener {
            Log.d(TAG, "Text button clicked")
            setEditMode(EditMode.TEXT)
            val newTextView = textOverlayManager.addTextView("Text")
            currentSelectedTextView = newTextView
            updateTextSizeControls()
        }
        
        btnDraw.setOnClickListener {
            Log.d(TAG, "Draw button clicked")
            setEditMode(EditMode.DRAW)
        }
        
        btnCrop.setOnClickListener {
            Log.d(TAG, "Crop button clicked")
            setEditMode(EditMode.CROP_ROTATE)
        }
        
        btnRotate.setOnClickListener {
            Log.d(TAG, "Rotate button clicked")
            try {
                // Rotate background image 90 degrees directly
                layeredCanvasManager.rotateBackgroundBitmap()
                
                // Update ImageView immediately with rotated image
                updateImageViewWithEditedBitmap()
                
                // Update the crop rotate view with rotated image
                val rotatedBitmap = layeredCanvasManager.getBackgroundBitmap()
                if (rotatedBitmap != null) {
                    cropRotateView.setOriginalBitmap(rotatedBitmap)
                }
                
                Toast.makeText(this, "Image rotated 90°", Toast.LENGTH_SHORT).show()
                
            } catch (e: Exception) {
                Log.e(TAG, "Error rotating image", e)
                Toast.makeText(this, "Error rotating image", Toast.LENGTH_SHORT).show()
            }
        }
        
        // Text size SeekBar
        textSizeSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    val newSize = 12f + progress // Size from 12 to 72
                    textOverlayManager.setTextSizeInPx(newSize)
                    updateTextSizeLabel(newSize)
                }
            }
            
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })
        
        btnDeleteText.setOnClickListener {
            textOverlayManager.forceDelete()
        }
        
        // Setup font buttons with debug
        btnFontDefault.setOnClickListener { 
            Log.d(TAG, "Default button clicked")
            setCurrentTextFont(MovableTextView.FontType.NORMAL) 
        }
        btnFontSerif.setOnClickListener { 
            Log.d(TAG, "Serif button clicked")
            setCurrentTextFont(MovableTextView.FontType.SERIF) 
        }
        btnFontMonospace.setOnClickListener { 
            Log.d(TAG, "Monospace button clicked")
            setCurrentTextFont(MovableTextView.FontType.MONOSPACE) 
        }
        btnFontCasual.setOnClickListener { 
            Log.d(TAG, "Casual button clicked")
            setCurrentTextFont(MovableTextView.FontType.CASUAL) 
        }
        btnFontCursive.setOnClickListener { 
            Log.d(TAG, "Cursive button clicked")
            setCurrentTextFont(MovableTextView.FontType.CURSIVE) 
        }
    }
    
    private fun setupDrawingTools() {
        brushSizeSeekBar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                if (fromUser) {
                    val brushSize = 5f + (progress * 15f / 100f) // 5 to 20
                    drawingView.setBrushSize(brushSize)
                }
            }
            
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })
        
        // IMPORTANT: Color picker hanya untuk BRUSH saja, bukan untuk teks!
        // Teks tetap menggunakan warna default putih (Color.WHITE)
        // Setup color selection for BRUSH only (tidak untuk teks)
        colorViews.forEachIndexed { index, colorView ->
            colorView.setOnClickListener {
                val color = when (index) {
                    0 -> android.graphics.Color.RED
                    1 -> android.graphics.Color.BLUE
                    2 -> android.graphics.Color.GREEN
                    3 -> android.graphics.Color.YELLOW
                    4 -> android.graphics.Color.WHITE
                    else -> android.graphics.Color.WHITE
                }
                Log.d(TAG, "Brush color selected: $color")
                drawingView.setBrushColor(color) // Hanya mengubah warna brush
                updateBrushColorSelection(colorView)
            }
        }
        
        // Set default brush color to white
        drawingView.setBrushColor(android.graphics.Color.WHITE)
        updateBrushColorSelection(colorViews[4]) // White as default
    }
    
    private fun setupCropRotateTools() {
        // Crop buttons
        btnCropToggle.setOnClickListener {
            val isCropModeEnabled = btnCropToggle.text == "Disable Crop"
            cropRotateView.setCropMode(!isCropModeEnabled)
            
            if (!isCropModeEnabled) {
                btnCropToggle.text = "Disable Crop"
                btnApplyCrop.visibility = View.VISIBLE
            } else {
                btnCropToggle.text = "Enable Crop"
                btnApplyCrop.visibility = View.GONE
            }
            
            Log.d(TAG, "Crop mode toggled: ${!isCropModeEnabled}")
        }
        
        btnApplyCrop.setOnClickListener {
            Log.d(TAG, "Apply crop clicked")
            cropRotateView.applyCrop()
            
            // Ensure ImageView is updated after crop
            updateImageViewWithEditedBitmap()
            
            btnCropToggle.text = "Enable Crop"
            btnApplyCrop.visibility = View.GONE
        }
    }
    
    private fun setEditMode(mode: EditMode) {
        currentMode = mode
        
        // Exit edit mode for all text views when switching tools
        textOverlayManager.exitAllEditModes()
        
        // Always ensure ImageView shows the current edited bitmap when switching modes
        updateImageViewWithEditedBitmap()
        
        when (mode) {
            EditMode.TEXT -> {
                drawingView.setDrawingEnabled(false)
                drawingToolsContainer.visibility = android.view.View.GONE
                textToolsContainer.visibility = android.view.View.VISIBLE
                cropRotateToolsContainer.visibility = android.view.View.GONE
                cropRotateView.visibility = android.view.View.GONE
                updateButtonSelection(btnText)
            }
            EditMode.DRAW -> {
                drawingView.setDrawingEnabled(true)
                drawingToolsContainer.visibility = android.view.View.VISIBLE
                textToolsContainer.visibility = android.view.View.GONE
                cropRotateToolsContainer.visibility = android.view.View.GONE
                cropRotateView.visibility = android.view.View.GONE
                updateButtonSelection(btnDraw)
            }
            EditMode.CROP_ROTATE -> {
                drawingView.setDrawingEnabled(false)
                drawingToolsContainer.visibility = android.view.View.GONE
                textToolsContainer.visibility = android.view.View.GONE
                cropRotateToolsContainer.visibility = android.view.View.VISIBLE
                cropRotateView.visibility = android.view.View.VISIBLE
                
                // Ensure CropRotateView uses the latest edited bitmap
                val currentEditedBitmap = layeredCanvasManager.getBackgroundBitmap()
                if (currentEditedBitmap != null) {
                    cropRotateView.setOriginalBitmap(currentEditedBitmap)
                }
                
                updateButtonSelection(btnCrop)
            }
            EditMode.NONE -> {
                drawingView.setDrawingEnabled(false)
                drawingToolsContainer.visibility = android.view.View.GONE
                textToolsContainer.visibility = android.view.View.GONE
                cropRotateToolsContainer.visibility = android.view.View.GONE
                cropRotateView.visibility = android.view.View.GONE
                clearButtonSelection()
            }
        }
    }
    
    private fun updateButtonSelection(selectedButton: ImageButton) {
        val buttons = listOf(btnText, btnDraw, btnCrop)
        buttons.forEach { button ->
            if (button == selectedButton) {
                button.alpha = 1.0f
            } else {
                button.alpha = 0.7f
            }
        }
    }

    private fun clearButtonSelection() {
        val buttons = listOf(btnText, btnDraw, btnCrop)
        buttons.forEach { button ->
            button.alpha = 1.0f
        }
    }
    
    private fun updateTextSizeControls() {
        val currentTextView = currentSelectedTextView
        if (currentTextView != null) {
            val currentSize = textOverlayManager.getTextSizeInPx()
            val progress = (currentSize - 12).toInt() // Convert back to SeekBar progress (0-60)
            textSizeSeekBar.progress = progress.coerceIn(0, 60)
            updateTextSizeLabel(currentSize)
            updateFontSelection(textOverlayManager.getCurrentFontType())
            
            // Enable controls
            textSizeSeekBar.isEnabled = true
            btnDeleteText.isEnabled = true
            btnDeleteText.alpha = 1.0f
            fontButtons.forEach { it.isEnabled = true; it.alpha = 1.0f }
        } else {
            // Disable controls when no text selected
            textSizeSeekBar.isEnabled = false
            btnDeleteText.isEnabled = false
            btnDeleteText.alpha = 0.5f
            fontButtons.forEach { it.isEnabled = false; it.alpha = 0.5f }
            updateTextSizeLabel(24f) // Default display
            updateFontSelection(MovableTextView.FontType.NORMAL) // Default display
        }
    }
    
    private fun updateTextSizeLabel(sizePx: Float) {
        textSizeLabel.text = "${sizePx.toInt()}px"
    }
    
    private fun setCurrentTextFont(fontType: MovableTextView.FontType) {
        Log.d(TAG, "=== FONT CHANGE START ===")
        Log.d(TAG, "Requested font type: $fontType")
        Log.d(TAG, "Current selected text view: ${textOverlayManager.getCurrentSelectedTextView()}")
        Log.d(TAG, "Current selected text view ID: ${textOverlayManager.getCurrentSelectedTextView()?.textViewId}")
        Log.d(TAG, "All text view IDs: ${textOverlayManager.getAllTextViewIds()}")
        
        // Apply font to currently selected text view
        textOverlayManager.setFontType(fontType)
        updateFontSelection(fontType)
        
        // Verify font was applied
        val appliedFont = textOverlayManager.getCurrentSelectedTextView()?.fontType
        Log.d(TAG, "Applied font type: $appliedFont")
        Log.d(TAG, "=== FONT CHANGE END ===")
    }
    
    private fun updateFontSelection(selectedType: MovableTextView.FontType) {
        // Reset all buttons to unselected state
        fontButtons.forEach { button ->
            button.alpha = 0.7f
        }
        
        // Highlight selected button
        val selectedButton = when (selectedType) {
            MovableTextView.FontType.NORMAL -> btnFontDefault
            MovableTextView.FontType.SERIF -> btnFontSerif
            MovableTextView.FontType.MONOSPACE -> btnFontMonospace
            MovableTextView.FontType.CASUAL -> btnFontCasual
            MovableTextView.FontType.CURSIVE -> btnFontCursive
            MovableTextView.FontType.BOLD -> btnFontCasual // For backward compatibility
            MovableTextView.FontType.ITALIC -> btnFontCursive // For backward compatibility
        }
        
        selectedButton.alpha = 1.0f
    }
    
    // Visual feedback untuk pemilihan warna brush (bukan teks)
    private fun updateBrushColorSelection(selectedView: View) {
        colorViews.forEach { view ->
            view.alpha = if (view == selectedView) 1.0f else 0.5f
        }
    }
    
    /**
     * Hide soft keyboard
     */
    private fun hideKeyboard() {
        try {
            val inputMethodManager = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            val currentFocusView = currentFocus
            if (currentFocusView != null) {
                inputMethodManager.hideSoftInputFromWindow(currentFocusView.windowToken, 0)
            }
            Log.d(TAG, "Keyboard hidden")
        } catch (e: Exception) {
            Log.e(TAG, "Error hiding keyboard", e)
        }
    }
    
    /**
     * Resize bitmap to 9:16 aspect ratio (story format)
     * Adds letterbox (black padding) if needed to maintain aspect ratio
     * @param bitmap Original bitmap dari canvas capture
     * @return Bitmap baru dengan aspect ratio 9:16 yang fixed
     */
    private fun resizeToStoryAspect(bitmap: Bitmap): Bitmap {
        try {
            val originalWidth = bitmap.width
            val originalHeight = bitmap.height
            
            Log.d(TAG, "Original bitmap size: ${originalWidth}x${originalHeight}")
            
            // Target aspect ratio untuk story (9:16)
            val targetAspectRatio = 9f / 16f // 0.5625
            val currentAspectRatio = originalWidth.toFloat() / originalHeight.toFloat()
            
            Log.d(TAG, "Current aspect ratio: $currentAspectRatio, Target: $targetAspectRatio")
            
            // Calculate new dimensions untuk maintain 9:16 aspect ratio
            val finalWidth: Int
            val finalHeight: Int
            
            if (currentAspectRatio > targetAspectRatio) {
                // Image terlalu lebar (landscape) - letterbox kiri/kanan
                finalHeight = originalHeight
                finalWidth = (originalHeight * targetAspectRatio).toInt()
                Log.d(TAG, "Letterboxing horizontal - adding black padding left/right")
            } else {
                // Image terlalu tinggi atau square - letterbox atas/bawah
                finalWidth = originalWidth
                finalHeight = (originalWidth / targetAspectRatio).toInt()
                Log.d(TAG, "Letterboxing vertical - adding black padding top/bottom")
            }
            
            Log.d(TAG, "Final size after aspect ratio fix: ${finalWidth}x${finalHeight}")
            
            // Create new bitmap dengan background hitam
            val aspectCorrectedBitmap = Bitmap.createBitmap(
                finalWidth,
                finalHeight,
                Bitmap.Config.ARGB_8888
            )
            
            val canvas = Canvas(aspectCorrectedBitmap)
            
            // Fill dengan background hitam untuk letterbox effect
            canvas.drawColor(Color.BLACK)
            
            // Calculate position untuk center original bitmap
            val left = (finalWidth - originalWidth) / 2f
            val top = (finalHeight - originalHeight) / 2f
            
            Log.d(TAG, "Centering original bitmap at position: ($left, $top)")
            
            // Draw original bitmap di center dengan letterbox
            canvas.drawBitmap(bitmap, left, top, null)
            
            Log.d(TAG, "Story aspect ratio bitmap created successfully")
            
            return aspectCorrectedBitmap
            
        } catch (e: Exception) {
            Log.e(TAG, "Error resizing to story aspect ratio", e)
            // Return original bitmap jika ada error
            return bitmap
        }
    }
    
    /**
     * Capture final canvas view dengan menyembunyikan EditText boxes
     * @param view View yang akan di-capture (biasanya editorContainer)
     * @return Bitmap hasil capture atau null jika gagal
     */
    private fun captureFinalCanvas(view: View): Bitmap? {
        return try {
            Log.d(TAG, "Preparing canvas for final capture...")
            
            // Step 1: Clear focus dan sembunyikan keyboard dari semua EditText
            val allTextViews = textOverlayManager.getAllTextViews()
            allTextViews.forEach { textView ->
                textView.clearFocus()
                textView.exitEditMode()
            }
            
            // Step 2: Clear focus dari container dan sembunyikan keyboard
            view.clearFocus()
            hideKeyboard()
            
            // Step 3: Wait untuk memastikan keyboard tersembunyi dan UI updated
            Thread.sleep(100) // Small delay to ensure UI updates
            
            Log.d(TAG, "All EditText focus cleared, capturing canvas...")
            
            // Step 4: Pastikan view sudah di-layout
            if (view.width == 0 || view.height == 0) {
                Log.e(TAG, "View dimensions are 0, cannot capture")
                return null
            }
            
            // Step 5: Create bitmap dengan ukuran view
            val bitmap = Bitmap.createBitmap(
                view.width,
                view.height,
                Bitmap.Config.ARGB_8888
            )
            
            // Step 6: Create canvas dan render view ke bitmap (tanpa EditText boxes)
            val canvas = Canvas(bitmap)
            view.draw(canvas)
            
            Log.d(TAG, "Final canvas captured successfully: ${bitmap.width}x${bitmap.height}")
            Log.d(TAG, "Canvas captured without EditText input boxes")
            bitmap
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to capture final canvas", e)
            null
        }
    }
    
    /**
     * Convert bitmap ke base64 dengan prefix "data:image/jpeg;base64,"
     * @param bitmap Bitmap yang akan di-convert
     * @return Base64 string dengan proper prefix untuk Firestore
     */
    private fun bitmapToBase64WithPrefix(bitmap: Bitmap): String {
        val byteArrayOutputStream = java.io.ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        val base64 = android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)
        return "data:image/jpeg;base64,$base64"
    }
    
    private fun bitmapToBase64(bitmap: Bitmap): String {
        val byteArrayOutputStream = java.io.ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return android.util.Base64.encodeToString(byteArray, android.util.Base64.DEFAULT)
    }
    
    // Implementation of CropModeProvider interface
    override fun isCropModeActive(): Boolean {
        // Check if crop mode is currently enabled
        val isCropEnabled = btnCropToggle.text == "Disable Crop"
        Log.d(TAG, "isCropModeActive called: $isCropEnabled")
        return isCropEnabled
    }
}
