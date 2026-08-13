package com.komputerkit.moview.ui.common

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class StarRatingTestActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xFF141414.toInt())
            setPadding(dp(24), dp(24), dp(24), dp(24))
        }

        val title = TextView(this).apply {
            text = "StarRatingView isolated test"
            setTextColor(Color.WHITE)
            textSize = 18f
            setPadding(0, 0, 0, dp(8))
        }
        root.addView(title, params())

        val scroll = ScrollView(this)
        scroll.addView(root, params())

        // 10 states: 0.5 .. 5.0
        for (n in 1..10) {
            val rating = n * 0.5f
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, dp(6), 0, dp(6))
            }
            val label = TextView(this).apply {
                text = "%.1f".format(rating)
                setTextColor(Color.WHITE)
                textSize = 14f
                width = dp(56)
            }
            val stars = StarRatingView(this).apply {
                starSizeDp = 28f
                starGapDp = 3f
                setColors(0xFFE8B84B.toInt(), 0xFF4A463F.toInt())
                this.rating = rating
            }
            row.addView(label, rowParams())
            row.addView(stars, rowParams())
            root.addView(row, params())
        }

        // Editable demo row
        val editableLabel = TextView(this).apply {
            text = "Editable (tap twice on a star)"
            setTextColor(Color.WHITE)
            textSize = 14f
            setPadding(0, dp(16), 0, dp(8))
        }
        root.addView(editableLabel, params())

        val editableRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val editableStars = StarRatingView(this).apply {
            starSizeDp = 40f
            starGapDp = 4f
            setColors(0xFFE8B84B.toInt(), 0xFF4A463F.toInt())
            setEditable(true) { value ->
                toast("Rated: $value")
            }
        }
        val editableValue = TextView(this).apply {
            text = "0.0"
            setTextColor(0xFFE8B84B.toInt())
            textSize = 14f
            setPadding(dp(16), 0, 0, 0)
        }
        editableStars.setEditable(true) { value ->
            editableValue.text = "%.1f".format(value)
        }
        editableRow.addView(editableStars, rowParams())
        editableRow.addView(editableValue, rowParams())
        root.addView(editableRow, params())

        setContentView(scroll)
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun toast(message: String) {
        android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
    }

    private fun params(): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

    private fun rowParams(): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
}