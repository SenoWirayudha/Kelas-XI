package com.komputerkit.moview.data.repository

import com.komputerkit.moview.data.api.MovieCardDto
import com.komputerkit.moview.data.api.RetrofitClient
import com.komputerkit.moview.data.model.FriendActivity
import com.komputerkit.moview.data.model.Movie
import com.komputerkit.moview.data.model.User
import com.komputerkit.moview.data.model.Notification
import com.komputerkit.moview.data.model.NotificationType
import com.komputerkit.moview.data.model.NotificationSection
import com.komputerkit.moview.util.TmdbImageUrl
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MovieRepository {
    
    private val apiService = RetrofitClient.movieApiService
    
    // Konversi dari DTO ke Model
    private fun MovieCardDto.toMovie(): Movie {
        return Movie(
            id = this.id,
            title = this.title,
            posterUrl = this.poster_path ?: "",
            averageRating = this.average_rating,
            genre = this.genres.joinToString(", "),
            releaseYear = this.year,
            description = "",
            hasReview = false,
            reviewId = 0,
            userRating = 0f
        )
    }
    
    // Ambil data dari API
    suspend fun getPopularMoviesThisWeek(): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getHome()
            if (response.success && response.data != null) {
                response.data.popular_this_week.map { it.toMovie() }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getFriendActivities(): List<FriendActivity> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getHome()
            if (response.success && response.data != null) {
                response.data.new_from_friends.map { review ->
                    FriendActivity(
                        id = review.review_id,
                        user = User(
                            id = review.user.id,
                            username = review.user.username,
                            profilePhotoUrl = "",
                            email = "",
                            bio = ""
                        ),
                        movie = review.movie.toMovie(),
                        rating = review.rating.toFloat(),
                        likeCount = 0,
                        isRewatch = false,
                        hasReview = true,
                        reviewText = "",
                        timestamp = System.currentTimeMillis()
                    )
                }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun searchMovies(query: String): List<Movie> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.searchMovies(query)
            if (response.success && response.data != null) {
                response.data.map { it.toMovie() }
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
    
    suspend fun getMovieDetail(movieId: Int): Movie? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMovieDetail(movieId)
            if (response.success && response.data != null) {
                val movie = response.data
                
                // Combine directors into crew list as "Director" job
                val directorsAsCrew = if (movie.directors.isNotEmpty()) {
                    listOf(
                        com.komputerkit.moview.data.api.CrewJobDto(
                            job = "Director",
                            people = movie.directors.map { director ->
                                com.komputerkit.moview.data.api.CrewPersonDto(
                                    id = director.id,
                                    name = director.name,
                                    photo_url = director.photo_url
                                )
                            }
                        )
                    )
                } else {
                    emptyList()
                }
                
                // Merge directors at the beginning of crew list
                val fullCrew = directorsAsCrew + movie.crew
                
                Movie(
                    id = movie.id,
                    title = movie.title,
                    posterUrl = movie.poster_path ?: "",
                    backdropUrl = movie.backdrop_path ?: "",
                    averageRating = movie.statistics.average_rating,
                    genre = movie.genres.joinToString(", "),
                    releaseYear = movie.year,
                    description = movie.synopsis,
                    director = movie.directors.firstOrNull()?.name ?: "",
                    duration = movie.duration,
                    pgRating = movie.rating,
                    watchedCount = "${movie.statistics.watched_count}",
                    reviewCount = "${movie.statistics.reviews_count}",
                    rating5 = movie.statistics.rating_distribution["5"] ?: 0,
                    rating4 = movie.statistics.rating_distribution["4"] ?: 0,
                    rating3 = movie.statistics.rating_distribution["3"] ?: 0,
                    rating2 = movie.statistics.rating_distribution["2"] ?: 0,
                    rating1 = movie.statistics.rating_distribution["1"] ?: 0,
                    cast = movie.cast.map { cast ->
                        com.komputerkit.moview.data.model.CastMember(
                            id = cast.id,
                            name = cast.name,
                            character = cast.character,
                            photoUrl = cast.photo_url ?: ""
                        )
                    },
                    hasReview = false,
                    reviewId = 0,
                    userRating = 0f,
                    streamingServices = movie.streaming_services,
                    theatricalServices = movie.theatrical_services,
                    crew = fullCrew,
                    originalLanguage = movie.details.original_language,
                    spokenLanguages = movie.details.spoken_languages,
                    productionCountries = movie.details.production_countries,
                    productionCompanies = movie.details.production_companies
                )
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    suspend fun getPersonDetail(personId: Int): com.komputerkit.moview.data.api.PersonDetailDto? = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPersonDetail(personId)
            if (response.success && response.data != null) {
                response.data
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    // FALLBACK: Data dummy untuk development (akan dihapus nanti)
    fun getPopularMoviesThisWeekDummy(): List<Movie> {
        return listOf(
            Movie(
                id = 1,
                title = "The Shawshank Redemption",
                posterUrl = TmdbImageUrl.getPosterUrl("/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg") ?: "",
                averageRating = 4.8f,
                genre = "Drama",
                releaseYear = 1994,
                description = "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
                hasReview = true,
                reviewId = 1,
                userRating = 5f
            ),
            Movie(
                id = 2,
                title = "The Godfather",
                posterUrl = TmdbImageUrl.getPosterUrl("/3bhkrj58Vtu7enYsRolD1fZdja1.jpg") ?: "",
                averageRating = 4.7f,
                genre = "Crime, Drama",
                releaseYear = 1972,
                description = "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
                hasReview = false,
                reviewId = 0,
                userRating = 4.5f
            ),
            Movie(
                id = 3,
                title = "The Dark Knight",
                posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT) ?: "",
                averageRating = 4.6f,
                genre = "Action, Crime",
                releaseYear = 2008,
                description = "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
                hasReview = true,
                reviewId = 3,
                userRating = 4f
            ),
            Movie(
                id = 4,
                title = "Pulp Fiction",
                posterUrl = TmdbImageUrl.getPosterUrl("/dRaGv7snvPZH0QXKNGSuPOK0Nzq.jpg") ?: "",
                averageRating = 4.5f,
                genre = "Crime, Drama",
                releaseYear = 1994,
                description = "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
                hasReview = false,
                reviewId = 0,
                userRating = 3.5f
            ),
            Movie(
                id = 5,
                title = "Forrest Gump",
                posterUrl = TmdbImageUrl.getPosterUrl("/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg") ?: "",
                averageRating = 4.4f,
                genre = "Drama, Romance",
                releaseYear = 1994,
                description = "The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events unfold from the perspective of an Alabama man.",
                hasReview = true,
                reviewId = 2,
                userRating = 5f
            ),
            Movie(
                id = 6,
                title = "Inception",
                posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION) ?: "",
                averageRating = 4.5f,
                genre = "Action, Sci-Fi",
                releaseYear = 2010,
                description = "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
                hasReview = false,
                reviewId = 0,
                userRating = 3f
            ),
            Movie(
                id = 7,
                title = "The Matrix",
                posterUrl = TmdbImageUrl.getPosterUrl("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg") ?: "",
                averageRating = 4.4f,
                genre = "Action, Sci-Fi",
                releaseYear = 1999,
                description = "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
                hasReview = false,
                reviewId = 0,
                userRating = 4.5f
            ),
            Movie(
                id = 8,
                title = "Interstellar",
                posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR) ?: "",
                averageRating = 4.6f,
                genre = "Adventure, Drama, Sci-Fi",
                releaseYear = 2014,
                description = "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
                hasReview = true,
                reviewId = 4,
                userRating = 5f
            )
        )
    }
    
    fun getFriendActivitiesDummy(): List<FriendActivity> {
        val users = listOf(
            User(
                id = 1,
                username = "john_cinema",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                email = "john@example.com",
                bio = "Movie enthusiast"
            ),
            User(
                id = 2,
                username = "sarah_films",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                email = "sarah@example.com",
                bio = "Love classic movies"
            ),
            User(
                id = 3,
                username = "mike_reviews",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                email = "mike@example.com",
                bio = "Professional movie critic"
            ),
            User(
                id = 4,
                username = "emma_movie",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                email = "emma@example.com",
                bio = "Sci-fi fan"
            ),
            User(
                id = 5,
                username = "david_watch",
                profilePhotoUrl = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                email = "david@example.com",
                bio = "Weekend movie watcher"
            )
        )
        
        val movies = getPopularMoviesThisWeekDummy()
        
        return listOf(
            FriendActivity(
                id = 1,
                user = users[0],
                movie = movies[0],
                rating = 5.0f,
                likeCount = 24,
                isRewatch = false,
                hasReview = true,
                reviewText = "Absolutely masterpiece! The story keeps you engaged from start to finish.",
                timestamp = System.currentTimeMillis() - 3600000 // 1 hour ago
            ),
            FriendActivity(
                id = 2,
                user = users[1],
                movie = movies[2],
                rating = 4.5f,
                likeCount = 18,
                isRewatch = true,
                hasReview = false,
                timestamp = System.currentTimeMillis() - 7200000 // 2 hours ago
            ),
            FriendActivity(
                id = 3,
                user = users[2],
                movie = movies[5],
                rating = 4.8f,
                likeCount = 32,
                isRewatch = false,
                hasReview = true,
                reviewText = "Mind-bending and visually stunning. Nolan at his best!",
                timestamp = System.currentTimeMillis() - 10800000 // 3 hours ago
            ),
            FriendActivity(
                id = 4,
                user = users[3],
                movie = movies[7],
                rating = 5.0f,
                likeCount = 45,
                isRewatch = true,
                hasReview = true,
                reviewText = "Watched it for the 3rd time and still amazed by the emotional depth and scientific accuracy.",
                timestamp = System.currentTimeMillis() - 14400000 // 4 hours ago
            ),
            FriendActivity(
                id = 5,
                user = users[4],
                movie = movies[4],
                rating = 4.0f,
                likeCount = 12,
                isRewatch = false,
                hasReview = false,
                timestamp = System.currentTimeMillis() - 18000000 // 5 hours ago
            ),
            FriendActivity(
                id = 6,
                user = users[0],
                movie = movies[3],
                rating = 4.7f,
                likeCount = 28,
                isRewatch = true,
                hasReview = true,
                reviewText = "Tarantino's storytelling is unmatched. Every scene is iconic.",
                timestamp = System.currentTimeMillis() - 21600000 // 6 hours ago
            )
        )
    }
    
    fun getNotifications(): List<Notification> {
        return listOf(
            // Today
            Notification(
                id = 1,
                userId = 1,
                userName = "john_cinema",
                userAvatar = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                message = "john_cinema liked your review of Inception",
                time = "2 hours ago",
                moviePoster = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INCEPTION) ?: "",
                isRead = false,
                type = NotificationType.LIKE,
                section = NotificationSection.TODAY
            ),
            Notification(
                id = 2,
                userId = 2,
                userName = "sarah_films",
                userAvatar = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                message = "sarah_films commented on your review: \"Great analysis!\"",
                time = "4 hours ago",
                moviePoster = TmdbImageUrl.getPosterUrl("/3bhkrj58Vtu7enYsRolD1fZdja1.jpg") ?: "",
                isRead = false,
                type = NotificationType.COMMENT,
                section = NotificationSection.TODAY
            ),
            Notification(
                id = 3,
                userId = 3,
                userName = "mike_reviews",
                userAvatar = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                message = "mike_reviews started following you",
                time = "6 hours ago",
                isRead = true,
                type = NotificationType.FOLLOW,
                section = NotificationSection.TODAY
            ),
            // Yesterday
            Notification(
                id = 4,
                userId = 4,
                userName = "emma_movie",
                userAvatar = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                message = "emma_movie liked your review of The Matrix",
                time = "Yesterday",
                moviePoster = TmdbImageUrl.getPosterUrl("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg") ?: "",
                isRead = true,
                type = NotificationType.LIKE,
                section = NotificationSection.YESTERDAY
            ),
            Notification(
                id = 5,
                userId = 5,
                userName = "david_watch",
                userAvatar = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                message = "david_watch commented on your review: \"I completely agree!\"",
                time = "Yesterday",
                moviePoster = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DARK_KNIGHT) ?: "",
                isRead = true,
                type = NotificationType.COMMENT,
                section = NotificationSection.YESTERDAY
            ),
            // Last Week
            Notification(
                id = 6,
                userId = 1,
                userName = "john_cinema",
                userAvatar = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                message = "john_cinema liked your review of Interstellar",
                time = "5 days ago",
                moviePoster = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_INTERSTELLAR) ?: "",
                isRead = true,
                type = NotificationType.LIKE,
                section = NotificationSection.LAST_WEEK
            ),
            Notification(
                id = 7,
                userId = 2,
                userName = "sarah_films",
                userAvatar = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                message = "sarah_films started following you",
                time = "6 days ago",
                isRead = true,
                type = NotificationType.FOLLOW,
                section = NotificationSection.LAST_WEEK
            )
        )
    }
    
    fun getMovies(): List<Movie> {
        return getPopularMoviesThisWeekDummy()
    }
    
    fun getDiaryEntries(): List<com.komputerkit.moview.data.model.DiaryEntry> {
        val movies = getPopularMoviesThisWeekDummy()
        return listOf(
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 1,
                movie = movies[0],
                watchedDate = "2023-10-14",
                dateLabel = "14 Oct",
                monthYear = "OCTOBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 2,
                movie = movies[1],
                watchedDate = "2023-10-12",
                dateLabel = "12 Oct",
                monthYear = "OCTOBER 2023",
                rating = 4,
                hasReview = false,
                isLiked = false
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 3,
                movie = movies[2],
                watchedDate = "2023-10-08",
                dateLabel = "08 Oct",
                monthYear = "OCTOBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 4,
                movie = movies[3],
                watchedDate = "2023-10-05",
                dateLabel = "05 Oct",
                monthYear = "OCTOBER 2023",
                rating = 4,
                hasReview = false,
                isLiked = false
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 5,
                movie = movies[4],
                watchedDate = "2023-09-28",
                dateLabel = "28 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 6,
                movie = movies[0],
                watchedDate = "2023-09-22",
                dateLabel = "22 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 4,
                hasReview = false,
                isLiked = false
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 7,
                movie = movies[1],
                watchedDate = "2023-09-15",
                dateLabel = "15 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 5,
                hasReview = true,
                isLiked = true
            ),
            com.komputerkit.moview.data.model.DiaryEntry(
                id = 8,
                movie = movies[2],
                watchedDate = "2023-09-10",
                dateLabel = "10 Sep",
                monthYear = "SEPTEMBER 2023",
                rating = 3,
                hasReview = false,
                isLiked = false
            )
        )
    }
    
    fun getReviews(): List<com.komputerkit.moview.data.model.Review> {
        val movies = getPopularMoviesThisWeekDummy()
        return listOf(
            com.komputerkit.moview.data.model.Review(
                id = 1,
                movie = movies[0],
                rating = 9.0f,
                reviewText = "A visual masterpiece that surpasses the first part in every way. The scale and ambition of this film is breathtaking, with stunning cinematography and powerful performances.",
                reviewDate = "2024-03-15",
                dateLabel = "Mar 15, 2024"
            ),
            com.komputerkit.moview.data.model.Review(
                id = 2,
                movie = movies[1],
                rating = 10.0f,
                reviewText = "Absolutely chaotic and beautiful. I cried laughing and then just cried. A mind-bending journey through the multiverse that somehow feels deeply personal and universally relatable.",
                reviewDate = "2023-01-10",
                dateLabel = "Jan 10, 2023"
            ),
            com.komputerkit.moview.data.model.Review(
                id = 3,
                movie = movies[2],
                rating = 8.5f,
                reviewText = "Finally a detective story. Pattinson is a great dark knight, and the atmosphere is perfect. The noir aesthetic combined with modern sensibilities creates something truly unique.",
                reviewDate = "2022-04-05",
                dateLabel = "Apr 05, 2022"
            ),
            com.komputerkit.moview.data.model.Review(
                id = 4,
                movie = movies[3],
                rating = 9.5f,
                reviewText = "Nolan does it again. The tension during the Trinity test sequence was palpable. A masterful blend of historical drama and psychological thriller that left me speechless.",
                reviewDate = "2023-07-22",
                dateLabel = "Jul 22, 2023"
            )
        )
    }
    
    fun getWatchlistItems(): List<com.komputerkit.moview.data.model.WatchlistItem> {
        val movies = getPopularMoviesThisWeekDummy()
        return listOf(
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 1,
                movie = movies[0].copy(
                    id = 10,
                    title = "The Dark Horizon",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_BATMAN_BEGINS) ?: "",
                    releaseYear = 2024,
                    averageRating = 8.4f
                ),
                addedDate = "2024-01-05",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 2,
                movie = movies[1].copy(
                    id = 11,
                    title = "Cyber City 2099",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_TENET) ?: "",
                    releaseYear = 2023,
                    averageRating = 0f
                ),
                addedDate = "2024-01-04",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 3,
                movie = movies[2].copy(
                    id = 12,
                    title = "Prism",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNE) ?: "",
                    releaseYear = 2022,
                    averageRating = 9.1f
                ),
                addedDate = "2024-01-03",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 4,
                movie = movies[3].copy(
                    id = 13,
                    title = "The Silent Woods",
                    posterUrl = TmdbImageUrl.getPosterUrl(TmdbImageUrl.Sample.POSTER_DUNKIRK) ?: "",
                    releaseYear = 2024,
                    averageRating = 0f
                ),
                addedDate = "2024-01-02",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 5,
                movie = movies[4].copy(
                    id = 14,
                    title = "Echoes of Time",
                    posterUrl = TmdbImageUrl.getPosterUrl("/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg") ?: "",
                    releaseYear = 1984,
                    averageRating = 0f
                ),
                addedDate = "2023-12-28",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 6,
                movie = movies[0].copy(
                    id = 15,
                    title = "Autumn Leaves",
                    posterUrl = TmdbImageUrl.getPosterUrl("/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg") ?: "",
                    releaseYear = 2021,
                    averageRating = 7.8f
                ),
                addedDate = "2023-12-25",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 7,
                movie = movies[1].copy(
                    id = 16,
                    title = "System Core",
                    posterUrl = TmdbImageUrl.getPosterUrl("/dRaGv7snvPZH0QXKNGSuPOK0Nzq.jpg") ?: "",
                    releaseYear = 2026,
                    averageRating = 0f
                ),
                addedDate = "2023-12-20",
                isWatched = false
            ),
            com.komputerkit.moview.data.model.WatchlistItem(
                id = 8,
                movie = movies[2].copy(
                    id = 17,
                    title = "Deep Dive",
                    posterUrl = TmdbImageUrl.getPosterUrl("/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg") ?: "",
                    releaseYear = 2023,
                    averageRating = 0f
                ),
                addedDate = "2023-12-15",
                isWatched = false
            )
        )
    }
    
    fun getFollowers(): List<com.komputerkit.moview.data.model.UserProfile> {
        return listOf(
            com.komputerkit.moview.data.model.UserProfile(
                id = 1,
                username = "MovieBuff99",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 2,
                username = "SarahFilms",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                bio = "Reviewer at Letterboxd"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 3,
                username = "ActionHero",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 4,
                username = "Cinephile2024",
                avatarUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 5,
                username = "DirectorCut",
                avatarUrl = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                bio = "24 Mutual friends"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 6,
                username = "NoirFanatic",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                bio = "Follows you"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 7,
                username = "SciFiGuru",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                bio = "Sci-fi enthusiast"
            )
        )
    }
    
    fun getFollowing(): List<com.komputerkit.moview.data.model.UserProfile> {
        return listOf(
            com.komputerkit.moview.data.model.UserProfile(
                id = 11,
                username = "Sarah Connor",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                bio = "@sarahc • 42 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 12,
                username = "Marty McFly",
                avatarUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                bio = "@timetraveler • 128 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 13,
                username = "Ellen Ripley",
                avatarUrl = TmdbImageUrl.getProfileUrl("/bOlYWhVuOiU6azC4Bw6zlXZ5QTC.jpg") ?: "",
                bio = "@nostromo_offi... • 89 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 14,
                username = "Thomas Anderson",
                avatarUrl = TmdbImageUrl.getProfileUrl("/hUh4ugq6UUTUC03pKshXdQqKcR.jpg") ?: "",
                bio = "@neo_one • 15 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 15,
                username = "Furiosa",
                avatarUrl = TmdbImageUrl.getProfileUrl("/kU3B75TyRiCgE270EyZnHjfivoq.jpg") ?: "",
                bio = "@imperator • 33 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 16,
                username = "Tony Stark",
                avatarUrl = TmdbImageUrl.getProfileUrl("/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg") ?: "",
                bio = "@ironman • 1,024 reviews"
            ),
            com.komputerkit.moview.data.model.UserProfile(
                id = 17,
                username = "Rick Deckard",
                avatarUrl = TmdbImageUrl.getProfileUrl("/e8SEXyV7heKWX1GhNbF7SbPWjH.jpg") ?: "",
                bio = "@bladerunner • 0 reviews"
            )
        )
    }
}
