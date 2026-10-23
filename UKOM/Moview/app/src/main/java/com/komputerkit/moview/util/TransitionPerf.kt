package com.komputerkit.moview.util

import androidx.core.view.doOnPreDraw
import androidx.fragment.app.Fragment

/**
 * Keeps the enter/exit slide smooth on tab switches:
 * the transition waits for the first laid-out frame instead of starting on a
 * half-measured view tree.
 */
fun Fragment.postponeEnterUntilLaidOut() {
    postponeEnterTransition()
    view?.doOnPreDraw { startPostponedEnterTransition() }
}

/**
 * Defers heavy work (network emit → DiffUtil → list rebind, Glide requests)
 * until the ~280ms enter slide is over, so it never runs mid-animation.
 */
fun Fragment.runAfterEnterTransition(block: () -> Unit) {
    val v = view ?: return
    v.postDelayed({ if (view != null) block() }, 320L)
}
