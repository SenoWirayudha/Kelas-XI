package com.komputerkit.moview.ui.share

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.core.content.FileProvider
import com.komputerkit.moview.BuildConfig
import java.io.File
import java.io.FileOutputStream

/**
 * Saves the generated poster and hands it to the Instagram Stories editor.
 *
 * Primary path: `com.instagram.share.ADD_TO_STORY` + `backgroundImage` extra (documented
 * background-sticker intent for Stories) with a FileProvider content URI.
 * Fallback when Instagram is missing: save to the device gallery and report it to the caller.
 */
object StoryShareHelper {

    /** Cache subfolder for generated posters (never public storage). Declared in file_paths.xml. */
    const val SHARED_DIR = "shared_posters"

    sealed interface Result {
        data object InstagramOpened : Result
        data object SavedToGallery : Result
        data class Failed(val reason: String) : Result
    }

    /**
     * Tests the installed package list, not getLaunchIntentForPackage(): Instagram exposes no
     * launcher intent to third parties, so the old check always reported "not installed".
     */
    fun isInstagramInstalled(context: Context): Boolean = try {
        context.packageManager.getPackageInfo(INSTAGRAM_PACKAGE, 0)
        true
    } catch (_: PackageManager.NameNotFoundException) {
        false
    }

    /** Writes [bitmap] to the cache and returns its FileProvider URI. */
    fun cachePoster(context: Context, bitmap: Bitmap): Uri {
        val dir = File(context.cacheDir, SHARED_DIR).apply { if (!exists()) mkdirs() }

        // Keep only the newest few files; each share supersedes the previous one.
        dir.listFiles()
            ?.sortedByDescending { it.lastModified() }
            ?.drop(MAX_CACHED_FILES)
            ?.forEach { it.delete() }

        val file = File(dir, "moview-story-${System.currentTimeMillis()}.png")
        FileOutputStream(file).use { out ->
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }

        return FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    }

    /**
     * Opens the Instagram Stories editor with [uri] as the background image.
     *
     * Tries the Stories-specific intent first. If Instagram is present but has no activity
     * registered for it (older versions), falls back to the plain send intent targeted at
     * Instagram, and finally to a chooser so the user can still reach Instagram.
     */
    fun shareToInstagramStories(context: Context, uri: Uri): Boolean {
        val installed = isInstagramInstalled(context)
        Log.d(TAG, "shareToInstagramStories: installed=$installed uri=$uri fbAppId=${BuildConfig.FB_APP_ID}")

        if (!installed) return false

        // Instagram's Stories intent demands a Facebook App ID in "source_application".
        // Only attempt it when one is configured; otherwise use Instagram's plain share sheet.
        if (BuildConfig.FB_APP_ID.isNotBlank()) {
            val storiesIntent = Intent(INSTAGRAM_STORIES_ACTION).apply {
                // The background asset goes in setDataAndType(). The com.instagram.sharedSticker.*
                // extras are iOS-pasteboard-only; putting the bitmap there made Instagram open
                // and immediately close with an empty composer.
                setDataAndType(uri, "image/png")
                putExtra(EXTRA_SOURCE_APPLICATION, BuildConfig.FB_APP_ID)
                addFlags(startFlags(context))
            }

            if (storiesIntent.resolveActivity(context.packageManager) != null) {
                val started = startTarget(context, storiesIntent, uri, "storiesIntent")
                if (started) return true
            }
        }

        // Instagram installed but no usable Stories intent: hand the image to Instagram
        // directly; its share sheet offers Feed / Story / Reels / Direct.
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
            setPackage(INSTAGRAM_PACKAGE)
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(startFlags(context))
        }

        if (sendIntent.resolveActivity(context.packageManager) != null) {
            val started = startTarget(context, sendIntent, uri, "sendIntent")
            if (started) return true
        }

        // Last resort: untargeted chooser so the user can still reach Instagram.
        val chooser = Intent.createChooser(
            Intent(Intent.ACTION_SEND).apply {
                type = "image/png"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            },
            "Share to Instagram"
        ).addFlags(startFlags(context))

        return try {
            context.startActivity(chooser)
            Log.d(TAG, "chooser started")
            true
        } catch (e: Exception) {
            Log.e(TAG, "chooser failed", e)
            false
        }
    }

    private fun startTarget(context: Context, intent: Intent, uri: Uri, label: String): Boolean {
        return try {
            // Explicit grant: setPackage() alone is not enough on some Android versions.
            context.grantUriPermission(
                INSTAGRAM_PACKAGE, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
            )
            context.startActivity(intent)
            Log.d(TAG, "$label started")
            true
        } catch (e: Exception) {
            Log.e(TAG, "$label failed", e)
            false
        }
    }

    /**
     * Read permission always; NEW_TASK only when launched from a non-Activity context
     * (a Fragment's context is a ContextThemeWrapper, which would otherwise crash).
     */
    private fun startFlags(context: Context): Int {
        var flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
        if (context !is android.app.Activity) flags = flags or Intent.FLAG_ACTIVITY_NEW_TASK
        return flags
    }

    /**
     * Saves [bitmap] into the gallery (Pictures/Moview). Works on API 24+ without any
     * storage permission: MediaStore on Q+, app-specific external dir on older versions.
     */
    fun saveToGallery(context: Context, bitmap: Bitmap): Boolean {
        val fileName = "Moview_Story_${System.currentTimeMillis()}.png"

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                    put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/Moview")
                }
                val uri = context.contentResolver.insert(
                    MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values
                ) ?: return false

                context.contentResolver.openOutputStream(uri)?.use { out ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                } ?: return false
                true
            } else {
                val dir = File(
                    context.getExternalFilesDir(Environment.DIRECTORY_PICTURES), "Moview"
                ).apply { if (!exists()) mkdirs() }
                val file = File(dir, fileName)
                FileOutputStream(file).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                }

                // Make it appear in the gallery right away.
                val values = ContentValues().apply {
                    put(MediaStore.Images.Media.DATA, file.absolutePath)
                    put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                }
                context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                true
            }
        } catch (_: Exception) {
            false
        }
    }

    private const val TAG = "StoryShare"
    private const val INSTAGRAM_PACKAGE = "com.instagram.android"
    private const val INSTAGRAM_STORIES_ACTION = "com.instagram.share.ADD_TO_STORY"
    private const val EXTRA_SOURCE_APPLICATION = "source_application"
    private const val MAX_CACHED_FILES = 5
}