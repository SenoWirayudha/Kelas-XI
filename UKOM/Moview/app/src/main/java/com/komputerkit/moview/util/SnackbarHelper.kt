package com.komputerkit.moview.util

import android.app.Dialog
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat
import androidx.fragment.app.Fragment
import com.google.android.material.snackbar.Snackbar
import com.komputerkit.moview.R

enum class SnackbarType { SUCCESS, ERROR, INFO }

private const val TAG_FONT = "FontCheck"

fun android.app.Activity.showSnackbar(message: String, type: SnackbarType = SnackbarType.INFO) {
    // If a dialog is showing, anchor Snackbar above it instead of hidden behind it.
    val fm = (this as? androidx.fragment.app.FragmentActivity)?.supportFragmentManager
    val topDialogFragment = fm?.fragments?.filterIsInstance<androidx.fragment.app.DialogFragment>()
        ?.lastOrNull { it.dialog?.isShowing == true }
    if (topDialogFragment?.dialog?.isShowing == true) {
        val d = topDialogFragment.dialog!!
        val anchor = d.findViewById<View>(android.R.id.content) ?: d.window?.decorView ?: findViewById<View>(android.R.id.content)
        val anchorView = d.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
        showAppSnackbar(anchor, message, type, anchorView)
    } else {
        // Anchor to the activity root so the bar can be stacked above the bottom navigation.
        val rootView = findViewById<View>(android.R.id.content)
        showAppSnackbar(rootView, message, type)
    }
}

fun Fragment.showSnackbar(message: String, type: SnackbarType = SnackbarType.INFO) {
    // If a BottomSheetDialog is showing, anchor inside its window so Snackbar appears above the sheet.
    val activity = activity ?: run { view?.let { showAppSnackbar(it, message, type) }; return }
    val fm = activity.supportFragmentManager
    val topDialogFragment = fm.fragments.filterIsInstance<androidx.fragment.app.DialogFragment>()
        .lastOrNull { it.dialog?.isShowing == true }
    if (topDialogFragment?.dialog?.isShowing == true) {
        val d = topDialogFragment.dialog!!
        val anchor = d.findViewById<View>(android.R.id.content) ?: d.window?.decorView ?: view ?: return
        val anchorView = d.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
        showAppSnackbar(anchor, message, type, anchorView)
    } else {
        // Anchor to the activity root (NOT the fragment view). The fragment view sits inside
        // nav_host_fragment, which does not contain the bottom navigation, so anchoring there
        // let the Snackbar overlap the tabs.
        val rootView = activity.findViewById<View>(android.R.id.content) ?: view ?: return
        showAppSnackbar(rootView, message, type)
    }
}

/**
 * Shows a Snackbar while a BottomSheetDialog is open.
 * Does NOT dismiss the dialog — anchors the Snackbar above the sheet so both stay visible.
 */
fun android.app.Activity.showSnackbarWithDialog(
    message: String,
    dialog: Dialog?,
    type: SnackbarType = SnackbarType.INFO
) {
    val anchor: View
    var anchorView: View? = null

    if (dialog?.isShowing == true) {
        val dialogContent = dialog.findViewById<View>(android.R.id.content)
        val decorView = dialog.window?.decorView
        anchor = dialogContent ?: decorView ?: findViewById<View>(android.R.id.content)
        anchorView = dialog.findViewById<View>(com.google.android.material.R.id.design_bottom_sheet)
    } else {
        anchor = findViewById<View>(android.R.id.content)
    }

    showAppSnackbar(anchor, message, type, anchorView)
}

private fun showAppSnackbar(
    anchor: View,
    message: String,
    type: SnackbarType,
    anchorView: View? = null
) {
    val snackbar = Snackbar.make(anchor, message, Snackbar.LENGTH_SHORT)

    // Anchor above the bottom navigation (when present) so it never covers the tabs.
    // An explicit anchorView (e.g. a bottom sheet) always wins.
    val navBar = bottomNavigationOf(anchor)
    val resolvedAnchor = anchorView ?: navBar
    resolvedAnchor?.let { snackbar.anchorView = it }

    val snackbarView = snackbar.view
    snackbarView.setPadding(0, 0, 0, 0)

    val params = snackbarView.layoutParams as? FrameLayout.LayoutParams
        ?: FrameLayout.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.WRAP_CONTENT
        )
    params.gravity = Gravity.BOTTOM
    // With anchorView the Snackbar already sits above the target; only fall back to a manual
    // margin when the bar could not be used as an anchor.
    params.setMargins(0, 0, 0, if (resolvedAnchor != null) 0 else bottomNavigationOffset(anchor))
    snackbarView.layoutParams = params

    val bgColor = when (type) {
        SnackbarType.SUCCESS -> ContextCompat.getColor(anchor.context, R.color.star_green)
        SnackbarType.ERROR   -> ContextCompat.getColor(anchor.context, R.color.red)
        SnackbarType.INFO    -> ContextCompat.getColor(anchor.context, R.color.accent_blue)
    }
    snackbarView.setBackgroundColor(bgColor)

    val interFont = try {
        ResourcesCompat.getFont(anchor.context, R.font.font_family_inter)
    } catch (_: Exception) { null }

    val textView = snackbarView.findViewById<TextView>(com.google.android.material.R.id.snackbar_text)
    textView?.let {
        if (interFont != null) it.typeface = interFont
        it.setTextColor(ContextCompat.getColor(anchor.context, R.color.white))
        it.textSize = 14f
        it.gravity = Gravity.CENTER
        Log.d(TAG_FONT, "Snackbar typeface=${it.typeface} font=${interFont != null} msg=$message anchorView=${anchorView != null}")
    }

    snackbar.show()
}

/**
 * The visible bottom navigation for [anchor]'s window, or null when absent/hidden
 * (login, full-screen child screens).
 */
private fun bottomNavigationOf(anchor: View): View? {
    val activity = anchor.context.activityOrNull() ?: return null
    val nav = activity.findViewById<View>(R.id.bottom_navigation) ?: return null
    return nav.takeIf { it.visibility == View.VISIBLE }
}

/** Unwraps ContextThemeWrapper chains (fragment/preview contexts are not Activities). */
private fun android.content.Context.activityOrNull(): android.app.Activity? {
    var ctx: android.content.Context? = this
    while (ctx is android.content.ContextWrapper) {
        if (ctx is android.app.Activity) return ctx
        ctx = ctx.baseContext
    }
    return ctx as? android.app.Activity
}

/**
 * Height of the visible bottom navigation, so snackbars stack above it rather than covering
 * it. Returns 0 when the bar is absent or hidden (login, full-screen child screens).
 */
private fun bottomNavigationOffset(anchor: View): Int {
    val nav = bottomNavigationOf(anchor) ?: return 0
    val params = nav.layoutParams as? android.view.ViewGroup.MarginLayoutParams
    return nav.height + (params?.bottomMargin ?: 0)
}

/** Call once per Chip to log the actual runtime typeface (Inter vs fallback). */fun logChipFont(tag: String, chip: com.google.android.material.chip.Chip) {
    val tf = chip.typeface
    val paintTf = chip.paint.typeface
    android.util.Log.d(TAG_FONT, "Chip[$tag] typeface=$tf paintTypeface=$paintTf text=${chip.text}")
}

/**
 * Forces Inter (semibold) onto an AlertDialog's text buttons. The stock
 * TextAppearance.MaterialComponents.Button resolves to the phone's
 * sans-serif-medium, so the font has to be set on the button views directly.
 */
fun android.app.Dialog.applyInterButtons() {
    val tf = ResourcesCompat.getFont(context, R.font.inter_semibold) ?: return
    (this as? android.app.AlertDialog)?.let { dialog ->
        listOf(
            android.content.DialogInterface.BUTTON_POSITIVE,
            android.content.DialogInterface.BUTTON_NEGATIVE,
            android.content.DialogInterface.BUTTON_NEUTRAL
        ).forEach { which -> dialog.getButton(which)?.typeface = tf }
    }
}
