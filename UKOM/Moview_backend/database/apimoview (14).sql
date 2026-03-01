-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 01 Mar 2026 pada 11.52
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
(20, 'Brazil'),
(9, 'Canada'),
(7, 'China'),
(21, 'Denmark'),
(5, 'France'),
(6, 'Germany'),
(22, 'Iceland'),
(8, 'India'),
(13, 'Indonesia'),
(16, 'Iran'),
(12, 'Italy'),
(4, 'Japan'),
(14, 'Norway'),
(18, 'Saudi Arabia'),
(3, 'South Korea'),
(11, 'Spain'),
(19, 'Thailand'),
(17, 'Tunisia'),
(15, 'UK'),
(23, 'Ukraine'),
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
  `review_id` bigint(20) UNSIGNED DEFAULT NULL,
  `watched_at` date NOT NULL,
  `rating` tinyint(3) UNSIGNED DEFAULT NULL COMMENT 'Rating snapshot at time of logging (1-5 stars)',
  `is_liked` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether user liked this movie when logging it',
  `note` text DEFAULT NULL,
  `is_rewatched` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this diary entry is a rewatch (not first watch)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `diaries`
--

INSERT INTO `diaries` (`id`, `user_id`, `film_id`, `review_id`, `watched_at`, `rating`, `is_liked`, `note`, `is_rewatched`, `created_at`, `updated_at`) VALUES
(6, 3, 6, 10, '2026-02-07', NULL, 0, 'Review: Kita kan tua dan kehilangan pegangan', 0, '2026-02-06 07:00:22', '2026-02-07 03:40:05'),
(7, 3, 19, NULL, '2026-02-06', NULL, 0, 'Review: Jeleq banget dah, membingungkan', 0, '2026-02-06 07:02:11', '2026-02-06 07:02:11'),
(8, 3, 15, NULL, '2026-02-07', NULL, 0, 'Review: Emang bagus banget nget nget', 0, '2026-02-06 07:04:59', '2026-02-07 03:29:43'),
(9, 3, 26, NULL, '2026-01-30', 4, 0, 'Review: Gila Bangt', 0, '2026-02-06 07:15:32', '2026-02-07 04:03:27'),
(10, 3, 7, NULL, '2026-02-07', NULL, 0, 'Review: tes', 0, '2026-02-06 07:29:03', '2026-02-07 03:13:46'),
(11, 3, 2, NULL, '2026-02-06', NULL, 0, 'Review: Sangat sangat dibikin melongo', 0, '2026-02-06 07:33:09', '2026-02-06 07:33:09'),
(12, 3, 10, 11, '2026-02-11', 5, 1, 'Review: soo good', 0, '2026-02-07 03:44:11', '2026-02-10 21:36:05'),
(13, 3, 11, NULL, '2026-02-07', 5, 0, 'Watched this film', 0, '2026-02-07 03:50:06', '2026-02-07 03:50:06'),
(14, 3, 16, 12, '2026-02-01', 5, 0, 'Review: <b><i>Ngantuk</i></b><b><i> baby</i></b>. <a href=\"https://tv8.lk21official.cc/secret-agent-2025\">Aku </a><a href=\"https://tv8.lk21official.cc/secret-agent-2025\">nonton</a><a href=\"https://tv8.lk21official.cc/secret-agent-2025\"> disini</a>', 0, '2026-02-07 04:16:39', '2026-02-07 04:50:15'),
(20, 3, 10, 11, '2026-02-11', 5, 1, 'tes', 1, '2026-02-10 22:30:56', '2026-02-10 22:30:56'),
(21, 3, 11, 13, '2026-02-11', 5, 0, 'tes', 1, '2026-02-10 22:34:28', '2026-02-10 22:34:28'),
(22, 3, 10, 14, '2026-02-11', 5, 1, 'tes', 1, '2026-02-10 22:34:52', '2026-02-10 22:34:52'),
(23, 3, 34, 15, '2026-02-11', 4, 0, 'tes', 0, '2026-02-10 22:52:49', '2026-02-10 22:52:49'),
(24, 3, 34, 16, '2026-02-11', 4, 0, 'tes22', 1, '2026-02-10 22:53:00', '2026-02-10 22:53:00'),
(25, 3, 34, 17, '2026-02-14', 4, 0, 'Aku suka sinema Horeg ini', 1, '2026-02-14 01:28:09', '2026-02-14 01:28:09'),
(26, 5, 37, 18, '2026-02-14', 5, 1, 'Keren, Absolut cinema', 0, '2026-02-14 04:00:21', '2026-02-14 04:00:21'),
(27, 5, 34, 19, '2026-02-25', 4, 1, 'Sangar', 0, '2026-02-24 18:16:47', '2026-02-24 18:16:47'),
(28, 5, 10, 20, '2026-02-25', 5, 1, 'Heartwarming', 0, '2026-02-24 20:53:12', '2026-02-24 20:53:12'),
(29, 5, 14, 21, '2026-02-28', 5, 1, 'Film yang dikemas dengan cara absurd, nyeleneh, simbolik, dan lucu. Bercerita tentang seorang pria (March) yang kehilangan istrinya (Nat) karena polusi debu, lalu sang istri kembali sebagai hantu di dalam vacuum cleaner. Film ini bukan hanya fokus pada romansa March dan Nat, melainkan pada trauma dan ingatan yang belum selesai. Saat tragedi penindakan militer 2010 di Bangkok disinggung, absurditasnya berubah menjadi satire pahit tentang memori kolektif yang tak bisa begitu saja disingkirkan.', 0, '2026-02-28 04:47:40', '2026-02-28 04:47:40'),
(30, 5, 42, 22, '2026-02-28', 4, 1, 'Astagfirullah', 0, '2026-02-28 04:53:23', '2026-02-28 04:53:23'),
(31, 5, 30, 23, '2026-02-28', 5, 1, 'Sedih banggettt', 0, '2026-02-28 04:53:49', '2026-02-28 04:53:49'),
(32, 5, 41, 24, '2026-02-28', 5, 1, 'Sunyi mamposss', 0, '2026-02-28 04:54:43', '2026-02-28 04:54:43'),
(33, 5, 2, 25, '2026-02-28', 5, 1, 'Review: bAGUSSSS', 0, '2026-02-28 08:30:02', '2026-03-01 03:32:28');

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

--
-- Dumping data untuk tabel `followers`
--

INSERT INTO `followers` (`id`, `user_id`, `follower_id`, `created_at`, `updated_at`) VALUES
(5, 5, 3, '2026-02-24 22:19:47', '2026-02-24 22:19:47'),
(6, 3, 5, '2026-02-24 22:29:34', '2026-02-24 22:29:34'),
(7, 3, 6, '2026-02-28 03:10:44', '2026-02-28 03:10:44'),
(8, 5, 6, '2026-02-28 03:11:08', '2026-02-28 03:11:08'),
(10, 6, 5, '2026-02-28 08:32:26', '2026-02-28 08:32:26');

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
(16, 'Family'),
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
(19, 'Icelandic'),
(13, 'Indonesian'),
(8, 'Italian'),
(3, 'Japanese'),
(20, 'Javanese'),
(2, 'Korean'),
(4, 'Mandarin Chinese'),
(14, 'Norwegian'),
(15, 'Persian (Farsi)'),
(9, 'Portuguese'),
(12, 'Russian'),
(6, 'Spanish'),
(17, 'Thai');

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
(22, '2026_01_27_000001_create_moview_schema_tables', 1),
(23, '2026_02_07_000001_add_review_id_to_diaries_table', 3),
(24, '2026_02_07_000002_add_rating_to_diaries_table', 4),
(25, '2026_02_07_000003_add_is_liked_to_reviews_and_diaries', 5),
(26, '2026_02_07_000004_add_watched_at_to_reviews_table', 6),
(27, '2026_02_11_add_is_rewatched_to_diaries', 7),
(28, '2026_02_14_add_is_rewatched_to_reviews', 8),
(29, '2026_02_25_000001_create_notifications_table', 9),
(30, '2026_02_28_141730_update_review_comments_status_column', 10),
(31, '2026_03_01_102005_add_flagged_status_to_reviews_table', 11);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movies`
--

CREATE TABLE `movies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `release_year` year(4) NOT NULL,
  `duration` int(11) DEFAULT NULL,
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
(5, 'Resurrection', '2025', 160, 'R', 'In a future where humanity has surrendered its ability to dream in exchange for immortality, an outcast finds illusion, nightmarish visions, and beauty in an intoxicating world of his own making.', 'movies/5/poster/yhKBpNYCQLXQAKJG3xD3Qu7o49EtGYpBzgM3ux4C.webp', 'movies/5/backdrop/P23DLxZaJZ1S6XAnAuhfJ4SloMLfLIuLBIlv4Wav.webp', 'https://youtu.be/ZIJezWgFUEY?si=Jpy_MBO8xS7IhmsA', 'published', '2026-01-30 06:37:18', '2026-02-28 04:43:41'),
(6, 'Sore: Istri Dari Masa Depan', '2025', 119, 'PG', 'A young man living alone in Croatia encounters a woman who claims to be his wife from the future, sent on a mission to help him correct his bad habits and improve his lifestyle.', 'movies/6/poster/FhAgMgFumfx1blIzWkSBy4FyN0CxfW59fzpiPhYn.webp', 'movies/6/backdrop/c2nt7XkzgOZ8T5RC2qIKTuVn1zke4C3Qgu9JZKTZ.webp', 'https://youtu.be/CZJWXm5KKyM?si=78R4C1eRm3FNYdrv', 'published', '2026-01-30 22:53:21', '2026-01-30 23:02:35'),
(7, 'Jatuh Cinta Seperti di Film-Film', '2023', 118, 'PG-13', 'Bagus, a screenwriter, reunites with his high school friend and crush, Hana, who is still grieving from the loss of her husband. He wants to convince her to fall in love once again, just like in the movies.', 'movies/7/poster/mvjIEh7YHK6ruRW6cFlomGqB1zhiGCHrlmhRnlma.webp', 'movies/7/backdrop/ztVPySl8mh5j6V5AHd3cSgh4HS41NJ06oj07wiyu.webp', 'https://youtu.be/F6jPobzz-ag?si=qEEc1W9VBvl_QaO1', 'published', '2026-01-30 23:06:54', '2026-01-30 23:10:24'),
(8, '\"Wuthering Heights\"', '2026', 136, 'R', 'Tragedy strikes when Heathcliff falls in love with Catherine Earnshaw, a woman from a wealthy family in 18th-century England.', 'movies/8/poster/uuaS50XVV9EDYQYtvbTe41EQqv5fFVWKShQo3sbs.webp', 'movies/8/backdrop/Na2VQgAGvNfG32r8ZkBcW6gYUlz6bk6g5j7IMi0u.webp', NULL, 'published', '2026-01-30 23:23:17', '2026-01-30 23:28:09'),
(9, 'Kokuho', '2025', 174, 'R', 'Nagasaki, 1964: Following the death of his yakuza father, 15-year-old Kikuo is taken under the wing of a famous kabuki actor. Alongside Shunsuke, the actor’s only son, he decides to dedicate himself to this traditional form of theatre. For decades, the two young men grow and evolve together – and one will become the greatest Japanese master of the art of kabuki.', 'movies/9/poster/jjU63J5nEzTMsQCgJUs3i4RBo5tj8gschDTVHyxd.webp', 'movies/9/backdrop/yxvyoYjoyyKIcnI5NEpHYZZO2yxHnUfflVQynODO.webp', 'https://youtu.be/Y0KfXj3Skao?si=w1QQcdOb5uHYylAV', 'published', '2026-01-31 02:47:29', '2026-02-28 05:12:58'),
(10, 'Sentimental Value', '2025', 133, 'PG-13', 'Sisters Nora and Agnes reunite with their estranged father, the charismatic Gustav, a once-renowned director who offers stage actress Nora a role in what he hopes will be his comeback film. When Nora turns it down, she soon discovers he has given her part to an eager young Hollywood star.', 'movies/10/poster/0WjHMZ4RSpw30YVH9Boi3WF7sSKRWAiQM6sCiPWL.webp', 'movies/10/backdrop/rMqzPyh7Af2WFdIXZ1QCvRHh5fTsZ3RGbQ7UnNPr.webp', 'https://youtu.be/lKbcKQN5Yrw?si=VVVKOvSx9Oe60on3', 'published', '2026-02-01 00:53:48', '2026-02-01 01:25:17'),
(11, 'It Was Just an Accident', '2025', 103, 'PG-13', 'An unassuming mechanic is reminded of his time in an Iranian prison when he encounters a man he suspects to be his sadistic jailhouse captor.', 'movies/11/poster/eHmpYjkkzCHaHKyLjHqBTlyVJTVcFzYWBMb3CekT.webp', 'movies/11/backdrop/casiXSWhcY2FaCewF33ozxNEG140w36AqiAxrbRM.webp', 'https://youtu.be/nF04v-ze2Yc?si=NjQPWXOJMejfIEHv', 'published', '2026-02-01 01:09:15', '2026-02-01 01:25:26'),
(12, 'The Voice of Hind Rajab', '2025', 89, 'PG', 'January 29, 2024. Red Crescent volunteers receive an emergency call. A five-year old girl is trapped in a car under fire in Gaza, pleading for rescue. While trying to keep her on the line, they do everything they can to get an ambulance to her. Her name was Hind Rajab.', 'movies/12/poster/WARIEsnc3Iegg3dYrivlQA9AsH6K05XtmoalB3jy.webp', 'movies/12/backdrop/y96DkRBguGbmad3k17I4CVojlH2FhAMU0jQ3nrMn.webp', 'https://youtu.be/hrssPpqv6vc?si=JOircuAacdAtx_Xa', 'published', '2026-02-01 01:15:50', '2026-02-01 01:25:35'),
(13, 'Human Resource', '2026', 122, 'R', 'Working in HR at a challenging company, Fren interviews young new hires and is secretly one month pregnant, grappling with the decision to have a child in difficult circumstances.', 'movies/13/poster/WjGiuVTQ3sEhPLezQ2CJP4pMSW9BvYkkUMQo5BEM.webp', 'movies/13/backdrop/EhcF1T98u3mCu94c34tpjXyl3cXewPEiSYtnL7qt.webp', 'https://youtu.be/S7dPzA9uYyc?si=2JK2spyWN8iOaw-K', 'published', '2026-02-01 01:32:28', '2026-02-01 01:48:35'),
(14, 'A Usefull Ghost', '2025', 130, 'NC-17', 'After dying from a respiratory disease, a mother\'s spirit possesses a vacuum cleaner to protect her husband when he begins showing the same symptoms.', 'movies/14/poster/cTJL52SoTVBxcd8Ap0vSbcdGJCkxmdbSJHM2iBrB.webp', 'movies/14/backdrop/g8JibIXVMP8wOKg4QZPYobPBIIDxvpG3Zhtf7EFg.webp', 'https://youtu.be/rh0aOKhssKU?si=oF7ue9511YhfklIX', 'published', '2026-02-01 01:46:33', '2026-02-01 01:48:26'),
(15, 'Sinners', '2025', 138, 'R', 'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.', 'movies/15/poster/lSQHQSyGvQVMW5wrnQOVI1O7R3CIEg7ueByJ38tP.webp', 'movies/15/backdrop/PJJn2sNJHNcsINP5HXSakLeiN7H1LEIi0hdGxwWz.webp', 'https://youtu.be/bKGxHflevuk?si=pJKjqEREd_Y4xXzJ', 'published', '2026-02-01 02:11:35', '2026-02-01 04:01:21'),
(16, 'The Secret Agent', '2025', 161, 'NC-17', 'Brazil, 1977. Marcelo, a technology expert in his early 40s, is on the run. Hoping to reunite with his son, he travels to Recife during Carnival but soon realizes that the city is not the safe haven he was expecting.', 'movies/16/poster/U2n1A2XdMgeogmj1y7qdHMn2LNbosnz8tS2t4ICR.webp', 'movies/16/backdrop/W9RuHcz4dYU3ksO5xFE87kUWQnro78cShVgMQmGg.webp', 'https://youtu.be/9UfrzDKrhEc?si=MXfVdhiuooocyw3R', 'published', '2026-02-01 02:14:58', '2026-02-03 17:25:09'),
(17, 'Para Perasuk', '2026', 119, 'Not Rated', 'In a town where pleasure equals being possessed by spiritual beings, Bayu aspires to be the shaman of a trance party so he can fundraise enough money to prevent an impending eviction.', 'movies/17/poster/nD2SYCIwfxdtxWBSFVac9X8FYS0CFi5ZKWyRTVnQ.webp', 'movies/17/backdrop/wwf8ERmpdgxMM1IDcLvaPKpV4krL6W7FFbPqdfTo.webp', 'https://youtu.be/tiIDmjCim3k?si=j_JZDP0ciz_D_kNm', 'published', '2026-02-01 04:10:03', '2026-02-01 11:44:49'),
(18, 'Monster Pabrik Rambut', '2026', NULL, 'Not Rated', 'Two sisters deal with the sudden death of their mother at a wig factory. One believes it was suicide while the other is certain it was a result of possession and takes a job at the factory to uncover the truth. Meanwhile, their brother - born with an eerie gift to regenerate his own body - catches the attention of a ghostly figure roaming the factory, searching for a vessel to inhabit.', 'movies/18/poster/EhNypxxHyEFZacRX9KpVkWUrgBjFyeAKzHOfkF3K.webp', 'movies/18/backdrop/OK7qKBusnxr3JELTDKVizCX3rVwB2sQBpgcCxMqo.jpg', 'https://youtu.be/DaI3BNtjk6Y?si=gkCqEKo9nuBEnhvG', 'published', '2026-02-01 04:21:07', '2026-02-01 11:44:49'),
(19, 'Alpha', '2025', 128, 'R', 'Alpha, a troubled 13-year-old lives with her single mom. Their world collapses the day she returns from school with a tattoo on her arm.', 'movies/19/poster/Fbznt5rvnUmJqE0qKGyCcb5kMeMdaU1X3PpTc4zY.webp', 'movies/19/backdrop/Vh5CePRfJ7lGYlfW7akA969vjb1caspE29IuGTuJ.webp', 'https://youtu.be/4Cc2A-YLARs?si=3QrxoPkBWLHLErn_', 'published', '2026-02-01 04:30:39', '2026-02-01 04:46:53'),
(20, 'Poor Things', '2023', 141, 'NC-17', 'Brought back to life by an unorthodox scientist, a young woman runs off with a lawyer on a whirlwind adventure across the continents. Free from the prejudices of her times, she grows steadfast in her purpose to stand for equality and liberation.', 'movies/20/poster/4YEx2aWuFh9snIfXwSlUa4bLHNm48M6c4m11bkRM.webp', 'movies/20/backdrop/75bZ6AHxuZgpFzYdLv4VzHDxbYSQssTh20zv0HMQ.webp', 'https://youtu.be/RlbR5N6veqw?si=oiitCSgASONY59N3', 'published', '2026-02-03 17:14:03', '2026-02-14 03:43:57'),
(21, 'My Therapist Said, I am Full of Sadness', '2024', 22, 'R', 'Monica scours archive material for answers to the question of how queer life in Berlin and the wish to be accepted by her Christian-Indonesian parents can be reconciled.', 'movies/21/poster/kt3CRvLrQtFl9mTZei9RdutKksGRLYho2rexrmj2.webp', 'movies/21/backdrop/UfjtEHvAUDkdlmlaTwEwnpNFhghXeUqbYtPuTtwd.webp', 'https://youtu.be/7SLivyKN0bs?si=WhA4fAt1Vlsu8unM', 'published', '2026-02-06 04:24:45', '2026-02-06 04:34:38'),
(22, 'Sammi, Who Can Detach His Body Parts', '2025', 19, NULL, 'Sammi has the ability to remove parts of his body and give them to those he loves and wants to help. After his death, Sammi’s mother goes in search of the pieces of her son.', 'movies/22/poster/30UsvBs7vqeNgJM7LcPSGYkFirTyPsf7aCiuRuO0.jpg', 'movies/22/backdrop/ZsI4A5LzJcEsAYcKvrYarsRer7SfTuq6lmzFFi2T.webp', 'https://youtu.be/03sTav1C6y0?si=TREzmLut1e_Q9Ivu', 'published', '2026-02-06 04:26:35', '2026-02-06 04:35:48'),
(23, 'The Love That Remains', '2025', 109, 'R', 'Tenderly captures a year in the life of a family as the parents navigate their separation. Through both playful and heartfelt moments, the film portrays the bittersweet essence of faded love and shared memories amidst the changing seasons.', 'movies/23/poster/DrP87pWyrUZBgfznaBHLroKqZDIsMnXs9ofgy9V8.webp', 'movies/23/backdrop/vTbi3LW7vmo2hGcKnWR4eNvdD15QUZIXSavF5Kt8.webp', 'https://youtu.be/jZ0fdmesr-w?si=lJO1fmyxLBaYkKZB', 'published', '2026-02-06 04:37:48', '2026-02-07 02:05:35'),
(24, 'Sound of Falling', '2025', 148, 'NC-17', 'Four adolescent girls each spend their youth in the same farmhouse over the last century. Though separated by decades, resonances between their lives emerge: their desires and distress, secrets and truths, encounters with another’s gaze and defiant gaze in return.', 'movies/24/poster/vMsNSkLA6mu5D5b0bNAoG7aOalbB3xr90quOcoIH.webp', 'movies/24/backdrop/RAL29SVvfa0YlZy6W70eR2UisPbSMtVE6DnSkJEN.webp', 'https://youtu.be/O-jgGbvLgVo?si=3WwrqgIYiQ7TjctK', 'published', '2026-02-06 04:44:33', '2026-02-06 04:53:26'),
(25, '2000 Meters to Andriivka', '2025', 108, 'PG-13', 'Amid the failing counteroffensive, a journalist follows a Ukrainian platoon on their mission to traverse one mile of heavily fortified forest and liberate a strategic village from Russian occupation. But the farther they advance through their destroyed homeland, the more they realize that this war may never end.', 'movies/25/poster/jRSgm2GRI5NC0gkyOg3TwN4i2TIgXufIF2RAu2e4.webp', 'movies/25/backdrop/RCDHk5ORYx2jhNjiZpEZ31oZhsxx8bjVgNQSLMVL.webp', 'https://youtu.be/xRSPxuptLd8?si=0I64QHlrBmWEv3Kn', 'published', '2026-02-06 04:49:54', '2026-02-06 04:53:19'),
(26, 'Die My Love', '2025', 119, 'NC-17', 'After inheriting a remote Montana house, Jackson moves there from New York with his partner Grace, and the couple soon welcome a child. As Jackson becomes increasingly absent and rural isolation sets in, Grace struggles with loneliness, creative frustration, and unresolved emotional wounds. What begins as an attempt at renewal gradually turns into an intense psychological descent, placing strain on their relationship and exposing the fragile balance between love, identity, and motherhood.', 'movies/26/poster/3nWTBsL85E6puz9teGu3AkDzTjx2QUZD83Ccq5e1.webp', 'movies/26/backdrop/kQvKAEPLX4ubRkCXJzNVABkDKj9x0hnWRKKxNH7g.webp', 'https://youtu.be/2jzXHW6Qe70?si=2UeziX7FgFAUBX4W', 'published', '2026-02-06 04:55:07', '2026-02-06 05:38:19'),
(27, 'No Other Choice', '2025', 139, 'R', 'Setelah dipecat dan dipermalukan oleh pasar kerja yang kejam, seorang manajer pabrik kertas veteran terjerumus ke dalam kekerasan dalam upaya putus asa untuk mendapatkan kembali martabatnya.', 'movies/27/poster/dpsNHS38E2Rdmf5py1UyQ1CjTAGBFUE0diXyXLUU.webp', 'movies/27/backdrop/rGzVUJS17UvBv7AHBRqbVjtY5WWdBAxwzF0hGad6.webp', 'https://youtu.be/HKZpuG_ezvY?si=0ZqNtP-269EBaAxu', 'published', '2026-02-06 05:01:21', '2026-02-15 03:29:39'),
(28, 'Your Name.', '2016', 106, 'G', 'High schoolers Mitsuha and Taki are complete strangers living separate lives. But one night, they suddenly switch places. Mitsuha wakes up in Taki’s body, and he in hers. This bizarre occurrence continues to happen randomly, and the two must adjust their lives around each other.', 'movies/28/poster/6ysHamTKUPGnR5u87iaGZuS2KS3iP3NKNXga6V9L.webp', 'movies/28/backdrop/NbTOiql5BChwEwB4zhjGXvxwWpDWnU0N8ToIdRpj.webp', 'https://youtu.be/xU47nhruN-Q?si=7PpOyW94Tx0L9hmB', 'published', '2026-02-07 01:48:11', '2026-02-07 02:04:42'),
(29, 'Ponyo', '2008', 100, 'G', 'When Sosuke, a young boy who lives on a clifftop overlooking the sea, rescues a stranded goldfish named Ponyo, he discovers more than he bargained for. Ponyo is a curious, energetic young creature who yearns to be human, but even as she causes chaos around the house, her father, a powerful sorcerer, schemes to return Ponyo to the sea.', 'movies/29/poster/B0QMbELlOTmq5uMN3Pai2qTWT4oXkn49DbuDDini.webp', 'movies/29/backdrop/BfeG9CBUqy0NQywmRViGM4lCMsnlQwKaR5upnDAM.webp', 'https://youtu.be/h6XP82TyFWw?si=zooozS-BdbJiFZC_', 'published', '2026-02-07 02:00:21', '2026-02-07 02:04:33'),
(30, 'Hamnet', '2025', 126, 'PG-13', 'The powerful story of love and loss that inspired the creation of Shakespeare\'s timeless masterpiece, Hamlet.', 'movies/30/poster/krUjfCdqoImYYS6FYaAw4X9oW3F1gJs5fPN6m2FU.webp', 'movies/30/backdrop/BcCXuv2Bbf6JT1he4wzbuaq5qr0MctMFGg6nlaGt.webp', 'https://youtu.be/xYcgQMxQwmk?si=wdQswysXXgi61e6L', 'published', '2026-02-07 02:50:18', '2026-02-07 02:55:39'),
(31, 'Marty Supreme', '2025', 150, 'R', 'Marty Mauser, a young man with a dream no one respects, goes to hell and back in pursuit of greatness.', 'movies/31/poster/7i8w1eBBicdFWL8Hr7Rb1U5c9Rq7zCMF4KVZ0e4b.webp', 'movies/31/backdrop/XIApNBZz0xgsqOK466QBIWiG648Oxsmt9nEYGKSM.webp', 'https://youtu.be/s9gSuKaKcqM?si=eVioWdw8Y1PAcMvN', 'published', '2026-02-07 02:53:09', '2026-02-07 02:55:27'),
(32, 'Empat Musim Pertiwi', '2026', NULL, NULL, 'Released from prison, a woman returns to her village and tries to face the four seasons of her past. The lack of welcome from the villagers, and even her family, leads her into a power that is hidden underneath the fog. Aiming to heal, a sexual assault survivor takes a journey to redefine her own meaning of home, family, and peace.', 'movies/32/poster/sfI4BqK2JF0PFbVxRSyjlOrZTHTTflS63hZ16MWD.webp', 'movies/32/backdrop/082ckOHMdnSOw49yhrIneepvnUp5c2uEAvXTnv33.webp', NULL, 'published', '2026-02-07 02:58:07', '2026-02-07 03:15:16'),
(33, 'Memoir of a Snail', '2024', 94, 'R', 'Life can only be understood backwards, but we have to live it forwards.\r\n\r\nForcibly separated from her twin brother when they are orphaned, a melancholic misfit learns how to find confidence within herself amid the clutter of misfortunes and everyday life.', 'movies/33/poster/J5owMINkJ3DonUXRwHI1HGjxuQsX6k4QRVsOLDlz.webp', 'movies/33/backdrop/aEQkBKlhO1OJePmQyzPxnu9sMW1nOyLsxw2HSEVb.webp', 'https://youtu.be/Ehc8cc7g31I?si=82r2CmF33HXveWeQ', 'published', '2026-02-07 04:28:03', '2026-02-14 03:45:33'),
(34, 'Sirāt', '2025', 115, 'PG-13', 'A man and his son arrive at a rave lost in the mountains of Morocco. They are looking for Marina, their daughter and sister, who disappeared months ago at another rave. Driven by fate, they decide to follow a group of ravers in search of one last party, in hopes Marina will be there.', 'movies/34/poster/JSGyu7yh2e361AgDYmiKsaektf0tulHoMP5dUt7t.webp', 'movies/34/backdrop/P6zjYdmEnbGl2zhJ4MKJgpznDVt2Vd6zAEvIx8aG.webp', 'https://youtu.be/ww-IXHXvS70?si=XbsNMgfstgIwknaG', 'published', '2026-02-10 17:29:02', '2026-02-14 03:44:37'),
(35, 'Oldboy', '2003', 120, 'NC-17', 'Oldboy bercerita tentang Oh Dae-su (Choi Min-sik) yang secara tiba-tiba diculik oleh sekelompok orang. Tanpa mengerti permasalahannya, Oh Dae-su kemudian dikurung di sebuah ruangan misterius. Di tengah-tengah masa kurungannya, melalui siaran berita di televisi, Oh Dae-su mendapati bahwa dirinya telah menjadi buronan karena dituduh membunuh istrinya sendiri. Dari sana kemudian ia bertekad untuk kabur dan membalas dendam kepada orang yang mengurungnya. 15 tahun berselang, tiba-tiba Oh Dae-su terbebas dari kurungannya. Ia tidak mengerti mengapa dirinya bisa keluar dari ruangan tersebut. Oh Dae-su kemudian memulai pencarian dan mencoba memecahkan misteri di balik penculikannya. Dalam upayanya tersebut, Oh Dae-su bertemu seorang pelayan restoran sushi yang bernama Mi Do (Kang Hye-jung).', 'movies/35/poster/KlBQcWzL6yGhPxWrCX2GH42lX1THzjLmRq7LCufN.webp', 'movies/35/backdrop/UhRzQarPn4u3fO0FMUyaahompOhn6xMvnVPyLRXz.webp', 'https://youtu.be/tAaBkFChaRg?si=nFXqf1y5MdI2aPjM', 'published', '2026-02-14 01:24:31', '2026-02-14 01:33:21'),
(36, 'Everything Everywhere All at Once', '2022', 140, 'R', 'Everything Everywhere All at Once menceritakan seorang warga Amerika keturunan China bernama Evelyn Wang. Ia dan suaminya menjalankan usaha laundry hingga akhirnya didatangi oleh agen IRS. Di tengah keterpurukan itu, Waymond mencoba menceraikan Evelyn.', 'movies/36/poster/hCV8BZxPwuJRTmcdKL1gfn46N7D8pvVsjgozh7TX.webp', 'movies/36/backdrop/T6go3lBAc7cRJyVAh64qCpC17sC4jW8iCSMTsWOE.webp', 'https://youtu.be/wxN1T1uxQ2g?si=JGWNYo1fZ7_07DRU', 'published', '2026-02-14 01:30:03', '2026-02-14 01:32:37'),
(37, 'A Separation', '2011', 123, 'PG-13', 'A married couple are faced with a difficult decision - to improve the life of their child by moving to another country or to stay in Iran and look after a deteriorating parent who has Alzheimer\'s disease.', 'movies/37/poster/euWz3zYnaVtdYkzYxc0fsEkGtbnjUZsBckl4swe3.webp', 'movies/37/backdrop/XIkaZyNfP3aJ06TIVwlNtzARlw7EdHy5iAlz32mi.webp', 'https://youtu.be/58Onuy5USTc?si=iSQL6CMaOatnHW7y', 'published', '2026-02-14 01:38:41', '2026-02-14 01:41:42'),
(38, 'Aftersun', '2022', 102, 'R', 'Sophie mengenang kegembiraan dan kepiluannya dari liburan yang dia lakukan bersama ayahnya dua puluh tahun sebelumnya. Kenangan nyata dan khayalan mengisi celah di antara rekaman miniDV saat dia mencoba mendamaikan ayah yang dia kenal dengan pria yang tidak dia kenal.', 'movies/38/poster/YO3NsOtfjoJLoUHgWy2dsxDoj6Sl24cyQ34h7Bjn.webp', 'movies/38/backdrop/NmhP1KECaVeNwMlV2TO9YXbLVROcY8JjxdPb3oRW.webp', NULL, 'published', '2026-02-14 04:19:16', '2026-02-14 04:21:02'),
(39, 'La La Land', '2016', 129, 'PG-13', 'Ketika Sebastian, seorang pianis, dan Mia, seorang aktris, mencoba untuk menggapai mimpi dan mencapai kesuksesan di bidang masing-masing, mereka terjebak dalam pilihan antara cinta dan karir.', 'movies/39/poster/32VPPqPrgpMvqInrFhpl4mR5wNe2gzyKhmWiOLdv.webp', 'movies/39/backdrop/yc94Tv9YEUlWLZ6hyJ3s953BiaI5grfSpqub0HsE.webp', 'https://youtu.be/0pdqf4P9MB8?si=0sF4hhYjMB0M5iJz', 'published', '2026-02-14 05:38:43', '2026-02-14 05:41:38'),
(40, 'Parasite', '2019', 133, 'R', 'Semua menganggur, keluarga Ki-taek memiliki minat khusus pada Taman kaya dan glamor untuk mata pencaharian mereka sampai mereka terjerat dalam insiden tak terduga.', 'movies/40/poster/SvSfwrfxD7hJAvBxzRtOpH0j4EhYtX85Rr06aLEO.webp', 'movies/40/backdrop/QxXVHoZs8uJideK5jAYcA1euj1t2eDimF7iVD8yj.webp', 'https://youtu.be/isOGD_7hNIY?si=3AXXub_f4PlJugz7', 'published', '2026-02-15 02:45:50', '2026-02-15 02:53:47'),
(41, 'The Seed of the Sacred Fig', '2024', 167, 'PG-13', 'Investigating judge Iman grapples with paranoia amid political unrest in Tehran. When his gun vanishes, he suspects his wife and daughters, imposing draconian measures that strain family ties as societal rules crumble.', 'movies/41/poster/WSd66avb0rUipB7BWCtVHysM5XhapwznCtIqqEhC.webp', 'movies/41/backdrop/IozpJYooh5NkPNJ9aBgtc8kxoYIfFTvATD9X8aJX.webp', 'https://youtu.be/nbKLGsf1Syg?si=lIlQVo7sBGlZ-fQf', 'published', '2026-02-15 02:51:41', '2026-02-15 02:53:37'),
(42, 'Anora', '2024', 139, 'NC-17', 'Seorang pekerja seks muda dari Brooklyn mendapatkan kesempatan di cerita Cinderella ketika dia bertemu dan secara impulsif menikahi putra seorang oligarki. Setelah berita mencapai Rusia, dongengnya terancam ketika orang tuanya berangkat untuk membuat pernikahan dibatalkan.', 'movies/42/poster/l5fk2wtNZXNW6UgWzMZIqzDeLyu86XPly4XnstFA.webp', 'movies/42/backdrop/EMSgOND1nz7oJidfmhZmpIW33IScghkrY1cjmNYu.webp', 'https://youtu.be/GuPkfvxmtdw?si=gYtldKVFp3d6BPCQ', 'published', '2026-02-15 03:05:16', '2026-02-15 03:40:49'),
(43, 'Portrait of a Lady on Fire', '2019', 121, 'NC-17', 'DON\'T REGRET. REMEMBER.\r\n\r\nOn an isolated island in Brittany at the end of the eighteenth century, a female painter is obliged to paint a wedding portrait of a young woman.', 'movies/43/poster/uYxlams4WAuuNZgMKzjPYmkqTH4EENrEwg47kcew.webp', 'movies/43/backdrop/k5NpxCa2lHXLFZRXOOiJgWjmaAjvY1TcD6Xw58tI.webp', 'https://youtu.be/R-fQPTwma9o?si=ETFBNdjeB9bSLB3y', 'published', '2026-02-24 18:12:14', '2026-02-24 18:15:36'),
(44, 'Call Me by Your Name', '2017', 132, 'NC-17', 'IS IT BETTER TO SPEAK OR DIE?\r\n\r\nIn the summer of 1983, a 17-year-old Elio spends his days in his family\'s villa in Italy. One day Oliver, a graduate student, arrives to assist Elio\'s father, a professor of Greco-Roman culture. Soon, Elio and Oliver discover a summer that will alter their lives forever.', 'movies/44/poster/B3ScRDIq9R8n0e2VYlwJzNlN7kblrbtQyOyL3HNc.webp', 'movies/44/backdrop/P8L14z6T3907ArTab2pxdE4IAMqjqUzh13LeMG4z.webp', 'https://youtu.be/Z9AYPxH5NTM?si=0nw-7Nb6TascWXN8', 'published', '2026-02-28 05:39:03', '2026-02-28 05:41:49'),
(45, 'Sorry, Baby', '2025', 104, 'R', 'WELCOME TO THE WORLD.\r\n\r\nAgnes feels stuck. Unlike her best friend, Lydie, who’s moved to New York and is now expecting a baby, Agnes still lives in the New England house they once shared as graduate students, now working as a professor at her alma mater. A ‘bad thing’ happened to Agnes a few years ago and, since then, despite her best efforts, life hasn’t gotten back on track.', 'movies/45/poster/ixkERvrumhCKAlISB7mZUU7efKAnTbJNC3M3qQVg.webp', 'movies/45/backdrop/hZMMgpkaT2kPmOSiUZxO2W1NmLU9dOUXK8zCAkLI.webp', 'https://youtu.be/Rc0jgWoZo9w?si=KJIEEg4va5cW_rf2', 'published', '2026-02-28 06:59:35', '2026-03-01 03:17:13'),
(46, 'Taste of Cherry', '1997', 99, 'G', 'A middle-aged Tehranian man, Mr. Badii is intent on killing himself and seeks someone to bury him after his demise. Driving around the city, the seemingly well-to-do Badii meets with numerous people, including a Muslim student, asking them to take on the job, but initially he has little luck. Eventually, Badii finds a man who is up for the task because he needs the money, but his new associate soon tries to talk him out of committing suicide.', 'movies/46/poster/Cl5nyTnVAe0YYv83H5w0AzuBeXXPVp0Nw5XRSMYR.webp', 'movies/46/backdrop/WB3VFln0ATVM1MI2PgbZ2bZKqMM1EBNF2QtpPg5Y.webp', 'https://youtu.be/ukmYdGwVqPg?si=BsH4EkNRZOqRL93C', 'published', '2026-03-01 03:22:09', '2026-03-01 03:25:02'),
(47, 'One Battle After Another', '2025', 162, 'R', 'SOME SEARCH FOR BATTLE, OTHERS ARE BORN INTO IT.\r\n\r\nBob revolusioner yang tercuci hidup dalam keadaan paranoia yang dirajam, bertahan hidup di luar jaringan dengan putrinya yang bersemangat dan mandiri, Willa. Ketika musuh bebuyutannya muncul kembali setelah 16 tahun dan dia hilang, mantan radikal berebut untuk menemukannya, ayah dan anak perempuan keduanya berjuang melawan konsekuensi dari masa lalunya.', 'movies/47/poster/n1eGXOYIksIUcbKgOAEKRixrqMkp6ueDOJNP4z8x.webp', 'movies/47/backdrop/PY14kRf8lJNkWghAyuVmE3ahPafRlfBlijnr70fw.webp', 'https://youtu.be/feOQFKv2Lw4?si=sUm7mFYTXDXynEY1', 'published', '2026-03-01 03:29:17', '2026-03-01 03:30:46');

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
(9, 4),
(10, 5),
(10, 6),
(10, 14),
(10, 15),
(11, 5),
(11, 16),
(12, 1),
(12, 5),
(12, 12),
(12, 15),
(12, 17),
(12, 18),
(13, 19),
(14, 19),
(15, 1),
(16, 5),
(16, 6),
(16, 20),
(17, 13),
(18, 13),
(19, 5),
(20, 1),
(20, 15),
(21, 1),
(21, 3),
(21, 13),
(22, 13),
(23, 5),
(23, 21),
(23, 22),
(24, 6),
(25, 1),
(25, 23),
(26, 1),
(27, 3),
(27, 5),
(28, 4),
(29, 4),
(30, 1),
(30, 15),
(31, 1),
(32, 6),
(32, 13),
(32, 14),
(33, 10),
(34, 5),
(34, 11),
(35, 3),
(36, 1),
(37, 5),
(37, 16),
(38, 1),
(38, 15),
(39, 1),
(40, 3),
(41, 5),
(41, 6),
(42, 1),
(43, 5),
(44, 1),
(44, 5),
(44, 12),
(44, 20),
(45, 1),
(45, 5),
(45, 11),
(46, 5),
(46, 16),
(47, 1);

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
(9, 7),
(10, 7),
(11, 5),
(11, 7),
(12, 7),
(13, 7),
(14, 4),
(14, 7),
(14, 8),
(15, 1),
(15, 7),
(15, 9),
(16, 5),
(16, 7),
(17, 7),
(18, 7),
(18, 9),
(19, 7),
(19, 9),
(19, 12),
(19, 13),
(20, 4),
(20, 7),
(20, 8),
(20, 11),
(21, 6),
(22, 9),
(23, 4),
(23, 7),
(24, 7),
(25, 6),
(25, 14),
(26, 7),
(27, 4),
(27, 5),
(27, 13),
(28, 3),
(28, 7),
(28, 11),
(29, 3),
(29, 8),
(29, 16),
(30, 7),
(30, 11),
(31, 7),
(32, 7),
(32, 15),
(33, 3),
(33, 4),
(33, 7),
(34, 7),
(34, 13),
(35, 1),
(35, 7),
(35, 10),
(35, 13),
(36, 1),
(36, 2),
(36, 4),
(36, 12),
(37, 7),
(38, 7),
(39, 4),
(39, 7),
(39, 11),
(40, 4),
(40, 7),
(40, 13),
(41, 5),
(41, 7),
(41, 13),
(42, 4),
(42, 7),
(42, 11),
(43, 7),
(43, 11),
(44, 7),
(44, 11),
(45, 4),
(45, 7),
(46, 7),
(47, 1),
(47, 4),
(47, 5),
(47, 13);

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
(9, 3),
(10, 1),
(10, 7),
(10, 14),
(11, 15),
(12, 11),
(13, 17),
(14, 17),
(15, 1),
(16, 1),
(16, 7),
(16, 9),
(17, 13),
(18, 13),
(19, 5),
(20, 1),
(20, 5),
(20, 9),
(21, 1),
(21, 13),
(22, 13),
(23, 1),
(23, 19),
(24, 7),
(25, 1),
(26, 1),
(27, 1),
(27, 2),
(28, 3),
(29, 3),
(30, 1),
(31, 1),
(32, 13),
(32, 20),
(33, 1),
(33, 5),
(34, 1),
(34, 5),
(34, 6),
(34, 11),
(35, 2),
(36, 1),
(36, 4),
(37, 15),
(38, 1),
(39, 1),
(40, 2),
(41, 15),
(42, 1),
(42, 12),
(43, 5),
(43, 8),
(44, 1),
(44, 5),
(44, 8),
(45, 1),
(46, 15),
(47, 1),
(47, 5),
(47, 6);

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

--
-- Dumping data untuk tabel `movie_likes`
--

INSERT INTO `movie_likes` (`id`, `user_id`, `film_id`, `created_at`) VALUES
(1, 3, 8, '2026-02-03 18:17:30'),
(3, 3, 2, '2026-02-03 18:22:41'),
(4, 3, 3, '2026-02-03 18:25:16'),
(5, 3, 7, '2026-02-03 18:39:59'),
(6, 3, 27, '2026-02-06 05:07:23'),
(7, 3, 24, '2026-02-06 05:57:04'),
(8, 3, 6, '2026-02-06 06:32:32'),
(9, 3, 15, '2026-02-06 07:04:55'),
(13, 3, 26, '2026-02-06 07:14:13'),
(14, 3, 16, '2026-02-06 07:23:43'),
(15, 3, 10, '2026-02-07 03:44:06'),
(16, 5, 37, '2026-02-14 04:00:06'),
(18, 5, 2, '2026-02-14 04:00:36'),
(19, 5, 34, '2026-02-24 18:16:37'),
(20, 5, 10, '2026-02-24 20:52:59'),
(21, 5, 14, '2026-02-28 04:46:56'),
(22, 5, 42, '2026-02-28 04:53:14'),
(23, 5, 30, '2026-02-28 04:53:39'),
(24, 5, 41, '2026-02-28 04:54:31');

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
(10, 5, 'poster', 'movies/5/poster/iXl1MJ57vGlRi2GvQFLgPYmsifXdgikhRepquaqC.webp', 0, '2026-01-31 04:30:24'),
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
(31, 7, 'backdrop', 'movies/7/backdrop/bEihWtI8KtjiePWfL1v6JsurnOWsmQPG4QkkgJjd.webp', 0, '2026-01-31 11:43:57'),
(32, 4, 'backdrop', 'movies/4/backdrop/YOxPILsulRaoXSimNuBz3lNpDkZ0fW51RhOPLGDA.webp', 0, '2026-02-01 07:44:40'),
(33, 4, 'backdrop', 'movies/4/backdrop/sytI9YDHeFuY2VNB1F8zPXZB5olcB2YikL9LyIKA.webp', 0, '2026-02-01 07:44:49'),
(34, 4, 'backdrop', 'movies/4/backdrop/DZc5GHtHaYLuLl4Ia0RJ046u3GwX1uTeHETeZMuT.webp', 0, '2026-02-01 07:44:55'),
(35, 4, 'backdrop', 'movies/4/backdrop/7Ih78WXWpDOAnlFVsGFT1tghpd7vObMHZ6xomFhz.webp', 0, '2026-02-01 07:45:01'),
(36, 4, 'backdrop', 'movies/4/backdrop/MN9CaO6yPUsohkp6OhZ7nviMrR88CpcYxmpLtU1y.webp', 0, '2026-02-01 07:45:12'),
(37, 10, 'poster', 'movies/10/poster/0WjHMZ4RSpw30YVH9Boi3WF7sSKRWAiQM6sCiPWL.webp', 1, '2026-02-01 08:03:33'),
(38, 10, 'backdrop', 'movies/10/backdrop/rMqzPyh7Af2WFdIXZ1QCvRHh5fTsZ3RGbQ7UnNPr.webp', 1, '2026-02-01 08:03:44'),
(39, 11, 'poster', 'movies/11/poster/eHmpYjkkzCHaHKyLjHqBTlyVJTVcFzYWBMb3CekT.webp', 1, '2026-02-01 08:13:35'),
(40, 11, 'backdrop', 'movies/11/backdrop/casiXSWhcY2FaCewF33ozxNEG140w36AqiAxrbRM.webp', 1, '2026-02-01 08:13:48'),
(41, 12, 'poster', 'movies/12/poster/WARIEsnc3Iegg3dYrivlQA9AsH6K05XtmoalB3jy.webp', 1, '2026-02-01 08:24:39'),
(42, 12, 'backdrop', 'movies/12/backdrop/y96DkRBguGbmad3k17I4CVojlH2FhAMU0jQ3nrMn.webp', 1, '2026-02-01 08:24:46'),
(43, 13, 'poster', 'movies/13/poster/WjGiuVTQ3sEhPLezQ2CJP4pMSW9BvYkkUMQo5BEM.webp', 1, '2026-02-01 08:38:45'),
(44, 13, 'backdrop', 'movies/13/backdrop/EhcF1T98u3mCu94c34tpjXyl3cXewPEiSYtnL7qt.webp', 1, '2026-02-01 08:38:56'),
(45, 14, 'poster', 'movies/14/poster/cTJL52SoTVBxcd8Ap0vSbcdGJCkxmdbSJHM2iBrB.webp', 1, '2026-02-01 08:47:59'),
(46, 14, 'backdrop', 'movies/14/backdrop/g8JibIXVMP8wOKg4QZPYobPBIIDxvpG3Zhtf7EFg.webp', 1, '2026-02-01 08:48:16'),
(47, 15, 'poster', 'movies/15/poster/lSQHQSyGvQVMW5wrnQOVI1O7R3CIEg7ueByJ38tP.webp', 1, '2026-02-01 09:12:46'),
(48, 15, 'backdrop', 'movies/15/backdrop/PJJn2sNJHNcsINP5HXSakLeiN7H1LEIi0hdGxwWz.webp', 1, '2026-02-01 09:12:57'),
(49, 16, 'poster', 'movies/16/poster/U2n1A2XdMgeogmj1y7qdHMn2LNbosnz8tS2t4ICR.webp', 1, '2026-02-01 09:18:58'),
(50, 16, 'backdrop', 'movies/16/backdrop/W9RuHcz4dYU3ksO5xFE87kUWQnro78cShVgMQmGg.webp', 1, '2026-02-01 09:19:10'),
(51, 17, 'poster', 'movies/17/poster/nD2SYCIwfxdtxWBSFVac9X8FYS0CFi5ZKWyRTVnQ.webp', 1, '2026-02-01 11:11:42'),
(52, 17, 'backdrop', 'movies/17/backdrop/wwf8ERmpdgxMM1IDcLvaPKpV4krL6W7FFbPqdfTo.webp', 1, '2026-02-01 11:11:54'),
(53, 18, 'poster', 'movies/18/poster/EhNypxxHyEFZacRX9KpVkWUrgBjFyeAKzHOfkF3K.webp', 1, '2026-02-01 11:21:37'),
(54, 18, 'backdrop', 'movies/18/backdrop/OK7qKBusnxr3JELTDKVizCX3rVwB2sQBpgcCxMqo.jpg', 1, '2026-02-01 11:21:49'),
(55, 19, 'poster', 'movies/19/poster/Fbznt5rvnUmJqE0qKGyCcb5kMeMdaU1X3PpTc4zY.webp', 1, '2026-02-01 11:31:22'),
(56, 19, 'backdrop', 'movies/19/backdrop/Vh5CePRfJ7lGYlfW7akA969vjb1caspE29IuGTuJ.webp', 1, '2026-02-01 11:31:34'),
(57, 20, 'poster', 'movies/20/poster/4YEx2aWuFh9snIfXwSlUa4bLHNm48M6c4m11bkRM.webp', 1, '2026-02-04 00:14:50'),
(58, 20, 'backdrop', 'movies/20/backdrop/75bZ6AHxuZgpFzYdLv4VzHDxbYSQssTh20zv0HMQ.webp', 1, '2026-02-04 00:15:24'),
(59, 2, 'backdrop', 'movies/2/backdrop/A9e9WFIUQhorN3OsCQaIhcqilKOKJkHgGf894dK4.webp', 0, '2026-02-04 04:36:40'),
(60, 2, 'backdrop', 'movies/2/backdrop/XW4wvlEKQSUkfrf4rdVSWBcewVeGiDvnrycwtH5Z.webp', 0, '2026-02-04 04:36:47'),
(61, 2, 'backdrop', 'movies/2/backdrop/VZGAGXoBzBZ0x7s6rBOg1QaTZI5Nd65Y8KmiuEuJ.webp', 0, '2026-02-04 04:36:59'),
(62, 2, 'backdrop', 'movies/2/backdrop/gpKApH31gfj3nGWRhS984MpTcbX2THvc1bRrJWZW.webp', 0, '2026-02-04 04:37:06'),
(63, 2, 'backdrop', 'movies/2/backdrop/7wUpBlA0CsQ72ExCFI6BVSAnEOB1UlJaNGb8VA37.webp', 0, '2026-02-04 04:37:12'),
(64, 5, 'backdrop', 'movies/5/backdrop/R7PuDAOcweu9QvtNAn7uuktYNWjgtTmQkbaGsz24.webp', 0, '2026-02-04 06:24:32'),
(65, 22, 'poster', 'movies/22/poster/30UsvBs7vqeNgJM7LcPSGYkFirTyPsf7aCiuRuO0.jpg', 1, '2026-02-06 11:29:48'),
(66, 22, 'backdrop', 'movies/22/backdrop/ZsI4A5LzJcEsAYcKvrYarsRer7SfTuq6lmzFFi2T.webp', 1, '2026-02-06 11:30:23'),
(67, 21, 'poster', 'movies/21/poster/kt3CRvLrQtFl9mTZei9RdutKksGRLYho2rexrmj2.webp', 1, '2026-02-06 11:32:16'),
(68, 21, 'backdrop', 'movies/21/backdrop/UfjtEHvAUDkdlmlaTwEwnpNFhghXeUqbYtPuTtwd.webp', 1, '2026-02-06 11:32:28'),
(69, 23, 'poster', 'movies/23/poster/DrP87pWyrUZBgfznaBHLroKqZDIsMnXs9ofgy9V8.webp', 1, '2026-02-06 11:41:13'),
(70, 23, 'backdrop', 'movies/23/backdrop/vTbi3LW7vmo2hGcKnWR4eNvdD15QUZIXSavF5Kt8.webp', 1, '2026-02-06 11:41:26'),
(71, 24, 'poster', 'movies/24/poster/vMsNSkLA6mu5D5b0bNAoG7aOalbB3xr90quOcoIH.webp', 1, '2026-02-06 11:47:16'),
(72, 24, 'backdrop', 'movies/24/backdrop/RAL29SVvfa0YlZy6W70eR2UisPbSMtVE6DnSkJEN.webp', 1, '2026-02-06 11:48:19'),
(73, 25, 'poster', 'movies/25/poster/jRSgm2GRI5NC0gkyOg3TwN4i2TIgXufIF2RAu2e4.webp', 1, '2026-02-06 11:52:17'),
(74, 25, 'backdrop', 'movies/25/backdrop/RCDHk5ORYx2jhNjiZpEZ31oZhsxx8bjVgNQSLMVL.webp', 1, '2026-02-06 11:52:30'),
(75, 26, 'poster', 'movies/26/poster/3nWTBsL85E6puz9teGu3AkDzTjx2QUZD83Ccq5e1.webp', 1, '2026-02-06 11:57:48'),
(76, 26, 'backdrop', 'movies/26/backdrop/kQvKAEPLX4ubRkCXJzNVABkDKj9x0hnWRKKxNH7g.webp', 1, '2026-02-06 11:58:48'),
(77, 27, 'poster', 'movies/27/poster/dpsNHS38E2Rdmf5py1UyQ1CjTAGBFUE0diXyXLUU.webp', 1, '2026-02-06 12:04:55'),
(78, 27, 'backdrop', 'movies/27/backdrop/ofuU8scBdFLhCWTN8DlR3KPhH4tUrE3oiCZaEqnb.webp', 0, '2026-02-06 12:06:15'),
(79, 5, 'backdrop', 'movies/5/backdrop/E6EfABatcspRdUdtqz76cZ68HvrR0nETtaWpLInv.webp', 0, '2026-02-06 14:22:31'),
(80, 5, 'backdrop', 'movies/5/backdrop/SOVrGZN8Cw58AepzvBDFS9IQKkIVgRfw7gL7BTZZ.webp', 0, '2026-02-06 14:22:38'),
(81, 5, 'backdrop', 'movies/5/backdrop/DTepXieM1EH6FtgWOrnH54gzoMHLeqHoE7sk0fwZ.webp', 0, '2026-02-06 14:22:44'),
(82, 5, 'backdrop', 'movies/5/backdrop/Xndd8ZeQ32bbGr6MhEM2hnzfJEDQlm7DbBL9vF3b.webp', 0, '2026-02-06 14:22:49'),
(83, 5, 'backdrop', 'movies/5/backdrop/Zt2zHD4hyWCqqO2b2uST7LiggWPpJaWod45oxeXv.webp', 0, '2026-02-06 14:22:54'),
(84, 28, 'poster', 'movies/28/poster/6ysHamTKUPGnR5u87iaGZuS2KS3iP3NKNXga6V9L.webp', 1, '2026-02-07 08:52:26'),
(85, 28, 'backdrop', 'movies/28/backdrop/NbTOiql5BChwEwB4zhjGXvxwWpDWnU0N8ToIdRpj.webp', 1, '2026-02-07 08:52:39'),
(86, 29, 'poster', 'movies/29/poster/B0QMbELlOTmq5uMN3Pai2qTWT4oXkn49DbuDDini.webp', 1, '2026-02-07 09:04:11'),
(87, 29, 'backdrop', 'movies/29/backdrop/BfeG9CBUqy0NQywmRViGM4lCMsnlQwKaR5upnDAM.webp', 1, '2026-02-07 09:04:18'),
(88, 30, 'poster', 'movies/30/poster/krUjfCdqoImYYS6FYaAw4X9oW3F1gJs5fPN6m2FU.webp', 1, '2026-02-07 09:50:48'),
(89, 30, 'backdrop', 'movies/30/backdrop/BcCXuv2Bbf6JT1he4wzbuaq5qr0MctMFGg6nlaGt.webp', 1, '2026-02-07 09:51:05'),
(90, 31, 'poster', 'movies/31/poster/7i8w1eBBicdFWL8Hr7Rb1U5c9Rq7zCMF4KVZ0e4b.webp', 1, '2026-02-07 09:55:01'),
(91, 31, 'backdrop', 'movies/31/backdrop/XIApNBZz0xgsqOK466QBIWiG648Oxsmt9nEYGKSM.webp', 1, '2026-02-07 09:55:12'),
(92, 32, 'poster', 'movies/32/poster/sfI4BqK2JF0PFbVxRSyjlOrZTHTTflS63hZ16MWD.webp', 1, '2026-02-07 10:01:07'),
(93, 32, 'backdrop', 'movies/32/backdrop/082ckOHMdnSOw49yhrIneepvnUp5c2uEAvXTnv33.webp', 1, '2026-02-07 10:10:31'),
(94, 33, 'poster', 'movies/33/poster/J5owMINkJ3DonUXRwHI1HGjxuQsX6k4QRVsOLDlz.webp', 1, '2026-02-07 11:29:28'),
(95, 33, 'backdrop', 'movies/33/backdrop/aEQkBKlhO1OJePmQyzPxnu9sMW1nOyLsxw2HSEVb.webp', 1, '2026-02-07 11:29:41'),
(96, 34, 'poster', 'movies/34/poster/JSGyu7yh2e361AgDYmiKsaektf0tulHoMP5dUt7t.webp', 1, '2026-02-11 00:30:35'),
(97, 34, 'backdrop', 'movies/34/backdrop/P6zjYdmEnbGl2zhJ4MKJgpznDVt2Vd6zAEvIx8aG.webp', 1, '2026-02-11 00:30:48'),
(98, 35, 'poster', 'movies/35/poster/KlBQcWzL6yGhPxWrCX2GH42lX1THzjLmRq7LCufN.webp', 1, '2026-02-14 08:25:49'),
(99, 35, 'backdrop', 'movies/35/backdrop/UhRzQarPn4u3fO0FMUyaahompOhn6xMvnVPyLRXz.webp', 1, '2026-02-14 08:26:00'),
(100, 36, 'poster', 'movies/36/poster/hCV8BZxPwuJRTmcdKL1gfn46N7D8pvVsjgozh7TX.webp', 1, '2026-02-14 08:31:43'),
(101, 36, 'backdrop', 'movies/36/backdrop/T6go3lBAc7cRJyVAh64qCpC17sC4jW8iCSMTsWOE.webp', 1, '2026-02-14 08:31:53'),
(102, 37, 'poster', 'movies/37/poster/euWz3zYnaVtdYkzYxc0fsEkGtbnjUZsBckl4swe3.webp', 1, '2026-02-14 08:41:19'),
(103, 37, 'backdrop', 'movies/37/backdrop/XIkaZyNfP3aJ06TIVwlNtzARlw7EdHy5iAlz32mi.webp', 1, '2026-02-14 08:41:30'),
(104, 20, 'backdrop', 'movies/20/backdrop/D2PfeKH26MZz1EpZEhTfhWMFWRaJ1r1fAspXNzvo.webp', 0, '2026-02-14 11:05:35'),
(105, 20, 'backdrop', 'movies/20/backdrop/vOW8epajt2p3MzCvvICIlAr12TDiAjnhk88IrMWl.webp', 0, '2026-02-14 11:05:40'),
(106, 20, 'backdrop', 'movies/20/backdrop/GS441NHrTeQlqluMteSiCXwZZNKwMe0Q5uepXY3E.webp', 0, '2026-02-14 11:05:46'),
(107, 20, 'backdrop', 'movies/20/backdrop/CbRy79xPN5S0icdrAt53VrX8LuSvKBDSDKZueN89.webp', 0, '2026-02-14 11:05:51'),
(108, 38, 'poster', 'movies/38/poster/YO3NsOtfjoJLoUHgWy2dsxDoj6Sl24cyQ34h7Bjn.webp', 1, '2026-02-14 11:20:35'),
(109, 38, 'backdrop', 'movies/38/backdrop/NmhP1KECaVeNwMlV2TO9YXbLVROcY8JjxdPb3oRW.webp', 1, '2026-02-14 11:20:46'),
(110, 39, 'poster', 'movies/39/poster/32VPPqPrgpMvqInrFhpl4mR5wNe2gzyKhmWiOLdv.webp', 1, '2026-02-14 12:41:19'),
(111, 39, 'backdrop', 'movies/39/backdrop/yc94Tv9YEUlWLZ6hyJ3s953BiaI5grfSpqub0HsE.webp', 1, '2026-02-14 12:41:29'),
(112, 40, 'poster', 'movies/40/poster/SvSfwrfxD7hJAvBxzRtOpH0j4EhYtX85Rr06aLEO.webp', 1, '2026-02-15 09:47:30'),
(113, 40, 'backdrop', 'movies/40/backdrop/QxXVHoZs8uJideK5jAYcA1euj1t2eDimF7iVD8yj.webp', 1, '2026-02-15 09:47:40'),
(114, 41, 'poster', 'movies/41/poster/WSd66avb0rUipB7BWCtVHysM5XhapwznCtIqqEhC.webp', 1, '2026-02-15 09:53:05'),
(115, 41, 'backdrop', 'movies/41/backdrop/IozpJYooh5NkPNJ9aBgtc8kxoYIfFTvATD9X8aJX.webp', 1, '2026-02-15 09:53:24'),
(116, 42, 'poster', 'movies/42/poster/l5fk2wtNZXNW6UgWzMZIqzDeLyu86XPly4XnstFA.webp', 1, '2026-02-15 10:07:01'),
(117, 42, 'backdrop', 'movies/42/backdrop/EMSgOND1nz7oJidfmhZmpIW33IScghkrY1cjmNYu.webp', 1, '2026-02-15 10:07:12'),
(118, 27, 'backdrop', 'movies/27/backdrop/rGzVUJS17UvBv7AHBRqbVjtY5WWdBAxwzF0hGad6.webp', 1, '2026-02-15 10:29:33'),
(119, 27, 'backdrop', 'movies/27/backdrop/pWhR7f8dCrOoe87QNnMlQtkKikNBiLcecOSpj4Ol.webp', 0, '2026-02-15 10:29:45'),
(120, 27, 'backdrop', 'movies/27/backdrop/Oq9zDpqDftGPjNdLcKFKm6H2L5neQM204Zys7LJ5.webp', 0, '2026-02-15 10:29:50'),
(121, 27, 'backdrop', 'movies/27/backdrop/r2PZZB9g4wtcNTPoiTyemgd41sh9K244GUCNX56y.webp', 0, '2026-02-15 10:29:58'),
(122, 27, 'backdrop', 'movies/27/backdrop/XzAFOM5VYCPl3S7L4gTzYfwVYkrE7StQUbNPs30F.webp', 0, '2026-02-15 10:30:07'),
(123, 27, 'backdrop', 'movies/27/backdrop/blNsFZEMN6nzurVhvVTZtqo4PmiaQ1rT9BopaV1T.webp', 0, '2026-02-15 10:30:16'),
(124, 27, 'backdrop', 'movies/27/backdrop/C8UrWOwRpuhwTsuwSuwUa5EUyzOJG6KcqP6Ahz9e.webp', 0, '2026-02-15 10:30:25'),
(125, 27, 'backdrop', 'movies/27/backdrop/eSjfoH4ZasRujj9PsmPtxFFn1waxRkmN5JRahw3e.webp', 0, '2026-02-15 10:35:09'),
(126, 10, 'backdrop', 'movies/10/backdrop/nN8L1vwL664haKikcvt2NnUo5ymerMD5xSrid937.webp', 0, '2026-02-15 12:07:22'),
(127, 10, 'backdrop', 'movies/10/backdrop/bPo4WeQAvje5gKC9qZ5p2VhwscXJlu69E7Oi54uU.webp', 0, '2026-02-15 12:07:56'),
(128, 10, 'backdrop', 'movies/10/backdrop/TP4rZGyu1zErQa9JJkmKY4sQPw6qwoPO1eBUBzsi.webp', 0, '2026-02-15 12:08:10'),
(129, 43, 'poster', 'movies/43/poster/uYxlams4WAuuNZgMKzjPYmkqTH4EENrEwg47kcew.webp', 1, '2026-02-25 01:15:03'),
(130, 43, 'backdrop', 'movies/43/backdrop/k5NpxCa2lHXLFZRXOOiJgWjmaAjvY1TcD6Xw58tI.webp', 1, '2026-02-25 01:15:17'),
(131, 43, 'backdrop', 'movies/43/backdrop/1tkE8W7skWE1agMgbV9dUvIoNOks019sEyRZ70Y1.webp', 0, '2026-02-25 03:28:53'),
(132, 30, 'backdrop', 'movies/30/backdrop/WcvLzELjaCn7l5vXy52iqwdXPfW3hSq4zqFiLKn7.webp', 0, '2026-02-25 03:32:50'),
(133, 30, 'backdrop', 'movies/30/backdrop/Qz3OzImArUT2ouHC746OeaMv2CKFF1GIwV4muUVj.webp', 0, '2026-02-25 03:32:55'),
(134, 30, 'backdrop', 'movies/30/backdrop/18MgPasmVhGN6jRM4yqxyJC9AMFRgELdX3uI3o9f.webp', 0, '2026-02-25 03:33:00'),
(135, 30, 'backdrop', 'movies/30/backdrop/0wGPYPHTVirlfxklQ9dxyXZ4xHvjI9DiWbt3mMi8.webp', 0, '2026-02-25 03:33:26'),
(136, 5, 'poster', 'movies/5/poster/yhKBpNYCQLXQAKJG3xD3Qu7o49EtGYpBzgM3ux4C.webp', 1, '2026-02-28 11:43:35'),
(137, 44, 'poster', 'movies/44/poster/B3ScRDIq9R8n0e2VYlwJzNlN7kblrbtQyOyL3HNc.webp', 1, '2026-02-28 12:41:23'),
(138, 44, 'backdrop', 'movies/44/backdrop/P8L14z6T3907ArTab2pxdE4IAMqjqUzh13LeMG4z.webp', 1, '2026-02-28 12:41:33'),
(139, 45, 'poster', 'movies/45/poster/ixkERvrumhCKAlISB7mZUU7efKAnTbJNC3M3qQVg.webp', 1, '2026-02-28 14:01:04'),
(140, 45, 'backdrop', 'movies/45/backdrop/hZMMgpkaT2kPmOSiUZxO2W1NmLU9dOUXK8zCAkLI.webp', 1, '2026-02-28 14:01:16'),
(141, 46, 'poster', 'movies/46/poster/Cl5nyTnVAe0YYv83H5w0AzuBeXXPVp0Nw5XRSMYR.webp', 1, '2026-03-01 10:24:38'),
(142, 46, 'backdrop', 'movies/46/backdrop/WB3VFln0ATVM1MI2PgbZ2bZKqMM1EBNF2QtpPg5Y.webp', 1, '2026-03-01 10:24:51'),
(143, 47, 'poster', 'movies/47/poster/n1eGXOYIksIUcbKgOAEKRixrqMkp6ueDOJNP4z8x.webp', 1, '2026-03-01 10:30:26'),
(144, 47, 'backdrop', 'movies/47/backdrop/PY14kRf8lJNkWghAyuVmE3ahPafRlfBlijnr70fw.webp', 1, '2026-03-01 10:30:35');

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
(13, 4, 13, 'crew', NULL, 'Director', 0),
(14, 4, 10, 'cast', 'Nora', NULL, 0),
(15, 4, 11, 'cast', 'Hae Sung', NULL, 1),
(16, 4, 13, 'crew', NULL, 'Screenplay', 0),
(17, 5, 16, 'crew', NULL, 'Director', 0),
(18, 5, 16, 'crew', NULL, 'Screenplay', 0),
(19, 4, 18, 'cast', 'Arthur', NULL, 4),
(20, 5, 19, 'cast', 'Deliriant / Qiu Moyun / Mongrel / Jia Shengjun / Apollo', NULL, 2),
(21, 5, 20, 'cast', 'The Great Other / Mother / Voiceover', NULL, 3),
(22, 5, 21, 'cast', 'Tai Zhaomei', NULL, 4),
(23, 6, 22, 'cast', 'Sore', NULL, 0),
(24, 6, 23, 'cast', 'Jonathan', NULL, 1),
(25, 6, 24, 'crew', NULL, 'Director', 2),
(26, 6, 24, 'crew', NULL, 'Writer', 3),
(27, 7, 25, 'cast', 'Bagus', NULL, 0),
(28, 7, 26, 'cast', 'Hana', NULL, 1),
(29, 7, 27, 'cast', 'Yoram', NULL, 2),
(30, 7, 22, 'cast', 'Celine', NULL, 3),
(31, 7, 23, 'cast', 'Dion Wiyoko', NULL, 4),
(32, 7, 24, 'crew', NULL, 'Director', 5),
(33, 7, 24, 'crew', NULL, 'Writer', 6),
(34, 10, 29, 'cast', 'Nora Borg', NULL, 0),
(35, 10, 30, 'cast', 'Gustav Borg', NULL, 1),
(36, 10, 31, 'cast', 'Agnes Borg Pettersen', NULL, 2),
(37, 10, 32, 'cast', 'Rachel Kemp', NULL, 3),
(39, 10, 28, 'crew', NULL, 'Director', 4),
(40, 10, 28, 'crew', NULL, 'Writer', 5),
(41, 20, 33, 'cast', 'Bella Baxter', NULL, 0),
(42, 20, 34, 'cast', 'Duncan Wedderburn', NULL, 1),
(43, 20, 35, 'cast', 'Godwin Baxter', NULL, 2),
(44, 20, 36, 'cast', 'Max McCandles', NULL, 3),
(45, 20, 37, 'crew', NULL, 'Director', 4),
(46, 20, 38, 'crew', NULL, 'Writer', 5),
(47, 39, 33, 'cast', 'Mia', NULL, 0),
(48, 39, 40, 'cast', 'Sebastian', NULL, 1),
(49, 39, 41, 'crew', NULL, 'Director', 2),
(50, 39, 41, 'crew', NULL, 'Writer', 3),
(51, 8, 42, 'cast', 'Catherine Earnshaw', NULL, 0),
(52, 8, 43, 'cast', 'Heathcliff', NULL, 1),
(53, 8, 44, 'crew', NULL, 'Director', 2),
(55, 8, 44, 'crew', NULL, 'Writer', 3),
(56, 9, 45, 'cast', 'Kikuo Tachibana', NULL, 0),
(57, 9, 46, 'cast', 'Shunsuke Ogaki', NULL, 1),
(58, 9, 47, 'cast', 'Kikuo (young)', NULL, 2),
(59, 9, 48, 'cast', 'Shunsuke (young)', NULL, 3),
(61, 9, 49, 'crew', NULL, 'Director', 4),
(63, 9, 50, 'crew', NULL, 'Writer', 5),
(64, 27, 51, 'cast', 'Yoo Man-su', NULL, 0),
(65, 27, 52, 'cast', 'Lee Mi-ri', NULL, 1),
(66, 27, 53, 'cast', 'Choi Seon-chul', NULL, 2),
(67, 27, 54, 'cast', 'Gu Bum-mo', NULL, 3),
(68, 27, 55, 'cast', 'Lee A-ra', NULL, 4),
(69, 27, 4, 'crew', NULL, 'Director', 5),
(70, 27, 4, 'crew', NULL, 'Writer', 6),
(71, 27, 56, 'crew', NULL, 'Writer', 7),
(72, 27, 57, 'crew', NULL, 'Writer', 8),
(73, 27, 58, 'crew', NULL, 'Writer', 9),
(74, 11, 60, 'cast', 'Vahid', NULL, 0),
(75, 11, 61, 'cast', 'Shiva', NULL, 1),
(76, 11, 64, 'cast', 'Eghbal', NULL, 2),
(77, 11, 62, 'cast', 'Golrokh', NULL, 3),
(78, 11, 63, 'cast', 'Ali', NULL, 4),
(79, 11, 65, 'cast', 'Hamid', NULL, 5),
(80, 11, 59, 'crew', NULL, 'Director', 6),
(81, 11, 59, 'crew', NULL, 'Writer', 7),
(82, 30, 67, 'cast', 'Agnes', NULL, 0),
(83, 30, 68, 'cast', 'Will', NULL, 1),
(84, 30, 71, 'cast', 'Mary', NULL, 2),
(85, 30, 70, 'cast', 'Bartholomew', NULL, 3),
(86, 30, 69, 'cast', 'Hamnet', NULL, 4),
(87, 30, 66, 'crew', NULL, 'Director', 5),
(88, 30, 66, 'crew', NULL, 'Writer', 6),
(89, 31, 73, 'cast', 'Marty Mauser', NULL, 0),
(90, 31, 74, 'cast', 'Rachel Mizler', NULL, 1),
(91, 31, 72, 'crew', NULL, 'Director', 2),
(92, 31, 72, 'crew', NULL, 'Writer', 3),
(93, 45, 75, 'cast', 'Agnes', NULL, 0),
(94, 45, 76, 'cast', 'Lydie', NULL, 1),
(95, 45, 75, 'crew', NULL, 'Director', 2),
(96, 45, 75, 'crew', NULL, 'Writer', 3);

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
(5, 18),
(6, 13),
(7, 13),
(8, 1),
(9, 14),
(9, 15),
(10, 16),
(10, 17),
(10, 18),
(10, 19),
(11, 16),
(11, 18),
(12, 20),
(13, 21),
(14, 21),
(15, 1),
(15, 11),
(16, 16),
(16, 18),
(17, 22),
(18, 23),
(19, 16),
(20, 24),
(21, 26),
(22, 25),
(22, 26),
(23, 12),
(23, 18),
(24, 27),
(24, 28),
(25, 29),
(26, 30),
(26, 31),
(27, 5),
(27, 9),
(27, 16),
(28, 14),
(28, 33),
(29, 14),
(29, 34),
(30, 24),
(31, 4),
(32, 35),
(32, 36),
(32, 37),
(32, 38),
(32, 39),
(33, 40),
(34, 16),
(35, 16),
(36, 4),
(37, 41),
(37, 42),
(38, 43),
(38, 44),
(39, 45),
(39, 46),
(40, 5),
(40, 16),
(40, 20),
(40, 47),
(41, 16),
(41, 18),
(42, 16),
(42, 48),
(42, 49),
(43, 16),
(43, 18),
(43, 20),
(43, 50),
(44, 51),
(44, 52),
(45, 4),
(46, 12),
(46, 53),
(46, 54),
(47, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `movie_services`
--

CREATE TABLE `movie_services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `movie_id` bigint(20) UNSIGNED NOT NULL,
  `service_id` bigint(20) UNSIGNED NOT NULL,
  `availability_type` enum('stream','rent','buy') DEFAULT 'stream',
  `release_date` date DEFAULT NULL COMMENT 'Release date for theatrical or streaming',
  `is_coming_soon` tinyint(1) DEFAULT 0 COMMENT 'Whether this service is marked as coming soon'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `movie_services`
--

INSERT INTO `movie_services` (`id`, `movie_id`, `service_id`, `availability_type`, `release_date`, `is_coming_soon`) VALUES
(20, 6, 1, 'stream', NULL, 0),
(23, 7, 1, 'stream', NULL, 0),
(30, 8, 9, 'stream', '2026-02-11', 0),
(31, 8, 10, 'stream', '2026-02-11', 0),
(32, 8, 12, 'stream', '2026-02-11', 0),
(38, 10, 11, 'rent', '2026-02-24', 0),
(41, 11, 11, 'rent', NULL, 0),
(54, 1, 11, 'stream', NULL, 1),
(58, 3, 11, 'rent', NULL, 0),
(64, 15, 4, 'stream', NULL, 0),
(92, 19, 11, 'stream', NULL, 0),
(93, 18, 9, 'stream', NULL, 1),
(94, 18, 10, 'stream', NULL, 1),
(95, 18, 12, 'stream', NULL, 1),
(99, 16, 10, 'stream', NULL, 0),
(100, 16, 11, 'stream', NULL, 0),
(101, 13, 10, 'stream', '2026-02-06', 0),
(102, 13, 11, 'stream', NULL, 1),
(103, 13, 12, 'stream', '2026-02-07', 0),
(112, 21, 1, 'stream', NULL, 0),
(114, 22, 1, 'stream', NULL, 0),
(125, 25, 11, 'stream', NULL, 0),
(126, 24, 11, 'stream', NULL, 0),
(128, 26, 11, 'stream', NULL, 0),
(132, 17, 9, 'stream', '2026-04-23', 0),
(133, 17, 10, 'stream', '2026-04-23', 0),
(134, 17, 12, 'stream', '2026-04-23', 0),
(139, 29, 1, 'stream', NULL, 0),
(141, 23, 11, 'stream', NULL, 0),
(142, 28, 5, 'rent', NULL, 0),
(143, 28, 5, 'buy', NULL, 0),
(159, 32, 9, 'stream', NULL, 1),
(160, 32, 10, 'stream', NULL, 1),
(161, 32, 12, 'stream', NULL, 1),
(166, 12, 11, 'rent', '2026-03-26', 0),
(171, 35, 11, 'stream', NULL, 0),
(172, 36, 5, 'rent', NULL, 0),
(173, 36, 5, 'buy', NULL, 0),
(176, 37, 11, 'stream', NULL, 0),
(177, 34, 11, 'stream', NULL, 0),
(178, 33, 11, 'stream', NULL, 0),
(180, 38, 11, 'stream', NULL, 0),
(182, 39, 1, 'stream', NULL, 0),
(183, 41, 11, 'stream', NULL, 0),
(186, 42, 4, 'stream', NULL, 0),
(187, 5, 11, 'stream', NULL, 0),
(188, 30, 9, 'stream', NULL, 0),
(189, 30, 10, 'stream', NULL, 0),
(190, 30, 12, 'stream', NULL, 0),
(191, 14, 11, 'rent', NULL, 0),
(192, 31, 9, 'stream', NULL, 0),
(193, 31, 10, 'stream', NULL, 0),
(194, 31, 12, 'stream', NULL, 0),
(198, 9, 9, 'stream', NULL, 0),
(199, 9, 10, 'stream', NULL, 0),
(200, 9, 12, 'stream', NULL, 0),
(203, 44, 1, 'stream', NULL, 0),
(210, 45, 11, 'stream', NULL, 0),
(212, 46, 11, 'stream', NULL, 0),
(213, 47, 4, 'stream', NULL, 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `actor_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL COMMENT 'follow, like_review, comment_review, reply_comment',
  `film_id` bigint(20) UNSIGNED DEFAULT NULL,
  `related_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'review_id or comment_id',
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `actor_id`, `type`, `film_id`, `related_id`, `message`, `is_read`, `created_at`, `updated_at`) VALUES
(1, 5, 3, 'follow', NULL, NULL, 'Sengefilm followed you', 1, '2026-02-24 22:19:47', '2026-02-24 22:19:47'),
(2, 5, 3, 'like_review', 10, 20, 'Sengefilm liked your ★★★★★ review of Sentimental Value', 1, '2026-02-24 22:19:53', '2026-02-24 22:19:53'),
(3, 5, 3, 'reply_comment', 10, 15, 'Sengefilm replied to your comment on Sentimental Value', 1, '2026-02-24 22:20:09', '2026-02-24 22:20:09'),
(4, 3, 5, 'follow', NULL, NULL, 'Mafia film followed you', 1, '2026-02-24 22:29:34', '2026-02-24 22:29:34'),
(5, 3, 5, 'like_review', 10, 11, 'Mafia film liked your ★★★★★ review of Sentimental Value', 1, '2026-02-24 22:30:23', '2026-02-24 22:30:23'),
(6, 3, 5, 'reply_comment', 10, 16, 'Mafia film replied to your comment on Sentimental Value', 1, '2026-02-24 22:30:49', '2026-02-24 22:30:49'),
(7, 3, 5, 'comment_review', 10, 17, 'Mafia film commented on your review of Sentimental Value', 1, '2026-02-24 22:31:06', '2026-02-24 22:31:06'),
(8, 5, 3, 'like_review', 34, 19, 'Sengefilm liked your ★★★★ review of Sirāt', 1, '2026-02-24 23:17:25', '2026-02-24 23:17:25'),
(9, 5, 3, 'comment_review', 34, 18, 'Sengefilm commented on your review of Sirāt', 1, '2026-02-24 23:17:37', '2026-02-24 23:17:37'),
(10, 3, 6, 'follow', NULL, NULL, 'Mopud followed you', 0, '2026-02-28 03:10:44', '2026-02-28 03:10:44'),
(11, 5, 6, 'follow', NULL, NULL, 'Mopud followed you', 1, '2026-02-28 03:11:08', '2026-02-28 03:11:08'),
(12, 6, 5, 'follow', NULL, NULL, 'Mafia film followed you', 0, '2026-02-28 03:12:04', '2026-02-28 03:12:04'),
(13, 3, 5, 'comment_review', 34, 19, 'Mafia film commented on your review of Sirāt', 0, '2026-02-28 07:30:19', '2026-02-28 07:30:19'),
(14, 3, 5, 'comment_review', 16, 20, 'Mafia film commented on your review of The Secret Agent', 0, '2026-02-28 08:00:01', '2026-02-28 08:00:01'),
(15, 3, 5, 'comment_review', 34, 21, 'Mafia film commented on your review of Sirāt', 0, '2026-02-28 08:15:58', '2026-02-28 08:15:58'),
(16, 6, 5, 'follow', NULL, NULL, 'Mafia film followed you', 0, '2026-02-28 08:32:26', '2026-02-28 08:32:26'),
(17, 3, 5, 'like_review', 34, 15, 'Mafia film liked your ★★★★ review of Sirāt', 0, '2026-02-28 08:32:43', '2026-02-28 08:32:43'),
(18, 3, 5, 'like_review', 2, 6, 'Mafia film liked your ★★★★★ review of The Handmaiden', 0, '2026-03-01 03:00:17', '2026-03-01 03:00:17'),
(19, 3, 5, 'like_review', 34, 17, 'Mafia film liked your ★★★★ review of Sirāt', 0, '2026-03-01 03:01:25', '2026-03-01 03:01:25'),
(20, 3, 5, 'like_review', 34, 17, 'Mafia film liked your ★★★★ review of Sirāt', 0, '2026-03-01 03:01:27', '2026-03-01 03:01:27');

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
(4, 'Park Chan-wook', 'Director', 'persons/ATi83oGBQItI9xfymHmpeCOA6X8LTlYPv5vjdfBA.webp', 'Park Chan-wook (born August 23, 1963) is a South Korean film director, screenwriter, producer, and former film critic. He is considered one of the most prominent filmmakers of South Korean cinema as well as world cinema in 21st century. His films have gained notoriety for their cinematography and framing, black humor and often brutal subject matter.', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-14 02:20:04'),
(5, 'Kim Tae-ri', 'Actor', 'persons/hkiw9uyPO3I29clDtwKBh0WbTTfaBW9xO695SpRq.webp', 'Kim Tae-ri yang lahir pada 24 April 1990 adalah aktris asal Korea Selatan. Sebelum memulai karirnya sebagai aktris dia mempunyai keinginan untuk menjadi seorang penyiar, ia mendaftar di Departemen Jurnalisme dan Penyiaran (sekarang Departemen Media) di Universitas Kyung Hee. Sampai saat itu, dia belum tertarik pada akting, teater, atau film. Kim Tae-ri pertama kali berhubungan dengan akting di klub drama perguruan tinggi. Pada tahun pertamanya, ia melihat sebuah drama merekrut anggota baru dan bergabung dengan klub drama, dan di tahun keduanya, ia memutuskan untuk mengejar karir sebagai aktor teater.\r\n\r\nKim Tae- ri memulai karirnya dengan tampil dalam produksi teater dan menjadi model iklan TV. Ia memulai debut film layar lebarnya dalam film Park Chan-wook yang berjudul The Handmaiden (2016) di mana ia terpilih dari 1.500 kandidat yang mengikuti audisi untuk peran tersebut. Dia terkenal karena membintangi film The Handmaiden (2016), Little Forest (2018), Space Sweepers (2020) dan drama sejarah Mr. Sunshine (2018). Baru-baru ini, Ia mendapatkan pengakuan lebih lanjut untuk peran utamanya dalam drama percintaan remaja di Twenty-Five Twenty-One (2022). Ia memenangkan kategori Penghargaan Aktris Terbaik pada 58th Baeksang Arts Awards.', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-14 02:22:11'),
(6, 'Kim Min-hee', 'Actor', 'persons/IPSUJRqdkVGS2JTWgdoVs7GQGe2sS3EVHgqgeJCS.webp', 'Kim Min-hee (김민희, born 1 March 1982) is a South Korean actress and former fashion model. In 2017, she won the Silver Bear for Best Actress at the Berlin International Film Festival for her performance in Hong Sang-soo\'s film On the Beach at Night Alone (2017). She is known as one of the muses of director Hong Sang-soo and gained international recognition in her leading role in auteur Park Chan-wook\'s film The Handmaiden (2016).', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-14 02:21:21'),
(7, 'Ha Jung-woo', 'Actor', 'persons/4mcNZUzjwEKgSABBRN0L0onIUOGNd9Bv4t7Ki8pF.webp', 'Ha Jung-woo (Korean: 하정우; born Kim Sung-hoon on March 11, 1978) is a South Korean actor, film director, screenwriter and film producer. One of the highest grossing actors in South Korea, Ha\'s starring films have accumulated more than 100 million tickets. Only 3 other actors have reached this milestone, with Ha being nearly a decade younger than the rest when achieving this.\r\n\r\nHis breakthrough to stardom came with the role in Na Hong-jin\'s serial killer film The Chaser (2008). One of the leading actors of his generation in Korean cinema, Ha showcased his versatility across films of various genres: road movie My Dear Enemy (2008), sports film Take Off (2009), action thriller The Yellow Sea (2010), gangster saga Nameless Gangster: Rules of the Time (2012), romantic comedy Love Fiction (2012), spy actioner The Berlin File (2013), and action thriller The Terror Live (2013). Ha is also known for his role as grim reaper Gang-rim in the fantasy action film Along with the Gods: The Two Worlds (2017) and its 2018 sequel.\r\n\r\nHe made his directorial debut through the comedy film Fasten Your Seatbelt (2013), followed by Chronicle of a Blood Merchant (2015).', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-14 02:22:46'),
(8, 'Cho Jin-woong', 'Actor', 'persons/sqPQsSWf3OCGKGgtLa1Rb8O48sX31Hu06CCN2wU9.webp', 'Cho Jin-woong (조진웅) is a South Korean actor. Born Jo Won-joon on April 3, 1976, he is best known for his roles as Sejong\'s loyal bodyguard in Deep Rooted Tree (2011), a mobster in Nameless Gangster: Rules of the Time (2012), and a mysterious villain in A Hard Day (2014). He also gained recognition and praise for his performance as a detective in the television series Signal (2016).', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-14 02:23:16'),
(9, 'Kōji Yakusho', 'Actor', 'persons/kJboL4aoDUqZhW0XWFsuUOr93bnwA7pjDYm7SjbE.webp', 'Kōji Hashimoto (橋本 広司, Hashimoto Kōji, born 1 January 1956), known professionally as Kōji Yakusho (役所 広司, Yakusho Kōji), is a Japanese actor. He is known internationally for his starring roles in Shall We Dance? (1996), 13 Assassins (2010), The Third Murder (2017), The Blood of Wolves (2018), Under the Open Sky (2020) and The Days (2023). For his performance in Perfect Days (2023), he was awarded the Best Actor award in the 76th Cannes Film Festival.', NULL, 'Japan', '2026-01-30 06:37:18', '2026-02-14 02:24:10'),
(10, 'Greta Lee', 'Actor', 'persons/nX8ZqWQaqB83GuhKbFYdrghH81wbwlLXTlflPNAq.webp', 'Greta Jiehan Lee (born March 7, 1983) is an American actress. She had supporting roles in the Netflix comedy-drama series Russian Doll (2019–2022) and the Apple TV+ drama series The Morning Show (2021–present). The latter earned her a nomination for a Primetime Emmy Award. She gained prominence for her starring role in the romantic drama film Past Lives (2023), for which she received a nomination for a Golden Globe Award for Best Actress.\r\n\r\nLee began her career in theatre, making her Broadway debut in the musical comedy The 25th Annual Putnam County Spelling Bee (2007). She starred in the 2010 revival of the comedic play La Bête on Broadway and the West End. In 2011, she acted in the Amy Herzog play 4000 Miles at Lincoln Center Theatre.\r\n\r\nDescription above from the Wikipedia article Greta Lee, licensed under CC-BY-SA, full list of contributors on Wikipedia.', NULL, 'United States', '2026-01-30 06:37:18', '2026-02-14 02:26:56'),
(11, 'Teo Yoo', 'Actor', 'persons/m2BqMKKbM8lHU0ZayKM2Ox7jiUos5wzXyNr4FzyJ.webp', 'Kim Chi-hun (Korean: 김치훈; born April 11, 1981), known professionally as Teo Yoo (Korean: 유태오), is a South Korean actor. He has starred as Viktor Tsoi in the biographical musical film Leto (2018) and won the Blue Dragon Film Award for Best New Actor in 2021. In 2023, he gained wider recognition for starring in the romantic drama film Past Lives, earning a nomination for the BAFTA Award for Best Actor in a Leading Role. In June 2024, he was invited to join the Academy of Motion Picture Arts and Sciences.\r\n\r\nDescription above from the Wikipedia article Teo Yoo, licensed under CC-BY-SA, full list of contributors on Wikipedia.', NULL, NULL, '2026-01-30 06:37:18', '2026-02-14 02:37:30'),
(12, 'Wim Wenders', 'Director', 'persons/Y7QmewYqI48a0i8J4FanH4Epb8XVPKAFZ41GgHfR.webp', 'Ernst Wilhelm \"Wim\" Wenders (born 14 August 1945) is a German filmmaker and playwright, who is a major figure in New German Cinema. Among the honors he has received are prizes from the Cannes, Venice and Berlin film festivals. He has also received a BAFTA Award and been nominated for three Academy Awards and a Grammy Award.\r\n\r\nWenders made his feature film debut with Summer in the City (1970). He earned critical acclaim for directing the films Alice in the Cities (1974), The Wrong Move (1975), and Kings of the Road (1976), later known as the Road Movie trilogy. Wenders won the BAFTA Award for Best Direction and the Palme d\'Or for Paris, Texas (1984) and the Cannes Film Festival Best Director Award for Wings of Desire (1987). His other notable films include The American Friend (1977), Faraway, So Close! (1993), and Perfect Days (2023).\r\n\r\nWenders has received three nominations for the Academy Award for Best Documentary Feature: for Buena Vista Social Club (1999), Pina (2011), and The Salt of the Earth (2014). He received a nomination for the Grammy Award for Best Long Form Music Video for Willie Nelson at the Teatro (1998). He is also known for directing the documentaries Tokyo-Ga (1985), The Soul of a Man (2003), and Pope Francis: A Man of His Word (2018).\r\n\r\nWenders has been the president of the European Film Academy since 1996 and won an Honorary Golden Bear in 2015. He is an active photographer, emphasizing images of desolate landscapes. He is considered an auteur director.\r\n\r\nDescription above from the Wikipedia article Wim Wenders, licensed under CC-BY-SA, full list of contributors on Wikipedia.', NULL, 'Germany', '2026-01-30 06:37:18', '2026-02-14 02:25:12'),
(13, 'Celine Song', 'Director', 'persons/IQ6rvhrEtW9hpfl52hclkmq6ISSdPcAYu0tRI8Aw.webp', 'Celine Song (born Song Ha-Young; Korean: 송하영; born September 19, 1988) is a Canadian, Academy Award-nominated director, playwright, and screenwriter based in the United States.\r\n\r\nHer directorial film debut, Past Lives (2023), received critical acclaim and was nominated for the Academy Award for Best Picture and Original Screenplay. Among her plays are Endlings and The Seagull on The Sims 4 (both 2020).', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-14 02:26:14'),
(14, 'Chung Seo-kyung', 'Writer', 'persons/BndyzQzeCeemZPNjx2SgxWm7KVxDuyed00kVCJ4p.webp', 'Chung Seo-kyung is a South Korean screenwriter. She has collaborated extensively with director Park Chan-wook.', NULL, 'South Korea', '2026-01-30 06:37:18', '2026-02-15 03:37:55'),
(16, 'Bi Gan', 'Director', 'persons/mkowCcHurf7HNI8KXTKVtLxMHxlXq9noJ6E6V2NH.webp', 'Bi Gan (Chinese: 毕赣, born 4 June 1989) is a Chinese film director, screenwriter, poet, and photographer. His first feature film, Kaili Blues, was released in 2015 and won Best New Film Director at the 52nd Golden Horse Awards, the FIPRESCI Prize, The Golden Montgolfiere Prize at the 37th Festival of the Three Continents in Nantes,[3] and the Best First Feature Film Award at The 68th Locarno Film Festival.\r\n\r\nBi Gan was born in Kaili City in Guizhou Province on June 4, 1989. He is an ethnic Miao.\r\n\r\nFrom 2008 to 2011, Bi Gan studied Television directing in Radio, Film, and Television Cadre College in Taiyuan, Shanxi. The college was renamed in 2013 as Communication University of Shanxi.\r\n\r\nDuring his college years, Bi watched Andrei Tarkovsky\'s Stalker, later stating in an interview, \"Cinema can be different [from mainstream films]; you can make what you like. What I had seen up to that point were mainly Hollywood films. What I was taught was pretty boring.\" Because of this particular film, he made up his mind to pursue filmmaking. \"Before that, my parents and my relatives thought I would become jobless after graduation since I didn\'t want to do anything.\"\r\n\r\nIn 2010 he made the short fiction film South, which won the first prize at the university-sponsored \"Guang Sui Ying Dong\" (Light Follows the Motion of Shadow) Film Festival.\r\n\r\nTwo years later in 2012, he made a black-and-white short film Diamond Sutra (《金刚经》; also known as The Poet and Singer), which features a story of murder in a small isolated town in the mountain. The film received Special Mention Award from the 19th Hong Kong ifva (Incubator for Film and Visual media in Asia), an award organized by Hong Kong Arts Centre,[9] and was ranked top 10 at the 9th China Independent Film Festival in Nanjing, China.\r\n\r\nIn 2015, Bi\'s debut feature film, Kaili Blues, written by him, gave the emerging director wider exposure. The film also garnered the Best New Film Director at the 52nd Golden Horse Awards, the FIPRESCI Prize, the Golden Montgolfiere Prize at the 37th Festival of the Three Continents in Nantes, and the Best First Feature Film Award at the 68th Locarno Film Festival.\r\n\r\nIn 2017, Bi wrote and directed his second feature film Long Day\'s Journey into Night, starring Tang Wei, Huang Jue, Sylvia Chang, and Lee Hong-chi. The film is also based in Guizhou Province and was released in 2018.', NULL, 'China', '2026-01-30 06:37:18', '2026-02-14 02:31:52'),
(18, 'John Magaro', 'Actor', 'persons/jcjXbFhU2BnDTEJYPzMw0LoEjpDrSQv5niDcYHcF.webp', 'John Robert Magaro (born February 16, 1983) is an American actor. He has acted in the films Not Fade Away (2012), The Big Short (2015), Carol (2015), Overlord (2018), First Cow (2019), Showing Up (2022), The Mistress (2022), and Past Lives (2023). He has also acted in the Netflix series Orange Is the New Black (2015–2019), The Umbrella Academy (2019) and the Amazon series Crisis in Six Scenes (2016). He made his Broadway debut as Earl Williams, the escaped convict, in the revival of The Front Page in 2016\r\n\r\nDescription above from the Wikipedia article John Magaro, licensed under CC-BY-SA, full list of contributors on Wikipedia.', NULL, NULL, '2026-02-14 02:28:27', '2026-02-14 02:28:27'),
(19, 'Jackson Yee', 'Actor', 'persons/FrZsp5cILr1smgMH9lcxP8SMKkzcoCHW3mhSZ0My.webp', 'Jackson Yee (born 28 November, 2000) is a Chinese actor and singer who graduated from The Central Academy of Drama.\r\n\r\nAlready a star across Asia by 13, Yee gained international recognition with his film debut Better Days (2019), which was Oscar-nominated. Filmed at 17, the role earned him numerous Best Newcomer awards. He went on to star in a string of record-breaking hits, including A Little Red Flower (2020), The Battle at Lake Changjin (2021, China’s highest-grossing live-action film), Nice View (2022), Full River Red (the highest-grossing Asian film of 2023), and Big World (2024, TIFF-JP Audience Award), a micro-budget hit.\r\n\r\nHis engagement with challenging, auteur-oriented works continues with projects such as Cannes-winning Resurrection (2025). Across seven leading roles, Yee’s films have grossed over US$2.8 billion worldwide with nearly 500 million admissions. Jackson Yee’s leading projects have exceeded RMB 100 million in pre-sales for seven consecutive years, including Resurrection (2025), excluding previews. He has received Best Actor nominations from all of China’s major film awards and became the youngest Golden Rooster winner at age 24.\r\n\r\nWidely regarded as the leading figure in contemporary Chinese cinema, Yee is noted for his charisma, versatility, and ability to navigate both commercial and arthouse filmmaking. He topped the Forbes China Celebrity List in 2020 and 2021 before its discontinuation.', NULL, NULL, '2026-02-14 02:32:48', '2026-02-14 02:32:48'),
(20, 'Shu Qi', 'Actor', 'persons/2Q5TxgzvocoIX3J0MYucmLLO7KgbOMDC3iwq2Plg.webp', 'Lin Li-hui, better known by her stage name Shu Qi (Chinese: 舒淇; pinyin: Shū Qí), is a Taiwanese actress and model. She has also been credited as Hsu Chi and Shu Kei.', NULL, NULL, '2026-02-14 02:33:24', '2026-02-14 02:33:24'),
(21, 'Li Gengxi', 'Actor', 'persons/VspNZz0wI9yldSguy0THEQQCGJjNyA4481hhrIfr.webp', 'Gengxi Li is a Chinese actress,is known for A Little Reunion (2019), Beyond (2022) and The Long Season (2023).', NULL, NULL, '2026-02-14 02:34:07', '2026-02-14 02:34:07'),
(22, 'Sheila Dara Aisha', 'Actor', 'persons/Kx8LhYttSjtvvpO8X4Dn5ZrTaxWKGJZHq1pjWU0H.webp', 'Sheila Dara Aisha Tanjung (born September 24, 1992) is a Citra award-winning Indonesian actress, singer, and model.\r\n\r\nSheila\'s career started at a young age, starting out as a child singer and acting in soap operas, up until she was a teenager. She gained wider recognition with her roles in films such as One Day We\'ll Talk About Today (2020) and The Red Point of Marriage (2022). She won her first Piala Citra with Falling in Love Like in Movies (2023).', NULL, NULL, '2026-02-14 02:36:29', '2026-02-14 02:36:29'),
(23, 'Dion Wiyoko', 'Actor', 'persons/rJ0eJD6FXOxpyg4LnHshHeRFQypS4ZjJEoCCto2a.webp', 'Dion Wiyoko (born in Surabaya, May 3, 1984) is an Indonesian actor of Chinese descent. He began his career as a model before becoming an actor.', NULL, NULL, '2026-02-14 02:37:09', '2026-02-14 02:37:09'),
(24, 'Yandy Laurens', 'Director', 'persons/z9x76nwZTjPuXfkv8qqJrbQfqDg6I0cVbu4fUCty.webp', 'Alexander Yandy Laurens (born April 9, 1989) is a Indonesian film director, screenwriter, and producer. Born and raised in Makassar, Laurens studied film at the Jakarta Arts Institute (Institut Kesenian Jakarta). His graduation short film, Wan An, won Best Short Film at the 2012 Indonesian Film Festival. Following this achievement, he went on to direct numerous commercials, music videos, and web series.\r\n\r\nIn 2017, Laurens was announced as the director of a film adaptation of the 1996 television series Keluarga Cemara. The film, titled Cemara’s Family, had its world premiere at the 2018 Jogja-NETPAC Asian Film Festival. Starring Ringgo Agus Rahman, Nirina Zubir, Adhisty Zara, and Widuri Puteri, it was theatrically released on 3 January 2019 and became the seventh highest-grossing Indonesian film of all time, with 1,699,433 admissions.\r\n\r\nHis second feature film, Falling In Love Like in Movies, a partially black-and-white romantic comedy, premiered at the 18th Jogja-NETPAC Asian Film Festival. This marked his second collaboration with Ringgo Agus Rahman and Nirina Zubir following Cemara’s Family. The film was released theatrically in Indonesia on 30 November 2023 and went on to receive eleven nominations at the 2024 Indonesian Film Festival, including Best Picture and Best Director.\r\n\r\nIn 2024, Laurens was announced as the director of another adaptation of a television series created by Arswendo Atmowiloto, titled A Brother and 7 Siblings. The film served as the closing title of the 19th Jogja-NETPAC Asian Film Festival. His fourth feature film, Sore: Istri dari Masa Depan, adapted from his web series of the same name and starring Dion Wiyoko reprising his role, was theatrically released in Indonesia on 10 July 2025.', NULL, NULL, '2026-02-14 02:38:59', '2026-02-14 02:38:59'),
(25, 'Ringgo Agus Rahman', 'Actor', 'persons/OwOXZqGRiblkf7z2oCRbFHK5uVBA7rPFGbEoHjI7.webp', 'Ringgo Agus Rahman (born August 12, 1982) is a Piala Citra winning Indonesian actor and comedian.\r\n\r\nHis career started as a radio DJ in Bandung, which subsequently let to his silver screen debut in Jomblo (2006). He is known for his roles in Get Married (2007), Cemara\'s Family (2018), and Falling in Love Like in Movies (2023), which won his first Piala Citra.', NULL, NULL, '2026-02-14 02:39:43', '2026-02-14 02:39:43'),
(26, 'Nirina Zubir', 'Actor', 'persons/QDQP8vamQo9JOXzvKASpxUBNcJX4sOh6WnzyzpSy.webp', 'Nirina Zubir atau dipanggil Nirina saja  adalah seorang pembawa acara dan aktris asal Indonesia. Ia bertinggi badan 158 cm. Nirina merupakan putri Zubir Amin, diplomat senior kelahiran Pariaman, Sumatera Barat. Pada tanggal 6 Februari 2010 pasangan Nirina & suaminya (Ernest \"Coklat\") dikaruniai seorang perempuan yaitu Zivara Ruciragati Sharief.', NULL, NULL, '2026-02-14 02:40:27', '2026-02-14 02:40:27'),
(27, 'Alex Abbad', 'Actor', 'persons/dXYn3CQ9faKFF6iumBh0lB1XPmGX4a0jKCYm3CM9.webp', 'Alex Abdullah Abbad (born June 18, 1978) is a two-time Citra winning Indonesian actor and presenter. He was known as an MTV video jockey. His acting career started with Andai Ia Tahu (2002). He won the Piala Citra for My Stupid Boss (2016) and Falling in Love Like in Movies (2023).', NULL, NULL, '2026-02-14 02:41:05', '2026-02-14 02:41:05'),
(28, 'Joachim Trier', 'Director', 'persons/bggaLNhKlnpKUuHx2uqYym9iijlP73OVejRNDh5e.webp', 'Joachim Trier (born 1 March 1974) is a Danish-born Norwegian filmmaker. He is best known for his Oslo trilogy which comprises the films Reprise (2006), Oslo, August 31st (2011), The Worst Person in the World (2021). For the latter film, he was nominated for the Best Original Screenplay at the 94th Academy Awards, with the film also nominated for Best International Feature. He is also known for directing Louder Than Bombs (2015), Thelma (2017), and the documentary The Other Munch (2018). In addition to an Academy Award, he has also been nominated for a BAFTA Award, two Cesar Awards, and three Cannes Film Festival Awards.', NULL, NULL, '2026-02-14 03:00:34', '2026-02-14 03:00:34'),
(29, 'Renate Reinsve', 'Actor', 'persons/hse5lG18DzbI5wAwfRCDhRaTM3Ig0drdNazfzqxN.webp', 'Renate Reinsve (born 24 November 1987) is a Norwegian actress, best known for Oslo, August 31st (2011), Welcome to Norway (2016), The Worst Person in the World (2021) and Sentimental Value (2025). At the 2021 Cannes Film Festival, Reinsve won the Best Actress Award for The Worst Person in the World, the first time ever a Norwegian actress has won an award at the festival. She has also starred in the Apple TV+ legal thriller series Presumed Innocent, the A24 satirical dark comedy A Different Man, and the thriller Armand (all in 2024).', NULL, NULL, '2026-02-14 03:01:07', '2026-02-14 03:01:07'),
(30, 'Stellan Skarsgård', 'Actor', 'persons/xRAqhoJCXM3Rop7JVZDjD07ymm7bfQQKFZQdjVgL.webp', 'Stellan Skarsgård (born June 13, 1951) is a Swedish actor, known internationally for The Hunt for Red October and Good Will Hunting, as well as his supporting roles in the Pirates of the Caribbean, Mamma Mia!, and Marvel Cinematic Universe (MCU) franchises.\r\n\r\nSkarsgård is particularly associated with director Lars von Trier and has appeared in six of the Danish auteur\'s features: The Kingdom, Breaking the Waves, Dancer in the Dark, Dogville, Melancholia, and Nymphomaniac.', NULL, NULL, '2026-02-14 03:02:12', '2026-02-14 03:02:12'),
(31, 'Inga Ibsdotter Lilleaas', 'Actor', 'persons/l0WBGsZeAKYeICMHy0D0sADjGzVjHiOcCMz095LB.webp', 'Inga Ibsdotter Lilleaas (born 9 April 1989) is a Norwegian actress. She studied theatre at Nord University in Bodø and spent a semester studying at the Lee Strasberg Theatre and Film Institute in New York City. She is most notably known for her role in Joachim Trier\'s 2025 film, Sentimental Value.', NULL, NULL, '2026-02-14 03:02:52', '2026-02-14 03:02:52'),
(32, 'Elle Fanning', 'Actor', 'persons/uy9G8zQg3K7F2siLv9JAnsBWlCMR1j3qSo4K0xNF.webp', 'Mary Elle Fanning (born April 9, 1998) is an American actress. As a child, she made her film debut as the younger version of her sister Dakota Fanning\'s character in the drama film I Am Sam (2001). She appeared in several other films as a child actress, including Daddy Day Care (2003), Babel (2006), The Curious Case of Benjamin Button and Phoebe in Wonderland (both 2008), and the miniseries The Lost Room (2006). She then had leading roles in Sofia Coppola\'s drama Somewhere (2010) and J. J. Abrams\' science fiction film Super 8 (2011).\r\n\r\nFanning played Princess Aurora in the fantasy films Maleficent (2014) and Maleficent: Mistress of Evil (2019) while working in independent films such as Sally Potter\'s Ginger & Rosa (2012), Nicolas Winding Refn\'s The Neon Demon (2016), Mike Mills\' 20th Century Women (2016), and Coppola\'s The Beguiled (2017). From 2020 to 2023, she starred as Catherine the Great in the Hulu period satire series The Great, for which she received nominations for a Primetime Emmy Award and two Golden Globe Awards. She has since portrayed Michelle Carter in the Hulu limited series The Girl from Plainville (2022), made her Broadway debut in the play Appropriate (2023), and played a character based on Suze Rotolo in the biographical drama A Complete Unknown (2024).', NULL, NULL, '2026-02-14 03:03:34', '2026-02-14 03:03:34'),
(33, 'Emma Stone', 'Actor', 'persons/LwFTvHYtw6Etmy22XpwaQCxBQf2GYhmthd55LaTe.webp', 'Emily Jean \"Emma\" Stone (born November 6, 1988, Scottsdale, Arizona) is an American actress and producer whose dynamic performances have reshaped contemporary cinema. With two Academy Awards, two BAFTA Awards, and two Golden Globe Awards, she is a leading figure in global filmmaking. Her career began at Phoenix\'s Valley Youth Theatre with The Wind in the Willows (2000). At fifteen, she moved to Los Angeles, debuting in an unsold television pilot, In Search of the New Partridge Family (2004). Stone gained recognition through teen comedies like Superbad (2007), Zombieland (2009), and Easy A (2010), her first starring role, earning a Golden Globe nomination. Her roles in Crazy, Stupid, Love (2011) and The Help (2011) highlighted her versatility, while The Amazing Spider-Man (2012) and its 2014 sequel elevated her global profile.\r\n\r\nStone earned Oscar nominations for Birdman (2014) and The Favourite (2018), winning Best Actress for La La Land (2016) and Poor Things (2023). She starred in Battle of the Sexes (2017), Cruella (2021), and Maniac (2018). In 2020, she co-founded Fruit Tree, producing films like Problemista (2023).\r\n\r\nStone\'s collaboration with Yorgos Lanthimos, inspired by her admiration for his films like The Lobster (2015) and Dogtooth (2009), spans The Favourite, Poor Things, and Kinds of Kindness (2024). This partnership, driven by her trust in his vision, reflects her deliberate shift toward experimental cinema over mainstream Hollywood projects.', NULL, NULL, '2026-02-14 05:25:17', '2026-02-14 05:25:17'),
(34, 'Mark Ruffalo', 'Actor', 'persons/pTrEhdQ6WEWYLFpMYlRbqkO1REGxlGLdMeSwj7p8.webp', 'Mark Alan Ruffalo (born November 22, 1967) is an American actor. He began acting in the late 1980s and first gained recognition for his work in Kenneth Lonergan\'s play This Is Our Youth (1996) and drama film You Can Count on Me (2000). He went on to star in the romantic comedies 13 Going on 30 (2004) and Just like Heaven (2005), and the thrillers In the Cut (2003), Zodiac (2007), and Shutter Island (2010). He received a Tony Award nomination for his supporting role in the Broadway revival of Awake and Sing! in 2006. Ruffalo has gained international recognition for playing Bruce Banner / Hulk in the Marvel Cinematic Universe, beginning with the film The Avengers (2012).\r\n\r\nRuffalo earned a record-tying four nominations for the Academy Award for Best Supporting Actor for playing a sperm donor in The Kids Are All Right (2010), Dave Schultz in Foxcatcher (2014), Michael Rezendes in Spotlight (2015), and a debauched lawyer in Poor Things (2023). He won a Screen Actors Guild Award for Best Actor for playing a gay activist in the television drama film The Normal Heart (2015), and a Primetime Emmy Award for Outstanding Lead Actor for his dual role as identical twins in the miniseries I Know This Much Is True (2020).', NULL, NULL, '2026-02-14 05:25:58', '2026-02-14 05:25:58'),
(35, 'Willem Dafoe', 'Actor', 'persons/CmydBqrxkaYX307Ar6M0VuG2rF6dbL9JMlnT3smM.webp', 'William James \"Willem\" Dafoe (born July 22, 1955) is an American actor. Known for his prolific career portraying diverse roles in both mainstream and arthouse films, he is the recipient of various accolades, including the Volpi Cup for Best Actor as well as nominations for four Academy Awards, a BAFTA Award, four Golden Globe Awards, four Critics\' Choice Movie Awards, and five Screen Actors Guild Awards. He has frequently collaborated with filmmakers Paul Schrader, Abel Ferrara, Lars von Trier, Julian Schnabel, Wes Anderson, and Robert Eggers. Dafoe was a founding member of experimental theatre company The Wooster Group.\r\n\r\nHe made his film debut with an uncredited role in Heaven\'s Gate (1980). Dafoe\'s early career includes credits for The Loveless (1982), Streets of Fire (1984), and To Live and Die in L.A. (1985). He earned his first Academy Award nomination for the war drama Platoon (1986), followed by nominations for his roles in Shadow of the Vampire (2000), The Florida Project (2017), and the Vincent van Gogh biopic At Eternity\'s Gate (2018). He also gained acclaim and wide recognition for his roles as Jesus Christ in The Last Temptation of Christ (1988) and as the supervillain Norman Osborn in the superhero film Spider-Man (2002), a role he reprised in its sequels Spider-Man 2 (2004) and Spider-Man 3 (2007), and the Marvel Cinematic Universe film Spider-Man: No Way Home (2021).\r\n\r\nHis other film appearance include roles in Mississippi Burning (1988), Born on the Fourth of July (1989), Wild at Heart (1990), Light Sleeper (1992), Body of Evidence (1993), Clear and Present Danger (1994), The English Patient (1996), Affliction (1997), New Rose Hotel(1998), Existenz (1999), The Boondock Saints (1999), American Psycho (2000), Auto Focus (2002), Finding Nemo (2003), The Life Aquatic with Steve Zissou (2004), Inside Man (2006), Mr. Bean\'s Holiday (2007), Antichrist (2009), Fantastic Mr. Fox (2009), Nymphomaniac (2013), The Fault in Our Stars (2014), John Wick (2014), The Grand Budapest Hotel (2014), Aquaman (2018), The Lighthouse (2019), Nightmare Alley (2021), Poor Things (2023), and Beetlejuice Beetlejuice (2024).', NULL, NULL, '2026-02-14 05:26:40', '2026-02-14 05:26:40'),
(36, 'Ramy Youssef', 'Actor', 'persons/exWayOYEqm7JGJxtSVE4Iwc9ClbVe8ZtQ5MCgicA.webp', 'Ramy Youssef (born March 26, 1991) is an American stand-up comedian, actor, and writer of Egyptian descent. Youssef made his acting debut in the Nick@Nite sitcom See Dad Run. In 2019, Youssef made his breakthrough with Ramy, a show Youssef created, produced and starred in. Youssef received a Golden Globe Award for Best Actor in a Television Series for his performance.', NULL, NULL, '2026-02-14 05:27:17', '2026-02-14 05:27:17'),
(37, 'Yorgos Lanthimos', 'Director', 'persons/lsX2nxzgiAsLS6qumCSKfowXnpdeR3QmU3k6csWx.webp', 'Yorgos Lanthimos (Greek: Γιώργος Λάνθιμος, born 23 September 1973) is a Greek filmmaker. He has received multiple accolades, including a BAFTA Award and a Golden Lion, as well as nominations for five Academy Awards and a Golden Globe Award.\r\n\r\nLanthimos started his career in experimental theatre before making his directorial film debut with the sex comedy My Best Friend (2001). He rose to prominence by directing the psychological drama film Dogtooth (2009), which won the Un Certain Regard prize at the Cannes Film Festival and was nominated for the Academy Award for Best Foreign Language Film. Lanthimos transitioned to making English-language films with the black comedy The Lobster (2015), which earned him an Academy Award nomination for Best Original Screenplay, and the psychological thriller The Killing of a Sacred Deer (2017).\r\n\r\nHe collaborated with actress Emma Stone in the period black comedies The Favourite (2018) and Poor Things (2023) and the anthology film Kinds of Kindness (2024). He received nominations for the Academy Award for Best Director and Best Picture for The Favourite and Poor Things, in addition to winning the Golden Lion for the latter.\r\n\r\nDescription above from the Wikipedia article Yorgos Lanthimos, licensed under CC-BY-SA, full list of contributors on Wikipedia.', NULL, NULL, '2026-02-14 05:27:54', '2026-02-14 05:31:42'),
(38, 'Tony McNamara', 'Writer', 'persons/Q527vEi8ZjmtyH6EIZr2AN6s9ib4mNCiSyfVd1Pi.webp', 'Tony McNamara (born 31 December 1966) is an Australian writer and producer. He is best known for writing the screenplays for The Favourite (2018) and Poor Things (2023). Starting in theater, he transitioned to television, creating The Great and writing for shows like Doctor Doctor. His film career soared with The Favourite, earning an Oscar nomination, followed by another for Poor Things, both with Yorgos Lanthimos, who chose him after reviewing hundreds of playwrights, finding his match in McNamara. He co-wrote Cruella and is scripting a Star Wars film and Evangeline. His style blends historical settings with modern humor, and he directed The Rage in Placid Lake.', NULL, NULL, '2026-02-14 05:28:26', '2026-02-14 05:32:02'),
(40, 'Ryan Gosling', 'Actor', 'persons/VjN91dfzyGOHRfBg1gqcP7evjZIlecKo15GeFFIo.webp', 'Ryan Thomas Gosling (born November 12, 1980) is a Canadian actor. Prominent in independent film, he has also worked in blockbuster films of varying genres, and has accrued a worldwide box office gross of over 1.9 billion USD. He has received various accolades, including a Golden Globe Award, and nominations for two Academy Awards and a BAFTA Award.\r\n\r\nBorn and raised in Canada, he rose to prominence at age 13 for being a child star on the Disney Channel\'s The Mickey Mouse Club (1993–1995), and went on to appear in other family entertainment programs, including Are You Afraid of the Dark? (1995) and Goosebumps (1996). His first film role was as a Jewish neo-Nazi in The Believer (2001), and he went on to star in several independent films, including Murder by Numbers (2002), The Slaughter Rule (2002), and The United States of Leland (2003).\r\n\r\nGosling gained wider recognition and stardom for the 2004 romance film The Notebook. This was followed by starring roles in a string of critically acclaimed independent dramas including Half Nelson (2006), for which he was nominated for the Academy Award for Best Actor. Gosling co-starred in three mainstream films in 2011, the romantic comedy Crazy, Stupid, Love and the action drama Drive, all of which were critical and commercial successes. He then starred in the acclaimed financial satire The Big Short (2015) and the romantic musical La La Land (2016), the latter of which won him the Golden Globe Award for Best Actor and a second Academy Award nomination for Best Actor. Further acclaim followed with the science fiction thriller Blade Runner 2049 (2017) and the biopic First Man (2018). In addition to acting, he made his directorial debut in 2014\'s Lost River.', NULL, NULL, '2026-02-14 05:42:25', '2026-02-14 05:42:25'),
(41, 'Damien Chazelle', 'Director', 'persons/pQzgCqDaSxJh90SZvepjxN84V1jfF2QcPhblAHIV.webp', 'Damien Sayre Chazelle (/ʃəˈzɛl/; born January 19, 1985) is a French-American filmmaker. He directed the psychological drama Whiplash (2014), the musical romance La La Land (2016), the biographical drama First Man (2018), and the period black comedy Babylon (2022).\r\n\r\nFor Whiplash, he was nominated for the Academy Award for Best Adapted Screenplay. His biggest commercial success came with La La Land, nominated for 14 Academy Awards, winning six, including Best Director, making him the youngest person to win the award at age 32. He has also directed two episodes of the Netflix limited series The Eddy (2020).\r\n\r\nDescription above from the Wikipedia article Damien Chazelle, licensed under CC-BY-SA, full list of contributors on Wikipedia.', NULL, NULL, '2026-02-14 05:43:33', '2026-02-14 05:45:30'),
(42, 'Margot Robbie', 'Actor', 'persons/NV01fXUBDAlTsu2mHqQVdDpd7YWrzkpuYWDuRZ97.webp', 'Margot Elise Robbie (born 2 July 1990) is an Australian actress and producer. Her work includes blockbusters and independent films, and her accolades include nominations for three Academy Awards, four Golden Globe Awards, and six BAFTA Awards. Time named her one of the 100 most influential people in the world in 2017, and Forbes named her the world\'s highest-paid actress in 2023.\r\n\r\nBorn and raised in Queensland, Robbie began her career in 2008 on the television series Neighbours, on which she was a regular until 2011. After moving to the United States, she led the television series Pan Am (2011–2012). She had her breakthrough in 2013 with Martin Scorsese\'s black comedy film The Wolf of Wall Street. She achieved wider recognition by starring in the roles of Jane Porter in The Legend of Tarzan (2016) and  Harley Quinn in the DC Extended Universe films, beginning with Suicide Squad (2016).\r\n\r\nRobbie received critical acclaim and a nomination for the Academy Award for Best Actress for her portrayal of figure skater Tonya Harding in the biopic I, Tonya (2017). This acclaim continued for her performances as Queen Elizabeth I in Mary Queen of Scots (2018), Sharon Tate in Once Upon a Time in Hollywood (2019), and a Fox News employee in Bombshell (2019). The last of these earned her a nomination for the Academy Award for Best Supporting Actress. Robbie has since starred as an aspiring actress in the period film Babylon (2022) and the titular fashion doll in the fantasy comedy Barbie (2023), which emerged as her highest-grossing release and, as its producer, earned her a nomination for the Academy Award for Best Picture.\r\n\r\nRobbie and her husband, filmmaker Tom Ackerley, co-founded the production company LuckyChap Entertainment in 2014, under which they have produced several films, including I, Tonya, Promising Young Woman (2020), Barbie, and Saltburn (2023), as well as the Hulu series Dollface (2019–2022) and the Netflix miniseries Maid (2021).', NULL, NULL, '2026-02-14 05:47:00', '2026-02-14 05:47:00'),
(43, 'Jacob Elordi', 'Actor', 'persons/veMaX9A2QTVH1GeMtr62bvQ5lF20PVzZa0k4jTA2.webp', 'Jacob Elordi (born 26 June 1997) is an Australian actor. After moving to Los Angeles in 2017 to pursue an acting career, he gained prominence with his role as Noah Flynn, the bad boy love interest, in Netflix\'s The Kissing Booth film series (2018–2021). He also became known for his role as troubled high school football player Nate Jacobs in HBO\'s teen drama series Euphoria (2019–present). In 2023, he starred as Elvis Presley in the biographical film Priscilla and as a wealthy university student in Saltburn, which earned him a nomination for the BAFTA Award for Best Actor in a Supporting Role.', NULL, NULL, '2026-02-14 05:47:41', '2026-02-14 05:47:41'),
(44, 'Emerald Fennell', 'Director', 'persons/qqZuumnv6aRmYAdGOWv7tRNDxF0O9bXhuGKzn4aK.webp', 'Emerald Lilly Fennell (born 1 October 1985) is an English actress, filmmaker, and writer. She has received numerous accolades, including an Academy Award, two BAFTA Awards, and nominations for three Primetime Emmy Awards and three Golden Globe Awards.\r\n\r\nFennell first gained attention for her roles in period films, such as Albert Nobbs (2011),  Anna Karenina (2012), and The Danish Girl (2015). She gained prominence for her starring role in the BBC One drama series Call the Midwife (2013–2017) and for her portrayal of Camilla Parker-Bowles in the Netflix drama series The Crown (2019–2020), the latter of which garnered her a Primetime Emmy Award nomination.\r\n\r\nAs a writer-director, Fennell is known as the showrunner for season two of the BBC spy thriller series Killing Eve (2019), which earned her two Primetime Emmy Award nominations. She made her feature film directorial debut with the thriller Promising Young Woman (2020), for which she won the Academy Award for Best Original Screenplay and received nominations for Best Picture and Best Director. Fennell also wrote the book for Andrew Lloyd Webber\'s musical Cinderella (2021) and directed her second film, the psychological thriller Saltburn (2023).', NULL, NULL, '2026-02-14 05:48:22', '2026-02-14 05:48:22'),
(45, 'Ryo Yoshizawa', 'Actor', 'persons/pjEEEOc6dXc5lKhOD2lKcfivbFxzEUuBOEww4HBH.webp', 'Ryo Yoshizawa (吉沢 亮) is a Japanese actor. His breakthrough roles include Yūichi Katagiri in the Tomodachi Game live-action television drama and films and Okita Sogo in the Gintama live-action films. He is known for his expressive eyes and natural acting style.', NULL, NULL, '2026-02-14 05:50:54', '2026-02-14 05:50:54'),
(46, 'Ryusei Yokohama', 'Actor', 'persons/9qfn3DMWoNLm0YKHD1uhQ82t4PTSw64oy4auGqGQ.webp', NULL, NULL, NULL, '2026-02-14 05:51:22', '2026-02-14 05:51:22'),
(47, 'Soya Kurokawa', 'Actor', 'persons/BFqAFGU2vlkWElY0uXmdHGEzFrZsB8GQJng5rePK.webp', 'Soya Kurokawa, born on December 5, 2009 in Japan, is an actor from the talent agency, TACHI PRO. He is known for Monster (2023), Tokyo Alien Bros (2018) and Ichiban Suki na Hana (2023).', NULL, NULL, '2026-02-14 05:53:06', '2026-02-14 05:53:06'),
(48, 'Keitatsu Koshiyama', 'Actor', 'persons/KmJLvzzF9YdGQt2AssNsLIoUcQm0UiMtQFJohQgO.webp', NULL, NULL, NULL, '2026-02-14 05:53:40', '2026-02-14 05:53:40'),
(49, 'Lee Sang-il', 'Director', 'persons/JlKjbxtdc2g8tHvyWKG0vP0MirGI2M60xM2eu0hN.webp', 'Lee Sang-il is a Korean-Japanese film director and screenwriter. His first film, “Chong,” was a short film about the lives of third generation Koreans living in Japan. “Hula Girls” was declared best Japanese film of 2006 by Kinema Junpo, and Lee won the Best Director and Best Screenplay prizes at the 2007 Japanese Academy Awards for the film. His film “Unforgiven” was screened in the Special Presentation section at the 2013 Toronto International Film Festival.', NULL, NULL, '2026-02-14 05:54:18', '2026-02-14 05:54:18'),
(50, 'Satoko Okudera', 'Writer', 'persons/Oa7o5DmTZFOHWTWmoJqR1SJMPLhfGcblnGXdcRVi.webp', 'Satoko Okudera (奥寺 佐渡子 Okudera Satoko, born 1966 in Iwate Prefecture) is a Japanese screenwriter. She is known for her screenplays in both the live-action and anime mediums. Her 1995 screenplay for Gakkō no kaidan was nominated for the Japan Academy Prize. She is best known for her collaborations with anime director Mamoru Hosoda. A graduate of the Literature Department of Tokai University in Tokyo, Okudera did not originally consider a career in screenwriting. Instead, she worked for an oil company until 1991, after which she quit her job and became a full-time writer. After over a decade of work in live-action film and television, Okudera was offered her first animation project: adapting Yasutaka Tsutsui\'s novel Toki o Kakeru Shōjo for director Mamoru Hosoda. The resulting film, The Girl Who Leapt Through Time, received worldwide acclaim and gave her international recognition upon its release in 2006. Okudera again collaborated with Hosoda on the 2009 film Summer Wars. At the 2009 Anime Festival Asia in Singapore, Hosoda revealed Okudera would be writing the script for his next project, Wolf Children.', NULL, NULL, '2026-02-14 05:54:56', '2026-02-14 05:54:56'),
(51, 'Lee Byung-hun', 'Actor', 'persons/JV0fG8KzbhxwdiVa0T3UZYz1BItOx83xIRB6ILdE.webp', 'Lee Byung-hun (이병헌; born July 12, 1970) is a South Korean actor, singer and model. He has received acclaim for his work in a wide range of genres, most notably Joint Security Area (2000); A Bittersweet Life (2005); The Good, the Bad, the Weird (2008); I Saw the Devil (2010); Masquerade (2012); Inside Men (2015); The Man Standing Next (2020); and the television series All In (2003), Iris (2009), Mr. Sunshine (2018), and Our Blues (2022). He has received multiple awards and nominations throughout his career.\r\n\r\nIn the United States, he is known for portraying Storm Shadow in G.I. Joe: The Rise of Cobra (2009) and its sequel G.I. Joe: Retaliation (2013). His other notable Hollywood films include Red 2 (2013), Terminator Genisys (2015), and The Magnificent Seven (2016). He also appeared as the Front Man in Netflix hit survival series Squid Game (2021–2025).', NULL, NULL, '2026-02-15 03:19:51', '2026-02-15 03:19:51'),
(52, 'Son Ye-jin', 'Actor', 'persons/AIOe2ZJE6tCc5ct5RSRruIcis5cK4FcvubT4c6wt.webp', 'Son Ye-jin (손예진), born Son Eon-jin (손언진) on 11th January 1982, is a South Korean actress. She rose to fame in romance-themed films and television series such as The Classic (2003), Summer Scent (2003), A Moment to Remember (2004), and April Snow (2005). She has won acting recognition for her versatility in diverse genres, notably in Alone in Love (2006), My Wife Got Married (2008), The Pirates (2014), The Truth Beneath and The Last Princess (both in 2016)', NULL, NULL, '2026-02-15 03:20:25', '2026-02-15 03:20:25'),
(53, 'Park Hee-soon', 'Actor', 'persons/2ifYQv7IeIvZia7gWEwhQL2RBY5WtPbIwthGhJV9.webp', 'Park Hee-soon (박희순) is a South Korean film, television, and theater actor.', NULL, NULL, '2026-02-15 03:21:06', '2026-02-15 03:21:06'),
(54, 'Lee Sung-min', 'Actor', 'persons/FEYNYHZmtjTnQdHJrQ6kZ5FxmwD6Y7mZanXrbH1l.webp', 'Lee Sung-min (Korean: 이성민; born October 15, 1968) is a South Korean actor. He first gained recognition for his supporting roles in television and film. He is best known for his performances in the series Golden Time (2012), Misaeng: Incomplete Life (2014), and Reborn Rich (2022), winning Best Actor at the Baeksang Arts Awards for the latter two works.\r\n\r\nLee has also received critical acclaim for his role in the espionage film The Spy Gone North (2018), for which he won several Best Actor awards. His other notable films include The Sheriff in Town (2017), The Witness (2018), The Man Standing Next (2020), and Handsome Guys (2024).', NULL, NULL, '2026-02-15 03:21:43', '2026-02-15 03:21:43'),
(55, 'Yeom Hye-ran', 'Actor', 'persons/VeLl9Q2m5vCVDp9m6pbiNhaNBex2S77pGdSQ8YHg.webp', 'Yeom Hye-ran is a Korean actress born in 1976.', NULL, NULL, '2026-02-15 03:22:22', '2026-02-15 03:22:22'),
(56, 'Lee Kyoung-mi', 'Writer', 'persons/oCyqBbNoCFTxqtpbptNujnMGKsDEsSEu5IYrFQm2.webp', 'Lee Kyoung-mi (Korean: 이경미 born December 1973) is a South Korean film director and screenwriter. She was born in Seoul, and graduated with a Russian degree from Hankuk University of Foreign Studies. After working at a company for three years, she entered the School of Film, TV & Multimedia of the Korea National University of Arts, graduating with a major in Filmmaking in 2004. Her short film Feel Good Story, about an employee given the task of figuring out how her company can evade paying taxes, garnered several awards in the film festival circuit in 2004. Lee made her feature directorial debut with Crush and Blush (2008), a black comedy about an obsessive teacher and an outcast student who bond over their shared misanthropy; a critic called it \"one of those rare films from an up-and-coming auteur that shows both guts and playfulness.\" It was the first film to be produced by Park Chan-wook; Lee had previously worked as a scripter/assistant director on Park\'s 2005 film Sympathy for Lady Vengeance. Crush and Blush premiered at the 13th Busan International Film Festival, and was released in theaters on October 16, 2008. Lee won Best New Director and Best Screenplay at the Blue Dragon Film Awards in 2008.', NULL, NULL, '2026-02-15 03:22:59', '2026-02-15 03:22:59'),
(57, 'Don McKellar', 'Writer', 'persons/wZmPcnMluLht6YD7JNes2rLEC2fW9Nm8Wfx52kRV.webp', 'Don McKellar CM (born August 17, 1963) is a Canadian actor, writer, playwright, and filmmaker. He was part of a loosely-affiliated group of filmmakers to emerge from Toronto known as the Toronto New Wave.\r\n\r\nHe is known for directing and writing the film Last Night, which won the Prix de la Jeunesse at the 1998 Cannes Film Festival, as well as his screenplays for films such as Thirty Two Short Films About Glenn Gould, The Red Violin, and Blindness. McKellar frequently acts in his own projects, and has also appeared in Atom Egoyan\'s Exotica and David Cronenberg\'s eXistenZ and Crimes of the Future.\r\n\r\nHe is also known for being a fixture on Canadian television, with series including Twitch City, Odd Job Jack, and Slings & Arrows, as well as writing the book for the popular Tony Award-winning musical The Drowsy Chaperone. He is an eight-time nominee and two-time Genie Award winner.', NULL, NULL, '2026-02-15 03:23:37', '2026-02-15 03:23:37'),
(58, 'Lee Ja-hye', 'Writer', 'persons/BNoOb4fegRISoyQBLNUxrysEz0C02nVzZ2zNzgc3.webp', NULL, NULL, NULL, '2026-02-15 03:24:05', '2026-02-15 03:24:05'),
(59, 'Jafar Panahi', 'Director', 'persons/mPIFdjALJgBH4Ps61i34xOam3RTnICbTiehNA5nu.webp', 'Jafar Panahi (born in July 11, 1960) is a representative of Iranian “New Wave.” He is one of the leaders of contemporary Iranian cinema. Panahi’s work, from his first attempts to discuss social issues to his later and braver discussions of taboo topics in Iran are a creative reflection on the nature of cinema and human society, and are imbued with humanity. In 2010, the court in Iran sentenced Jafar Panahi to six years in prison. In addition, according to the sentence, Panahi was banned from making films for 20 years, giving interviews to local and international media outlets, and leaving Iran. Three Faces was his fourth film (after This Is Not a Film, Closed Curtain, and Taxi) shot after his arrest. The director did not attend the premiere due to being banned from leaving Iran. Panahi is a student of Abbas Kiarostami, whose influence is especially clear in Three Faces, reminiscent of such acclaimed masterpieces as The Wind Will Carry Us and Taste of Cherry.', NULL, NULL, '2026-02-28 05:13:59', '2026-02-28 05:13:59'),
(60, 'Vahid Mobasseri', 'Actor', 'persons/XhmdnR4XRx02VjGXgJbKDKi9N6YwUFm28jLTzU8C.webp', 'Mobasseri is an Iranian actor. He has appeared in numerous works across both cinema and television drama, most notably the film Khers Nist (No Bears) and It Was Just an Accident, both directed by the renowned filmmaker Jafar Panahi.', NULL, NULL, '2026-02-28 05:14:51', '2026-02-28 05:14:51'),
(61, 'Mariam Afshari', 'Actor', 'persons/LiGn15jJYleDlNphki5C7zFeqf0MVHKpTFmuuAJE.webp', 'Afshari is an actress known for her role as Shiva in Iranian director Jafar Panahi\'s film \"It Was Just an Accident\" (2025), which won the Palme d’Or at the 78th Cannes Film Festival. She is also recognized for her work in the 2017 series Parisa. Afshari is a karate instructor and referee. In 2025 she got a Berlin Artist-in-Residence fellowship.', NULL, NULL, '2026-02-28 05:15:23', '2026-02-28 05:15:23'),
(62, 'Hadis Pakbaten', 'Actor', 'persons/AWZZ5qcvxhhintrIWntRgi0adVupUx44irCYhaTs.webp', NULL, NULL, NULL, '2026-02-28 05:16:01', '2026-02-28 05:16:01'),
(63, 'Majid Panahi', 'Actor', 'persons/UJU52ZgvJtYELbOmKsWhb7ksovkzUjy4wgy8YqTc.webp', NULL, NULL, NULL, '2026-02-28 05:16:25', '2026-02-28 05:16:25');
INSERT INTO `persons` (`id`, `full_name`, `primary_role`, `photo_path`, `bio`, `date_of_birth`, `nationality`, `created_at`, `updated_at`) VALUES
(64, 'Ebrahim Azizi', 'Actor', 'persons/XAdAtLp8YnNBFmf7p2pwEY5lf7hgiXlNn4jAnoX3.webp', NULL, NULL, NULL, '2026-02-28 05:16:58', '2026-02-28 05:16:58'),
(65, 'Mohamad Ali Elyasmehr', 'Actor', 'persons/FlzpJKPWr0rRliMwbqher3Ts1uiSIuWBPiqE5pC2.webp', NULL, NULL, NULL, '2026-02-28 05:17:19', '2026-02-28 05:17:19'),
(66, 'Chloé Zhao', 'Director', 'persons/txaD1iOi2YkFIIKG6cLl8fiXxaUU3mmUWDShNbnK.webp', 'Chloé Zhao (born Zhao Ting, in Chinese: 赵婷; 31 March 1982) is a Chinese-born filmmaker. She is known primarily for her work on independent films. For her film Nomadland (2020), Zhao is the second of three women to win the Academy Award for Best Director.\r\n\r\nSongs My Brothers Taught Me (2015), her debut feature film, premiered at Sundance Film Festival to critical acclaim and earned a nomination for the Independent Spirit Award for Best First Feature. The Rider (2017) was critically acclaimed and received nominations for the Independent Spirit Award for Best Film and Best Director.\r\n\r\nZhao garnered international recognition with the American film Nomadland (2020), which she wrote, produced, edited and directed, and which won numerous accolades, including the Golden Lion at the Venice Film Festival and the People\'s Choice Award at the Toronto International Film Festival. Earning four Academy Award nominations for the film, Zhao won Best Picture and Best Director, becoming the first woman of color to win the latter. She also won awards for directing at the Directors Guild of America Awards, Golden Globe Awards, and British Academy Film Awards, becoming the second female winner of each of them.\r\n\r\nZhao co-wrote and directed the Marvel Cinematic Universe superhero film Eternals (2021). Her latest film, Hamnet, premiered at the 52nd Telluride Film Festival to critical acclaim.', NULL, NULL, '2026-02-28 05:23:39', '2026-02-28 05:23:39'),
(67, 'Jessie Buckley', 'Actor', 'persons/Q2ayqe01GuTTvuJXUEdGDUpI40roTAX2QZ4qZW0a.webp', 'Jessie Buckley (born December 28, 1989) is an Irish actress and singer. The accolades she has received include a Golden Globe Award, a Laurence Olivier Award, nominations for an Academy Award and three BAFTA Awards.\r\n\r\nBuckley began her career in 2008 as a contestant on the BBC TV talent show I\'d Do Anything, in which she came second. A RADA graduate, her early onscreen appearances were in BBC television series, such as War & Peace (2016) and Taboo (2017). Buckley made her film debut playing the lead role in Beast (2017) and had her breakthrough starring in the musical film Wild Rose (2018). Her performance as an aspiring country music singer in the latter earned her a nomination for the BAFTA Award for Best Actress in a Leading Role.\r\n\r\nBuckley\'s career progressed with starring roles in the HBO miniseries Chernobyl (2019), I\'m Thinking of Ending Things (2020), season four of Fargo (2020), The Lost Daughter (2021), Men (2022) and Women Talking (2022). Her performance in The Lost Daughter earned her nominations for the BAFTA Award for Best Actress in a Supporting Role and the Academy Award for Best Supporting Actress. Buckley\'s portrayal of Sally Bowles in a 2021 West End theatre revival of Cabaret won her the Laurence Olivier Award for Best Actress in a Musical. \r\n\r\nIn 2022, she released the collaborative album For All Our Days That Tear the Heart with Bernard Butler, which was shortlisted for the 2022 Mercury Prize.', NULL, NULL, '2026-02-28 05:24:45', '2026-02-28 05:24:45'),
(68, 'Paul Mescal', 'Actor', 'persons/PjKBEqLnkgBl7OkcqUnuLDlu6Rg4RXxsPjp1fLOQ.webp', 'Paul Colm Michael Mescal (/ˈmɛskəl/ MESS-kəl; born 2 February 1996) is an Irish actor. Born in Maynooth, he studied acting at The Lir Academy and then performed in plays in Dublin theatres. He rose to fame with his role in the miniseries Normal People (2020), earning a BAFTA TV Award and a nomination for a Primetime Emmy Award.\r\n\r\nMescal progressed to film acting with roles in the psychological dramas The Lost Daughter (2021) and God\'s Creatures (2022). His starring roles as a troubled father in Aftersun (2022) and a mysterious neighbour in All of Us Strangers (2023) earned him nominations for BAFTA Film Awards in addition to a nomination for an Academy Award for the former. He received a Laurence Olivier Award for his portrayal of Stanley Kowalski in a 2022 revival of the play A Streetcar Named Desire. Mescal expanded to big-budget films with a leading role in the historical action film Gladiator II (2024).', NULL, NULL, '2026-02-28 05:25:15', '2026-02-28 05:25:15'),
(69, 'Jacobi Jupe', 'Actor', 'persons/ufAlc87r65Tbr9EJ5z1wA3CC8a3t7ztgfTb6YQn2.webp', 'Jacobi Jupe (born July 2013) is a British actor, best known for portraying Hamnet Shakespeare in Hamnet (2025). He is also the younger brother of actor Noah Jupe.', NULL, NULL, '2026-02-28 05:25:47', '2026-02-28 05:25:47'),
(70, 'Joe Alwyn', 'Actor', 'persons/AhXM1ELOrhXUSCnbGPHrQxBfll3fna7V2Ldc0Sjl.webp', 'Joseph Matthew Alwyn (born 21 February 1991) is an English actor. Alwyn made his feature film debut as the titular character in Ang Lee\'s 2016 war drama Billy Lynn\'s Long Halftime Walk and has since played roles in films such as The Favourite (2018), Boy Erased (2018), Mary Queen of Scots (2018), Harriet (2019), Catherine Called Birdy (2022), and The Brutalist (2024), as well as the BBC and Hulu drama series Conversations with Friends (2022).', NULL, NULL, '2026-02-28 05:26:21', '2026-02-28 05:26:21'),
(71, 'Emily Watson', 'Actor', 'persons/ZjFDlxoJ3eiMI9RaLIgrjCbSva836OKATXscRrPN.webp', 'Emily Margaret Watson (born 14 January 1967) is an English actress. She began her career on stage and joined the Royal Shakespeare Company in 1992. In 2002, she starred in productions of Twelfth Night and Uncle Vanya at the Donmar Warehouse. She was nominated for the Olivier Award for Best Actress for the latter. She was nominated for the Academy Award for Best Actress for her debut film role as a newlywed in Lars von Trier\'s Breaking the Waves (1996) and for her portrayal of Jacqueline du Pré in Anand Tucker\'s Hilary and Jackie (1998).\r\n\r\nWatson\'s other films include The Boxer (1997), Angela\'s Ashes (1999), Gosford Park (2001),  Punch-Drunk Love (2002), Red Dragon (2002), The Life and Death of Peter Sellers (2004), Corpse Bride (2005), Miss Potter (2006), Synecdoche, New York (2008), Oranges and Sunshine (2010), War Horse (2011), The Theory of Everything (2014), Kingsman: The Golden Circle (2017), God\'s Creatures (2022), and Small Things like These (2024). \r\n\r\nShe was nominated for a Primetime Emmy Award and a Golden Globe Award for her role in the HBO miniseries Chernobyl. She won the British Academy Television Award for Best Actress for playing Janet Leach in the 2011 ITV television biopic Appropriate Adult. She was nominated for the International Emmy Award for Best Actress for the 2017 BBC miniseries Apple Tree Yard. In 2024, she portrayed the lead role of Valya Harkonnen in the HBO science fiction series Dune: Prophecy.', NULL, NULL, '2026-02-28 05:26:54', '2026-02-28 05:26:54'),
(72, 'Josh Safdie', 'Director', 'persons/uFcnClKoe6m5coqqvqojoCqwwcxIsKIVsVmGFoLy.webp', 'Joshua Henry Safdie (born April 3, 1984) is an American filmmaker and screenwriter, best known for his work with his younger brother, Benny Safdie, as one half of the acclaimed Safdie Brothers. Together, they developed a reputation for raw, urgent storytelling in films such as Heaven Knows What (2014), Good Time (2017), and Uncut Gems (2019).\r\n\r\nIn 2024, it was reported that the Safdie Brothers would no longer co-direct and would instead pursue solo projects. Josh’s first feature since the split is Marty Supreme, starring Timothée Chalamet, scheduled for release on December 25, 2025.', NULL, NULL, '2026-02-28 05:30:38', '2026-02-28 05:30:38'),
(73, 'Timothée Chalamet', 'Actor', 'persons/gyWHzB3UR8E3VLpy6XhRr0AVhTFo0VWfTiZ9PtnK.webp', 'Timothée Hal Chalamet (born December 27, 1995) is an American actor. He began his career appearing in the drama series Homeland in 2012. Two years later, he made his film debut in the comedy-drama Men, Women & Children and appeared in Christopher Nolan\'s science fiction film Interstellar. He came into attention in Luca Guadagnino\'s coming-of-age film Call Me by Your Name (2017). Alongside supporting roles in Greta Gerwig\'s films Lady Bird (2017) and Little Women (2019), he took on starring roles in Beautiful Boy (2018) and Dune (2021).', NULL, NULL, '2026-02-28 05:31:20', '2026-02-28 05:31:20'),
(74, 'Odessa A\'zion', 'Actor', 'persons/hMCnYBtWwrb5eb1TY86qEWpYYWwWS5LhZKkQviRz.webp', 'Odessa Zion Segall Adlon (born June 17, 2000), often known as Odessa A\'zion, is an American actress. On television, she is known for her roles in the CBS series Fam (2019), the Netflix series Grand Army (2020), and the HBO series I Love LA (2025). Her films include Hellraiser (2022), The Inhabitant (2022), Sitting in Bars with Cake (2023), Fresh Kills (2024), Until Dawn (2025), and Marty Supreme (2025).', NULL, NULL, '2026-02-28 05:31:54', '2026-02-28 05:31:54'),
(75, 'Eva Victor', 'Actor', 'persons/TPktPTr0yIAU4XqOlZtCqZVjMIjzQuJY16hFIAzS.webp', 'Eva Victor (born 1994) is an American actor, writer, and director. They featured in the television series Billions from 2020 to 2023. They made their directorial debut with the self-starring independent film Sorry, Baby (2025).', NULL, NULL, '2026-02-28 07:02:27', '2026-02-28 07:02:27'),
(76, 'Naomi Ackie', 'Actor', 'persons/4HDciOzj3dE3jXoOC53A3qrKrWcOAah1x3bvOuVd.webp', 'Naomi Sarah Ackie (born 22 August 1992) is an English actress. She is known for her television roles in The End of the F***ing World (2019), for which she won the BAFTA TV Award for Best Supporting Actress, and Master of None (2021). Her film roles include Star Wars: The Rise of Skywalker (2019), I Wanna Dance with Somebody (2022), Blink Twice (2024), Sorry, Baby (2025), and Mickey 17 (2025).', NULL, NULL, '2026-02-28 07:02:57', '2026-02-28 07:02:57');

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
(40, 'Arenamedia'),
(18, 'ARTE France Cinema'),
(41, 'Asghar Farhadi Productions'),
(47, 'Barunson E&A'),
(43, 'BBC Film'),
(44, 'BFI'),
(13, 'Cerita Films'),
(5, 'CJ Entertainment'),
(33, 'CoMix Wave Films'),
(48, 'Cre Film'),
(28, 'Das Kleine Fernsehspiel'),
(30, 'Excellent Cadaver'),
(49, 'FilmNation Entertaiment'),
(35, 'Forka Films'),
(52, 'Frenesy Film'),
(21, 'GDH'),
(39, 'Giraffe Pictures'),
(15, 'GKIDS Films'),
(36, 'Imajinari'),
(38, 'Jagartha'),
(12, 'Janus Films'),
(53, 'Kanoon'),
(54, 'Kiarostami Foundation'),
(51, 'La Cinéfacture'),
(3, 'Legendary Pictures'),
(50, 'Lilies Films'),
(20, 'Madman Films'),
(46, 'Marc Platt Productions'),
(42, 'Memento Films Production'),
(17, 'Mer Film'),
(37, 'Miles Films'),
(9, 'Moho Film'),
(16, 'NEON'),
(23, 'Palari Films'),
(7, 'Paramount Pictures'),
(22, 'Rekata Studio'),
(24, 'Searchlight Pictures'),
(31, 'Sikelia Productions'),
(25, 'SinemArt'),
(6, 'Sony Pictures'),
(34, 'Studio Ghibli'),
(26, 'Studio Rumah Kedua'),
(27, 'Studio Zentral'),
(45, 'Summit Entertainment'),
(29, 'The Associated Press'),
(14, 'TOHO'),
(2, 'Universal Pictures'),
(1, 'Warner Bros'),
(11, 'Wenders Images'),
(10, 'Yong Film'),
(19, 'ZDF/Arte');

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

--
-- Dumping data untuk tabel `ratings`
--

INSERT INTO `ratings` (`id`, `user_id`, `film_id`, `rating`, `created_at`, `updated_at`) VALUES
(1, 3, 2, 5, '2026-02-01 02:58:01', '2026-02-06 05:15:48'),
(2, 3, 1, 4, '2026-02-01 03:03:52', '2026-02-01 04:10:37'),
(3, 3, 3, 5, '2026-02-01 03:11:10', '2026-02-01 03:34:12'),
(4, 3, 4, 5, '2026-02-01 03:30:10', '2026-02-01 03:40:01'),
(5, 3, 15, 5, '2026-02-01 04:03:34', '2026-02-07 03:29:20'),
(6, 3, 5, 5, '2026-02-01 04:06:29', '2026-02-01 04:06:29'),
(7, 3, 6, 5, '2026-02-03 17:21:41', '2026-02-06 06:54:30'),
(8, 3, 16, 5, '2026-02-03 17:25:29', '2026-02-06 07:23:46'),
(9, 3, 7, 5, '2026-02-03 18:39:59', '2026-02-06 07:29:17'),
(10, 3, 19, 3, '2026-02-03 21:19:56', '2026-02-06 07:01:51'),
(11, 3, 27, 5, '2026-02-06 05:07:21', '2026-02-06 05:09:53'),
(12, 3, 24, 4, '2026-02-06 05:57:03', '2026-02-06 05:57:15'),
(13, 3, 26, 5, '2026-02-06 07:12:23', '2026-02-07 03:47:33'),
(14, 3, 10, 5, '2026-02-07 03:44:05', '2026-02-07 03:44:05'),
(15, 3, 11, 5, '2026-02-07 03:50:02', '2026-02-10 22:34:21'),
(16, 3, 34, 4, '2026-02-10 22:35:43', '2026-02-10 22:40:53'),
(17, 3, 37, 0, '2026-02-14 02:53:28', '2026-02-14 02:53:28'),
(18, 5, 37, 5, '2026-02-14 04:00:04', '2026-02-14 04:00:04'),
(19, 5, 2, 5, '2026-02-14 04:00:33', '2026-02-28 08:29:51'),
(20, 5, 34, 4, '2026-02-24 18:16:35', '2026-02-24 18:16:35'),
(21, 5, 10, 5, '2026-02-24 20:52:58', '2026-02-24 20:52:58'),
(22, 5, 14, 5, '2026-02-28 04:46:55', '2026-02-28 04:46:55'),
(23, 5, 42, 4, '2026-02-28 04:53:13', '2026-02-28 04:53:13'),
(24, 5, 30, 5, '2026-02-28 04:53:39', '2026-02-28 04:53:39'),
(25, 5, 41, 5, '2026-02-28 04:54:29', '2026-02-28 04:54:29');

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
  `is_liked` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether user liked this movie when writing review',
  `is_rewatched` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this review was written during a rewatch (not first watch)',
  `watched_at` date DEFAULT NULL COMMENT 'Date when the movie was watched',
  `status` enum('published','hidden','deleted','flagged') DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `film_id`, `rating`, `title`, `content`, `backdrop_path`, `is_spoiler`, `is_liked`, `is_rewatched`, `watched_at`, `status`, `created_at`, `updated_at`) VALUES
(5, 3, 19, 3, NULL, 'Jeleq banget dah, membingungkan', NULL, 0, 0, 0, NULL, 'published', '2026-02-06 07:02:11', '2026-02-06 07:02:11'),
(6, 3, 2, 5, NULL, 'Sangat sangat dibikin melongo banget', NULL, 0, 0, 0, NULL, 'published', '2026-02-06 07:33:09', '2026-03-01 03:52:10'),
(7, 3, 7, 5, NULL, 'tes', NULL, 0, 0, 0, NULL, 'published', '2026-02-07 03:13:46', '2026-02-07 03:13:46'),
(8, 3, 26, 4, NULL, 'Gila Bangt', NULL, 0, 0, 0, NULL, 'published', '2026-02-07 03:20:50', '2026-02-07 04:03:27'),
(9, 3, 15, 5, NULL, 'Emang bagus banget nget nget', NULL, 0, 0, 0, NULL, 'published', '2026-02-07 03:29:43', '2026-02-07 03:29:43'),
(10, 3, 6, 5, NULL, 'Kita kan tua dan kehilangan pegangan', NULL, 0, 0, 0, NULL, 'published', '2026-02-07 03:40:05', '2026-02-07 03:40:05'),
(11, 3, 10, 5, NULL, 'goood', NULL, 0, 1, 1, '2026-02-11', 'published', '2026-02-07 03:44:28', '2026-02-10 22:00:29'),
(12, 3, 16, 5, NULL, '<b><i>Ngantuk</i></b><b><i> baby</i></b>. <a href=\"https://tv8.lk21official.cc/secret-agent-2025\">Aku </a><a href=\"https://tv8.lk21official.cc/secret-agent-2025\">nonton</a><a href=\"https://tv8.lk21official.cc/secret-agent-2025\"> disini</a>', NULL, 0, 1, 0, '2026-02-01', 'published', '2026-02-07 04:16:39', '2026-02-07 04:50:15'),
(13, 3, 11, 5, NULL, 'tes', NULL, 0, 0, 1, '2026-02-11', 'published', '2026-02-10 22:34:28', '2026-02-10 22:34:28'),
(14, 3, 10, 5, NULL, 'tes', NULL, 0, 1, 1, '2026-02-11', 'published', '2026-02-10 22:34:52', '2026-02-10 22:34:52'),
(15, 3, 34, 4, NULL, 'tes', NULL, 0, 0, 0, '2026-02-11', 'published', '2026-02-10 22:52:49', '2026-02-10 22:52:49'),
(16, 3, 34, 4, NULL, 'tes22', NULL, 0, 0, 1, '2026-02-11', 'published', '2026-02-10 22:53:00', '2026-02-10 22:53:00'),
(17, 3, 34, 4, NULL, 'Aku suka sinema Horeg ini', NULL, 0, 0, 1, '2026-02-14', 'published', '2026-02-14 01:28:08', '2026-02-14 01:28:08'),
(18, 5, 37, 5, NULL, 'Keren, Absolut cinema', NULL, 0, 1, 0, '2026-02-14', 'published', '2026-02-14 04:00:21', '2026-02-14 04:00:21'),
(19, 5, 34, 4, NULL, 'Sangar', NULL, 0, 1, 0, '2026-02-25', 'published', '2026-02-24 18:16:47', '2026-02-24 18:16:47'),
(20, 5, 10, 5, NULL, 'Heartwarming', NULL, 0, 1, 0, '2026-02-25', 'published', '2026-02-24 20:53:12', '2026-02-24 20:53:12'),
(21, 5, 14, 5, NULL, 'Film yang dikemas dengan cara absurd, nyeleneh, simbolik, dan lucu. Bercerita tentang seorang pria (March) yang kehilangan istrinya (Nat) karena polusi debu, lalu sang istri kembali sebagai hantu di dalam vacuum cleaner. Film ini bukan hanya fokus pada romansa March dan Nat, melainkan pada trauma dan ingatan yang belum selesai. Saat tragedi penindakan militer 2010 di Bangkok disinggung, absurditasnya berubah menjadi satire pahit tentang memori kolektif yang tak bisa begitu saja disingkirkan.', NULL, 0, 1, 0, '2026-02-28', 'published', '2026-02-28 04:47:40', '2026-02-28 04:47:40'),
(22, 5, 42, 4, NULL, 'Astagfirullah', NULL, 0, 1, 0, '2026-02-28', 'published', '2026-02-28 04:53:23', '2026-02-28 04:53:23'),
(23, 5, 30, 5, NULL, 'Sedih banggettt', NULL, 0, 1, 0, '2026-02-28', 'published', '2026-02-28 04:53:49', '2026-02-28 04:53:49'),
(24, 5, 41, 5, NULL, 'Sunyi mamposss', NULL, 0, 1, 0, '2026-02-28', 'published', '2026-02-28 04:54:43', '2026-02-28 04:54:43'),
(25, 5, 2, 5, NULL, 'bAGUSSSS', NULL, 0, 1, 0, '2026-02-28', 'published', '2026-02-28 08:30:02', '2026-03-01 03:32:28');

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
  `status` enum('published','flagged','deleted','hidden') NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `review_comments`
--

INSERT INTO `review_comments` (`id`, `review_id`, `user_id`, `content`, `parent_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 12, 3, 'tes', NULL, 'published', '2026-02-07 05:11:31', '2026-02-07 05:11:31'),
(2, 12, 3, 'Oke', 1, 'published', '2026-02-10 18:25:45', '2026-02-10 18:25:45'),
(3, 12, 3, 'bagus', 2, 'published', '2026-02-10 18:26:42', '2026-02-10 18:26:42'),
(4, 12, 3, 'Waw', NULL, 'deleted', '2026-02-10 18:27:00', '2026-02-28 08:08:32'),
(5, 12, 3, 'oke', 4, 'published', '2026-02-10 18:27:07', '2026-02-10 18:27:07'),
(9, 11, 3, '<i><b><u>waw</u></b></i>', NULL, 'published', '2026-02-10 19:49:58', '2026-02-10 19:49:58'),
(10, 11, 3, '<b><i>ya</i></b>', NULL, 'published', '2026-02-10 20:07:51', '2026-02-10 20:07:51'),
(11, 11, 3, '[nonton disini](https://klikfilm.com/r/6940/50)', NULL, 'published', '2026-02-10 20:09:18', '2026-02-10 20:09:18'),
(12, 11, 3, '<a href=\"https://klikfilm.com/r/6940/50\">tonton disini</a>', NULL, 'published', '2026-02-10 21:24:04', '2026-02-10 21:24:04'),
(14, 20, 5, 'Tes', NULL, 'published', '2026-02-24 22:18:27', '2026-02-24 22:18:27'),
(15, 20, 3, 'tes lagi', 14, 'published', '2026-02-24 22:20:09', '2026-02-24 22:20:09'),
(16, 11, 5, 'Thanks', 12, 'published', '2026-02-24 22:30:49', '2026-02-24 22:30:49'),
(17, 11, 5, 'Tess', NULL, 'published', '2026-02-24 22:31:06', '2026-02-24 22:31:06'),
(18, 19, 3, 'Horeg banget jir', NULL, 'published', '2026-02-24 23:17:37', '2026-02-24 23:17:37'),
(20, 12, 5, 'HAI KAK MUTUALAN YOK', NULL, 'deleted', '2026-02-28 08:00:01', '2026-02-28 08:00:18'),
(23, 24, 5, 'Emang bagus ni film', NULL, 'published', '2026-02-28 08:28:08', '2026-02-28 08:28:08'),
(24, 25, 5, 'WOW', NULL, 'published', '2026-02-28 08:34:00', '2026-02-28 08:34:00'),
(25, 23, 5, 'WOW<br>', NULL, 'published', '2026-02-28 08:34:27', '2026-02-28 08:34:27'),
(26, 25, 5, 'Tes', NULL, 'published', '2026-02-28 08:41:20', '2026-02-28 08:41:20'),
(27, 25, 5, 'tes', NULL, 'published', '2026-02-28 09:09:08', '2026-02-28 09:09:08'),
(28, 25, 5, 'tes lagi', NULL, 'published', '2026-02-28 09:09:14', '2026-02-28 09:09:14'),
(29, 25, 5, 'lagi', 24, 'published', '2026-02-28 09:09:23', '2026-02-28 09:09:23');

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

--
-- Dumping data untuk tabel `review_likes`
--

INSERT INTO `review_likes` (`id`, `review_id`, `user_id`, `created_at`, `updated_at`) VALUES
(3, 20, 3, '2026-02-24 22:19:53', '2026-02-24 22:19:53'),
(4, 11, 5, '2026-02-24 22:30:23', '2026-02-24 22:30:23'),
(5, 19, 3, '2026-02-24 23:17:25', '2026-02-24 23:17:25'),
(6, 15, 5, '2026-02-28 08:32:43', '2026-02-28 08:32:43'),
(7, 6, 5, '2026-03-01 03:00:17', '2026-03-01 03:00:17'),
(9, 17, 5, '2026-03-01 03:01:27', '2026-03-01 03:01:27');

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
(3, 'Sengefilm', 'tes@gmail.com', '$2y$12$lDfKXQIoqKTaeAdU.FpQX.Oqu.8Plbzprn6YOMhkIa9KCLtHN1KTK', 'user', 'active', '2026-01-30 23:49:39', 'M3wxNzcyMDAxMTY2fDY5OWU5NzhlYzZkMzI=', '2026-01-30 23:49:39', '2026-02-24 23:32:46'),
(4, 'NewUser185', 'newuser_1769846806@test.com', '$2y$12$r0tcTwJt.eLjMs1n5pgdi.k9gPXqhujHx90XqkT0QMgkNLXZHrmly', 'user', 'active', '2026-01-31 01:06:46', 'bmV3dXNlcl8xNzY5ODQ2ODA2QHRlc3QuY29tfDE3Njk4NDY4MDZ8Njk3ZGI4MTY3Njk0Zg==', '2026-01-31 01:06:46', '2026-01-31 01:06:46'),
(5, 'Mafia film', 'filmin@gmail.com', '$2y$12$eO1QTww7vMctvv7QWvNk0uB9Bk2C/aedqb./wlW.Q9dURDjbKISZG', 'user', 'active', '2026-02-14 03:59:49', 'NXwxNzcyMjczNTA3fDY5YTJiZjYzNTlkMDQ=', '2026-02-14 03:59:49', '2026-02-28 03:11:47'),
(6, 'Mopud', 'NewAcc@gmail.com', '$2y$12$5IZiuwVxT4H79twcw314mOyI.SUlG9nYY2.vjNVqCcw9uQE4wiLgq', 'user', 'active', '2026-02-28 03:10:19', 'TmV3QWNjQGdtYWlsLmNvbXwxNzcyMjczNDE4fDY5YTJiZjBhZTc0ZjA=', '2026-02-28 03:10:19', '2026-02-28 03:10:19');

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

--
-- Dumping data untuk tabel `user_activities`
--

INSERT INTO `user_activities` (`id`, `user_id`, `type`, `film_id`, `meta`, `created_at`, `updated_at`) VALUES
(1, 5, 'follow', NULL, '{\"followed_user_id\":\"3\"}', '2026-02-24 22:29:34', '2026-02-24 22:29:34'),
(2, 5, 'like_review', 10, '{\"review_id\":\"11\",\"review_owner_id\":3}', '2026-02-24 22:30:23', '2026-02-24 22:30:23'),
(3, 5, 'reply_comment', 10, '{\"review_id\":\"11\",\"parent_comment_id\":\"12\",\"comment_id\":16,\"parent_comment_owner_id\":3}', '2026-02-24 22:30:49', '2026-02-24 22:30:49'),
(4, 5, 'comment_review', 10, '{\"review_id\":\"11\",\"comment_id\":17,\"review_owner_id\":3}', '2026-02-24 22:31:06', '2026-02-24 22:31:06'),
(5, 3, 'like_review', 34, '{\"review_id\":\"19\",\"review_owner_id\":5}', '2026-02-24 23:17:25', '2026-02-24 23:17:25'),
(6, 3, 'comment_review', 34, '{\"review_id\":\"19\",\"comment_id\":18,\"review_owner_id\":5}', '2026-02-24 23:17:37', '2026-02-24 23:17:37'),
(7, 6, 'follow', NULL, '{\"followed_user_id\":\"3\"}', '2026-02-28 03:10:44', '2026-02-28 03:10:44'),
(8, 6, 'follow', NULL, '{\"followed_user_id\":\"5\"}', '2026-02-28 03:11:08', '2026-02-28 03:11:08'),
(9, 5, 'follow', NULL, '{\"followed_user_id\":\"6\"}', '2026-02-28 03:12:04', '2026-02-28 03:12:04'),
(10, 5, 'comment_review', 34, '{\"review_id\":\"17\",\"comment_id\":19,\"review_owner_id\":3}', '2026-02-28 07:30:19', '2026-02-28 07:30:19'),
(11, 5, 'comment_review', 16, '{\"review_id\":\"12\",\"comment_id\":20,\"review_owner_id\":3}', '2026-02-28 08:00:01', '2026-02-28 08:00:01'),
(12, 5, 'comment_review', 34, '{\"review_id\":\"17\",\"comment_id\":21,\"review_owner_id\":3}', '2026-02-28 08:15:58', '2026-02-28 08:15:58'),
(13, 5, 'reply_comment', 34, '{\"review_id\":\"17\",\"parent_comment_id\":\"21\",\"comment_id\":22,\"parent_comment_owner_id\":5}', '2026-02-28 08:16:36', '2026-02-28 08:16:36'),
(14, 5, 'comment_review', 41, '{\"review_id\":\"24\",\"comment_id\":23,\"review_owner_id\":5}', '2026-02-28 08:28:08', '2026-02-28 08:28:08'),
(15, 5, 'follow', NULL, '{\"followed_user_id\":\"6\"}', '2026-02-28 08:32:26', '2026-02-28 08:32:26'),
(16, 5, 'like_review', 34, '{\"review_id\":\"15\",\"review_owner_id\":3}', '2026-02-28 08:32:43', '2026-02-28 08:32:43'),
(17, 5, 'comment_review', 2, '{\"review_id\":\"25\",\"comment_id\":24,\"review_owner_id\":5}', '2026-02-28 08:34:00', '2026-02-28 08:34:00'),
(18, 5, 'comment_review', 30, '{\"review_id\":\"23\",\"comment_id\":25,\"review_owner_id\":5}', '2026-02-28 08:34:27', '2026-02-28 08:34:27'),
(19, 5, 'comment_review', 2, '{\"review_id\":\"25\",\"comment_id\":26,\"review_owner_id\":5}', '2026-02-28 08:41:20', '2026-02-28 08:41:20'),
(20, 5, 'comment_review', 2, '{\"review_id\":\"25\",\"comment_id\":27,\"review_owner_id\":5}', '2026-02-28 09:09:08', '2026-02-28 09:09:08'),
(21, 5, 'comment_review', 2, '{\"review_id\":\"25\",\"comment_id\":28,\"review_owner_id\":5}', '2026-02-28 09:09:14', '2026-02-28 09:09:14'),
(22, 5, 'reply_comment', 2, '{\"review_id\":\"25\",\"parent_comment_id\":\"24\",\"comment_id\":29,\"parent_comment_owner_id\":5}', '2026-02-28 09:09:23', '2026-02-28 09:09:23'),
(23, 5, 'like_review', 2, '{\"review_id\":\"6\",\"review_owner_id\":3}', '2026-03-01 03:00:17', '2026-03-01 03:00:17'),
(24, 5, 'like_review', 34, '{\"review_id\":\"17\",\"review_owner_id\":3}', '2026-03-01 03:01:25', '2026-03-01 03:01:25'),
(25, 5, 'like_review', 34, '{\"review_id\":\"17\",\"review_owner_id\":3}', '2026-03-01 03:01:27', '2026-03-01 03:01:27');

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
(218, 3, 33, 1, '2026-02-14 02:58:25', '2026-02-14 02:58:25'),
(219, 3, 4, 2, '2026-02-14 02:58:25', '2026-02-14 02:58:25'),
(220, 3, 3, 3, '2026-02-14 02:58:25', '2026-02-14 02:58:25'),
(221, 3, 2, 4, '2026-02-14 02:58:25', '2026-02-14 02:58:25'),
(282, 5, 30, 1, '2026-02-24 20:51:30', '2026-02-24 20:51:30'),
(283, 5, 14, 2, '2026-02-24 20:51:30', '2026-02-24 20:51:30'),
(284, 5, 42, 3, '2026-02-24 20:51:30', '2026-02-24 20:51:30'),
(285, 5, 37, 4, '2026-02-24 20:51:30', '2026-02-24 20:51:30');

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
(1, 3, 'Sengefilm', 'profiles/profile_3_1769941056.jpg', 'movies/33/backdrop/aEQkBKlhO1OJePmQyzPxnu9sMW1nOyLsxw2HSEVb.webp', 1, 'Tes', 'Sidoarjo, Indonesia', '2026-01-31 00:38:49', '2026-02-14 02:58:25'),
(2, 4, 'NewUser185', NULL, NULL, 0, NULL, NULL, '2026-01-31 01:06:46', '2026-01-31 01:06:46'),
(3, 1, NULL, NULL, NULL, 1, 'This is my new bio', NULL, '2026-01-31 03:41:40', '2026-01-31 03:41:40'),
(4, 5, 'Mafia film', 'profiles/profile_5_1771067279.jpg', 'movies/30/backdrop/WcvLzELjaCn7l5vXy52iqwdXPfW3hSq4zqFiLKn7.webp', 1, NULL, NULL, '2026-02-14 03:59:49', '2026-02-24 20:51:30'),
(5, 6, 'Mopud', NULL, NULL, 0, NULL, NULL, '2026-02-28 03:10:19', '2026-02-28 03:10:19');

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
-- Dumping data untuk tabel `watchlists`
--

INSERT INTO `watchlists` (`id`, `user_id`, `film_id`, `created_at`, `updated_at`) VALUES
(2, 3, 13, '2026-02-03 20:36:44', NULL),
(3, 3, 14, '2026-02-03 20:41:10', NULL),
(4, 3, 17, '2026-02-03 20:56:41', NULL);

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
  ADD KEY `diaries_watched_at_index` (`watched_at`),
  ADD KEY `diaries_review_id_index` (`review_id`),
  ADD KEY `diaries_rating_index` (`rating`),
  ADD KEY `diaries_is_liked_index` (`is_liked`),
  ADD KEY `diaries_is_rewatched_index` (`is_rewatched`);

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
  ADD KEY `movie_services_ibfk_2` (`service_id`),
  ADD KEY `idx_coming_soon` (`is_coming_soon`);

--
-- Indeks untuk tabel `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_film_id_foreign` (`film_id`),
  ADD KEY `notifications_user_id_index` (`user_id`),
  ADD KEY `notifications_actor_id_index` (`actor_id`),
  ADD KEY `notifications_type_index` (`type`),
  ADD KEY `notifications_is_read_index` (`is_read`),
  ADD KEY `notifications_created_at_index` (`created_at`);

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
  ADD KEY `reviews_created_at_index` (`created_at`),
  ADD KEY `reviews_is_liked_index` (`is_liked`),
  ADD KEY `reviews_watched_at_index` (`watched_at`),
  ADD KEY `reviews_is_rewatched_index` (`is_rewatched`);

--
-- Indeks untuk tabel `review_comments`
--
ALTER TABLE `review_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `review_comments_review_id_index` (`review_id`),
  ADD KEY `review_comments_user_id_index` (`user_id`),
  ADD KEY `review_comments_parent_id_index` (`parent_id`),
  ADD KEY `review_comments_created_at_index` (`created_at`),
  ADD KEY `review_comments_status_index` (`status`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT untuk tabel `diaries`
--
ALTER TABLE `diaries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT untuk tabel `followers`
--
ALTER TABLE `followers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT untuk tabel `genres`
--
ALTER TABLE `genres`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT untuk tabel `languages`
--
ALTER TABLE `languages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT untuk tabel `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT untuk tabel `movies`
--
ALTER TABLE `movies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT untuk tabel `movie_likes`
--
ALTER TABLE `movie_likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT untuk tabel `movie_media`
--
ALTER TABLE `movie_media`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- AUTO_INCREMENT untuk tabel `movie_persons`
--
ALTER TABLE `movie_persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT untuk tabel `movie_services`
--
ALTER TABLE `movie_services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=214;

--
-- AUTO_INCREMENT untuk tabel `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT untuk tabel `persons`
--
ALTER TABLE `persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT untuk tabel `production_houses`
--
ALTER TABLE `production_houses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT untuk tabel `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `review_comments`
--
ALTER TABLE `review_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT untuk tabel `review_likes`
--
ALTER TABLE `review_likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `user_activities`
--
ALTER TABLE `user_activities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT untuk tabel `user_favorite_films`
--
ALTER TABLE `user_favorite_films`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;

--
-- AUTO_INCREMENT untuk tabel `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `watchlists`
--
ALTER TABLE `watchlists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `diaries`
--
ALTER TABLE `diaries`
  ADD CONSTRAINT `diaries_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `diaries_review_id_foreign` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE SET NULL,
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
-- Ketidakleluasaan untuk tabel `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_film_id_foreign` FOREIGN KEY (`film_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
