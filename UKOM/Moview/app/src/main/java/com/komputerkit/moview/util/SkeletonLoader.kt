package com.komputerkit.moview.util

import android.animation.ValueAnimator
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.view.ViewGroup
import android.view.animation.LinearInterpolator
import androidx.core.content.ContextCompat
import com.komputerkit.moview.R
import java.util.WeakHashMap

/**
 * Reusable skeleton/shimmer placeholder for the whole app.
 *
 * Behaviour:
 *  - the placeholder container is ALWAYS fully opaque (solid dark background),
 *    so nothing behind it can show through;
            // 1) Solid base: opacity is never reduced.
 *    gradient band sweeps horizontally across them (~1.2s per sweep);
 *  - the real content views are set GONE while loading, so the old UI is not
 *    rendered at all (not merely covered).
 *
 * The placeholder shapes live in each screen's XML layout (built from the
 * shared `skeleton_block` / `skeleton_circle` drawables), so every screen keeps
 * its own shape but shares this single animation/visibility component.
 */
object SkeletonLoader {

    private class Pulse(val animator: ValueAnimator, val shimmers: List<ShimmerDrawable>)

    private val active = WeakHashMap<View, Pulse>()

    /** Show [container] as a shimmering skeleton and hide the real [content] views. */
    fun show(container: View, vararg content: View) {
        content.forEach { it.visibility = View.GONE }

        active.remove(container)?.let { previous ->
            previous.animator.cancel()
            previous.shimmers.forEach { it.setPhase(0f) }
        }
        container.animate().cancel()
        container.alpha = 1f
        // Opaque backdrop: guarantees no old fragment can be seen through the skeleton.
        container.setBackgroundColor(
            ContextCompat.getColor(container.context, R.color.dark_background)
        )
        container.visibility = View.VISIBLE

        val shimmers = collectShimmers(container)
        val animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 1200L
            repeatCount = ValueAnimator.INFINITE
            interpolator = LinearInterpolator()
        }
        animator.addUpdateListener { value ->
            val phase = value.animatedValue as Float
            for (shimmer in shimmers) shimmer.setPhase(phase)
        }
        animator.start()
        active[container] = Pulse(animator, shimmers)

        // Stop the infinite animation when the screen goes away (avoids leaking views).
        container.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
            override fun onViewAttachedToWindow(v: View) = Unit

            override fun onViewDetachedFromWindow(v: View) {
                v.removeOnAttachStateChangeListener(this)
                active.remove(v)?.let { pulse ->
                    pulse.animator.cancel()
                    pulse.shimmers.forEach { it.setPhase(0f) }
                }
            }
        })
    }

    /** Fade the skeleton out and reveal the real [content] views. */
    fun hide(container: View, vararg content: View) {
        active.remove(container)?.let { previous ->
            previous.animator.cancel()
            previous.shimmers.forEach { it.setPhase(0f) }
        }
        content.forEach { it.visibility = View.VISIBLE }

        if (container.visibility != View.VISIBLE) {
            container.alpha = 1f
            return
        }
        container.animate().cancel()
        container.animate()
            .alpha(0f)
            .setDuration(200L)
            .withEndAction {
                container.visibility = View.GONE
                container.alpha = 1f
            }
            .start()
    }

    /**
     * Replaces every placeholder block's static background with an equivalent
     * [ShimmerDrawable] (same base colour, corner radius / oval shape), reusing
     * an existing shimmer when the screen is shown again.
     */
    private fun collectShimmers(root: View): List<ShimmerDrawable> {
        val shimmers = ArrayList<ShimmerDrawable>()
        val shine = Color.argb(0x33, 0xFF, 0xFF, 0xFF)
        val baseColor = ContextCompat.getColor(root.context, R.color.dark_card)

        fun walk(view: View) {
            if (view is ViewGroup) {
                for (index in 0 until view.childCount) walk(view.getChildAt(index))
                return
            }
            val background = view.background
            if (background is ShimmerDrawable) {
                shimmers.add(background)
                return
            }
            // Only the shared skeleton placeholders (plain shapes) get a shimmer.
            val shape = background as? GradientDrawable ?: return
            val shimmer = ShimmerDrawable(
                baseColor = baseColor,
                shineColor = shine,
                isCircle = shape.shape == GradientDrawable.OVAL,
                cornerRadius = shape.cornerRadius.takeIf { it > 0f } ?: 0f
            )
            view.background = shimmer
            shimmers.add(shimmer)
        }
        walk(root)
        return shimmers
    }

    /** Solid base colour plus a horizontally moving light band, clipped to the shape. */
    private class ShimmerDrawable(
        private val baseColor: Int,
        private val shineColor: Int,
        private val isCircle: Boolean,
        private val cornerRadius: Float
    ) : Drawable() {

        private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        private val rect = RectF()
        private var phase = 0f

        fun setPhase(value: Float) {
            phase = value
            invalidateSelf()
        }

        override fun draw(canvas: Canvas) {
            val bounds = bounds
            if (bounds.isEmpty) return
            rect.set(bounds)

            // 1) Solid base â€” opacity is never reduced.
            paint.shader = null
            paint.color = baseColor
            drawShape(canvas)

            // 2) Moving highlight band.
            val bandWidth = bounds.width() * 0.7f
            if (bandWidth <= 0f) return
            val start = bounds.left - bandWidth + (bounds.width() + bandWidth * 2f) * phase
            paint.shader = LinearGradient(
                start, 0f, start + bandWidth, 0f,
                intArrayOf(Color.TRANSPARENT, shineColor, Color.TRANSPARENT),
                floatArrayOf(0f, 0.5f, 1f),
                Shader.TileMode.CLAMP
            )
            drawShape(canvas)
        }

        private fun drawShape(canvas: Canvas) {
            if (isCircle) {
                canvas.drawOval(rect, paint)
            } else {
                canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint)
            }
        }

        override fun setAlpha(alpha: Int) {
            paint.alpha = alpha
        }

        override fun setColorFilter(colorFilter: android.graphics.ColorFilter?) {
            paint.colorFilter = colorFilter
        }

        @Deprecated("Deprecated in Java")
        override fun getOpacity(): Int = android.graphics.PixelFormat.OPAQUE
    }
}
