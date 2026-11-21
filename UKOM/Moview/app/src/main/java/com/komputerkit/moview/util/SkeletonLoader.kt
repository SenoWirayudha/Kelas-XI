package com.komputerkit.moview.util

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.view.View
import java.util.WeakHashMap

/**
 * Skeleton/shimmer placeholder helper.
 *
 * The placeholder layout itself is plain XML (grey blocks shaped like the real
 * content); this object only pulses it while loading and fades it out once the
 * data has arrived.
 */
object SkeletonLoader {

    private val animators = WeakHashMap<View, ObjectAnimator>()

    fun show(view: View) {
        animators.remove(view)?.cancel()
        view.animate().cancel()
        view.alpha = 1f
        view.visibility = View.VISIBLE
        val anim = ObjectAnimator.ofFloat(view, View.ALPHA, 1f, 0.45f, 1f).apply {
            duration = 1000L
            repeatCount = ValueAnimator.INFINITE
        }
        animators[view] = anim
        anim.start()
    }

    fun hide(view: View) {
        if (view.visibility != View.VISIBLE) return
        animators.remove(view)?.cancel()
        view.animate().cancel()
        view.animate()
            .alpha(0f)
            .setDuration(220L)
            .withEndAction {
                view.visibility = View.GONE
                view.alpha = 1f
            }
            .start()
    }
}
