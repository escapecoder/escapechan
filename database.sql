-- Adminer 4.8.1 MySQL 8.0.45-0ubuntu0.24.04.1 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `title` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `text` mediumtext COLLATE utf8mb4_general_ci,
  `timestamp` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `bans`;
CREATE TABLE `bans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip_subnet` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `reason` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `type` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `moder` int NOT NULL DEFAULT '0',
  `timestamp` int NOT NULL DEFAULT '0',
  `end` int NOT NULL DEFAULT '0',
  `canceled` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ip_subnet` (`ip_subnet`),
  KEY `board` (`board`),
  KEY `end` (`end`),
  KEY `type` (`type`),
  KEY `canceled` (`canceled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `boards`;
CREATE TABLE `boards` (
  `id` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `name` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `info` varchar(4096) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `info_outer` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `male_adjectives` varchar(2048) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `male_proper_names` varchar(2048) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `female_adjectives` varchar(2048) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `female_proper_names` varchar(2048) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `reactions` varchar(1024) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `category_id` int NOT NULL DEFAULT '0',
  `default_name` varchar(64) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `enable_dices` tinyint(1) NOT NULL DEFAULT '0',
  `enable_flags` tinyint(1) NOT NULL DEFAULT '0',
  `enable_icons` tinyint(1) NOT NULL DEFAULT '0',
  `enable_likes` tinyint(1) NOT NULL DEFAULT '0',
  `enable_reactions` tinyint(1) NOT NULL DEFAULT '0',
  `enable_names` tinyint(1) NOT NULL DEFAULT '0',
  `enable_ids` tinyint(1) NOT NULL DEFAULT '0',
  `enable_oekaki` tinyint(1) NOT NULL DEFAULT '0',
  `enable_posting` tinyint(1) NOT NULL DEFAULT '0',
  `enable_sage` tinyint(1) NOT NULL DEFAULT '0',
  `enable_shield` tinyint(1) NOT NULL DEFAULT '0',
  `enable_subject` tinyint(1) NOT NULL DEFAULT '0',
  `enable_thread_tags` tinyint(1) NOT NULL DEFAULT '0',
  `enable_trips` tinyint(1) NOT NULL DEFAULT '0',
  `enable_op_mod` tinyint(1) NOT NULL DEFAULT '0',
  `enable_telegram_linking` tinyint(1) NOT NULL DEFAULT '0',
  `require_files_for_op` tinyint(1) NOT NULL DEFAULT '0',
  `is_danger` tinyint(1) NOT NULL DEFAULT '0',
  `file_types` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `bump_limit` int NOT NULL DEFAULT '0',
  `last_num` int NOT NULL DEFAULT '0',
  `max_comment` int NOT NULL DEFAULT '0',
  `max_files_size` int NOT NULL DEFAULT '0',
  `max_pages` int NOT NULL DEFAULT '0',
  `speed` int NOT NULL DEFAULT '0',
  `threads` int NOT NULL DEFAULT '0',
  `threads_per_page` int NOT NULL DEFAULT '0',
  `unique_posters` int NOT NULL DEFAULT '0',
  `ban_reasons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `spamlist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `replacements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `name` (`name`),
  CONSTRAINT `boards_chk_1` CHECK (json_valid(`ban_reasons`)),
  CONSTRAINT `boards_chk_2` CHECK (json_valid(`spamlist`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `boards` (`id`, `name`, `info`, `info_outer`, `male_adjectives`, `male_proper_names`, `female_adjectives`, `female_proper_names`, `reactions`, `category_id`, `default_name`, `enable_dices`, `enable_flags`, `enable_icons`, `enable_likes`, `enable_reactions`, `enable_names`, `enable_ids`, `enable_oekaki`, `enable_posting`, `enable_sage`, `enable_shield`, `enable_subject`, `enable_thread_tags`, `enable_trips`, `enable_op_mod`, `enable_telegram_linking`, `require_files_for_op`, `is_danger`, `file_types`, `bump_limit`, `last_num`, `max_comment`, `max_files_size`, `max_pages`, `speed`, `threads`, `threads_per_page`, `unique_posters`, `ban_reasons`, `spamlist`, `replacements`, `deleted`) VALUES
('test',	'Тест',	'<p>Тестовый раздел.</p>',	'',	'',	'',	'',	'',	'heart.png\r\nclown.png',	0,	'Аноним',	1,	0,	0,	1,	1,	1,	0,	0,	1,	1,	0,	1,	0,	1,	1,	0,	0,	0,	'jpg,png,gif,webm,mp4,webp,mp3,wav',	500,	2,	15000,	20480,	5,	0,	0,	0,	0,	'[]',	'[]',	'[]',	0);

DROP TABLE IF EXISTS `bots`;
CREATE TABLE `bots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tg_id` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `name` varchar(64) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `description` varchar(2048) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `commands` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `webhook` varchar(256) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `key` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `threads_count` int NOT NULL DEFAULT '0',
  `posts_count` int NOT NULL DEFAULT '0',
  `timestamp` int NOT NULL DEFAULT '0',
  `banned` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `tg_id` (`tg_id`),
  KEY `timestamp` (`timestamp`),
  KEY `banned` (`banned`),
  CONSTRAINT `bots_chk_1` CHECK (json_valid(`commands`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `configs`;
CREATE TABLE `configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `no_rkn_domain` varchar(128) COLLATE utf8mb3_german2_ci DEFAULT NULL,
  `postform_annotation` text COLLATE utf8mb3_german2_ci,
  `footer_annotation` text COLLATE utf8mb3_german2_ci,
  `menu_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `danger_menu_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `safe_menu_sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ban_reasons` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `spamlist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `emojis` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `disable_files_displaying` int DEFAULT '0',
  `disable_files_displaying_for_readonly` int DEFAULT '0',
  `disable_files_uploading` int DEFAULT '0',
  PRIMARY KEY (`id`),
  CONSTRAINT `configs_chk_1` CHECK (json_valid(`menu_sections`)),
  CONSTRAINT `configs_chk_2` CHECK (json_valid(`danger_menu_sections`)),
  CONSTRAINT `configs_chk_3` CHECK (json_valid(`safe_menu_sections`)),
  CONSTRAINT `configs_chk_4` CHECK (json_valid(`ban_reasons`)),
  CONSTRAINT `configs_chk_5` CHECK (json_valid(`spamlist`)),
  CONSTRAINT `configs_chk_6` CHECK (json_valid(`emojis`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;

INSERT INTO `configs` (`id`, `no_rkn_domain`, `postform_annotation`, `footer_annotation`, `menu_sections`, `danger_menu_sections`, `safe_menu_sections`, `ban_reasons`, `spamlist`, `emojis`, `disable_files_displaying`, `disable_files_displaying_for_readonly`, `disable_files_uploading`) VALUES
(1,	'',	'<p style=\"text-align: left;\"><font color=\"#636363\">Перед постингом ознакомьтесь с <a href=\"/d/res/1313401.html\" target=\"_blank\"><b>правилами сайта</b></a>.<br></font><span style=\"color: rgb(99, 99, 99); background-color: rgba(var(--bs-tertiary-bg-rgb),var(--bs-bg-opacity)); font-size: var(--bs-body-font-size); font-weight: var(--bs-body-font-weight);\">Отправляя сообщение, вы автоматически соглашаетесь с этими правилами.</span><br></p>',	'<p>Администрация сайта не несёт ответственности за размещаемую пользователями информацию. Все сообщения на сайте принадлежат их авторам.</p>',	'[{\"sectionName\":\"Общение\",\"links\":[{\"label\":\"/test/ - Тест\",\"url\":\"/test/\",\"danger\":\"0\"}]}]',	'[{\"sectionName\":\"Общение\",\"links\":[{\"label\":\"/test/ - Тест\",\"url\":\"/test/\",\"danger\":\"0\"}]}]',	NULL,	'[{\"value\":\"Нанесение вреда сайту (Вайп, ЦП, Запрещёнка)\"},{\"value\":\"Шизофорс/щитпостинг\"},{\"value\":\"Спам, реклама, вредоносные ссылки\"},{\"value\":\"Персональные данные/доксинг\"},{\"value\":\"Призывы/пропаганда терроризма и/или экстремизма\"},{\"value\":\"Пропаганда наркотиков\"},{\"value\":\"Призывы к суициду\"},{\"value\":\"Злоупотребление политикой\"},{\"value\":\"Злоупотребление 18+ контентом\"},{\"value\":\"Попрошайничество\"},{\"value\":\"Просьба автора\"}]',	'[]',	NULL,	0,	0,	0);

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `files_to_check`;
CREATE TABLE `files_to_check` (
  `path` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `ids`;
CREATE TABLE `ids` (
  `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `name` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `color` varchar(8) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `thread` int NOT NULL DEFAULT '0',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  UNIQUE KEY `id` (`id`),
  KEY `ip_board_thread` (`ip`,`board`,`thread`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `num` int NOT NULL DEFAULT '0',
  `vote` int NOT NULL DEFAULT '0',
  `timestamp` int NOT NULL DEFAULT '0',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `board_num` (`board`,`num`),
  KEY `ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `moders`;
CREATE TABLE `moders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(32) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  `password` varchar(32) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  `note` varchar(1024) COLLATE utf8mb3_german2_ci NOT NULL DEFAULT '',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `sessions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `level` int NOT NULL DEFAULT '0',
  `expose_ip` int NOT NULL DEFAULT '0',
  `timestamp` int NOT NULL DEFAULT '0',
  `enabled` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `login` (`login`),
  KEY `password` (`password`),
  CONSTRAINT `moders_chk_1` CHECK (json_valid(`permissions`)),
  CONSTRAINT `moders_chk_2` CHECK (json_valid(`sessions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_german2_ci;

INSERT INTO `moders` (`id`, `login`, `password`, `note`, `permissions`, `sessions`, `level`, `expose_ip`, `timestamp`, `enabled`) VALUES
(1,	'admin',	'admin',	'Главный администратор',	'[{\"board\":\"all\",\"thread\":\"\"}]',	'[\"3ebd83f8e6ee5a46\"]',	5,	0,	1717844065,	1);

DROP TABLE IF EXISTS `modlog`;
CREATE TABLE `modlog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `moder` int NOT NULL DEFAULT '0',
  `action` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `num` int NOT NULL DEFAULT '0',
  `parent` int NOT NULL DEFAULT '0',
  `anywhere` int NOT NULL DEFAULT '0',
  `delall` int NOT NULL DEFAULT '0',
  `limit` int NOT NULL DEFAULT '0',
  `new_board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ban_id` int NOT NULL DEFAULT '0',
  `ip_or_subnet` varchar(8) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip_subnet` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `reason` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `timestamp` int NOT NULL DEFAULT '0',
  `end` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `moder` (`moder`),
  KEY `ip` (`ip`),
  KEY `action` (`action`),
  KEY `board` (`board`),
  KEY `num` (`num`),
  KEY `ip_subnet` (`ip_subnet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `passcodes`;
CREATE TABLE `passcodes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tg_id` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `code` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `sessions` varchar(128) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `timestamp` int NOT NULL DEFAULT '0',
  `expires` int NOT NULL DEFAULT '0',
  `banned` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `sessions` (`sessions`),
  KEY `code` (`code`),
  KEY `tg_id` (`tg_id`),
  KEY `ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `poll_votes`;
CREATE TABLE `poll_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `num` int NOT NULL DEFAULT '0',
  `vote` int NOT NULL DEFAULT '0',
  `timestamp` int NOT NULL DEFAULT '0',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `num` int NOT NULL DEFAULT '0',
  `parent` int NOT NULL DEFAULT '0',
  `lasthit` bigint NOT NULL DEFAULT '0',
  `lasttouch` bigint NOT NULL DEFAULT '0',
  `timestamp` bigint NOT NULL DEFAULT '0',
  `autodeletion_timestamp` bigint NOT NULL DEFAULT '0',
  `op` tinyint NOT NULL DEFAULT '0',
  `sticky` tinyint NOT NULL DEFAULT '0',
  `closed` tinyint NOT NULL DEFAULT '0',
  `private` tinyint NOT NULL DEFAULT '0',
  `banned` int NOT NULL DEFAULT '0',
  `archived` int NOT NULL DEFAULT '0',
  `deleted` int NOT NULL DEFAULT '0',
  `deleted_by_thread_deletion` int NOT NULL DEFAULT '0',
  `deleted_by_board_deletion` int NOT NULL DEFAULT '0',
  `deleted_by_endless_excess` int NOT NULL DEFAULT '0',
  `deleted_by_delall` int NOT NULL DEFAULT '0',
  `deleted_by_owner` int NOT NULL DEFAULT '0',
  `deleted_by_op` int NOT NULL DEFAULT '0',
  `deleted_by_autodeletion` int NOT NULL DEFAULT '0',
  `views` int NOT NULL DEFAULT '0',
  `likes` int NOT NULL DEFAULT '0',
  `dislikes` int NOT NULL DEFAULT '0',
  `reports` int NOT NULL DEFAULT '0',
  `endless` int NOT NULL DEFAULT '0',
  `edited` int NOT NULL DEFAULT '0',
  `edited_by_mod` int NOT NULL DEFAULT '0',
  `edited_by_mod_id` int NOT NULL DEFAULT '0',
  `usercode` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `email` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `client` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `poster_id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `moder_id` int NOT NULL DEFAULT '0',
  `passcode_id` int NOT NULL DEFAULT '0',
  `bot_id` int NOT NULL DEFAULT '0',
  `trip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `trip_plain` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `subject` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `mod_note` varchar(256) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `tags` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ban_reason` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ban_id` int NOT NULL DEFAULT '0',
  `ban_moder` int NOT NULL DEFAULT '0',
  `comment` mediumtext COLLATE utf8mb4_general_ci,
  `comment_parsed` mediumtext COLLATE utf8mb4_general_ci,
  `files` varchar(1800) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `enable_poll` int NOT NULL DEFAULT '0',
  `enable_multiple_votes` int NOT NULL DEFAULT '0',
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `menu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `force_geo` int NOT NULL DEFAULT '0',
  `pixels` int NOT NULL DEFAULT '0',
  `hat` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip_country_code` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip_country_name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `ip_city_name` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `deleted` (`deleted`),
  KEY `archived` (`archived`),
  KEY `parent` (`parent`),
  KEY `num` (`num`),
  KEY `board` (`board`),
  KEY `ip` (`ip`),
  KEY `reports` (`reports`),
  KEY `deleted_by_thread_deletion` (`deleted_by_thread_deletion`),
  KEY `sticky` (`sticky`),
  KEY `deleted_by_endless_excess` (`deleted_by_endless_excess`),
  KEY `deleted_by_delall` (`deleted_by_delall`),
  KEY `passcode_id` (`passcode_id`),
  KEY `autodeletion_timestamp` (`autodeletion_timestamp`),
  KEY `deleted_by_autodeletion` (`deleted_by_autodeletion`),
  CONSTRAINT `posts_chk_1` CHECK (json_valid(`answers`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `posts` (`id`, `board`, `num`, `parent`, `lasthit`, `lasttouch`, `timestamp`, `autodeletion_timestamp`, `op`, `sticky`, `closed`, `private`, `banned`, `archived`, `deleted`, `deleted_by_thread_deletion`, `deleted_by_board_deletion`, `deleted_by_endless_excess`, `deleted_by_delall`, `deleted_by_owner`, `deleted_by_op`, `deleted_by_autodeletion`, `views`, `likes`, `dislikes`, `reports`, `endless`, `edited`, `edited_by_mod`, `edited_by_mod_id`, `usercode`, `email`, `name`, `client`, `poster_id`, `moder_id`, `passcode_id`, `bot_id`, `trip`, `trip_plain`, `subject`, `mod_note`, `tags`, `ban_reason`, `ban_id`, `ban_moder`, `comment`, `comment_parsed`, `files`, `enable_poll`, `enable_multiple_votes`, `answers`, `menu`, `force_geo`, `pixels`, `hat`, `ip`, `ip_country_code`, `ip_country_name`, `ip_city_name`) VALUES
(1,	'test',	2,	0,	1771179937,	0,	1771179937,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	0,	'e9cf52961bc7a6d48309cffc7804a947',	'',	'Аноним',	'',	'',	1,	0,	0,	'',	'',	'Тестовый тред',	'',	'',	'',	0,	0,	'Тестовый тред.',	'Тестовый тред.',	'null',	0,	0,	'[]',	'[]',	0,	0,	'',	'0.0.0.0',	'us',	'США',	'Нью-Йорк');

DROP TABLE IF EXISTS `reactions`;
CREATE TABLE `reactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `num` int NOT NULL DEFAULT '0',
  `icon` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `timestamp` int NOT NULL DEFAULT '0',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `ip` (`ip`),
  KEY `board` (`board`),
  KEY `num` (`num`),
  KEY `icon` (`icon`),
  KEY `board_num_icon` (`board`,`num`,`icon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `num` int NOT NULL DEFAULT '0',
  `parent` int NOT NULL DEFAULT '0',
  `ip` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `timestamp` bigint NOT NULL DEFAULT '0',
  `processed` int NOT NULL DEFAULT '0',
  `comment` varchar(256) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `board_num` (`board`,`num`),
  KEY `ip` (`ip`),
  KEY `processed` (`processed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `tg_users`;
CREATE TABLE `tg_users` (
  `id` varchar(16) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `name` varchar(128) COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `timestamp` int NOT NULL DEFAULT '0',
  `banned` int NOT NULL DEFAULT '0',
  KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 2026-02-15 18:27:29
