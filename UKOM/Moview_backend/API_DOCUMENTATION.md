# Moview API Documentation for Android

Base URL: `http://127.0.0.1:8000/api/v1`

## Endpoints

### 1. Home Screen Data
**GET** `/home`

Get all data for home screen including popular movies this week and recent reviews from friends.

**Response:**
```json
{
  "success": true,
  "data": {
    "popular_this_week": [
      {
        "id": 1,
        "title": "The Godfather",
        "year": "1972",
        "duration": "175m",
        "rating": "PG-13",
        "poster_path": "http://127.0.0.1:8000/storage/posters/godfather.jpg",
        "backdrop_path": "http://127.0.0.1:8000/storage/backdrops/godfather.jpg",
        "genres": ["Crime", "Drama"],
        "average_rating": 4.7,
        "watched_count": 12400
      }
    ],
    "new_from_friends": [
      {
        "review_id": 1,
        "user": {
          "id": 5,
          "username": "john_cinema"
        },
        "movie": {
          "id": 1,
          "title": "The Shawshank Redemption",
          "year": "1994",
          "poster_path": "...",
          "genres": ["Drama"],
          "average_rating": 4.8,
          "watched_count": 15200
        },
        "rating": 5,
        "created_at": "2026-01-30 10:30:00"
      }
    ]
  }
}
```

### 2. Popular Movies
**GET** `/popular`

**Query Parameters:**
- `per_page` (optional): Number of items per page (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Godfather",
      "year": "1972",
      "duration": "175m",
      "rating": "PG-13",
      "poster_path": "http://127.0.0.1:8000/storage/posters/godfather.jpg",
      "backdrop_path": "http://127.0.0.1:8000/storage/backdrops/godfather.jpg",
      "genres": ["Crime", "Drama"],
      "average_rating": 4.7,
      "watched_count": 12400
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 100
  }
}
```

### 3. Recent Reviews
**GET** `/recent-reviews`

**Query Parameters:**
- `per_page` (optional): Number of items per page (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "review_id": 1,
      "user": {
        "id": 5,
        "username": "john_cinema"
      },
      "movie": {
        "id": 1,
        "title": "The Shawshank Redemption",
        "poster_path": "...",
        "genres": ["Drama"],
        "average_rating": 4.8
      },
      "rating": 5,
      "title": "Absolutely masterpiece!",
      "content": "One of the best films ever made...",
      "created_at": "2026-01-30 10:30:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 20,
    "total": 200
  }
}
```

### 4. Get Movies List
**GET** `/movies`

**Query Parameters:**
- `per_page` (optional): Number of items per page (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Godfather",
      "year": "1972",
      "duration": "175m",
      "rating": "PG-13",
      "poster_path": "http://127.0.0.1:8000/storage/posters/godfather.jpg",
      "backdrop_path": "http://127.0.0.1:8000/storage/backdrops/godfather.jpg",
      "genres": ["Crime", "Drama"],
      "average_rating": 4.7,
      "watched_count": 12400
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 20,
    "total": 200
  }
}
```

### 5. Get Movie Detail
**GET** `/movies/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "The Godfather",
    "year": "1972",
    "duration": "175m",
    "rating": "PG-13",
    "synopsis": "The aging patriarch of an organized crime dynasty...",
    "poster_path": "http://127.0.0.1:8000/storage/posters/godfather.jpg",
    "backdrop_path": "http://127.0.0.1:8000/storage/backdrops/godfather.jpg",
    "trailer_url": "https://www.youtube.com/watch?v=...",
    "genres": ["Crime", "Drama"],
    "director": {
      "id": 1,
      "name": "Francis Ford Coppola",
      "photo": "http://127.0.0.1:8000/storage/persons/coppola.jpg"
    },
    "cast": [
      {
        "id": 2,
        "name": "Marlon Brando",
        "character": "Vito Corleone",
        "photo": "http://127.0.0.1:8000/storage/persons/brando.jpg"
      }
    ],
    "statistics": {
      "watched_count": 12400,
      "reviews_count": 3400,
      "average_rating": 4.7,
      "rating_distribution": {
        "1": 45,
        "2": 120,
        "3": 380,
        "4": 1200,
        "5": 8500
      }
    },
    "streaming_services": [
      {
        "id": 1,
        "name": "Netflix",
        "logo": "http://127.0.0.1:8000/storage/services/netflix.png"
      }
    ]
  }
}
```

### 6. Get Movie Reviews
**GET** `/movies/{id}/reviews`

**Query Parameters:**
- `per_page` (optional): Number of items per page (default: 10)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": {
        "id": 5,
        "username": "johndoe"
      },
      "rating": 10,
      "title": "Absolutely masterpiece!",
      "content": "One of the best films ever made...",
      "is_spoiler": false,
      "created_at": "2024-01-20 15:30:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 50
  }
}
```

### 7. Get Movie Cast & Crew
**GET** `/movies/{id}/cast-crew`

**Response:**
```json
{
  "success": true,
  "data": {
    "cast": [
      {
        "id": 2,
        "name": "Marlon Brando",
        "character": "Vito Corleone",
        "photo": "http://127.0.0.1:8000/storage/persons/brando.jpg"
      }
    ],
    "crew": [
      {
        "id": 1,
        "name": "Francis Ford Coppola",
        "role": "Director",
        "photo": "http://127.0.0.1:8000/storage/persons/coppola.jpg"
      }
    ]
  }
}
```

### 8. Search Movies
**GET** `/search?q={query}`

**Query Parameters:**
- `q` (required): Search query string (searches in title and synopsis)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "The Dark Knight",
      "year": "2008",
      "duration": "152m",
      "rating": "PG-13",
      "poster_path": "http://127.0.0.1:8000/storage/posters/dark-knight.jpg",
      "backdrop_path": "http://127.0.0.1:8000/storage/backdrops/dark-knight.jpg",
      "genres": ["Action", "Crime", "Drama"],
      "average_rating": 4.7,
      "watched_count": 12400
    }
  ]
}
```

## Home Screen Implementation

For the Android home screen, use the `/home` endpoint which provides:

1. **Popular This Week** - Movies sorted by ratings/watches in the last 7 days
2. **New From Friends** - Recent reviews from other users with movie info

This reduces API calls from 2 separate requests to just 1.

## Search Implementation

The `/search` endpoint searches in both:
- Movie title
- Movie synopsis

This provides more comprehensive search results.

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Movie not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Search query is required"
}
```

## Notes for Android Development

1. **Base URL**: Change to your production URL when deploying
2. **Image URLs**: All image paths are full URLs, ready to use with image loading libraries (Glide, Picasso, Coil)
3. **CORS**: Already enabled for cross-origin requests
4. **Pagination**: Use `page` parameter for infinite scroll implementation
5. **Rating Distribution**: Keys 1-5 represent star ranges (1=★-★★, 2=★★-★★★, etc.)

## Example Android API Call (Retrofit)

```kotlin
interface MovieApi {
    @GET("api/v1/movies/{id}")
    suspend fun getMovieDetail(@Path("id") id: Int): Response<MovieDetailResponse>
    
    @GET("api/v1/movies")
    suspend fun getMovies(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20
    ): Response<MoviesListResponse>
    
    @GET("api/v1/search")
    suspend fun searchMovies(@Query("q") query: String): Response<MoviesListResponse>
}
```

## Testing the API

You can test the API using:
- Browser: `http://127.0.0.1:8000/api/v1/movies`
- Postman
- cURL: `curl http://127.0.0.1:8000/api/v1/movies/1`
