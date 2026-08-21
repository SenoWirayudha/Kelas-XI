package com.komputerkit.moview.util

import android.app.Activity
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.google.android.material.snackbar.Snackbar
import com.komputerkit.moview.R

enum class SnackbarType { SUCCESS, ERROR, INFO }

fun Activity.showSnackbar(message: String, type: SnackbarType = SnackbarType.INFO) {
    val rootView = findViewById<View>(android.R.id.content)
    showAppSnackbar(rootView, message, type)
}

fun Fragment.showSnackbar(message: String, type: SnackbarType = SnackbarType.INFO) {
    view?.let { showAppSnackbar(it, message, type) }
}

private fun showAppSnackbar(anchor: View, message: String, type: SnackbarType) {
    val snackbar = Snackbar.make(anchor, message, Snackbar.LENGTH_SHORT)

    val snackbarView = snackbar.view
    val params = snackbarView.layoutParams as? LinearLayout.LayoutParams
    params?.gravity = Gravity.BOTTOM
    params?.setMargins(24, 0, 24, 24)
    snackbarView.layoutParams = params

    val bgColor = when (type) {
        SnackbarType.SUCCESS -> ContextCompat.getColor(anchor.context, R.color.star_green)
        SnackbarType.ERROR   -> ContextCompat.getColor(anchor.context, R.color.red)
        SnackbarType.INFO    -> ContextCompat.getColor(anchor.context, R.color.accent_blue)
    }
    snackbarView.setBackgroundColor(bgColor)

    val textView = snackbarView.findViewById<TextView>(com.google.android.material.R.id.snackbar_text)
    textView?.let {
        it.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL))
        it.setTextColor(ContextCompat.getColor(anchor.context, R.color.white))
        it.textSize = 14f
        it.gravity = Gravity.CENTER
    }

    snackbar.show()
}
