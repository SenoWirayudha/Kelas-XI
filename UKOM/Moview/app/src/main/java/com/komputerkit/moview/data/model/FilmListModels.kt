package com.komputerkit.moview.data.model

/** A curated film list (Letterboxd-style). */
data class FilmList(
    val id: Int,
    val userId: Int,
    val ownerUsername: String? = null,
    val ownerAvatarUrl: String? = null,
    val title: String,
    val description: String?,
    /** "ranked" (numbered) or "plain" (no numbers). */
    val type: String = TYPE_PLAIN,
    /** "public" or "private". */
    val visibility: String = VISIBILITY_PUBLIC,
    /** Mirror the list back cover from the film at #1. */
    val useBackdrop: Boolean = false,
    /** movie_media id of the chosen hero backdrop (film #1). */
    val backdropMediaId: Int? = null,
    val itemsCount: Int = 0,
    val posterUrl: String? = null,
    val backdropUrl: String? = null,
    /** Up to 7 posters for the overlapping strip on the My List row. */
    val posterUrls: List<String> = emptyList(),
    /** Set when the query was scoped to one film ("Add to List" marking). */
    val containsMovie: Boolean = false,
    val items: List<FilmListItem> = emptyList()
) {
    val isRanked: Boolean get() = type == TYPE_RANKED
    val isPrivate: Boolean get() = visibility == VISIBILITY_PRIVATE

    companion object {
        const val TYPE_RANKED = "ranked"
        const val TYPE_PLAIN = "plain"
        const val VISIBILITY_PUBLIC = "public"
        const val VISIBILITY_PRIVATE = "private"
    }
}

/** One film inside a list; position is 1-based and follows the drag order. */
data class FilmListItem(
    val movieId: Int,
    val position: Int,
    val title: String?,
    val releaseYear: Int?,
    val ageRating: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val customPoster: Boolean = false,
    val customBackdrop: Boolean = false,
    val posterMediaId: Int? = null,
    val backdropMediaId: Int? = null
)

/** Artwork picker payload for a film already in the list. */
data class MovieArtwork(
    val posters: List<ArtworkOption> = emptyList(),
    val backdrops: List<ArtworkOption> = emptyList()
)

data class ArtworkOption(
    val id: Int,
    val url: String
)

/** A film offered in the "back cover" picker, with its available backdrops. */
data class FilmBackdropOption(
    val movieId: Int,
    val title: String?,
    val backdrops: List<ArtworkOption>
)
