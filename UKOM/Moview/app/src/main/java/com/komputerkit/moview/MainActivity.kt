package com.komputerkit.moview

import android.content.Context
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.HorizontalScrollView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.NavOptions
import androidx.navigation.fragment.NavHostFragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.data.repository.MovieRepository
import com.komputerkit.moview.util.PagerSwipeGesture
import com.komputerkit.moview.util.showSnackbar
import com.komputerkit.moview.util.SnackbarType
import com.komputerkit.moview.databinding.ActivityMainBinding
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController

    // Bottom-tab order as laid out in bottom_nav_menu.xml (no wrapping in swipe).
    private val tabOrder = intArrayOf(
        R.id.navigation_home,
        R.id.navigation_search,
        R.id.navigation_cinema,
        R.id.navigation_notification,
        R.id.navigation_profile
    )
    private var lastTabIndex = 0
    // Set to true while a swipe-gesture commit is handling navigation directly,
    // so the BottomNav's setOnItemSelectedListener skips its navigateToTabRoot call.
    private var swipeNavigating = false

    /** Event ids from the last festival list fetch (used for the Bioskop dot). */
    private var knownEventIds: Set<Int> = emptySet()

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
        refreshBioskopBadge()
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
            if (swipeNavigating) return@setOnItemSelectedListener true // swipe already handled nav
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
            applySoftInputMode(destination.id)

            when (destination.id) {
                R.id.loginFragment,
                R.id.signUpFragment,
                R.id.verifyOtpFragment,
                R.id.forgotPasswordFragment,
                R.id.editProfileFragment,
                R.id.logFilmFragment,
                R.id.posterGeneratorFragment,
                R.id.posterBackdropFragment,
                R.id.eventDetailFragment,
                // Only the list form/picker are full-screen; list screens keep the navbar.
                R.id.listEditorFragment,
                R.id.filmPickerFragment,
                R.id.addToListFragment -> {
                    binding.bottomNavigation.visibility = View.GONE
                }
                R.id.navigation_search -> {
                    val isSelectMovieMode = arguments?.getBoolean("selectMovieMode", false) == true
                    binding.bottomNavigation.visibility = if (isSelectMovieMode) View.GONE else View.VISIBLE
                }
                else -> {
                    binding.bottomNavigation.visibility = View.VISIBLE
                    restoreDefaultWindowChrome()
                }
            }

            // "Pilih Film" reuses Search; do not move the main-tab highlight there.
            val isSelectMovieMode = destination.id == R.id.navigation_search &&
                arguments?.getBoolean("selectMovieMode", false) == true

            when (destination.id) {
                R.id.navigation_home -> binding.bottomNavigation.menu.findItem(R.id.navigation_home)?.isChecked = true
                R.id.navigation_profile -> binding.bottomNavigation.menu.findItem(R.id.navigation_profile)?.isChecked = true
                R.id.navigation_search -> if (!isSelectMovieMode) {
                    binding.bottomNavigation.menu.findItem(R.id.navigation_search)?.isChecked = true
                }
                R.id.navigation_cinema -> binding.bottomNavigation.menu.findItem(R.id.navigation_cinema)?.isChecked = true
                R.id.navigation_notification -> binding.bottomNavigation.menu.findItem(R.id.navigation_notification)?.isChecked = true
            }

            // Bioskop dot clears as soon as the user opens the tab; the coach mark
            // only ever shows on the Home tab.
            when (destination.id) {
                R.id.navigation_cinema -> {
                    markBioskopEventsSeen()
                    binding.coachBioskop.visibility = View.GONE
                }
                R.id.navigation_home -> maybeShowBioskopCoachMark()
                else -> binding.coachBioskop.visibility = View.GONE
            }
        }
    }

    // --- Bioskop tab dot + one-time coach mark ------------------------------

    /**
     * Home has no text input, so the IME must never resize its window. Leaving the
     * activity on the inherited `adjustResize` meant a Home opened right after the OTP
     * screen kept the keyboard-sized window (empty band under the navbar) until the
     * activity was recreated. Everything else keeps `adjustResize` (search, log, forms).
     */
    private fun applySoftInputMode(destinationId: Int) {
        val mode = if (destinationId == R.id.navigation_home) {
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
        } else {
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }
        window.setSoftInputMode(mode)
    }

    /**
     * Back to the plain, non edge-to-edge window used by the tab destinations.
     *
     * The auth / movie-schedule / detail screens switch the window to edge-to-edge
     * on resume and restore it on pause. When a tab is reached straight from one of
     * those screens (e.g. OTP success -> Home) the restore can be skipped, leaving the
     * window laid out edge-to-edge: the root then fills the screen and the bottom nav
     * is lifted off the bottom edge until the activity is recreated. Re-applying the
     * default here makes every tab entry self-healing.
     */
    private fun restoreDefaultWindowChrome() {
        WindowCompat.setDecorFitsSystemWindows(window, true)
        @Suppress("DEPRECATION")
        window.statusBarColor = ContextCompat.getColor(this, R.color.dark_background)
        @Suppress("DEPRECATION")
        window.navigationBarColor = ContextCompat.getColor(this, R.color.dark_background)
        // A stale translation would keep the bar off its constraint; it is never
        // animated by us, so resetting is safe.
        binding.bottomNavigation.translationY = 0f
        // Re-evaluate insets for the new (non edge-to-edge) window state.
        binding.root.requestApplyInsets()
    }

    /** Dot on the Bioskop tab while any festival event has not been seen yet. */
    private fun refreshBioskopBadge() {
        lifecycleScope.launch {
            val events = try {
                MovieRepository().getEvents()
            } catch (_: Exception) {
                emptyList()
            }
            knownEventIds = events.map { it.id }.toSet()
            // Already on the Bioskop tab: nothing new to announce.
            if (navController.currentDestination?.id == R.id.navigation_cinema) {
                markBioskopEventsSeen()
                return@launch
            }
            val seen = prefs().getStringSet(KEY_SEEN_EVENTS, emptySet()).orEmpty()
            setBioskopDot(events.any { it.id.toString() !in seen })
        }
    }

    private fun setBioskopDot(show: Boolean) {
        if (!show) {
            binding.bottomNavigation.removeBadge(R.id.navigation_cinema)
            return
        }

        // No number = the small dot variant of the badge.
        val badge = binding.bottomNavigation.getOrCreateBadge(R.id.navigation_cinema)
        badge.clearNumber()
        badge.backgroundColor = androidx.core.content.ContextCompat.getColor(this, R.color.accent_blue)
        badge.isVisible = true
    }

    /** Persists every currently listed event as seen (per event id). */
    private fun markBioskopEventsSeen() {
        if (knownEventIds.isEmpty()) return
        val seen = prefs().getStringSet(KEY_SEEN_EVENTS, emptySet())
            .orEmpty()
            .toMutableSet()
        seen.addAll(knownEventIds.map { it.toString() })
        prefs().edit().putStringSet(KEY_SEEN_EVENTS, seen).apply()
        setBioskopDot(false)
    }

    /** Shows the tooltip above the Bioskop tab once, on the first Home open. */
    private fun maybeShowBioskopCoachMark() {
        if (prefs().getBoolean(KEY_COACH_SEEN, false)) return
        // Persist on show so it never reappears, even if the user navigates away.
        prefs().edit().putBoolean(KEY_COACH_SEEN, true).apply()
        binding.coachBioskop.visibility = View.VISIBLE
        binding.btnCoachOk.setOnClickListener {
            binding.coachBioskop.visibility = View.GONE
        }
    }

    private fun prefs() = getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
    
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

    // --- Swipe between main tabs (ViewPager2-style: content follows finger, snaps on release) ---

    /**
     * PagerSwipeGesture drives the horizontal swipe on the main-tab host.
     *
     * Because only one fragment exists at a time in the NavHostFragment, only the
     * current page slides (like a single-panel push). On commit the fragment
     * transition is suppressed (no enter/exit anim) so the snap animation that
     * already moved navHostFragment.translationX provides the only visible motion.
     */
    private val tabSwipeGesture by lazy {
        val navHost = binding.navHostFragment
        PagerSwipeGesture(
            context = this,
            pageWidth = { navHost.width.toFloat() },
            translate = { offset -> navHost.translationX = offset },
            canGoLeft  = { currentTabIndex() < tabOrder.lastIndex },
            canGoRight = { currentTabIndex() > 0 },
            isBlocked  = { ev -> !isTabSwipeStartAllowed(ev) },
            // A committed swipe is finished here: the old page exits, the destination is
            // swapped while the host is off-screen, then the new page slides in. Doing this
            // in one place avoids the flash where Home reappeared before Search.
            onCommit = { direction, offset -> commitSwipe(navHost, direction, offset) },
            // Fallback for the (unused) default path.
            onSwipe = { direction -> switchTabBySwipe(direction) },
            onDragEnd = { navHost.translationX = 0f }
        )
    }

    /**
     * Finishes a swipe that passed the threshold.
     *
     * Sequence (each step starts where the previous ended, so the motion is continuous):
     *  1. slide the current page fully off-screen;
     *  2. swap the NavHost destination with no fragment animation (invisible, off-screen);
     *  3. slide the new page in from the opposite edge.
     */
    private fun commitSwipe(navHost: View, direction: Int, offset: Float): Boolean {
        val width = navHost.width.toFloat()
        if (width <= 0f) return false

        val exitTo = if (direction > 0) -width else width
        android.animation.ValueAnimator.ofFloat(offset, exitTo).apply {
            duration = EXIT_MS
            interpolator = android.view.animation.DecelerateInterpolator()
            addUpdateListener { navHost.translationX = it.animatedValue as Float }
            addListener(object : android.animation.AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: android.animation.Animator) {
                    switchTabBySwipe(direction)
                    // Commit now: the host is still off-screen, so the swap is invisible.
                    (supportFragmentManager.findFragmentById(R.id.nav_host_fragment) as? NavHostFragment)
                        ?.childFragmentManager?.executePendingTransactions()

                    navHost.translationX = -exitTo
                    navHost.animate()
                        .translationX(0f)
                        .setDuration(ENTER_MS)
                        .setInterpolator(android.view.animation.DecelerateInterpolator())
                        .start()
                }
            })
            start()
        }
        return true
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        if (tabSwipeGesture.onTouch(ev)) return true
        return super.dispatchTouchEvent(ev)
    }

    private fun currentTabIndex(): Int =
        tabOrder.indexOf(binding.bottomNavigation.selectedItemId)

    private fun isTabSwipeStartAllowed(ev: MotionEvent): Boolean {
        if (binding.bottomNavigation.visibility != View.VISIBLE) return false
        val currentId = navController.currentDestination?.id
        if (currentId == null || currentId !in tabOrder) return false

        // Use screen coordinates against each scroller's *global visible* rect. The previous
        // hit-test walked children with getHitRect(), which ignores how far the page is
        // scrolled � so after scrolling, a carousel was no longer detected and the tab swipe
        // fired while the user was dragging a poster row.
        return !isOverHorizontalScrollerOrNav(ev.rawX, ev.rawY)
    }

    private fun isOverHorizontalScrollerOrNav(x: Float, y: Float): Boolean {
        val rect = android.graphics.Rect()
        return hitsHorizontalScroller(window.decorView, x, y, rect)
    }

    private fun hitsHorizontalScroller(view: View, x: Float, y: Float, rect: android.graphics.Rect): Boolean {
        if (view.visibility != View.VISIBLE) return false

        if (view === binding.bottomNavigation) {
            return view.getGlobalVisibleRect(rect) && rect.contains(x.toInt(), y.toInt())
        }

        val horizontal = when (view) {
            is HorizontalScrollView -> true
            is RecyclerView -> (view.layoutManager as? LinearLayoutManager)?.orientation ==
                RecyclerView.HORIZONTAL
            else -> false
        }
        if (horizontal && view.getGlobalVisibleRect(rect) && rect.contains(x.toInt(), y.toInt())) {
            return true
        }

        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                if (hitsHorizontalScroller(view.getChildAt(i), x, y, rect)) return true
            }
        }
        return false
    }

    /** Fallback navigation used when onCommit returns false (edge cases). */
    private fun switchTabBySwipe(direction: Int) {
        val currentIdx = currentTabIndex()
        if (currentIdx < 0) return
        val targetIdx = currentIdx + direction
        if (targetIdx !in tabOrder.indices) return
        val targetId = tabOrder[targetIdx]
        if (binding.bottomNavigation.selectedItemId == targetId) return

        val noAnim = NavOptions.Builder()
            .setLaunchSingleTop(true)
            .setPopUpTo(navController.graph.startDestinationId, false)
            .build()
        try {
            navController.navigate(targetId, null, noAnim)
        } catch (_: IllegalArgumentException) { return }

        lastTabIndex   = targetIdx
        swipeNavigating = true
        binding.bottomNavigation.selectedItemId = targetId
        swipeNavigating = false
    }

    private fun checkLoginStatus() {
        val sharedPrefs = getSharedPreferences("MoviewPrefs", Context.MODE_PRIVATE)
        val isLoggedIn = sharedPrefs.getBoolean("isLoggedIn", false)

        if (!isLoggedIn) {
            // Resume ONLY a pending REGISTRATION OTP (user backgrounded mid
            // sign-up or the process died). A leftover delete-account state must
            // never hijack a normal launch — that is what kept bouncing the app
            // back to the OTP screen after an account deletion.
            val otpState = com.komputerkit.moview.ui.auth.OtpStateStore
                .getValid(this, com.komputerkit.moview.ui.auth.OtpPurpose.REGISTER)
            if (otpState != null) {
                navController.navigate(
                    R.id.verifyOtpFragment,
                    Bundle().apply {
                        putString("email", otpState.email)
                        putString("purpose", otpState.flow)
                    }
                )
            } else {
                // Any non-registration pending state is stale at this point.
                com.komputerkit.moview.ui.auth.OtpStateStore.clear(this)
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

    private companion object {
        /** Swipe commit: time for the current page to finish leaving the screen. */
        const val EXIT_MS = 150L
        /** Swipe commit: time for the new page to slide in. */
        const val ENTER_MS = 170L

        /** Festival event ids the user has already seen on the Bioskop tab. */
        const val KEY_SEEN_EVENTS = "bioskop_seen_event_ids"
        /** One-time coach mark above the Bioskop tab. */
        const val KEY_COACH_SEEN = "bioskop_coach_seen"
    }
}
