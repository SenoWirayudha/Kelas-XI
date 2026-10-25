package com.komputerkit.moview.ui.share

import android.content.Context
import android.graphics.Canvas
import android.util.AttributeSet
import android.view.View

/**
 * On-screen preview of the share poster. Draws through [PosterCompositor] so the preview and
 * the exported bitmap share one rendering path (WYSIWYG).
 *
 * The view keeps a 9:16 aspect ratio via [onMeasure].
 */
class PosterPreviewView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val compositor = PosterCompositor(context)
    private var content: PosterCompositor.PosterContent? = null

    init {
        // Glow uses Paint.setShadowLayer, which needs a software layer to render on-screen.
        setLayerType(LAYER_TYPE_SOFTWARE, null)
    }

    fun setContent(content: PosterCompositor.PosterContent?) {
        this.content = content
        invalidate()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val widthMode = MeasureSpec.getMode(widthMeasureSpec)
        val widthSize = MeasureSpec.getSize(widthMeasureSpec)
        val heightMode = MeasureSpec.getMode(heightMeasureSpec)
        val heightSize = MeasureSpec.getSize(heightMeasureSpec)

        val width: Int
        val height: Int
        when {
            widthMode == MeasureSpec.EXACTLY -> {
                width = widthSize
                height = (width * 16f / 9f).toInt()
            }
            heightMode == MeasureSpec.EXACTLY -> {
                height = heightSize
                width = (height * 9f / 16f).toInt()
            }
            else -> {
                width = widthSize
                height = (width * 16f / 9f).toInt()
            }
        }
        setMeasuredDimension(width, height)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        content?.let { compositor.draw(canvas, it) }
    }
}