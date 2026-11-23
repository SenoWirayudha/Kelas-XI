package com.komputerkit.moview.ui.share

import android.app.Application
import android.content.Context
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Backs [PosterGeneratorFragment].
 *
 * Deliberately thin: the poster URL, rating and author identity are the *already resolved*
 * values from the Log/Review detail screen (passed as nav args), so the custom-vs-default
 * poster logic and the half-star rating are reused instead of reimplemented. The backdrop
 * list is not fetched here either — the shared poster/backdrop picker supplies it.
 */
class PosterGeneratorViewModel(application: Application) : AndroidViewModel(application) {

    // Exactly 3 selected backdrop URLs, in panel order (1 -> 2 -> 3).
    private val _selectedUrls = MutableLiveData<List<String>>(emptyList())
    val selectedUrls: LiveData<List<String>> = _selectedUrls

    private val _shareEvent = MutableLiveData<ShareResult?>()
    val shareEvent: LiveData<ShareResult?> = _shareEvent

    // The preview shows the exact bitmap produced by PosterCompositor (1080x1920), i.e. the
    // same rendering path and resolution used for the Instagram export (single source of truth).
    private val _previewBitmap = MutableLiveData<Bitmap?>()
    val previewBitmap: LiveData<Bitmap?> = _previewBitmap

    private var previewJob: Job? = null

    /**
     * True once the picker was opened automatically. The generator's view is destroyed while
     * the picker is on top, so without this flag returning from the picker (including with
     * Back) would immediately open it again and trap the user in a loop.
     */
    var autoOpenedPicker: Boolean = false
        private set

    fun markPickerAutoOpened() {
        autoOpenedPicker = true
    }

    /** See [useBrandedBackground]; when true the collage ignores [selectedUrls]. */
    var useDefaultBackground: Boolean = false
        private set

    private var title: String = ""
    private var rating: Float = 0f
    private var username: String = ""
    private var posterUrl: String? = null
    private var profilePhotoUrl: String? = null

    fun load(
        title: String,
        rating: Float,
        username: String,
        posterUrl: String?,
        profilePhotoUrl: String?
    ) {
        this.title = title
        this.rating = rating
        this.username = username
        this.posterUrl = posterUrl
        this.profilePhotoUrl = profilePhotoUrl
    }

    /** Applies the 3 scenes chosen in the shared backdrop picker. */
    fun setSelectedUrls(urls: List<String>) {
        useDefaultBackground = false
        _selectedUrls.value = urls.take(MAX_SCENES)
    }

    /**
     * The user skipped picking scenes: the collage uses the branded artwork from
     * `res/drawable-nodpi/bg_poster_default.png` (branding/"Background jika tanpa backdrop").
     */
    fun useBrandedBackground() {
        useDefaultBackground = true
        _selectedUrls.value = emptyList()
    }

    fun clearSelection() {
        useDefaultBackground = false
        _selectedUrls.value = emptyList()
        previewJob?.cancel()
        _previewBitmap.value = null
    }

    fun isReady(): Boolean =
        useDefaultBackground || _selectedUrls.value.orEmpty().size == MAX_SCENES

    /** Renders the export bitmap (same resolution/path as [share]) to show it as the preview. */
    fun loadPreview(context: Context) {
        if (!isReady()) {
            _previewBitmap.value = null
            return
        }

        previewJob?.cancel()
        previewJob = viewModelScope.launch {
            val bitmap = buildBitmap(context, _selectedUrls.value.orEmpty())
            _previewBitmap.value = bitmap
        }
    }

    /**
     * Renders the poster at full 1080x1920 and hands it to Instagram Stories.
     * Falls back to saving in the gallery only when Instagram truly cannot take it.
     */
    fun share(context: Context) {
        if (!isReady()) return
        val urls = _selectedUrls.value.orEmpty()

        viewModelScope.launch {
            val bitmap = withContext(Dispatchers.Default) { buildBitmap(context, urls) }

            if (bitmap == null) {
                _shareEvent.value = ShareResult.Failed("Gagal membuat poster.")
                return@launch
            }

            val result = withContext(Dispatchers.IO) {
                val uri = runCatching { StoryShareHelper.cachePoster(context, bitmap) }.getOrNull()
                when {
                    uri == null -> ShareResult.Failed("Gagal menyimpan poster.")
                    StoryShareHelper.shareToInstagramStories(context, uri) -> ShareResult.InstagramOpened
                    // Instagram missing or refused the intent: keep a gallery copy.
                    StoryShareHelper.saveToGallery(context, bitmap) -> ShareResult.SavedToGallery
                    else -> ShareResult.Failed("Gagal membuka Instagram.")
                }
            }
            _shareEvent.value = result
        }
    }

    fun consumeShareEvent() {
        _shareEvent.value = null
    }

    private suspend fun buildBitmap(context: Context, urls: List<String>): Bitmap? {
        val panelHeight = OUTPUT_HEIGHT / 3

        val backdrops = if (useDefaultBackground) emptyList() else urls.map { url ->
            ShareBitmapLoader.load(context, url, OUTPUT_WIDTH, panelHeight)
        }
        val poster = ShareBitmapLoader.load(
            context, posterUrl, POSTER_LOAD_WIDTH, POSTER_LOAD_HEIGHT
        )
        val avatar = ShareBitmapLoader.load(context, profilePhotoUrl, AVATAR_LOAD_SIZE, AVATAR_LOAD_SIZE)

        val bitmap = Bitmap.createBitmap(OUTPUT_WIDTH, OUTPUT_HEIGHT, Bitmap.Config.ARGB_8888)
        val canvas = android.graphics.Canvas(bitmap)
        // The bitmap canvas is a software canvas, so Paint.setShadowLayer renders the glow.
        PosterCompositor(context).draw(
            canvas,
            PosterCompositor.PosterContent(
                backdrops = backdrops,
                poster = poster,
                profilePhoto = avatar,
                title = title,
                rating = rating,
                username = withAtPrefix(username)
            )
        )
        return bitmap
    }

    /** Poster shows the handle, e.g. "@seno". */
    private fun withAtPrefix(name: String): String {
        val trimmed = name.trim()
        return if (trimmed.isEmpty() || trimmed.startsWith("@")) trimmed else "@$trimmed"
    }

    sealed interface ShareResult {
        /** Instagram Stories editor was opened with the poster. */
        data object InstagramOpened : ShareResult

        /** Instagram could not take the image; poster was written to the gallery instead. */
        data object SavedToGallery : ShareResult
        data class Failed(val reason: String) : ShareResult
    }

    companion object {
        const val MAX_SCENES = 3

        private const val OUTPUT_WIDTH = 1080
        private const val OUTPUT_HEIGHT = 1920
        private const val POSTER_LOAD_WIDTH = 940
        private const val POSTER_LOAD_HEIGHT = 1400
        private const val AVATAR_LOAD_SIZE = 384
    }
}
