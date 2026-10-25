package com.komputerkit.moview.util

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ValueAnimator
import android.content.Context
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.ViewConfiguration
import android.view.animation.DecelerateInterpolator
import kotlin.math.abs
import kotlin.math.roundToLong

/**
 * ViewPager2-style horizontal swipe: content follows the finger and snaps on release
 * (past half a page, or a fling) — the same feel as the ticket-history pager.
 *
 * Used where a real ViewPager2 is not practical: the bottom-nav tabs (hosted by a NavHost)
 * and the Profil/Setting panes inside Edit Profile.
 *
 * [onTouch] must receive every event before the children do. It returns `true` only while a
 * drag is in progress; otherwise `false`, so taps and vertical scrolling are untouched.
 */
class PagerSwipeGesture(
    context: Context,
    private val pageWidth: () -> Float,
    private val translate: (Float) -> Unit,
    private val canGoLeft: () -> Boolean,
    private val canGoRight: () -> Boolean,
    private val onSwipe: (direction: Int) -> Unit,
    /** Called once the drag wins, so children can drop their own gesture. */
    private val onCancelChildren: () -> Unit = {},
    /** True when the touch starts somewhere that must keep the gesture (e.g. a carousel). */
    private val isBlocked: (MotionEvent) -> Boolean = { false },
    /** Prepare the incoming page (e.g. make it visible at the right offset). */
    private val onDragStart: (direction: Int) -> Unit = {},
    /** Restore visibility/state after the snap animation. */
    private val onDragEnd: () -> Unit = {},
    /**
     * Optional: take over the release animation when a swipe commits. Gets the direction
     * (+1 = next page, -1 = previous page) and the current finger offset in px. Return true
     * when handled; the gesture then does NOT animate, call [onSwipe] or [onDragEnd]; the
     * caller owns the whole hand-over. Return false to use the default snap.
     */
    private val onCommit: ((direction: Int, offset: Float) -> Boolean)? = null
) {
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop.toFloat()
    private val minFling = ViewConfiguration.get(context).scaledMinimumFlingVelocity.toFloat()

    private var tracker: VelocityTracker? = null
    private var downX = 0f
    private var downY = 0f
    private var offset = 0f
    private var dragging = false
    private var locked = false
    private var animator: ValueAnimator? = null

    fun onTouch(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                animator?.cancel()
                tracker?.recycle()
                tracker = VelocityTracker.obtain().also { it.addMovement(event) }
                downX = event.rawX
                downY = event.rawY
                offset = 0f
                dragging = false
                locked = isBlocked(event)
            }

            // A second finger never cancels a drag that is already running.
            MotionEvent.ACTION_POINTER_DOWN -> if (!dragging) locked = true

            MotionEvent.ACTION_MOVE -> {
                if (locked && !dragging) return false
                tracker?.addMovement(event)

                val dx = event.rawX - downX
                val dy = event.rawY - downY

                if (!dragging) {
                    if (abs(dy) > touchSlop && abs(dy) >= abs(dx)) {
                        locked = true // vertical: belongs to the scrollable content
                        return false
                    }
                    if (abs(dx) <= touchSlop || abs(dx) <= abs(dy)) return false

                    val goingNext = dx < 0f
                    if ((goingNext && !canGoLeft()) || (!goingNext && !canGoRight())) {
                        locked = true // first/last page: no rubber band, like ViewPager2
                        return false
                    }

                    dragging = true
                    onCancelChildren()
                    onDragStart(if (goingNext) 1 else -1)
                }

                offset = dx
                translate(dx)
                return true
            }

            MotionEvent.ACTION_UP -> {
                val wasDragging = dragging
                if (wasDragging) {
                    tracker?.addMovement(event)
                    tracker?.computeCurrentVelocity(1000)
                    val vx = tracker?.xVelocity ?: 0f
                    val dx = event.rawX - downX
                    val width = pageWidth()

                    val goNext = dx < 0f
                    val direction = if (goNext) 1 else -1
                    val passedHalf = abs(dx) > width / 2f
                    val flung = if (goNext) vx < -minFling else vx > minFling
                    val commit = (passedHalf || flung) &&
                            if (goNext) canGoLeft() else canGoRight()

                    val handled = commit && onCommit?.invoke(direction, dx) == true
                    if (!handled) settle(commit, dx, direction, vx)
                }
                tracker?.recycle()
                tracker = null
                dragging = false
                locked = false
                return wasDragging
            }

            MotionEvent.ACTION_CANCEL -> {
                val wasDragging = dragging
                // Continue from where the page currently is instead of jumping to 0.
                if (wasDragging) settle(commit = false, dx = offset, direction = 0, velocityX = 0f)
                tracker?.recycle()
                tracker = null
                dragging = false
                locked = false
                return wasDragging
            }
        }
        return false
    }

    private fun settle(commit: Boolean, dx: Float, direction: Int, velocityX: Float) {
        val width = pageWidth()
        val end = if (commit) (if (direction > 0) -width else width) else 0f
        val distance = abs(end - dx)

        // Time scales with the distance left, and a fast fling finishes quicker.
        var snapMs = (SNAP_MAX_MS * (distance / width).coerceIn(0f, 1f)).roundToLong()
        val speed = abs(velocityX)
        if (speed > minFling) {
            snapMs = minOf(snapMs, (distance / speed * 1000f).roundToLong())
        }
        snapMs = snapMs.coerceIn(SNAP_MIN_MS, SNAP_MAX_MS)

        animator?.cancel()
        animator = ValueAnimator.ofFloat(dx, end).apply {
            setDuration(snapMs)
            interpolator = DecelerateInterpolator(1.8f)
            addUpdateListener { anim -> translate(anim.animatedValue as Float) }
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    if (commit) onSwipe(direction)
                    onDragEnd()
                }
            })
            start()
        }
    }

    private companion object {
        const val SNAP_MAX_MS = 300L
        const val SNAP_MIN_MS = 180L
    }
}