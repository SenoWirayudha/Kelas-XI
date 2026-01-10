package com.komputerkit.moview.util

object TmdbImageUrl {
    // TMDB base URLs for different image types
    private const val POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500"
    private const val BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w780"
    private const val PROFILE_BASE_URL = "https://image.tmdb.org/t/p/w185"
    
    /**
     * Get full poster URL from path
     * @param path TMDB poster path (e.g., "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg")
     * @return Full TMDB poster URL or null if path is null
     */
    fun getPosterUrl(path: String?): String? {
        return if (path != null) "$POSTER_BASE_URL$path" else null
    }
    
    /**
     * Get full backdrop URL from path
     * @param path TMDB backdrop path
     * @return Full TMDB backdrop URL or null if path is null
     */
    fun getBackdropUrl(path: String?): String? {
        return if (path != null) "$BACKDROP_BASE_URL$path" else null
    }
    
    /**
     * Get full profile photo URL from path
     * @param path TMDB profile path
     * @return Full TMDB profile URL or null if path is null
     */
    fun getProfileUrl(path: String?): String? {
        return if (path != null) "$PROFILE_BASE_URL$path" else null
    }
    
    // Sample TMDB paths for dummy data (already full URLs in current code)
    // These will be replaced when real API integration happens
    object Sample {
        // Sample poster paths
        val POSTER_INTERSTELLAR = "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
        val POSTER_DUNE = "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
        val POSTER_DARK_KNIGHT = "/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
        val POSTER_INCEPTION = "/xJHokMbljvjADYdit5fK5VQsXEG.jpg"
        val POSTER_DUNKIRK = "/wcKFYIiVDvRURrzglV9kGu7fpfY.jpg"
        val POSTER_BATMAN_BEGINS = "/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg"
        val POSTER_TENET = "/k68nPLbIST6NP96JmTxmZijEvCA.jpg"
        
        // Sample backdrop paths
        val BACKDROP_INTERSTELLAR = "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"
        val BACKDROP_DEFAULT = "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg"
        
        // Sample profile paths
        val PROFILE_NOLAN = "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg"
        val PROFILE_USER_1 = "/cGLFwUw namely1.jpg" // Dummy
    }
}
