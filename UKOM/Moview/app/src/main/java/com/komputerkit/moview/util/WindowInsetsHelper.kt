package com.komputerkit.moview.util

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.view.View
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.komputerkit.moview.R
import java.util.WeakHashMap

/**
 * Status-bar handling for Android 15's enforced edge-to-edge mode.
 *
 * Only the top inset is consumed here. The bottom navigation / bottom bars are
 * deliberately left alone and keep their pre-existing behaviour.
 */
object WindowInsetsHelper {

    enum class Mode {
        /** Pad the destination container by the status-bar inset. */
        HEADER,

        /** The screen already handles its own status-bar/hero insets. */
        NONE
    }

    val isEdgeToEdge: Boolean
        get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM

    private val rootBasePadding = WeakHashMap<View, IntArray>()

    /** Dark app theme: transparent status bar with readable (light) icons. */
    fun applyDarkSystemBars(activity: Activity) {
        if (!isEdgeToEdge) return

        val window = activity.window
        WindowCompat.setDecorFitsSystemWindows(window, false)
        @Suppress("DEPRECATION")
        window.statusBarColor = Color.TRANSPARENT
        window.isStatusBarContrastEnforced = false

        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
        }
    }

    /**
     * Existing immersive screens keep their look on older Android versions.
     * On API 35+ the window must stay edge-to-edge even when the screen is
     * paused, otherwise returning to a tab can leave the status bar opaque.
     */
    fun applyImmersiveWindow(
        activity: Activity,
        immersive: Boolean,
        darkStatusBarIcons: Boolean,
        includeNavigationBar: Boolean
    ) {
        val window = activity.window
        val controller = WindowInsetsControllerCompat(window, window.decorView)

        if (immersive) {
            WindowCompat.setDecorFitsSystemWindows(window, false)
            @Suppress("DEPRECATION")
            window.statusBarColor = Color.TRANSPARENT
            controller.isAppearanceLightStatusBars = darkStatusBarIcons
            if (includeNavigationBar) {
                @Suppress("DEPRECATION")
                window.navigationBarColor = Color.TRANSPARENT
                controller.isAppearanceLightNavigationBars = false
            }
            return
        }

        if (isEdgeToEdge) {
            applyDarkSystemBars(activity)
            return
        }

        WindowCompat.setDecorFitsSystemWindows(window, true)
        @Suppress("DEPRECATION")
        window.statusBarColor = ContextCompat.getColor(activity, R.color.dark_background)
        controller.isAppearanceLightStatusBars = false
        if (includeNavigationBar) {
            @Suppress("DEPRECATION")
            window.navigationBarColor = ContextCompat.getColor(activity, R.color.dark_background)
            controller.isAppearanceLightNavigationBars = false
        }
    }

    /** Insets an Activity screen: header only, bottom bars untouched. */
    fun applyActivityInsets(activity: Activity, root: View) {
        if (!isEdgeToEdge) return
        applyDarkSystemBars(activity)
        applyHeaderInset(root)
    }

    /** Insets a NavHost destination: header only, bottom bars untouched. */
    fun applyFragmentInsets(root: View, mode: Mode) {
        if (!isEdgeToEdge) return
        if (mode == Mode.NONE) {
            clearHeaderInset(root)
            return
        }
        applyHeaderInset(root)
    }

    private fun applyHeaderInset(root: View) {
        val base = rootBasePadding.getOrPut(root) {
            intArrayOf(
                root.paddingLeft,
                root.paddingTop,
                root.paddingRight,
                root.paddingBottom
            )
        }

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val top = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top
            view.setPadding(base[0], base[1] + top, base[2], base[3])
            insets
        }
        ViewCompat.requestApplyInsets(root)
    }

    private fun clearHeaderInset(root: View) {
        val base = rootBasePadding.remove(root) ?: return
        ViewCompat.setOnApplyWindowInsetsListener(root, null)
        root.setPadding(base[0], base[1], base[2], base[3])
    }
}
