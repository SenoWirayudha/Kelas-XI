package com.komputerkit.moview

import android.content.Context
import android.os.Bundle
import android.view.MotionEvent
import android.view.VelocityTracker
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.NavOptions
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.databinding.ActivityMainBinding
import kotlinx.coroutines.launch
import kotlin.math.abs

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController

    // Bottom-tab order as laid out in bottom_nav_menu.xml (no wrapping in swipe).
    private val tabOrder = intArrayOf(
        R.id.navigation_home,
        R.id.navigation_search,
        R.id.navigation_notification,
        R.id.navigation_profile
    )
    private var lastTabIndex = 0

    // --- Horizontal fling state for swiping between adjacent main tabs ---
    private var swipeDownX = 0f
    private var swipeDownY = 0f
    private var swipeDownTime = 0L
    private var swipeEligible = false
    private var swipeTracker: VelocityTracker? = null
    /** True when the down event landed on a horizontally scrollable view (carousel). */
    private var swipeLockedByScroller = false
    private val swipeDensity by lazy { resources.displayMetrics.density }
    private val swipeMaxVelocity by lazy {
        ViewConfiguration.get(this).scaledMaximumFlingVelocity.toFloat()
    }
    private val swipeTouchSlop by lazy { ViewConfiguration.get(this).scaledTouchSlop }

    // Standard forward push animation (enter from right, exit to left) used for
    // navigate-by-id pushes that have no <action> to carry anim attrs.
    private val forwardNavOptions: NavOptions
        get() = NavOptions.Builder()
            .setEnterAnim(R.anim.slide_in_right)
            .setExitAnim(R.anim.slide_out_left)
            .setPopEnterAnim(R.anim.slide_in_left)
            .setPopExitAnim(R.anim.slide_out_right)
            .build()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupNavigation()
        checkLoginStatus()
        loadUnreadNotificationCount()
        handleMovieDetailIntent(intent)

        // Global network/5xx errors surfaced by the OkHttp interceptor
        // (repositories swallow them, so screens would otherwise fail silently).
        lifecycleScope.launch {
            com.komputerkit.moview.util.ErrorBus.messages.collect { message ->
                showSnackbar(message, SnackbarType.ERROR)
            }
        }

        // --- DEBUG: runtime font verification (auto-removed after confirmed, keep log only) ---
        binding.root.post { verifyFontsAtRuntime() }
    }

    private fun verifyFontsAtRuntime() {
        val tag = "FontCheck"
        try {
            val inter = androidx.core.content.res.ResourcesCompat.getFont(this, R.font.font_family_inter)
            val sansDefault = android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.NORMAL)
            val sansMedium = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
            // Bare Chip (uses chipStyle from theme)
            val chip = com.google.android.material.chip.Chip(this)
            chip.text = "FontCheckChip"
            val chipTf = chip.typeface
            val chipPaintTf = chip.paint.typeface
            val chipTfIsInter = inter != null && chipTf != null && chipTf.toString() == inter.toString()
            val chipPaintIsInter = inter != null && chipPaintTf != null && chipPaintTf.toString() == inter.toString()
            val chipIsSans = chipTf?.toString() == sansDefault.toString() || chipTf?.toString() == sansMedium.toString()
            android.util.Log.d(tag, "Probe Chip typeface=$chipTf paintTf=$chipPaintTf text=${chip.text}")
            android.util.Log.d(tag, "Probe Chip vs Inter tf=$chipTfIsInter paint=$chipPaintIsInter inter=$inter isSans=$chipIsSans sansDefault=$sansDefault")
            android.util.Log.d(tag, "RESULT Chip isInter=${chipTfIsInter && chipPaintIsInter && !chipIsSans} (need both tf+paint)")

            // XML-inflated Choice Chip (same as search filter chips)
            val choiceChip = layoutInflater.inflate(R.layout.item_search_studio, null) as? com.google.android.material.chip.Chip
            if (choiceChip != null) {
                val ct = choiceChip.typeface
                val pt = choiceChip.paint.typeface
                val ctIsInter = inter != null && ct != null && ct.toString() == inter.toString()
                val ptIsInter = inter != null && pt != null && pt.toString() == inter.toString()
                android.util.Log.d(tag, "Probe ChoiceChip typeface=$ct paintTf=$pt text=${choiceChip.text} isInter tf=$ctIsInter paint=$ptIsInter")
                android.util.Log.d(tag, "RESULT ChoiceChip isInter=${ctIsInter && ptIsInter}")
            }

            val a = obtainStyledAttributes(intArrayOf(com.google.android.material.R.attr.chipStyle))
            android.util.Log.d(tag, "Theme chipStyle resId=${a.getResourceId(0, 0)}")
            a.recycle()
            val b = obtainStyledAttributes(intArrayOf(com.google.android.material.R.attr.snackbarStyle))
            android.util.Log.d(tag, "Theme snackbarStyle resId=${b.getResourceId(0, 0)}")
            b.recycle()
        } catch (e: Exception) {
            android.util.Log.e(tag, "Probe Chip failed", e)
        }
        try {
            val c = obtainStyledAttributes(intArrayOf(android.R.attr.fontFamily))
            android.util.Log.d(tag, "Theme android:fontFamily=${c.getString(0)}")
            c.recycle()
        } catch (e: Exception) {
            android.util.Log.e(tag, "Probe fontFamily failed", e)
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleMovieDetailIntent(intent)
    }

    private fun handleMovieDetailIntent(intent: android.content.Intent) {
        val movieId = intent.getIntExtra("navigate_to_movie_id", 0)
        if (movieId > 0) {
            intent.removeExtra("navigate_to_movie_id")
            try {
                navController.navigate(
                    R.id.movieDetailFragment,
                    Bundle().apply { putInt("movieId", movieId) },
                    forwardNavOptions
                )
            } catch (e: Exception) {
                showSnackbar("Gagal membuka detail film", SnackbarType.ERROR)
            }
            return
        }

        val logFilmMovieId = intent.getIntExtra("navigate_to_log_film_movie_id", 0)
        if (logFilmMovieId > 0) {
            intent.removeExtra("navigate_to_log_film_movie_id")
            try {
                navController.navigate(
                    R.id.logFilmFragment,
                    Bundle().apply {
                        putInt("movieId", logFilmMovieId)
                        putBoolean("isEditMode", false)
                        putInt("reviewId", 0)
                        putString("existingReviewText", null)
                        putInt("existingRating", 0)
                        putString("watchedDate", null)
                    },
                    forwardNavOptions
                )
            } catch (e: Exception) {
                showSnackbar("Gagal membuka halaman review/log", SnackbarType.ERROR)
            }
            return
        }

        val posterBackdropMovieId = intent.getIntExtra("navigate_to_poster_backdrop_movie_id", 0)
        if (posterBackdropMovieId > 0) {
            intent.removeExtra("navigate_to_poster_backdrop_movie_id")
            try {
                navController.navigate(
                    R.id.posterBackdropFragment,
                    Bundle().apply {
                        putInt("movieId", posterBackdropMovieId)
                        putBoolean("openBackdropsTab", false)
                    },
                    forwardNavOptions
                )
            } catch (e: Exception) {
                showSnackbar("Gagal membuka ganti poster/backdrop", SnackbarType.ERROR)
            }
        }
    }
    
    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        // Letterboxd-style tab navigation: EVERY tap on the bottom nav (whether switching
        // tabs or re-tapping the active one) goes back to that tab's root and discards all
        // nested/child screens opened anywhere. No saveState/restoreState / multiple back stacks.
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            val index = tabOrder.indexOf(item.itemId)
            navigateToTabRoot(item.itemId, forward = index > lastTabIndex)
            true
        }

        // Re-tapping the currently-active tab item also goes to its root (fresh state).
        binding.bottomNavigation.setOnItemReselectedListener { item ->
            navigateToTabRoot(item.itemId)
        }

        // Hide bottom navigation on login screen and child screens that should be full-screen
        navController.addOnDestinationChangedListener { _, destination, arguments ->
            when (destination.id) {
                R.id.loginFragment,
                R.id.signUpFragment,
                R.id.verifyOtpFragment,
                R.id.forgotPasswordFragment,
                R.id.editProfileFragment,
                R.id.logFilmFragment,
                R.id.posterGeneratorFragment,
                R.id.posterBackdropFragment -> {
                    binding.bottomNavigation.visibility = View.GONE
                }
                R.id.navigation_search -> {
                    val isSelectMovieMode = arguments?.getBoolean("selectMovieMode", false) == true
                    binding.bottomNavigation.visibility = if (isSelectMovieMode) View.GONE else View.VISIBLE
                }
                else -> {
                    binding.bottomNavigation.visibility = View.VISIBLE
                }
            }

            when (destination.id) {
                R.id.navigation_home -> binding.bottomNavigation.menu.findItem(R.id.navigation_home)?.isChecked = true
                R.id.navigation_profile -> binding.bottomNavigation.menu.findItem(R.id.navigation_profile)?.isChecked = true
                R.id.navigation_search -> binding.bottomNavigation.menu.findItem(R.id.navigation_search)?.isChecked = true
                R.id.navigation_notification -> binding.bottomNavigation.menu.findItem(R.id.navigation_notification)?.isChecked = true
            }
        }
    }
    
    /**
     * Jump to a main tab's root (single stack, all nested screens discarded).
     *
     * @param forward true when moving toward the next tab (or reselecting), false
     *  when moving toward the previous tab — controls the slide direction so the
     *  screen transition matches the swipe/button direction. Re-tapping the tab
     *  root you are already on keeps the original (no) animation.
     */
    private fun navigateToTabRoot(itemId: Int, forward: Boolean = true) {
        val index = tabOrder.indexOf(itemId)
        if (index >= 0) lastTabIndex = index

        val builder = NavOptions.Builder()
            .setLaunchSingleTop(true)
            .setPopUpTo(navController.graph.startDestinationId, false)

        if (navController.currentDestination?.id != itemId) {
            if (forward) {
                builder.setEnterAnim(R.anim.slide_in_right)
                    .setExitAnim(R.anim.slide_out_left)
                    .setPopEnterAnim(R.anim.slide_in_right)
                    .setPopExitAnim(R.anim.slide_out_left)
            } else {
                builder.setEnterAnim(R.anim.slide_in_left)
                    .setExitAnim(R.anim.slide_out_right)
                    .setPopEnterAnim(R.anim.slide_in_left)
                    .setPopExitAnim(R.anim.slide_out_right)
            }
        }

        try {
            navController.navigate(itemId, null, builder.build())
        } catch (e: IllegalArgumentException) {
            // Destination not reachable from current graph state — ignore
        }
    }

    // --- Swipe between main tabs (adjacent only, no wrap-around) -------------

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        detectTabSwipe(ev)
        return super.dispatchTouchEvent(ev)
    }

    /**
     * Observes (never consumes) touch stream: a fast horizontal fling on a
     * main-tab root switches to the adjacent tab. Gestures that start over
     * horizontal scrollers, the bottom nav bar, or non-tab screens are ignored
     * so their own scrolling/navigation keeps priority.
     */
    private fun detectTabSwipe(ev: MotionEvent) {
        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                swipeTracker?.recycle()
                swipeTracker = VelocityTracker.obtain()
                swipeTracker?.addMovement(ev)
                swipeDownX = ev.rawX
                swipeDownY = ev.rawY
                swipeDownTime = ev.eventTime
                swipeEligible = isTabSwipeAllowed(ev)
            }
            MotionEvent.ACTION_POINTER_DOWN -> swipeEligible = false
            MotionEvent.ACTION_MOVE -> {
                swipeTracker?.addMovement(ev)
                // The finger started on a horizontal carousel: once it actually scrolls, the
                // gesture belongs to the carousel, so drop the tab-swipe candidate for good.
                if (swipeEligible && swipeLockedByScroller) {
                    val dx = abs(ev.rawX - swipeDownX)
                    val dy = abs(ev.rawY - swipeDownY)
                    if (dx > swipeTouchSlop && dx > dy) {
                        swipeEligible = false
                        swipeTracker?.recycle()
                        swipeTracker = null
                    }
                }
            }
            MotionEvent.ACTION_UP -> {
                val tracker = swipeTracker
                swipeTracker = null
                tracker?.addMovement(ev)
                if (swipeEligible && tracker != null) {
                    tracker.computeCurrentVelocity(1000, swipeMaxVelocity)
                    val vx = tracker.xVelocity
                    val vy = tracker.yVelocity
                    val dx = ev.rawX - swipeDownX
                    val dy = ev.rawY - swipeDownY
                    val elapsed = ev.eventTime - swipeDownTime
                    if (elapsed > 0L && elapsed <= 1200L &&
                        abs(dx) >= swipeTouchSlop * 2f &&
                        abs(vx) >= 450f * swipeDensity &&
                        abs(vx) > abs(vy) * 1.3f
                    ) {
                        switchTabBySwipe(dx)
                    }
                }
                tracker?.recycle()
            }
            MotionEvent.ACTION_CANCEL -> {
                swipeTracker?.recycle()
                swipeTracker = null
                swipeEligible = false
            }
        }
    }

    private fun isTabSwipeAllowed(ev: MotionEvent): Boolean {
        swipeLockedByScroller = false
        if (binding.bottomNavigation.visibility != View.VISIBLE) return false
        val currentId = navController.currentDestination?.id
        if (currentId == null || currentId !in tabOrder) return false

        val decor = window.decorView
        val location = IntArray(2)
        decor.getLocationOnScreen(location)
        val hit = findTopChildUnder(decor, ev.rawX - location[0], ev.rawY - location[1])
            ?: return false
        return !isGestureBlockedAt(hit)
    }

    /** Top-most visible view under the given decor-view coordinates. */
    private fun findTopChildUnder(root: View, rootX: Float, rootY: Float): View? {
        var current: View = root
        var x = rootX
        var y = rootY
        val rect = android.graphics.Rect()
        while (true) {
            val group = current as? ViewGroup ?: break
            var matched = false
            for (i in group.childCount - 1 downTo 0) {
                val child = group.getChildAt(i)
                if (child.visibility != View.VISIBLE) continue
                child.getHitRect(rect)
                if (rect.contains(x.toInt(), y.toInt())) {
                    x -= rect.left
                    y -= rect.top
                    current = child
                    matched = true
                    break
                }
            }
            if (!matched) break
        }
        return current
    }

    /** True when the touch sits on the bottom nav or a horizontal scroller. */
    private fun isGestureBlockedAt(start: View): Boolean {
        var view: View? = start
        while (view != null) {
            if (view === binding.bottomNavigation) return true
            if (view is HorizontalScrollView) {
                swipeLockedByScroller = true
                return true
            }
            if (view is RecyclerView) {
                val orientation = view.layoutManager?.let { lm ->
                    (lm as? LinearLayoutManager)?.orientation
                }
                if (orientation == RecyclerView.HORIZONTAL) {
                    swipeLockedByScroller = true
                    return true
                }
            }
            view = view.parent as? View
        }
        return false
    }

    private fun switchTabBySwipe(dx: Float) {
        val currentIdx = tabOrder.indexOf(binding.bottomNavigation.selectedItemId)
        if (currentIdx < 0) return
        val step = if (dx < 0f) 1 else -1 // swipe left → next tab, right → previous
        val targetIdx = currentIdx + step
        if (targetIdx !in tabOrder.indices) return // no wrap at first/last tab
        navigateToTabRoot(tabOrder[targetIdx], forward = step > 0)
    }

    private fun checkLoginStatus() {
        val sharedPrefs = getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val isLoggedIn = sharedPrefs.getBoolean("isLoggedIn", false)
        
        if (!isLoggedIn) {
            // Resume an in-flight OTP verification if one is still pending and
            // unexpired (the user backgrounded mid-verify or the process died).
            val otpState = com.komputerkit.moview.ui.auth.OtpStateStore.getValid(this)
            if (otpState != null) {
                navController.navigate(
                    R.id.verifyOtpFragment,
                    Bundle().apply {
                        putString("email", otpState.email)
                        putString("flow", otpState.flow)
                    }
                )
            } else {
                // User not logged in, navigate to login
                navController.navigate(R.id.loginFragment)
            }
        }
        // If logged in, stay at default destination (home)
    }
    
    private fun loadUnreadNotificationCount() {
        val sharedPrefs = getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val userId = sharedPrefs.getInt("userId", 0)
        if (userId == 0) return
        
        lifecycleScope.launch {
            try {
                val repository = MovieRepository()
                repository.getNotificationsAsync(userId)
            } catch (_: Exception) { }
        }
    }
    
    fun updateNotificationBadge(count: Int) {
        val menuItem = binding.bottomNavigation.menu.findItem(R.id.navigation_notification)
        if (menuItem == null) return

        if (count > 0) {
            val badge = binding.bottomNavigation.getOrCreateBadge(R.id.navigation_notification)
            badge.number = count
            badge.isVisible = true
        } else {
            binding.bottomNavigation.removeBadge(R.id.navigation_notification)
        }
    }
}
