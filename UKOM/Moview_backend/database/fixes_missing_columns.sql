-- Add missing columns and tables to match Laravel models

-- 1. Add trailer_url column to movies table
ALTER TABLE movies 
ADD COLUMN trailer_url VARCHAR(500) COMMENT 'YouTube or video URL' AFTER default_backdrop_path;

-- 2. Create movie_likes table (for user likes/favorites)
CREATE TABLE IF NOT EXISTS movie_likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    film_id BIGINT UNSIGNED NOT NULL COMMENT 'References movies.id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (film_id) REFERENCES movies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_film (user_id, film_id),
    INDEX idx_film (film_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add release_date to movie_services (for theatrical releases)
ALTER TABLE movie_services 
ADD COLUMN release_date DATE COMMENT 'Release date for theatrical or streaming' AFTER availability_type;
