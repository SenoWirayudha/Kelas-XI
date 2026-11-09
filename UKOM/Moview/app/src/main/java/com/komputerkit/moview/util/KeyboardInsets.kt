package com.komputerkit.moview.util

import android.content.Context
import android.view.View
import android.view.inputmethod.InputMethodManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Hides the IME and runs [action] only once the ime insets report "not visible"
 * (with a [timeoutMs] fallback).
 *
 * Navigating while the keyboard is still up leaves the shared activity window at
 * the keyboard-reduced height: the next screen draws its bottom navigation on
 * top of that shrunken window and it only comes back after the app is restarted.
 */
fun View.hideImeAndThen(timeoutMs: Long = 300L, action: () -> Unit) {
    val root = this
    // Clear the ACTUAL focused child (clearing the root alone would leave the
    // EditText focused, and the keyboard would pop back up after navigation).
    root.findFocus()?.clearFocus()
    root.clearFocus()

    ViewCompat.getWindowInsetsController(root)?.hide(WindowInsetsCompat.Type.ime())
    (root.context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager)
        ?.hideSoftInputFromWindow(root.windowToken, 0)

    var done = false
    val finish = {
        if (!done) {
            done = true
            if (root.isAttachedToWindow) action()
        }
    }
    val timeout = Runnable { finish() }
    root.postDelayed(timeout, timeoutMs)

    ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
        if (!insets.isVisible(WindowInsetsCompat.Type.ime())) {
            v.removeCallbacks(timeout)
            finish()
        }
        insets
    }
    ViewCompat.requestApplyInsets(root)
}
