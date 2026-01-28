-- ====================================
-- MOVIEW DATABASE SCHEMA
-- Film Review Application (Film Domain Only)
-- ====================================

-- Drop tables if exists (in reverse order of dependencies)
DROP TABLE IF EXISTS movie_persons;
DROP TABLE IF EXISTS movie_services;
DROP TABLE IF EXISTS movie_languages;
DROP TABLE IF EXISTS movie_countries;
DROP TABLE IF EXISTS movie_production_houses;
DROP TABLE IF EXISTS movie_genres;
DROP TABLE IF EXISTS movie_media;
DROP TABLE IF EXISTS persons;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS production_houses;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS movies;

-- ====================================
-- 1. MOVIES (Main Entity)
-- ====================================
CREATE TABLE movies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    release_year YEAR NOT NULL,
    duration INT UNSIGNED NOT NULL COMMENT 'Duration in minutes',
    age_rating VARCHAR(10) DEFAULT 'NR' COMMENT 'e.g., G, PG, PG-13, R, NC-17',
    synopsis TEXT,
    default_poster_path VARCHAR(500) COMMENT 'Default poster image path',
    default_backdrop_path VARCHAR(500) COMMENT 'Default backdrop image path',
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_title (title),
    INDEX idx_release_year (release_year),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 2. MOVIE MEDIA (Alternative Posters/Backdrops)
-- ====================================
CREATE TABLE movie_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT UNSIGNED NOT NULL,
    media_type ENUM('poster', 'backdrop') NOT NULL,
    media_path VARCHAR(500) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Alternative default media',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    INDEX idx_movie_media (movie_id, media_type),
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 3. GENRES
-- ====================================
CREATE TABLE genres (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movie_genres (
    movie_id BIGINT UNSIGNED NOT NULL,
    genre_id BIGINT UNSIGNED NOT NULL,
    
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 4. PRODUCTION HOUSES
-- ====================================
CREATE TABLE production_houses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movie_production_houses (
    movie_id BIGINT UNSIGNED NOT NULL,
    production_house_id BIGINT UNSIGNED NOT NULL,
    
    PRIMARY KEY (movie_id, production_house_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (production_house_id) REFERENCES production_houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 5. COUNTRIES
-- ====================================
CREATE TABLE countries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movie_countries (
    movie_id BIGINT UNSIGNED NOT NULL,
    country_id BIGINT UNSIGNED NOT NULL,
    
    PRIMARY KEY (movie_id, country_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 6. LANGUAGES
-- ====================================
CREATE TABLE languages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movie_languages (
    movie_id BIGINT UNSIGNED NOT NULL,
    language_id BIGINT UNSIGNED NOT NULL,
    
    PRIMARY KEY (movie_id, language_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 7. SERVICES (Streaming Platforms)
-- ====================================
CREATE TABLE services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    logo_path VARCHAR(500) COMMENT 'Service logo image path',
    type ENUM('streaming', 'theatrical', 'tv') DEFAULT 'streaming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movie_services (
    movie_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    availability_type ENUM('stream', 'rent', 'buy') DEFAULT 'stream',
    
    PRIMARY KEY (movie_id, service_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    INDEX idx_availability (availability_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 8. PERSONS (Cast & Crew)
-- ====================================
CREATE TABLE persons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    primary_role ENUM('Actor', 'Director', 'Writer', 'Producer', 'Cinematographer', 'Composer') NOT NULL,
    photo_path VARCHAR(500),
    bio TEXT,
    date_of_birth DATE,
    nationality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_full_name (full_name),
    INDEX idx_primary_role (primary_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 9. MOVIE PERSONS (Cast & Crew Assignment)
-- ====================================
CREATE TABLE movie_persons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT UNSIGNED NOT NULL,
    person_id BIGINT UNSIGNED NOT NULL,
    role_type ENUM('cast', 'crew') NOT NULL,
    character_name VARCHAR(255) COMMENT 'For cast: character name in the movie',
    job VARCHAR(100) COMMENT 'For crew: specific job (Director, Writer, etc.)',
    order_index INT DEFAULT 0 COMMENT 'Display order (0 = first)',
    
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
    INDEX idx_movie_role (movie_id, role_type),
    INDEX idx_person (person_id),
    INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- SEED DATA (Sample Data)
-- ====================================

-- Insert sample genres
INSERT INTO genres (name) VALUES 
('Action'), ('Adventure'), ('Animation'), ('Comedy'), ('Crime'),
('Documentary'), ('Drama'), ('Fantasy'), ('Horror'), ('Mystery'),
('Romance'), ('Sci-Fi'), ('Thriller'), ('War'), ('Western');

-- Insert sample production houses
INSERT INTO production_houses (name) VALUES 
('Warner Bros'), ('Universal Pictures'), ('Legendary Pictures'),
('A24'), ('CJ Entertainment'), ('Sony Pictures'),
('Paramount Pictures'), ('20th Century Studios');

-- Insert sample countries
INSERT INTO countries (name) VALUES 
('USA'), ('United Kingdom'), ('South Korea'), ('Japan'),
('France'), ('Germany'), ('China'), ('India'),
('Canada'), ('Australia'), ('Spain'), ('Italy');

-- Insert sample languages
INSERT INTO languages (name) VALUES 
('English'), ('Korean'), ('Japanese'), ('Mandarin Chinese'),
('French'), ('Spanish'), ('German'), ('Italian'),
('Portuguese'), ('Hindi'), ('Arabic'), ('Russian');

-- Insert sample services
INSERT INTO services (name, type) VALUES 
('Netflix', 'streaming'),
('Disney+', 'streaming'),
('Amazon Prime Video', 'streaming'),
('HBO Max', 'streaming'),
('Apple TV+', 'streaming'),
('Hulu', 'streaming'),
('Paramount+', 'streaming'),
('YouTube Premium', 'streaming'),
('Cinema XXI', 'theatrical'),
('CGV Cinemas', 'theatrical');

-- Insert sample movie
INSERT INTO movies (title, release_year, duration, age_rating, synopsis, status, default_poster_path, default_backdrop_path) 
VALUES 
('Inception', 2010, 148, 'PG-13', 
'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 
'published',
'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg');

-- Link movie with metadata (example for Inception)
INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 1), (1, 2), (1, 12); -- Action, Adventure, Sci-Fi
INSERT INTO movie_production_houses (movie_id, production_house_id) VALUES (1, 1), (1, 3); -- Warner Bros, Legendary
INSERT INTO movie_countries (movie_id, country_id) VALUES (1, 1), (1, 2); -- USA, UK
INSERT INTO movie_languages (movie_id, language_id) VALUES (1, 1); -- English
INSERT INTO movie_services (movie_id, service_id, availability_type) VALUES 
(1, 1, 'stream'),  -- Netflix
(1, 3, 'stream'),  -- Amazon Prime
(1, 4, 'rent');    -- HBO Max

-- Insert sample persons
INSERT INTO persons (full_name, primary_role, bio, nationality) VALUES
('Leonardo DiCaprio', 'Actor', 'Leonardo Wilhelm DiCaprio is an American actor and film producer.', 'American'),
('Christopher Nolan', 'Director', 'Christopher Edward Nolan is a British-American film director, producer, and screenwriter.', 'British-American'),
('Hans Zimmer', 'Composer', 'Hans Florian Zimmer is a German film score composer and music producer.', 'German');

-- Link persons with movie
INSERT INTO movie_persons (movie_id, person_id, role_type, character_name, job, order_index) VALUES
(1, 1, 'cast', 'Dom Cobb', NULL, 0),
(1, 2, 'crew', NULL, 'Director', 0),
(1, 3, 'crew', NULL, 'Composer', 1);

-- Insert alternative media for movie
INSERT INTO movie_media (movie_id, media_type, media_path, is_default) VALUES
(1, 'poster', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', FALSE),
(1, 'backdrop', 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', FALSE);

-- ====================================
-- USEFUL QUERIES (Examples)
-- ====================================

-- Get full movie details with all metadata
/*
SELECT 
    m.id,
    m.title,
    m.release_year,
    m.duration,
    m.age_rating,
    m.synopsis,
    m.status,
    GROUP_CONCAT(DISTINCT g.name) as genres,
    GROUP_CONCAT(DISTINCT ph.name) as production_houses,
    GROUP_CONCAT(DISTINCT c.name) as countries,
    GROUP_CONCAT(DISTINCT l.name) as languages
FROM movies m
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
LEFT JOIN movie_production_houses mph ON m.id = mph.movie_id
LEFT JOIN production_houses ph ON mph.production_house_id = ph.id
LEFT JOIN movie_countries mc ON m.id = mc.movie_id
LEFT JOIN countries c ON mc.country_id = c.id
LEFT JOIN movie_languages ml ON m.id = ml.movie_id
LEFT JOIN languages l ON ml.language_id = l.id
WHERE m.id = 1
GROUP BY m.id;
*/

-- Get cast and crew for a movie
/*
SELECT 
    mp.role_type,
    p.full_name,
    p.primary_role,
    mp.character_name,
    mp.job,
    mp.order_index
FROM movie_persons mp
JOIN persons p ON mp.person_id = p.id
WHERE mp.movie_id = 1
ORDER BY mp.role_type, mp.order_index;
*/

-- Get all alternative media for a movie
/*
SELECT 
    media_type,
    media_path,
    is_default
FROM movie_media
WHERE movie_id = 1
ORDER BY media_type, is_default DESC;
*/

-- Get streaming services for a movie
/*
SELECT 
    s.name as service_name,
    s.type as service_type,
    ms.availability_type
FROM movie_services ms
JOIN services s ON ms.service_id = s.id
WHERE ms.movie_id = 1
ORDER BY s.type, s.name;
*/

-- Find movies available on specific service
/*
SELECT 
    m.title,
    m.release_year,
    ms.availability_type
FROM movies m
JOIN movie_services ms ON m.id = ms.movie_id
WHERE ms.service_id = 1  -- Netflix
ORDER BY m.title;
*/
