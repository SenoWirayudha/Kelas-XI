package com.komputerkit.moview.ui.share

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.view.View
import androidx.core.content.res.ResourcesCompat
import androidx.core.graphics.ColorUtils
import androidx.core.graphics.drawable.toBitmap
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.common.StarRatingView
import kotlin.math.roundToInt

/**
 * Draws the share poster collage onto any [Canvas].
 *
 * Every number below is taken from the Figma SVG export (frame 1080x1920, units = px).
 * The canvas is scaled by `s = canvasWidth / 1080`, so the layout is identical at any size.
 * Export at exactly 1080 wide (see [render]) so nothing is distorted by screen density.
 *
 * Layer order (bottom to top):
 *  1. three backdrop panels: y 0-640, 640-1284, 1284-1920 (center-cropped)
 *  2. black shadow + poster (554x831 at 263,431, radius 30, 2px #727272 stroke)
 *  3. black shadow + round profile photo (90px, centered on the poster's top edge)
 *  4. title (with black glow), stars, "By" row, username
 *
 * Figma "blur" = 2 x sigma. Android's blur "radius" differs from sigma, so [blurRadius]
 * converts the Figma sigma values below.
 */
class PosterCompositor(
    private val context: Context,
    private val colors: Colors = Colors()
) {

    data class Colors(
        val starFilled: Int = Color.parseColor("#3663C4"),
        val starEmpty: Int = Color.parseColor("#4A4A4A"),
        val stroke: Int = Color.parseColor("#727272"),
        val byLine: Int = Color.parseColor("#D9D9D9"),
        val textPrimary: Int = Color.WHITE,
        val glow: Int = Color.BLACK,
        val panelFallback: Int = Color.parseColor("#1E2530")
    )

    data class PosterContent(
        val backdrops: List<Bitmap?>,
        val poster: Bitmap?,
        val profilePhoto: Bitmap?,
        val title: String,
        val rating: Float,
        val username: String
    )

    // Reused component (half-star aware). Sized in [drawStars].
    private val starView = StarRatingView(context).apply {
        starCount = STAR_COUNT
        displayMode = false
        setColors(colors.starFilled, colors.starEmpty)
    }

    // ---- Layout constants: pixels on the 1080x1920 canvas (from the Figma SVG) ------

    private companion object {
        const val VIRTUAL_WIDTH = 1080f
        const val VIRTUAL_HEIGHT = 1920f
        const val STAR_COUNT = 5

        // Backdrop panels are NOT equal thirds: 640 / 644 / 636
        const val PANEL_1_BOTTOM = 640f
        const val PANEL_2_BOTTOM = 1284f

        // Poster: outer rect 554x831 at (263,431), radius 30, 2px stroke drawn inside the edge
        const val POSTER_LEFT = 263f
        const val POSTER_TOP = 431f
        const val POSTER_WIDTH = 554f
        const val POSTER_HEIGHT = 831f
        const val POSTER_CORNER = 30f
        const val POSTER_STROKE = 2f
        const val POSTER_SHADOW_SPREAD = 9f
        const val POSTER_SHADOW_SIGMA = 35f
        const val POSTER_SHADOW_ALPHA = 0.40f

        // Profile photo: 90px circle centered on the poster's top edge (y = 431)
        const val PROFILE_SIZE = 90f
        const val PROFILE_CENTER_Y = 431f
        const val PROFILE_STROKE = 2f
        const val PROFILE_SHADOW_SPREAD = 16f
        const val PROFILE_SHADOW_SIGMA = 25f
        const val PROFILE_SHADOW_ALPHA = 0.45f

        // Title: Inter 40px (cap height 29.1), baseline y=1350, only the title has a glow
        const val TITLE_TEXT_SIZE = 40f
        const val TITLE_BASELINE = 1350f
        const val TITLE_GLOW_SIGMA = 17.5f
        const val TITLE_GLOW_ALPHA = 0.50f

        // Stars: each ~36x34 (pitch 38.5), vertical center y=1408.2, row width ~190
        const val STAR_SIZE = 36f
        const val STAR_GAP = 2.5f
        const val STAR_CENTER_Y = 1408.2f

        // "By" row: tiny white text + two 1px #D9D9D9 lines
        const val BY_TEXT_SIZE = 12f
        const val BY_BASELINE = 1476f
        const val BY_LEFT_LINE_START = 433f
        const val BY_LEFT_LINE_END = 518f
        const val BY_LEFT_LINE_Y = 1471.5f
        const val BY_RIGHT_LINE_START = 561f
        const val BY_RIGHT_LINE_END = 646f
        const val BY_RIGHT_LINE_Y = 1472.5f
        const val BY_LINE_HEIGHT = 1f

        // Username: white, 26px, baseline y=1527.5
        const val USERNAME_TEXT_SIZE = 26f
        const val USERNAME_BASELINE = 1527.5f
    }

    /**
     * Renders the collage into a fresh bitmap (default 1080x1920). Use it for the Instagram
     * export and for the on-screen preview: [BlurMaskFilter] shadows are reliable on a bitmap
     * canvas. If you keep drawing straight onto a View canvas, call
     * `setLayerType(View.LAYER_TYPE_SOFTWARE, null)` on that view.
     */
    fun render(content: PosterContent, width: Int = VIRTUAL_WIDTH.toInt()): Bitmap {
        val height = (width * VIRTUAL_HEIGHT / VIRTUAL_WIDTH).roundToInt()
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        draw(Canvas(bitmap), content)
        return bitmap
    }

    /** Draws the whole collage scaled to [canvas]'s width (9:16 aspect assumed). */
    fun draw(canvas: Canvas, content: PosterContent) {
        val s = canvas.width / VIRTUAL_WIDTH
        val width = canvas.width.toFloat()

        drawBackdrops(canvas, content.backdrops, width, canvas.height.toFloat(), s)

        // Poster
        val posterRect = RectF(
            POSTER_LEFT * s,
            POSTER_TOP * s,
            (POSTER_LEFT + POSTER_WIDTH) * s,
            (POSTER_TOP + POSTER_HEIGHT) * s
        )
        drawShadow(
            canvas, posterRect, POSTER_CORNER * s,
            POSTER_SHADOW_SPREAD * s, POSTER_SHADOW_SIGMA * s, POSTER_SHADOW_ALPHA
        )
        drawPoster(canvas, content.poster, posterRect, s)

        // Profile photo
        val centerX = width / 2f
        val profileCenterY = PROFILE_CENTER_Y * s
        val profileRadius = PROFILE_SIZE * s / 2f
        val profileRect = RectF(
            centerX - profileRadius,
            profileCenterY - profileRadius,
            centerX + profileRadius,
            profileCenterY + profileRadius
        )
        drawShadow(
            canvas, profileRect, profileRadius,
            PROFILE_SHADOW_SPREAD * s, PROFILE_SHADOW_SIGMA * s, PROFILE_SHADOW_ALPHA
        )
        drawProfilePhoto(canvas, content.profilePhoto, centerX, profileCenterY, s)

        drawCaption(canvas, content, width, s)
    }

    // ---- Layers --------------------------------------------------------------------

    private fun drawBackdrops(canvas: Canvas, backdrops: List<Bitmap?>, width: Float, height: Float, s: Float) {
        val edges = floatArrayOf(0f, PANEL_1_BOTTOM * s, PANEL_2_BOTTOM * s, height)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        for (index in 0 until 3) {
            val rect = RectF(0f, edges[index], width, edges[index + 1])
            val bitmap = backdrops.getOrNull(index)

            when {
                bitmap != null && !bitmap.isRecycled -> {
                    paint.shader = centerCropShader(bitmap, rect)
                    canvas.drawRect(rect, paint)
                    paint.shader = null
                }
                // No backdrop chosen (or the film has none): use the branded artwork so the
                // poster is never a plain grey block.
                defaultPanel != null && !defaultPanel!!.isRecycled -> {
                    paint.shader = centerCropShader(defaultPanel!!, rect)
                    canvas.drawRect(rect, paint)
                    paint.shader = null
                }
                else -> {
                    paint.shader = null
                    paint.color = colors.panelFallback
                    canvas.drawRect(rect, paint)
                }
            }
        }
    }

    /** Branding fallback (branding/"Background jika tanpa backdrop.png"), loaded once. */
    private val defaultPanel: Bitmap? by lazy {
        runCatching {
            ResourcesCompat.getDrawable(context.resources, R.drawable.bg_poster_default, null)
                ?.toBitmap()
        }.getOrNull()
    }

    /** Black shadow: [bounds] grown by [spread], then Gaussian-blurred with [sigma]. */
    private fun drawShadow(
        canvas: Canvas,
        bounds: RectF,
        radius: Float,
        spread: Float,
        sigma: Float,
        alpha: Float
    ) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = ColorUtils.setAlphaComponent(colors.glow, (255 * alpha).roundToInt())
            style = Paint.Style.FILL
            maskFilter = BlurMaskFilter(blurRadius(sigma), BlurMaskFilter.Blur.NORMAL)
        }
        val grown = RectF(bounds).apply { inset(-spread, -spread) }
        canvas.drawRoundRect(grown, radius + spread, radius + spread, paint)
    }

    private fun drawPoster(canvas: Canvas, poster: Bitmap?, rect: RectF, s: Float) {
        val corner = POSTER_CORNER * s
        val strokeWidth = POSTER_STROKE * s

        val fill = Paint(Paint.ANTI_ALIAS_FLAG)
        if (poster != null && !poster.isRecycled) {
            fill.shader = centerCropShader(poster, rect)
        } else {
            fill.color = colors.panelFallback
        }
        canvas.drawRoundRect(rect, corner, corner, fill)

        // 2px stroke #727272 inside the edge, so the outer size stays 554x831.
        val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = colors.stroke
            style = Paint.Style.STROKE
            this.strokeWidth = strokeWidth
        }
        val strokeRect = RectF(rect).apply { inset(strokeWidth / 2f, strokeWidth / 2f) }
        canvas.drawRoundRect(strokeRect, corner - strokeWidth / 2f, corner - strokeWidth / 2f, stroke)
    }

    private fun drawProfilePhoto(canvas: Canvas, photo: Bitmap?, centerX: Float, centerY: Float, s: Float) {
        val radius = PROFILE_SIZE * s / 2f
        val strokeWidth = PROFILE_STROKE * s
        val imageRect = RectF(centerX - radius, centerY - radius, centerX + radius, centerY + radius)

        val fill = Paint(Paint.ANTI_ALIAS_FLAG)
        if (photo != null && !photo.isRecycled) {
            fill.shader = centerCropShader(photo, imageRect)
        } else {
            fill.color = colors.panelFallback
        }
        canvas.drawCircle(centerX, centerY, radius, fill)

        // 2px stroke #727272 inside the 90px outer diameter.
        val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = colors.stroke
            style = Paint.Style.STROKE
            this.strokeWidth = strokeWidth
        }
        canvas.drawCircle(centerX, centerY, radius - strokeWidth / 2f, stroke)
    }

    private fun drawCaption(canvas: Canvas, content: PosterContent, canvasWidth: Float, s: Float) {
        val centerX = canvasWidth / 2f
        val padding = 70f * s

        // Title: white 40px with a black glow (the only element with a glow).
        val titlePaint = textPaint(TITLE_TEXT_SIZE * s, colors.textPrimary, semibold = true).apply {
            setShadowLayer(
                blurRadius(TITLE_GLOW_SIGMA * s),
                0f,
                0f,
                ColorUtils.setAlphaComponent(colors.glow, (255 * TITLE_GLOW_ALPHA).roundToInt())
            )
        }
        val title = fitText(content.title, titlePaint, canvasWidth - padding * 2f)
        canvas.drawText(title, centerX, TITLE_BASELINE * s, titlePaint)

        drawStars(canvas, centerX, STAR_CENTER_Y * s, content.rating, s)
        drawByRow(canvas, centerX, s)

        val usernamePaint = textPaint(USERNAME_TEXT_SIZE * s, colors.textPrimary, semibold = true)
        val username = fitText(content.username, usernamePaint, canvasWidth - padding * 2f)
        canvas.drawText(username, centerX, USERNAME_BASELINE * s, usernamePaint)
    }

    /**
     * Renders the project's existing [StarRatingView] (half-star aware), centered on
     * ([centerX], [centerY]). Its dp-based sizing is converted from canvas pixels.
     */
    private fun drawStars(canvas: Canvas, centerX: Float, centerY: Float, rating: Float, s: Float) {
        val density = context.resources.displayMetrics.density
        starView.starSizeDp = (STAR_SIZE * s) / density
        starView.starGapDp = (STAR_GAP * s) / density
        starView.rating = rating

        val spec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
        starView.measure(spec, spec)
        starView.layout(0, 0, starView.measuredWidth, starView.measuredHeight)

        canvas.save()
        canvas.translate(centerX - starView.measuredWidth / 2f, centerY - starView.measuredHeight / 2f)
        starView.draw(canvas)
        canvas.restore()
    }

    private fun drawByRow(canvas: Canvas, centerX: Float, s: Float) {
        val byPaint = textPaint(BY_TEXT_SIZE * s, colors.textPrimary, semibold = false)
        canvas.drawText("By", centerX, BY_BASELINE * s, byPaint)

        val half = BY_LINE_HEIGHT * s / 2f
        val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = colors.byLine }
        canvas.drawRect(
            BY_LEFT_LINE_START * s, BY_LEFT_LINE_Y * s - half,
            BY_LEFT_LINE_END * s, BY_LEFT_LINE_Y * s + half, linePaint
        )
        canvas.drawRect(
            BY_RIGHT_LINE_START * s, BY_RIGHT_LINE_Y * s - half,
            BY_RIGHT_LINE_END * s, BY_RIGHT_LINE_Y * s + half, linePaint
        )
    }

    // ---- Helpers -------------------------------------------------------------------

    /** Converts a Gaussian sigma (Figma/SVG) to Android's blur radius (sigma = 0.57735 * r + 0.5). */
    private fun blurRadius(sigma: Float): Float = ((sigma - 0.5f) / 0.57735f).coerceAtLeast(0.1f)

    private fun textPaint(size: Float, color: Int, semibold: Boolean): Paint {
        val typeface = if (semibold) {
            ResourcesCompat.getFont(context, R.font.inter_semibold)
        } else {
            null
        }
        return Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textSize = size
            this.color = color
            textAlign = Paint.Align.CENTER
            if (typeface != null) this.typeface = typeface
        }
    }

    /** Scales down [text] until it fits [maxWidth], then ellipsizes if still too wide. */
    private fun fitText(text: String, paint: Paint, maxWidth: Float): String {
        val original = paint.textSize
        var value = text.ifBlank { "Untitled" }
        var guard = 0
        while (paint.measureText(value) > maxWidth && paint.textSize > original * 0.6f && guard < 40) {
            paint.textSize -= original * 0.01f
            guard++
        }
        if (paint.measureText(value) > maxWidth) {
            while (value.length > 1 && paint.measureText("$value…") > maxWidth) {
                value = value.dropLast(1)
            }
            value = "$value…"
        }
        return value
    }

    private fun centerCropShader(bitmap: Bitmap, target: RectF): BitmapShader {
        val shader = BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        val targetRatio = target.width() / target.height()
        val bitmapRatio = bitmap.width.toFloat() / bitmap.height.toFloat()

        val srcWidth: Float
        val srcHeight: Float
        if (bitmapRatio > targetRatio) {
            srcHeight = bitmap.height.toFloat()
            srcWidth = srcHeight * targetRatio
        } else {
            srcWidth = bitmap.width.toFloat()
            srcHeight = srcWidth / targetRatio
        }

        val left = (bitmap.width - srcWidth) / 2f
        val top = (bitmap.height - srcHeight) / 2f
        // The shader is evaluated in canvas space, so map to the real on-canvas rect.
        shader.setLocalMatrix(
            Matrix().apply {
                setRectToRect(
                    RectF(left, top, left + srcWidth, top + srcHeight),
                    RectF(target),
                    Matrix.ScaleToFit.FILL
                )
            }
        )
        return shader
    }
}