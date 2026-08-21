package com.komputerkit.moview.util

import android.app.Activity
import android.app.Dialog
import android.graphics.Typeface
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.google.android.material.snackbar.Snackbar
import com.komputerkit.moview.R

enum class SnackbarType { SUCCESS, ERROR, INFO }

fun Activity.showSnackbar(message: String, type: SnackbarType = SnackbarType.INFO) {
    dismissForegroundDialogs()
    val rootView = findViewById<View>(android.R.id.content)
    showAppSnackbar(rootView, message, type)
}

fun Fragment.showSnackbar(message: String, type: SnackbarType = SnackbarType.INFO) {
    val fm = requireActivity().supportFragmentManager
    val snapshot = ArrayList(fm.fragments)
    for (f in snapshot) {
        if (f is androidx.fragment.app.DialogFragment && f.dialog?.isShowing == true) {
            f.dismissAllowingStateLoss()
        }
    }
    view?.let { showAppSnackbar(it, message, type) }
}

fun Activity.showSnackbarWithDialog(
    message: String,
    dialog: Dialog?,
    type: SnackbarType = SnackbarType.INFO
) {
    if (dialog?.isShowing == true) dialog.dismiss()
    val rootView = findViewById<View>(android.R.id.content)
    showAppSnackbar(rootView, message, type)
}

private fun Activity.dismissForegroundDialogs() {
    val fm = (this as? androidx.fragment.app.FragmentActivity)?.supportFragmentManager ?: return
    val snapshot = ArrayList(fm.fragments)
    for (f in snapshot) {
        if (f is androidx.fragment.app.DialogFragment && f.dialog?.isShowing == true) {
            f.dismissAllowingStateLoss()
        }
    }
}

private fun showAppSnackbar(anchor: View, message: String, type: SnackbarType) {
    val snackbar = Snackbar.make(anchor, message, Snackbar.LENGTH_SHORT)

    val snackbarView = snackbar.view
    snackbarView.setPadding(0, 0, 0, 0)

    val params = snackbarView.layoutParams as? FrameLayout.LayoutParams
        ?: FrameLayout.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.WRAP_CONTENT
        )
    params.gravity = Gravity.BOTTOM
    params.setMargins(0, 0, 0, 0)
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
