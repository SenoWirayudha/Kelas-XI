package com.komputerkit.moview.util

import com.komputerkit.moview.databinding.ViewDateBadgeBinding
import java.util.Calendar
import java.util.Locale

/**
 * Mengisi lencana tanggal (pita atas = nama hari singkat, bawah = tanggal).
 * Bulan sengaja tidak ditampilkan karena sudah ada di header grup.
 */
fun ViewDateBadgeBinding.bindDate(year: Int, month: Int, day: Int) {
    // month: 1..12. Calendar dibuat dari angka langsung, tanpa konversi zona waktu,
    // sehingga hari tidak bisa bergeser.
    val cal = Calendar.getInstance().apply {
        clear()
        set(year, month - 1, day)
    }
    val locale = Locale.getDefault()
    val weekdayShort = cal.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.SHORT, locale).orEmpty()
    val weekdayLong = cal.getDisplayName(Calendar.DAY_OF_WEEK, Calendar.LONG, locale).orEmpty()

    tvDateWeekday.text = weekdayShort
    tvDateDay.text = day.toString()
    root.contentDescription = "$weekdayLong, $day"
}

/**
 * Menerima string tanggal berawalan "yyyy-MM-dd" (juga "2026-10-04T..." atau "2026-10-04 12:00:00").
 * Hanya 10 karakter pertama yang dibaca, jadi tidak ada pergeseran zona waktu.
 * Samakan sumber string ini dengan yang dipakai untuk mengelompokkan ke header bulan.
 */
fun ViewDateBadgeBinding.bindDateIso(iso: String?) {
    val parts = iso?.take(10)?.split("-")
    val y = parts?.getOrNull(0)?.toIntOrNull()
    val m = parts?.getOrNull(1)?.toIntOrNull()
    val d = parts?.getOrNull(2)?.toIntOrNull()
    if (y == null || m == null || d == null || m !in 1..12 || d !in 1..31) {
        tvDateWeekday.text = ""
        tvDateDay.text = "-"
        root.contentDescription = null
        return
    }
    bindDate(y, m, d)
}
