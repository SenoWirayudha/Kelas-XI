-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 11 Feb 2026 pada 07.08
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
(24, 3, 34, 16, '2026-02-11', 4, 0, 'tes22', 1, '2026-02-10 22:53:00', '2026-02-10 22:53:00');

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
(27, '2026_02_11_add_is_rewatched_to_diaries', 7);

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
(5, 'Resurrection', '2025', 160, 'R', 'In a future where humanity has surrendered its ability to dream in exchange for immortality, an outcast finds illusion, nightmarish visions, and beauty in an intoxicating world of his own making.', 'movies/5/poster/iXl1MJ57vGlRi2GvQFLgPYmsifXdgikhRepquaqC.webp', 'movies/5/backdrop/P23DLxZaJZ1S6XAnAuhfJ4SloMLfLIuLBIlv4Wav.webp', NULL, 'published', '2026-01-30 06:37:18', '2026-02-06 07:20:55'),
(6, 'Sore: Istri Dari Masa Depan', '2025', 119, 'PG', 'A young man living alone in Croatia encounters a woman who claims to be his wife from the future, sent on a mission to help him correct his bad habits and improve his lifestyle.', 'movies/6/poster/FhAgMgFumfx1blIzWkSBy4FyN0CxfW59fzpiPhYn.webp', 'movies/6/backdrop/c2nt7XkzgOZ8T5RC2qIKTuVn1zke4C3Qgu9JZKTZ.webp', 'https://youtu.be/CZJWXm5KKyM?si=78R4C1eRm3FNYdrv', 'published', '2026-01-30 22:53:21', '2026-01-30 23:02:35'),
(7, 'Jatuh Cinta Seperti di Film-Film', '2023', 118, 'PG-13', 'Bagus, a screenwriter, reunites with his high school friend and crush, Hana, who is still grieving from the loss of her husband. He wants to convince her to fall in love once again, just like in the movies.', 'movies/7/poster/mvjIEh7YHK6ruRW6cFlomGqB1zhiGCHrlmhRnlma.webp', 'movies/7/backdrop/ztVPySl8mh5j6V5AHd3cSgh4HS41NJ06oj07wiyu.webp', 'https://youtu.be/F6jPobzz-ag?si=qEEc1W9VBvl_QaO1', 'published', '2026-01-30 23:06:54', '2026-01-30 23:10:24'),
(8, '\"Wuthering Heights\"', '2026', 136, 'R', 'Tragedy strikes when Heathcliff falls in love with Catherine Earnshaw, a woman from a wealthy family in 18th-century England.', 'movies/8/poster/uuaS50XVV9EDYQYtvbTe41EQqv5fFVWKShQo3sbs.webp', 'movies/8/backdrop/Na2VQgAGvNfG32r8ZkBcW6gYUlz6bk6g5j7IMi0u.webp', NULL, 'published', '2026-01-30 23:23:17', '2026-01-30 23:28:09'),
(9, 'Kokuho', '2025', 174, 'R', 'Nagasaki, 1964: Following the death of his yakuza father, 15-year-old Kikuo is taken under the wing of a famous kabuki actor. Alongside Shunsuke, the actor’s only son, he decides to dedicate himself to this traditional form of theatre. For decades, the two young men grow and evolve together – and one will become the greatest Japanese master of the art of kabuki.', 'movies/9/poster/jjU63J5nEzTMsQCgJUs3i4RBo5tj8gschDTVHyxd.webp', 'movies/9/backdrop/yxvyoYjoyyKIcnI5NEpHYZZO2yxHnUfflVQynODO.webp', NULL, 'published', '2026-01-31 02:47:29', '2026-01-31 02:52:01'),
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
(20, 'Poor Things', '2023', 141, 'NC-17', 'Brought back to life by an unorthodox scientist, a young woman runs off with a lawyer on a whirlwind adventure across the continents. Free from the prejudices of her times, she grows steadfast in her purpose to stand for equality and liberation.', 'movies/20/poster/4YEx2aWuFh9snIfXwSlUa4bLHNm48M6c4m11bkRM.webp', 'movies/20/backdrop/75bZ6AHxuZgpFzYdLv4VzHDxbYSQssTh20zv0HMQ.webp', NULL, 'published', '2026-02-03 17:14:03', '2026-02-03 17:18:33'),
(21, 'My Therapist Said, I am Full of Sadness', '2024', 22, 'R', 'Monica scours archive material for answers to the question of how queer life in Berlin and the wish to be accepted by her Christian-Indonesian parents can be reconciled.', 'movies/21/poster/kt3CRvLrQtFl9mTZei9RdutKksGRLYho2rexrmj2.webp', 'movies/21/backdrop/UfjtEHvAUDkdlmlaTwEwnpNFhghXeUqbYtPuTtwd.webp', 'https://youtu.be/7SLivyKN0bs?si=WhA4fAt1Vlsu8unM', 'published', '2026-02-06 04:24:45', '2026-02-06 04:34:38'),
(22, 'Sammi, Who Can Detach His Body Parts', '2025', 19, NULL, 'Sammi has the ability to remove parts of his body and give them to those he loves and wants to help. After his death, Sammi’s mother goes in search of the pieces of her son.', 'movies/22/poster/30UsvBs7vqeNgJM7LcPSGYkFirTyPsf7aCiuRuO0.jpg', 'movies/22/backdrop/ZsI4A5LzJcEsAYcKvrYarsRer7SfTuq6lmzFFi2T.webp', 'https://youtu.be/03sTav1C6y0?si=TREzmLut1e_Q9Ivu', 'published', '2026-02-06 04:26:35', '2026-02-06 04:35:48'),
(23, 'The Love That Remains', '2025', 109, 'R', 'Tenderly captures a year in the life of a family as the parents navigate their separation. Through both playful and heartfelt moments, the film portrays the bittersweet essence of faded love and shared memories amidst the changing seasons.', 'movies/23/poster/DrP87pWyrUZBgfznaBHLroKqZDIsMnXs9ofgy9V8.webp', 'movies/23/backdrop/vTbi3LW7vmo2hGcKnWR4eNvdD15QUZIXSavF5Kt8.webp', 'https://youtu.be/jZ0fdmesr-w?si=lJO1fmyxLBaYkKZB', 'published', '2026-02-06 04:37:48', '2026-02-07 02:05:35'),
(24, 'Sound of Falling', '2025', 148, 'NC-17', 'Four adolescent girls each spend their youth in the same farmhouse over the last century. Though separated by decades, resonances between their lives emerge: their desires and distress, secrets and truths, encounters with another’s gaze and defiant gaze in return.', 'movies/24/poster/vMsNSkLA6mu5D5b0bNAoG7aOalbB3xr90quOcoIH.webp', 'movies/24/backdrop/RAL29SVvfa0YlZy6W70eR2UisPbSMtVE6DnSkJEN.webp', 'https://youtu.be/O-jgGbvLgVo?si=3WwrqgIYiQ7TjctK', 'published', '2026-02-06 04:44:33', '2026-02-06 04:53:26'),
(25, '2000 Meters to Andriivka', '2025', 108, 'PG-13', 'Amid the failing counteroffensive, a journalist follows a Ukrainian platoon on their mission to traverse one mile of heavily fortified forest and liberate a strategic village from Russian occupation. But the farther they advance through their destroyed homeland, the more they realize that this war may never end.', 'movies/25/poster/jRSgm2GRI5NC0gkyOg3TwN4i2TIgXufIF2RAu2e4.webp', 'movies/25/backdrop/RCDHk5ORYx2jhNjiZpEZ31oZhsxx8bjVgNQSLMVL.webp', 'https://youtu.be/xRSPxuptLd8?si=0I64QHlrBmWEv3Kn', 'published', '2026-02-06 04:49:54', '2026-02-06 04:53:19'),
(26, 'Die My Love', '2025', 119, 'NC-17', 'After inheriting a remote Montana house, Jackson moves there from New York with his partner Grace, and the couple soon welcome a child. As Jackson becomes increasingly absent and rural isolation sets in, Grace struggles with loneliness, creative frustration, and unresolved emotional wounds. What begins as an attempt at renewal gradually turns into an intense psychological descent, placing strain on their relationship and exposing the fragile balance between love, identity, and motherhood.', 'movies/26/poster/3nWTBsL85E6puz9teGu3AkDzTjx2QUZD83Ccq5e1.webp', 'movies/26/backdrop/kQvKAEPLX4ubRkCXJzNVABkDKj9x0hnWRKKxNH7g.webp', 'https://youtu.be/2jzXHW6Qe70?si=2UeziX7FgFAUBX4W', 'published', '2026-02-06 04:55:07', '2026-02-06 05:38:19'),
(27, 'No Other Choice', '2025', 139, 'R', 'Setelah dipecat dan dipermalukan oleh pasar kerja yang kejam, seorang manajer pabrik kertas veteran terjerumus ke dalam kekerasan dalam upaya putus asa untuk mendapatkan kembali martabatnya.', 'movies/27/poster/dpsNHS38E2Rdmf5py1UyQ1CjTAGBFUE0diXyXLUU.webp', 'movies/27/backdrop/ofuU8scBdFLhCWTN8DlR3KPhH4tUrE3oiCZaEqnb.webp', 'https://youtu.be/HKZpuG_ezvY?si=0ZqNtP-269EBaAxu', 'published', '2026-02-06 05:01:21', '2026-02-06 05:06:28'),
(28, 'Your Name.', '2016', 106, 'G', 'High schoolers Mitsuha and Taki are complete strangers living separate lives. But one night, they suddenly switch places. Mitsuha wakes up in Taki’s body, and he in hers. This bizarre occurrence continues to happen randomly, and the two must adjust their lives around each other.', 'movies/28/poster/6ysHamTKUPGnR5u87iaGZuS2KS3iP3NKNXga6V9L.webp', 'movies/28/backdrop/NbTOiql5BChwEwB4zhjGXvxwWpDWnU0N8ToIdRpj.webp', 'https://youtu.be/xU47nhruN-Q?si=7PpOyW94Tx0L9hmB', 'published', '2026-02-07 01:48:11', '2026-02-07 02:04:42'),
(29, 'Ponyo', '2008', 100, 'G', 'When Sosuke, a young boy who lives on a clifftop overlooking the sea, rescues a stranded goldfish named Ponyo, he discovers more than he bargained for. Ponyo is a curious, energetic young creature who yearns to be human, but even as she causes chaos around the house, her father, a powerful sorcerer, schemes to return Ponyo to the sea.', 'movies/29/poster/B0QMbELlOTmq5uMN3Pai2qTWT4oXkn49DbuDDini.webp', 'movies/29/backdrop/BfeG9CBUqy0NQywmRViGM4lCMsnlQwKaR5upnDAM.webp', 'https://youtu.be/h6XP82TyFWw?si=zooozS-BdbJiFZC_', 'published', '2026-02-07 02:00:21', '2026-02-07 02:04:33'),
(30, 'Hamnet', '2025', 126, 'PG-13', 'The powerful story of love and loss that inspired the creation of Shakespeare\'s timeless masterpiece, Hamlet.', 'movies/30/poster/krUjfCdqoImYYS6FYaAw4X9oW3F1gJs5fPN6m2FU.webp', 'movies/30/backdrop/BcCXuv2Bbf6JT1he4wzbuaq5qr0MctMFGg6nlaGt.webp', 'https://youtu.be/xYcgQMxQwmk?si=wdQswysXXgi61e6L', 'published', '2026-02-07 02:50:18', '2026-02-07 02:55:39'),
(31, 'Marty Supreme', '2025', 150, 'R', 'Marty Mauser, a young man with a dream no one respects, goes to hell and back in pursuit of greatness.', 'movies/31/poster/7i8w1eBBicdFWL8Hr7Rb1U5c9Rq7zCMF4KVZ0e4b.webp', 'movies/31/backdrop/XIApNBZz0xgsqOK466QBIWiG648Oxsmt9nEYGKSM.webp', 'https://youtu.be/s9gSuKaKcqM?si=eVioWdw8Y1PAcMvN', 'published', '2026-02-07 02:53:09', '2026-02-07 02:55:27'),
(32, 'Empat Musim Pertiwi', '2026', NULL, NULL, 'Released from prison, a woman returns to her village and tries to face the four seasons of her past. The lack of welcome from the villagers, and even her family, leads her into a power that is hidden underneath the fog. Aiming to heal, a sexual assault survivor takes a journey to redefine her own meaning of home, family, and peace.', 'movies/32/poster/sfI4BqK2JF0PFbVxRSyjlOrZTHTTflS63hZ16MWD.webp', 'movies/32/backdrop/082ckOHMdnSOw49yhrIneepvnUp5c2uEAvXTnv33.webp', NULL, 'published', '2026-02-07 02:58:07', '2026-02-07 03:15:16'),
(33, 'Memoir of a Snail', '2024', 94, 'R', 'Life can only be understood backwards, but we have to live it forwards.\r\n\r\nForcibly separated from her twin brother when they are orphaned, a melancholic misfit learns how to find confidence within herself amid the clutter of misfortunes and everyday life.', 'movies/33/poster/J5owMINkJ3DonUXRwHI1HGjxuQsX6k4QRVsOLDlz.webp', 'movies/33/backdrop/aEQkBKlhO1OJePmQyzPxnu9sMW1nOyLsxw2HSEVb.webp', NULL, 'published', '2026-02-07 04:28:03', '2026-02-07 04:29:52'),
(34, 'Sirāt', '2025', 115, 'PG-13', 'A man and his son arrive at a rave lost in the mountains of Morocco. They are looking for Marina, their daughter and sister, who disappeared months ago at another rave. Driven by fate, they decide to follow a group of ravers in search of one last party, in hopes Marina will be there.', 'movies/34/poster/JSGyu7yh2e361AgDYmiKsaektf0tulHoMP5dUt7t.webp', 'movies/34/backdrop/P6zjYdmEnbGl2zhJ4MKJgpznDVt2Vd6zAEvIx8aG.webp', NULL, 'published', '2026-02-10 17:29:02', '2026-02-10 17:31:29');

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
(34, 11);

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
(34, 13);

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
(34, 11);

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
(15, 3, 10, '2026-02-07 03:44:06');

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
(78, 27, 'backdrop', 'movies/27/backdrop/ofuU8scBdFLhCWTN8DlR3KPhH4tUrE3oiCZaEqnb.webp', 1, '2026-02-06 12:06:15'),
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
(97, 34, 'backdrop', 'movies/34/backdrop/P6zjYdmEnbGl2zhJ4MKJgpznDVt2Vd6zAEvIx8aG.webp', 1, '2026-02-11 00:30:48');

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
(34, 16);

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
(56, 14, 11, 'stream', '2026-02-17', 1),
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
(129, 9, 9, 'stream', '2026-02-18', 0),
(130, 9, 10, 'stream', '2026-02-18', 0),
(131, 9, 12, 'stream', '2026-02-18', 0),
(132, 17, 9, 'stream', '2026-04-23', 0),
(133, 17, 10, 'stream', '2026-04-23', 0),
(134, 17, 12, 'stream', '2026-04-23', 0),
(139, 29, 1, 'stream', NULL, 0),
(141, 23, 11, 'stream', NULL, 0),
(142, 28, 5, 'rent', NULL, 0),
(143, 28, 5, 'buy', NULL, 0),
(150, 30, 9, 'stream', '2026-02-27', 0),
(151, 30, 10, 'stream', '2026-02-27', 0),
(152, 30, 12, 'stream', '2026-02-27', 0),
(159, 32, 9, 'stream', NULL, 1),
(160, 32, 10, 'stream', NULL, 1),
(161, 32, 12, 'stream', NULL, 1),
(163, 33, 11, 'stream', NULL, 0),
(165, 34, 11, 'rent', '2026-02-14', 0),
(166, 12, 11, 'rent', '2026-03-26', 0);

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
(40, 'Arenamedia'),
(18, 'ARTE France Cinema'),
(13, 'Cerita Films'),
(5, 'CJ Entertainment'),
(33, 'CoMix Wave Films'),
(28, 'Das Kleine Fernsehspiel'),
(30, 'Excellent Cadaver'),
(35, 'Forka Films'),
(21, 'GDH'),
(39, 'Giraffe Pictures'),
(15, 'GKIDS Films'),
(36, 'Imajinari'),
(38, 'Jagartha'),
(12, 'Janus Films'),
(3, 'Legendary Pictures'),
(20, 'Madman Films'),
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
(16, 3, 34, 4, '2026-02-10 22:35:43', '2026-02-10 22:40:53');

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
  `watched_at` date DEFAULT NULL COMMENT 'Date when the movie was watched',
  `status` enum('published','hidden','deleted') NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `reviews`
--

INSERT INTO `reviews` (`id`, `user_id`, `film_id`, `rating`, `title`, `content`, `backdrop_path`, `is_spoiler`, `is_liked`, `watched_at`, `status`, `created_at`, `updated_at`) VALUES
(5, 3, 19, 3, NULL, 'Jeleq banget dah, membingungkan', NULL, 0, 0, NULL, 'published', '2026-02-06 07:02:11', '2026-02-06 07:02:11'),
(6, 3, 2, 5, NULL, 'Sangat sangat dibikin melongo banget', NULL, 0, 0, NULL, 'published', '2026-02-06 07:33:09', '2026-02-07 03:01:34'),
(7, 3, 7, 5, NULL, 'tes', NULL, 0, 0, NULL, 'published', '2026-02-07 03:13:46', '2026-02-07 03:13:46'),
(8, 3, 26, 4, NULL, 'Gila Bangt', NULL, 0, 0, NULL, 'published', '2026-02-07 03:20:50', '2026-02-07 04:03:27'),
(9, 3, 15, 5, NULL, 'Emang bagus banget nget nget', NULL, 0, 0, NULL, 'published', '2026-02-07 03:29:43', '2026-02-07 03:29:43'),
(10, 3, 6, 5, NULL, 'Kita kan tua dan kehilangan pegangan', NULL, 0, 0, NULL, 'published', '2026-02-07 03:40:05', '2026-02-07 03:40:05'),
(11, 3, 10, 5, NULL, 'goood', NULL, 0, 1, '2026-02-11', 'published', '2026-02-07 03:44:28', '2026-02-10 22:00:29'),
(12, 3, 16, 5, NULL, '<b><i>Ngantuk</i></b><b><i> baby</i></b>. <a href=\"https://tv8.lk21official.cc/secret-agent-2025\">Aku </a><a href=\"https://tv8.lk21official.cc/secret-agent-2025\">nonton</a><a href=\"https://tv8.lk21official.cc/secret-agent-2025\"> disini</a>', NULL, 0, 1, '2026-02-01', 'published', '2026-02-07 04:16:39', '2026-02-07 04:50:15'),
(13, 3, 11, 5, NULL, 'tes', NULL, 0, 0, '2026-02-11', 'published', '2026-02-10 22:34:28', '2026-02-10 22:34:28'),
(14, 3, 10, 5, NULL, 'tes', NULL, 0, 1, '2026-02-11', 'published', '2026-02-10 22:34:52', '2026-02-10 22:34:52'),
(15, 3, 34, 4, NULL, 'tes', NULL, 0, 0, '2026-02-11', 'published', '2026-02-10 22:52:49', '2026-02-10 22:52:49'),
(16, 3, 34, 4, NULL, 'tes22', NULL, 0, 0, '2026-02-11', 'published', '2026-02-10 22:53:00', '2026-02-10 22:53:00');

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

--
-- Dumping data untuk tabel `review_comments`
--

INSERT INTO `review_comments` (`id`, `review_id`, `user_id`, `content`, `parent_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 12, 3, 'tes', NULL, 'published', '2026-02-07 05:11:31', '2026-02-07 05:11:31'),
(2, 12, 3, 'Oke', 1, 'published', '2026-02-10 18:25:45', '2026-02-10 18:25:45'),
(3, 12, 3, 'bagus', 2, 'published', '2026-02-10 18:26:42', '2026-02-10 18:26:42'),
(4, 12, 3, 'Waw', NULL, 'published', '2026-02-10 18:27:00', '2026-02-10 18:27:00'),
(5, 12, 3, 'oke', 4, 'published', '2026-02-10 18:27:07', '2026-02-10 18:27:07'),
(9, 11, 3, '<i><b><u>waw</u></b></i>', NULL, 'published', '2026-02-10 19:49:58', '2026-02-10 19:49:58'),
(10, 11, 3, '<b><i>ya</i></b>', NULL, 'published', '2026-02-10 20:07:51', '2026-02-10 20:07:51'),
(11, 11, 3, '[nonton disini](https://klikfilm.com/r/6940/50)', NULL, 'published', '2026-02-10 20:09:18', '2026-02-10 20:09:18'),
(12, 11, 3, '<a href=\"https://klikfilm.com/r/6940/50\">tonton disini</a>', NULL, 'published', '2026-02-10 21:24:04', '2026-02-10 21:24:04');

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
(214, 3, 5, 1, '2026-02-06 07:26:42', '2026-02-06 07:26:42'),
(215, 3, 4, 2, '2026-02-06 07:26:42', '2026-02-06 07:26:42'),
(216, 3, 3, 3, '2026-02-06 07:26:42', '2026-02-06 07:26:42'),
(217, 3, 2, 4, '2026-02-06 07:26:42', '2026-02-06 07:26:42');

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
(1, 3, 'Sengefilm', 'profiles/profile_3_1769941056.jpg', 'movies/5/backdrop/SOVrGZN8Cw58AepzvBDFS9IQKkIVgRfw7gL7BTZZ.webp', 1, 'Tes', 'Sidoarjo, Indonesia', '2026-01-31 00:38:49', '2026-02-06 07:26:42'),
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
  ADD KEY `reviews_watched_at_index` (`watched_at`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT untuk tabel `diaries`
--
ALTER TABLE `diaries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT untuk tabel `followers`
--
ALTER TABLE `followers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT untuk tabel `movies`
--
ALTER TABLE `movies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT untuk tabel `movie_likes`
--
ALTER TABLE `movie_likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT untuk tabel `movie_media`
--
ALTER TABLE `movie_media`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT untuk tabel `movie_persons`
--
ALTER TABLE `movie_persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT untuk tabel `movie_services`
--
ALTER TABLE `movie_services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=167;

--
-- AUTO_INCREMENT untuk tabel `persons`
--
ALTER TABLE `persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `production_houses`
--
ALTER TABLE `production_houses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT untuk tabel `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT untuk tabel `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT untuk tabel `review_comments`
--
ALTER TABLE `review_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=218;

--
-- AUTO_INCREMENT untuk tabel `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
