-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 31 Jan 2026 pada 13.18
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `apimoview`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `countries`
--

CREATE TABLE `countries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `countries`
--

INSERT INTO `countries` (`id`, `name`) VALUES
(10, 'Australia'),
(9, 'Canada'),
(7, 'China'),
(5, 'France'),
(6, 'Germany'),
(8, 'India'),
(13, 'Indonesia'),
(12, 'Italy'),
(4, 'Japan'),
(3, 'South Korea'),
(11, 'Spain'),
(2, 'United Kingdom'),
(1, 'USA');

-- --------------------------------------------------------

--
-- Struktur dari tabel `diaries`
--

CREATE TABLE `diaries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `film_id` bigint(20) UNSIGNED NOT NULL,
  `watched_at` date NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `followers`
--

CREATE TABLE `followers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `follower_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `genres`
--

CREATE TABLE `genres` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `genres`
--

INSERT INTO `genres` (`id`, `name`) VALUES
(1, 'Action'),
(2, 'Adventure'),
(3, 'Animation'),
(4, 'Comedy'),
(5, 'Crime'),
(6, 'Documentary'),
(7, 'Drama'),
(8, 'Fantasy'),
(9, 'Horror'),
(10, 'Mystery'),
(11, 'Romance'),
(12, 'Sci-Fi'),
(13, 'Thriller'),
(14, 'War'),
(15, 'Western');

-- --------------------------------------------------------

--
-- Struktur dari tabel `languages`
--

CREATE TABLE `languages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `languages`
--

INSERT INTO `languages` (`id`, `name`) VALUES
(11, 'Arabic'),
(1, 'English'),
(5, 'French'),
(7, 'German'),
(10, 'Hindi'),
(13, 'Indonesian'),
(8, 'Italian'),
(3, 'Japanese'),
(2, 'Korean'),
(4, 'Mandarin Chinese'),
(9, 'Portuguese'),
(12, 'Russian'),
(6, 'Spanish');

-- --------------------------------------------------------

--
-- Struktur dari tabel `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(10, '2026_01_27_000001_create_core_movie_tables', 2),
(11, '2026_01_28_000001_create_users_table', 2),
(12, '2026_01_28_000002_create_user_profiles_table', 2),
(13, '2026_01_28_000003_create_user_favorite_films_table', 2),
(14, '2026_01_28_000004_create_ratings_table', 2),
(15, '2026_01_28_000005_create_diaries_table', 2),
(16, '2026_01_28_000006_create_watchlists_table', 2),
(17, '2026_01_28_000007_create_followers_table', 2),
(18, '2026_01_28_000008_create_user_activities_table', 2),
(19, '2026_01_28_000009_create_reviews_table', 2),
(20, '2026_01_28_000010_create_review_likes_table', 2),
(21, '2026_01_28_000011_create_review_comments_table', 2),
(22, '2026_01_27_000001_create_moview_schema_tables', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movies`
--

CREATE TABLE `movies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `release_year` year(4) NOT NULL,
  `duration` int(10) UNSIGNED NOT NULL COMMENT 'Duration in minutes',
  `age_rating` varchar(10) DEFAULT 'NR' COMMENT 'e.g., G, PG, PG-13, R, NC-17',
  `synopsis` text DEFAULT NULL,
  `default_poster_path` varchar(500) DEFAULT NULL COMMENT 'Default poster image path',
  `default_backdrop_path` varchar(500) DEFAULT NULL COMMENT 'Default backdrop image path',
  `trailer_url` varchar(500) DEFAULT NULL COMMENT 'YouTube or video URL',
  `status` enum('draft','published') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movies`
--

INSERT INTO `movies` (`id`, `title`, `release_year`, `duration`, `age_rating`, `synopsis`, `default_poster_path`, `default_backdrop_path`, `trailer_url`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Inception', '2010', 148, 'PG-13', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 'movies/1/poster/5OBwmIPurhFTB0jHk8Rl3Irhha2MXvxqF26I5Bkp.webp', 'movies/1/backdrop/FLplanDFTeRk9wpJ4toUh4jfPqV8eUZlgIv0qlpy.webp', 'https://youtu.be/YoHD9XEInc0?si=KxD4Yt8_ZeMh5efc', 'published', '2026-01-30 13:33:36', '2026-01-30 06:44:53'),
(2, 'The Handmaiden', '2016', 168, 'NC-17', '1930s Korea, in the period of Japanese occupation, a new girl, Sookee, is hired as a handmaiden to a Japanese heiress, Hideko, who lives a secluded life on a large countryside estate with her domineering Uncle Kouzuki.', 'movies/2/poster/5KaUYiDyVYHpvYEbJUtByHpmOjigmpveskbTvF15.webp', 'movies/2/backdrop/7tPjR22RtGA8q4n8UaDamlnFPxHJDcLFLBB1lufy.webp', 'https://youtu.be/whldChqCsYk?si=_MK_uXDiQjqukebH', 'published', '2026-01-30 06:37:18', '2026-01-30 21:13:30'),
(3, 'Perfect Days', '2023', 123, 'PG', 'Hirayama seems utterly content with his simple life as a cleaner of toilets in Tokyo.', 'movies/3/poster/lNUXiqFkQiylVswXRL0CXpQQyO5w8A64VVJ1XwZc.webp', 'movies/3/backdrop/IYVzP15BMaVLXAtW6RJH9hLU4O3xTwz6EirgPiCp.webp', NULL, 'published', '2026-01-30 06:37:18', '2026-01-30 21:03:36'),
(4, 'Past Lives', '2023', 105, 'PG-13', 'Nora and Hae Sung, two deeply connected childhood friends, are wrest apart after Nora\'s family emigrates from South Korea.', 'movies/4/poster/hBWu8LFNnvKg6Gnd3D8GFHhqLS0rLKMlBp9hIMtx.webp', 'movies/4/backdrop/Ai4eeJWC12mAwSHaBvgwzlRUgyWVaIxeOGdyZ4Ag.webp', NULL, 'published', '2026-01-30 06:37:18', '2026-01-30 21:42:16'),
(5, 'Resurrection', '2025', 138, 'R', 'A father embarks on a journey to understand the afterlife.', 'movies/5/poster/iXl1MJ57vGlRi2GvQFLgPYmsifXdgikhRepquaqC.webp', 'movies/5/backdrop/P23DLxZaJZ1S6XAnAuhfJ4SloMLfLIuLBIlv4Wav.webp', NULL, 'published', '2026-01-30 06:37:18', '2026-01-30 21:31:44'),
(6, 'Sore: Istri Dari Masa Depan', '2025', 119, 'PG', 'A young man living alone in Croatia encounters a woman who claims to be his wife from the future, sent on a mission to help him correct his bad habits and improve his lifestyle.', 'movies/6/poster/FhAgMgFumfx1blIzWkSBy4FyN0CxfW59fzpiPhYn.webp', 'movies/6/backdrop/c2nt7XkzgOZ8T5RC2qIKTuVn1zke4C3Qgu9JZKTZ.webp', 'https://youtu.be/CZJWXm5KKyM?si=78R4C1eRm3FNYdrv', 'published', '2026-01-30 22:53:21', '2026-01-30 23:02:35'),
(7, 'Jatuh Cinta Seperti di Film-Film', '2023', 118, 'PG-13', 'Bagus, a screenwriter, reunites with his high school friend and crush, Hana, who is still grieving from the loss of her husband. He wants to convince her to fall in love once again, just like in the movies.', 'movies/7/poster/mvjIEh7YHK6ruRW6cFlomGqB1zhiGCHrlmhRnlma.webp', 'movies/7/backdrop/ztVPySl8mh5j6V5AHd3cSgh4HS41NJ06oj07wiyu.webp', 'https://youtu.be/F6jPobzz-ag?si=qEEc1W9VBvl_QaO1', 'published', '2026-01-30 23:06:54', '2026-01-30 23:10:24'),
(8, '\"Wuthering Heights\"', '2026', 136, 'R', 'Tragedy strikes when Heathcliff falls in love with Catherine Earnshaw, a woman from a wealthy family in 18th-century England.', 'movies/8/poster/uuaS50XVV9EDYQYtvbTe41EQqv5fFVWKShQo3sbs.webp', 'movies/8/backdrop/Na2VQgAGvNfG32r8ZkBcW6gYUlz6bk6g5j7IMi0u.webp', NULL, 'published', '2026-01-30 23:23:17', '2026-01-30 23:28:09'),
(9, 'Kokuho', '2025', 174, 'R', 'Nagasaki, 1964: Following the death of his yakuza father, 15-year-old Kikuo is taken under the wing of a famous kabuki actor. Alongside Shunsuke, the actor’s only son, he decides to dedicate himself to this traditional form of theatre. For decades, the two young men grow and evolve together – and one will become the greatest Japanese master of the art of kabuki.', 'movies/9/poster/jjU63J5nEzTMsQCgJUs3i4RBo5tj8gschDTVHyxd.webp', 'movies/9/backdrop/yxvyoYjoyyKIcnI5NEpHYZZO2yxHnUfflVQynODO.webp', NULL, 'published', '2026-01-31 02:47:29', '2026-01-31 02:52:01');

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_countries`
--

CREATE TABLE `movie_countries` (
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `country_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_countries`
--

INSERT INTO `movie_countries` (`movie_id`, `country_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 4),
(3, 6),
(4, 1),
(4, 3),
(5, 5),
(5, 7),
(6, 13),
(7, 13),
(8, 1),
(9, 4);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_genres`
--

CREATE TABLE `movie_genres` (
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `genre_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_genres`
--

INSERT INTO `movie_genres` (`movie_id`, `genre_id`) VALUES
(1, 1),
(1, 2),
(1, 12),
(2, 7),
(2, 11),
(2, 13),
(3, 7),
(4, 7),
(4, 11),
(5, 7),
(5, 8),
(6, 7),
(6, 11),
(6, 12),
(7, 4),
(7, 7),
(7, 11),
(8, 7),
(8, 11),
(9, 7);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_languages`
--

CREATE TABLE `movie_languages` (
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `language_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_languages`
--

INSERT INTO `movie_languages` (`movie_id`, `language_id`) VALUES
(1, 1),
(2, 2),
(2, 3),
(3, 2),
(3, 3),
(4, 1),
(4, 2),
(5, 2),
(5, 4),
(6, 13),
(7, 13),
(8, 1),
(9, 3);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_likes`
--

CREATE TABLE `movie_likes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `film_id` bigint(20) UNSIGNED NOT NULL COMMENT 'References movies.id',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_media`
--

CREATE TABLE `movie_media` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `media_type` enum('poster','backdrop') NOT NULL,
  `media_path` varchar(500) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'Alternative default media',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_media`
--

INSERT INTO `movie_media` (`id`, `movie_id`, `media_type`, `media_path`, `is_default`, `created_at`) VALUES
(3, 1, 'poster', 'movies/1/poster/5OBwmIPurhFTB0jHk8Rl3Irhha2MXvxqF26I5Bkp.webp', 1, '2026-01-30 13:43:07'),
(4, 1, 'backdrop', 'movies/1/backdrop/FLplanDFTeRk9wpJ4toUh4jfPqV8eUZlgIv0qlpy.webp', 1, '2026-01-30 13:43:44'),
(5, 2, 'poster', 'movies/2/poster/5KaUYiDyVYHpvYEbJUtByHpmOjigmpveskbTvF15.webp', 1, '2026-01-31 03:45:20'),
(6, 2, 'backdrop', 'movies/2/backdrop/7tPjR22RtGA8q4n8UaDamlnFPxHJDcLFLBB1lufy.webp', 1, '2026-01-31 03:45:38'),
(7, 3, 'poster', 'movies/3/poster/lNUXiqFkQiylVswXRL0CXpQQyO5w8A64VVJ1XwZc.webp', 1, '2026-01-31 04:01:05'),
(8, 3, 'backdrop', 'movies/3/backdrop/IYVzP15BMaVLXAtW6RJH9hLU4O3xTwz6EirgPiCp.webp', 1, '2026-01-31 04:03:30'),
(9, 4, 'poster', 'movies/4/poster/hBWu8LFNnvKg6Gnd3D8GFHhqLS0rLKMlBp9hIMtx.webp', 1, '2026-01-31 04:12:43'),
(10, 5, 'poster', 'movies/5/poster/iXl1MJ57vGlRi2GvQFLgPYmsifXdgikhRepquaqC.webp', 1, '2026-01-31 04:30:24'),
(11, 5, 'backdrop', 'movies/5/backdrop/P23DLxZaJZ1S6XAnAuhfJ4SloMLfLIuLBIlv4Wav.webp', 1, '2026-01-31 04:30:42'),
(12, 4, 'backdrop', 'movies/4/backdrop/Ai4eeJWC12mAwSHaBvgwzlRUgyWVaIxeOGdyZ4Ag.webp', 1, '2026-01-31 04:42:09'),
(13, 6, 'poster', 'movies/6/poster/FhAgMgFumfx1blIzWkSBy4FyN0CxfW59fzpiPhYn.webp', 1, '2026-01-31 06:01:42'),
(14, 6, 'backdrop', 'movies/6/backdrop/c2nt7XkzgOZ8T5RC2qIKTuVn1zke4C3Qgu9JZKTZ.webp', 1, '2026-01-31 06:01:56'),
(15, 7, 'poster', 'movies/7/poster/mvjIEh7YHK6ruRW6cFlomGqB1zhiGCHrlmhRnlma.webp', 1, '2026-01-31 06:09:25'),
(16, 7, 'backdrop', 'movies/7/backdrop/ztVPySl8mh5j6V5AHd3cSgh4HS41NJ06oj07wiyu.webp', 1, '2026-01-31 06:09:38'),
(17, 2, 'poster', 'movies/2/poster/1aU077w82zSVVoxfCZIJaJBCMoRJLsJ4Na1ba4D0.webp', 0, '2026-01-31 06:16:35'),
(18, 2, 'poster', 'movies/2/poster/eWWM4ju0ygzrhSsoRwJG8PYZ6nnYsQFzalbSfcN7.webp', 0, '2026-01-31 06:18:47'),
(19, 2, 'backdrop', 'movies/2/backdrop/wZ5rqpI7SuvCMHeXhGH0P3FFTJEBUYYy1QtsKMWI.webp', 0, '2026-01-31 06:18:59'),
(20, 2, 'backdrop', 'movies/2/backdrop/byssivfxxlCyfwHLpuBh1igRSqdHTF46JKzjB9iA.webp', 0, '2026-01-31 06:19:09'),
(21, 8, 'poster', 'movies/8/poster/uuaS50XVV9EDYQYtvbTe41EQqv5fFVWKShQo3sbs.webp', 1, '2026-01-31 06:26:52'),
(22, 8, 'backdrop', 'movies/8/backdrop/Na2VQgAGvNfG32r8ZkBcW6gYUlz6bk6g5j7IMi0u.webp', 1, '2026-01-31 06:27:05'),
(23, 9, 'poster', 'movies/9/poster/jjU63J5nEzTMsQCgJUs3i4RBo5tj8gschDTVHyxd.webp', 1, '2026-01-31 09:50:57'),
(24, 9, 'backdrop', 'movies/9/backdrop/yxvyoYjoyyKIcnI5NEpHYZZO2yxHnUfflVQynODO.webp', 1, '2026-01-31 09:51:11'),
(25, 9, 'backdrop', 'movies/9/backdrop/GSnoFTPocLVF38TANG4pChZseB8C0rBx2x0mr7nG.webp', 0, '2026-01-31 11:13:24'),
(26, 3, 'backdrop', 'movies/3/backdrop/kil4EhhwtNnQD17mfBzKjEszNnuF6nSyhUZYNowL.webp', 0, '2026-01-31 11:13:50'),
(27, 4, 'backdrop', 'movies/4/backdrop/MpiKp8duJt2LBFQjxLaU7tvdVzb5iMQEHZJQmAt0.webp', 0, '2026-01-31 11:14:12'),
(28, 5, 'backdrop', 'movies/5/backdrop/JkOGG9sSFtYykK6orcJ8Yelh9quoFDAJJWGB4cjT.webp', 0, '2026-01-31 11:14:45'),
(29, 6, 'backdrop', 'movies/6/backdrop/oYsZpExnpuhSQuMiGcev7dixWJqcah3SnkDxP7HS.webp', 0, '2026-01-31 11:15:09'),
(30, 8, 'backdrop', 'movies/8/backdrop/vY84g4TYRa7xI9qysTfCbMdZVOnvgOIRE1UxVYDh.webp', 0, '2026-01-31 11:43:21'),
(31, 7, 'backdrop', 'movies/7/backdrop/bEihWtI8KtjiePWfL1v6JsurnOWsmQPG4QkkgJjd.webp', 0, '2026-01-31 11:43:57');

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_persons`
--

CREATE TABLE `movie_persons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `person_id` bigint(20) UNSIGNED NOT NULL,
  `role_type` enum('cast','crew') NOT NULL,
  `character_name` varchar(255) DEFAULT NULL COMMENT 'For cast: character name in the movie',
  `job` varchar(100) DEFAULT NULL COMMENT 'For crew: specific job (Director, Writer, etc.)',
  `order_index` int(11) DEFAULT 0 COMMENT 'Display order (0 = first)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_persons`
--

INSERT INTO `movie_persons` (`id`, `movie_id`, `person_id`, `role_type`, `character_name`, `job`, `order_index`) VALUES
(1, 1, 1, 'cast', 'Dom Cobb', NULL, 0),
(2, 1, 2, 'crew', NULL, 'Director', 0),
(3, 1, 3, 'crew', NULL, 'Composer', 1),
(4, 2, 4, 'crew', NULL, 'Director', 0),
(5, 2, 5, 'cast', 'Sook-hee', NULL, 0),
(6, 2, 6, 'cast', 'Lady Hideko', NULL, 1),
(7, 2, 7, 'cast', 'Count Fujiwara', NULL, 2),
(8, 2, 8, 'cast', 'Uncle Kouzuki', NULL, 3),
(9, 2, 14, 'crew', NULL, 'Screenplay', 0),
(10, 3, 12, 'crew', NULL, 'Director', 0),
(11, 3, 9, 'cast', 'Hirayama', NULL, 0),
(12, 3, 15, 'crew', NULL, 'Cinematographer', 0),
(13, 4, 13, 'crew', NULL, 'Director', 0),
(14, 4, 10, 'cast', 'Nora', NULL, 0),
(15, 4, 11, 'cast', 'Hae Sung', NULL, 1),
(16, 4, 13, 'crew', NULL, 'Screenplay', 0),
(17, 5, 16, 'crew', NULL, 'Director', 0),
(18, 5, 16, 'crew', NULL, 'Screenplay', 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_production_houses`
--

CREATE TABLE `movie_production_houses` (
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `production_house_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_production_houses`
--

INSERT INTO `movie_production_houses` (`movie_id`, `production_house_id`) VALUES
(1, 1),
(1, 3),
(2, 9),
(2, 10),
(3, 11),
(4, 4),
(4, 5),
(5, 12),
(6, 13),
(7, 13),
(8, 1),
(9, 14),
(9, 15);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_services`
--

CREATE TABLE `movie_services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `service_id` bigint(20) UNSIGNED NOT NULL,
  `availability_type` enum('stream','rent','buy') DEFAULT 'stream',
  `release_date` date DEFAULT NULL COMMENT 'Release date for theatrical or streaming'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_services`
--

INSERT INTO `movie_services` (`id`, `movie_id`, `service_id`, `availability_type`, `release_date`) VALUES
(4, 1, 4, 'stream', NULL),
(5, 1, 5, 'rent', NULL),
(6, 1, 5, 'buy', NULL),
(14, 3, 11, 'stream', NULL),
(20, 6, 1, 'stream', NULL),
(21, 5, 10, 'stream', '2026-02-01'),
(22, 5, 12, 'stream', NULL),
(23, 7, 1, 'stream', NULL),
(30, 8, 9, 'stream', '2026-02-11'),
(31, 8, 10, 'stream', '2026-02-11'),
(32, 8, 12, 'stream', '2026-02-11');

-- --------------------------------------------------------

--
-- Struktur dari tabel `persons`
--

CREATE TABLE `persons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `primary_role` enum('Actor','Director','Writer','Producer','Cinematographer','Composer') NOT NULL,
  `photo_path` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `persons`
--

INSERT INTO `persons` (`id`, `full_name`, `primary_role`, `photo_path`, `bio`, `date_of_birth`, `nationality`, `created_at`, `updated_at`) VALUES
(1, 'Leonardo DiCaprio', 'Actor', 'persons/xOLHKCrLzuRqH8PglohlpsA4nbo1DiSvIjTa7ASe.webp', 'Leonardo Wilhelm DiCaprio is an American actor and film producer.', NULL, 'American', '2026-01-30 13:33:36', '2026-01-30 20:38:35'),
(2, 'Christopher Nolan', 'Director', 'persons/wdaMpeVhrU9Hfveq2l2CWTBZ1EcefAvqCnq1PR1V.webp', 'Christopher Edward Nolan is a British-American film director, producer, and screenwriter.', NULL, 'British-American', '2026-01-30 13:33:36', '2026-01-30 06:59:45'),
(3, 'Hans Zimmer', 'Composer', 'persons/qv0VulaY23UsWrZ67885saRcUkq8ST4mHyuyQmbr.webp', 'Hans Florian Zimmer is a German film score composer and music producer.', NULL, 'German', '2026-01-30 13:33:36', '2026-01-30 20:39:06'),
(4, 'Park Chan-wook', 'Director', NULL, NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(5, 'Kim Tae-ri', 'Actor', NULL, NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(6, 'Kim Min-hee', 'Actor', 'persons/xBVAva9rSkdMeXAdvnkVqKgTLn6tafiWjoYd00mD.webp', NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 07:00:47'),
(7, 'Ha Jung-woo', 'Actor', NULL, NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(8, 'Cho Jin-woong', 'Actor', NULL, NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(9, 'Kōji Yakusho', 'Actor', NULL, NULL, NULL, 'Japan', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(10, 'Greta Lee', 'Actor', NULL, NULL, NULL, 'United States', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(11, 'Teo Yoo', 'Actor', NULL, NULL, NULL, 'Germany', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(12, 'Wim Wenders', 'Director', NULL, NULL, NULL, 'Germany', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(13, 'Celine Song', 'Director', NULL, NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(14, 'Choi Seung-yun', 'Writer', NULL, NULL, NULL, 'South Korea', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(15, 'Franz Lustig', 'Cinematographer', NULL, NULL, NULL, 'Austria', '2026-01-30 06:37:18', '2026-01-30 06:37:18'),
(16, 'Bi Gan', 'Director', NULL, NULL, NULL, 'China', '2026-01-30 06:37:18', '2026-01-30 06:37:18');

-- --------------------------------------------------------

--
-- Struktur dari tabel `production_houses`
--

CREATE TABLE `production_houses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `production_houses`
--

INSERT INTO `production_houses` (`id`, `name`) VALUES
(8, '20th Century Studios'),
(4, 'A24'),
(13, 'Cerita Films'),
(5, 'CJ Entertainment'),
(15, 'GKIDS Films'),
(12, 'Janus Films'),
(3, 'Legendary Pictures'),
(9, 'Moho Film'),
(7, 'Paramount Pictures'),
(6, 'Sony Pictures'),
(14, 'TOHO'),
(2, 'Universal Pictures'),
(1, 'Warner Bros'),
(11, 'Wenders Images'),
(10, 'Yong Film');

-- --------------------------------------------------------

--
-- Struktur dari tabel `ratings`
--

CREATE TABLE `ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `film_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL COMMENT 'Rating 1-5 stars',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `film_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL COMMENT 'Rating 1-5 stars',
  `title` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `backdrop_path` varchar(255) DEFAULT NULL COMMENT 'Hero image for review detail page',
  `is_spoiler` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('published','hidden','deleted') NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `review_comments`
--

CREATE TABLE `review_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `review_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('published','hidden') NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `review_likes`
--

CREATE TABLE `review_likes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `review_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `services`
--

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `logo_path` varchar(500) DEFAULT NULL COMMENT 'Service logo image path',
  `type` enum('streaming','theatrical','tv') DEFAULT 'streaming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `services`
--

INSERT INTO `services` (`id`, `name`, `logo_path`, `type`, `created_at`) VALUES
(1, 'Netflix', '/logos/netflix.webp', 'streaming', '2026-01-30 13:33:36'),
(2, 'Disney+', NULL, 'streaming', '2026-01-30 13:33:36'),
(3, 'Amazon Prime Video', NULL, 'streaming', '2026-01-30 13:33:36'),
(4, 'HBO Max', '/logos/max.webp', 'streaming', '2026-01-30 13:33:36'),
(5, 'Apple TV+', '/logos/Appletv.webp', 'streaming', '2026-01-30 13:33:36'),
(6, 'Hulu', NULL, 'streaming', '2026-01-30 13:33:36'),
(7, 'Paramount+', NULL, 'streaming', '2026-01-30 13:33:36'),
(8, 'YouTube Premium', NULL, 'streaming', '2026-01-30 13:33:36'),
(9, 'Cinema XXI', '/logos/CinemaXXI.jpeg', 'theatrical', '2026-01-30 13:33:36'),
(10, 'CGV Cinemas', '/logos/CGV.jpeg', 'theatrical', '2026-01-30 13:33:36'),
(11, 'Klikfilm', '/logos/klikfilm.webp', 'streaming', '2026-01-31 04:16:49'),
(12, 'Cinepolis Indonesia', '/logos/Cinepolis.png', 'theatrical', '2026-01-31 04:36:16');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `status` enum('active','banned','suspended') NOT NULL DEFAULT 'active',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `joined_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'NewUsername', 'admin@moview.com', '$2y$12$knpNEAbZAOkT711/AZFX/eisyn6LBQCcShqiWp1YctQm5g8Oi8pZW', 'admin', 'active', '2026-01-30 20:29:53', NULL, '2026-01-30 20:29:53', '2026-01-30 20:29:53'),
(2, 'testuser', 'user@moview.com', '$2y$12$edj58OcYoXoiJsd22IwnnennCMGix0o98Y0ZJchd1VnnVwRMsH2rC', 'user', 'active', '2026-01-30 23:34:38', 'MnwxNzY5ODQxNjc0fDY5N2RhNDBhNTE4NDQ=', '2026-01-30 23:34:38', '2026-01-30 23:41:14'),
(3, 'Sengefilm', 'tes@gmail.com', '$2y$12$lDfKXQIoqKTaeAdU.FpQX.Oqu.8Plbzprn6YOMhkIa9KCLtHN1KTK', 'user', 'active', '2026-01-30 23:49:39', 'M3wxNzY5ODU5MDUzfDY5N2RlN2VkOWE2NjI=', '2026-01-30 23:49:39', '2026-01-31 04:30:53'),
(4, 'NewUser185', 'newuser_1769846806@test.com', '$2y$12$r0tcTwJt.eLjMs1n5pgdi.k9gPXqhujHx90XqkT0QMgkNLXZHrmly', 'user', 'active', '2026-01-31 01:06:46', 'bmV3dXNlcl8xNzY5ODQ2ODA2QHRlc3QuY29tfDE3Njk4NDY4MDZ8Njk3ZGI4MTY3Njk0Zg==', '2026-01-31 01:06:46', '2026-01-31 01:06:46');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_activities`
--

CREATE TABLE `user_activities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL COMMENT 'Activity type: rate_film, diary_log, review_post',
  `film_id` bigint(20) UNSIGNED DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional metadata for activity' CHECK (json_valid(`meta`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_favorite_films`
--

CREATE TABLE `user_favorite_films` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `film_id` bigint(20) UNSIGNED NOT NULL,
  `position` tinyint(3) UNSIGNED NOT NULL COMMENT 'Position 1-4 for favorite films',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `user_favorite_films`
--

INSERT INTO `user_favorite_films` (`id`, `user_id`, `film_id`, `position`, `created_at`, `updated_at`) VALUES
(86, 3, 4, 1, '2026-01-31 05:14:23', '2026-01-31 05:14:23'),
(87, 3, 3, 2, '2026-01-31 05:14:23', '2026-01-31 05:14:23'),
(88, 3, 2, 3, '2026-01-31 05:14:23', '2026-01-31 05:14:23'),
(89, 3, 5, 4, '2026-01-31 05:14:23', '2026-01-31 05:14:23');

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `backdrop_path` varchar(255) DEFAULT NULL,
  `backdrop_enabled` tinyint(1) DEFAULT 0,
  `bio` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `display_name`, `profile_photo`, `backdrop_path`, `backdrop_enabled`, `bio`, `location`, `created_at`, `updated_at`) VALUES
(1, 3, 'Sengefilm', NULL, 'movies/4/backdrop/MpiKp8duJt2LBFQjxLaU7tvdVzb5iMQEHZJQmAt0.webp', 1, 'Updated bio with location test', 'Sidoarjo, Indonesia', '2026-01-31 00:38:49', '2026-01-31 05:14:23'),
(2, 4, 'NewUser185', NULL, NULL, 0, NULL, NULL, '2026-01-31 01:06:46', '2026-01-31 01:06:46'),
(3, 1, NULL, NULL, NULL, 1, 'This is my new bio', NULL, '2026-01-31 03:41:40', '2026-01-31 03:41:40');

-- --------------------------------------------------------

--
-- Struktur dari tabel `watchlists`
--

CREATE TABLE `watchlists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `film_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`);

--
-- Indeks untuk tabel `diaries`
--
ALTER TABLE `diaries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `diaries_user_id_index` (`user_id`),
  ADD KEY `diaries_film_id_index` (`film_id`),
  ADD KEY `diaries_watched_at_index` (`watched_at`);

--
-- Indeks untuk tabel `followers`
--
ALTER TABLE `followers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_follower` (`user_id`,`follower_id`),
  ADD KEY `followers_user_id_index` (`user_id`),
  ADD KEY `followers_follower_id_index` (`follower_id`);

--
-- Indeks untuk tabel `genres`
--
ALTER TABLE `genres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`);

--
-- Indeks untuk tabel `languages`
--
ALTER TABLE `languages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`);

--
-- Indeks untuk tabel `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_title` (`title`),
  ADD KEY `idx_release_year` (`release_year`),
  ADD KEY `idx_status` (`status`);

--
-- Indeks untuk tabel `movie_countries`
--
ALTER TABLE `movie_countries`
  ADD PRIMARY KEY (`movie_id`,`country_id`),
  ADD KEY `country_id` (`country_id`);

--
-- Indeks untuk tabel `movie_genres`
--
ALTER TABLE `movie_genres`
  ADD PRIMARY KEY (`movie_id`,`genre_id`),
  ADD KEY `genre_id` (`genre_id`);

--
-- Indeks untuk tabel `movie_languages`
--
ALTER TABLE `movie_languages`
  ADD PRIMARY KEY (`movie_id`,`language_id`),
  ADD KEY `language_id` (`language_id`);

--
-- Indeks untuk tabel `movie_likes`
--
ALTER TABLE `movie_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_film` (`user_id`,`film_id`),
  ADD KEY `idx_film` (`film_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indeks untuk tabel `movie_media`
--
ALTER TABLE `movie_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_movie_media` (`movie_id`,`media_type`),
  ADD KEY `idx_is_default` (`is_default`);

--
-- Indeks untuk tabel `movie_persons`
--
ALTER TABLE `movie_persons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_movie_role` (`movie_id`,`role_type`),
  ADD KEY `idx_person` (`person_id`),
  ADD KEY `idx_order` (`order_index`);

--
-- Indeks untuk tabel `movie_production_houses`
--
ALTER TABLE `movie_production_houses`
  ADD PRIMARY KEY (`movie_id`,`production_house_id`),
  ADD KEY `production_house_id` (`production_house_id`);

--
-- Indeks untuk tabel `movie_services`
--
ALTER TABLE `movie_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_movie_service_type` (`movie_id`,`service_id`,`availability_type`),
  ADD KEY `idx_availability` (`availability_type`),
  ADD KEY `movie_services_ibfk_2` (`service_id`);

--
-- Indeks untuk tabel `persons`
--
ALTER TABLE `persons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_full_name` (`full_name`),
  ADD KEY `idx_primary_role` (`primary_role`);

--
-- Indeks untuk tabel `production_houses`
--
ALTER TABLE `production_houses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`);

--
-- Indeks untuk tabel `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_film_rating` (`user_id`,`film_id`),
  ADD KEY `ratings_user_id_index` (`user_id`),
  ADD KEY `ratings_film_id_index` (`film_id`),
  ADD KEY `ratings_rating_index` (`rating`);

--
-- Indeks untuk tabel `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviews_user_id_index` (`user_id`),
  ADD KEY `reviews_film_id_index` (`film_id`),
  ADD KEY `reviews_rating_index` (`rating`),
  ADD KEY `reviews_status_index` (`status`),
  ADD KEY `reviews_created_at_index` (`created_at`);

--
-- Indeks untuk tabel `review_comments`
--
ALTER TABLE `review_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_comments_review_id_index` (`review_id`),
  ADD KEY `review_comments_user_id_index` (`user_id`),
  ADD KEY `review_comments_parent_id_index` (`parent_id`),
  ADD KEY `review_comments_status_index` (`status`),
  ADD KEY `review_comments_created_at_index` (`created_at`);

--
-- Indeks untuk tabel `review_likes`
--
ALTER TABLE `review_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review_user_like` (`review_id`,`user_id`),
  ADD KEY `review_likes_review_id_index` (`review_id`),
  ADD KEY `review_likes_user_id_index` (`user_id`);

--
-- Indeks untuk tabel `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_type` (`type`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_username_index` (`username`),
  ADD KEY `users_email_index` (`email`),
  ADD KEY `users_role_index` (`role`),
  ADD KEY `users_status_index` (`status`);

--
-- Indeks untuk tabel `user_activities`
--
ALTER TABLE `user_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_activities_user_id_index` (`user_id`),
  ADD KEY `user_activities_type_index` (`type`),
  ADD KEY `user_activities_film_id_index` (`film_id`),
  ADD KEY `user_activities_created_at_index` (`created_at`);

--
-- Indeks untuk tabel `user_favorite_films`
--
ALTER TABLE `user_favorite_films`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_film` (`user_id`,`film_id`),
  ADD UNIQUE KEY `unique_user_position` (`user_id`,`position`),
  ADD KEY `user_favorite_films_user_id_index` (`user_id`),
  ADD KEY `user_favorite_films_film_id_index` (`film_id`);

--
-- Indeks untuk tabel `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_profiles_user_id_index` (`user_id`);

--
-- Indeks untuk tabel `watchlists`
--
ALTER TABLE `watchlists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_film_watchlist` (`user_id`,`film_id`),
  ADD KEY `watchlists_user_id_index` (`user_id`),
  ADD KEY `watchlists_film_id_index` (`film_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `countries`
--
ALTER TABLE `countries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT untuk tabel `diaries`
--
ALTER TABLE `diaries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `followers`
--
ALTER TABLE `followers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `genres`
--
ALTER TABLE `genres`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT untuk tabel `languages`
--
ALTER TABLE `languages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT untuk tabel `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT untuk tabel `movies`
--
ALTER TABLE `movies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `movie_likes`
--
ALTER TABLE `movie_likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `movie_media`
--
ALTER TABLE `movie_media`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT untuk tabel `movie_persons`
--
ALTER TABLE `movie_persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT untuk tabel `movie_services`
--
ALTER TABLE `movie_services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT untuk tabel `persons`
--
ALTER TABLE `persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `production_houses`
--
ALTER TABLE `production_houses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT untuk tabel `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `review_comments`
--
ALTER TABLE `review_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `review_likes`
--
ALTER TABLE `review_likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `user_activities`
--
ALTER TABLE `user_activities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `user_favorite_films`
--
ALTER TABLE `user_favorite_films`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT untuk tabel `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `watchlists`
--
ALTER TABLE `watchlists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `diaries`
--
ALTER TABLE `diaries`
  ADD CONSTRAINT `diaries_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `diaries_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `followers`
--
ALTER TABLE `followers`
  ADD CONSTRAINT `followers_follower_id_foreign` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `followers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_countries`
--
ALTER TABLE `movie_countries`
  ADD CONSTRAINT `movie_countries_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_countries_ibfk_2` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_genres`
--
ALTER TABLE `movie_genres`
  ADD CONSTRAINT `movie_genres_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_genres_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_languages`
--
ALTER TABLE `movie_languages`
  ADD CONSTRAINT `movie_languages_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_languages_ibfk_2` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_likes`
--
ALTER TABLE `movie_likes`
  ADD CONSTRAINT `movie_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_likes_ibfk_2` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_media`
--
ALTER TABLE `movie_media`
  ADD CONSTRAINT `movie_media_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_persons`
--
ALTER TABLE `movie_persons`
  ADD CONSTRAINT `movie_persons_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_persons_ibfk_2` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_production_houses`
--
ALTER TABLE `movie_production_houses`
  ADD CONSTRAINT `movie_production_houses_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_production_houses_ibfk_2` FOREIGN KEY (`production_house_id`) REFERENCES `production_houses` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `movie_services`
--
ALTER TABLE `movie_services`
  ADD CONSTRAINT `movie_services_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `movie_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ratings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `review_comments`
--
ALTER TABLE `review_comments`
  ADD CONSTRAINT `review_comments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `review_comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_comments_review_id_foreign` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `review_likes`
--
ALTER TABLE `review_likes`
  ADD CONSTRAINT `review_likes_review_id_foreign` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `review_likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `user_activities`
--
ALTER TABLE `user_activities`
  ADD CONSTRAINT `user_activities_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_activities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `user_favorite_films`
--
ALTER TABLE `user_favorite_films`
  ADD CONSTRAINT `user_favorite_films_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_favorite_films_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `watchlists`
--
ALTER TABLE `watchlists`
  ADD CONSTRAINT `watchlists_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `watchlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
