package com.komputerkit.moview.ui.lists

import com.komputerkit.moview.data.model.FilmListItem

/** One cell of a list poster grid. */
sealed class PosterCell {
    /** A film poster, with an optional rank badge. */
    data class Film(val item: FilmListItem) : PosterCell()

    /** Preview overflow ("+N"): the list holds more films than shown. */
    data class More(val count: Int) : PosterCell()
}
