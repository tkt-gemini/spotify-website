-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: spotify_clone
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Album`
--

DROP TABLE IF EXISTS `Album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Album` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artistId` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `coverUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `releaseDate` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `status` enum('DRAFT','PUBLISHED','HIDDEN','ARCHIVED','REMOVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Album_artistId_fkey` (`artistId`),
  CONSTRAINT `Album_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Album`
--

LOCK TABLES `Album` WRITE;
/*!40000 ALTER TABLE `Album` DISABLE KEYS */;
INSERT INTO `Album` VALUES (1,1,'Demo Album',NULL,'2026-06-07 17:18:25.028','PUBLISHED','2026-06-07 17:18:25.028','2026-06-07 17:18:25.028');
/*!40000 ALTER TABLE `Album` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Artist`
--

DROP TABLE IF EXISTS `Artist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Artist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bannerUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','HIDDEN','ARCHIVED','REMOVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdById` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Artist_createdById_fkey` (`createdById`),
  CONSTRAINT `Artist_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Artist`
--

LOCK TABLES `Artist` WRITE;
/*!40000 ALTER TABLE `Artist` DISABLE KEYS */;
INSERT INTO `Artist` VALUES (1,'Demo Artist','This is a demo artist for Phase 2.',NULL,NULL,'PUBLISHED',2,'2026-06-07 17:18:25.003','2026-06-07 17:18:25.003'),(2,'The Cool Band',NULL,NULL,NULL,'PUBLISHED',3,'2026-06-07 17:38:21.529','2026-06-07 17:38:21.529');
/*!40000 ALTER TABLE `Artist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ArtistTeamMember`
--

DROP TABLE IF EXISTS `ArtistTeamMember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ArtistTeamMember` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artistId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('OWNER','MANAGER','ADMIN','EDITOR','PRODUCER','VIEWER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ArtistTeamMember_artistId_userId_key` (`artistId`,`userId`),
  KEY `ArtistTeamMember_userId_fkey` (`userId`),
  CONSTRAINT `ArtistTeamMember_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ArtistTeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ArtistTeamMember`
--

LOCK TABLES `ArtistTeamMember` WRITE;
/*!40000 ALTER TABLE `ArtistTeamMember` DISABLE KEYS */;
INSERT INTO `ArtistTeamMember` VALUES (1,1,2,'OWNER','2026-06-07 17:18:25.003'),(2,2,3,'OWNER','2026-06-07 17:38:21.529');
/*!40000 ALTER TABLE `ArtistTeamMember` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FollowedArtist`
--

DROP TABLE IF EXISTS `FollowedArtist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FollowedArtist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `artistId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `FollowedArtist_userId_artistId_key` (`userId`,`artistId`),
  KEY `FollowedArtist_artistId_fkey` (`artistId`),
  CONSTRAINT `FollowedArtist_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FollowedArtist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FollowedArtist`
--

LOCK TABLES `FollowedArtist` WRITE;
/*!40000 ALTER TABLE `FollowedArtist` DISABLE KEYS */;
INSERT INTO `FollowedArtist` VALUES (1,2,1,'2026-06-07 17:20:00.179');
/*!40000 ALTER TABLE `FollowedArtist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FollowedPlaylist`
--

DROP TABLE IF EXISTS `FollowedPlaylist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FollowedPlaylist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `playlistId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `FollowedPlaylist_userId_playlistId_key` (`userId`,`playlistId`),
  KEY `FollowedPlaylist_playlistId_fkey` (`playlistId`),
  CONSTRAINT `FollowedPlaylist_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FollowedPlaylist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FollowedPlaylist`
--

LOCK TABLES `FollowedPlaylist` WRITE;
/*!40000 ALTER TABLE `FollowedPlaylist` DISABLE KEYS */;
/*!40000 ALTER TABLE `FollowedPlaylist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LikedTrack`
--

DROP TABLE IF EXISTS `LikedTrack`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LikedTrack` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `trackId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `LikedTrack_userId_trackId_key` (`userId`,`trackId`),
  KEY `LikedTrack_trackId_fkey` (`trackId`),
  CONSTRAINT `LikedTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `LikedTrack_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LikedTrack`
--

LOCK TABLES `LikedTrack` WRITE;
/*!40000 ALTER TABLE `LikedTrack` DISABLE KEYS */;
INSERT INTO `LikedTrack` VALUES (1,2,3,'2026-06-07 17:19:37.542');
/*!40000 ALTER TABLE `LikedTrack` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MediaAsset`
--

DROP TABLE IF EXISTS `MediaAsset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MediaAsset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerUserId` int DEFAULT NULL,
  `originalFilename` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mimeType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sizeBytes` int NOT NULL,
  `localPath` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publicUrl` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('IMAGE','AUDIO','VIDEO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `durationMs` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `MediaAsset_ownerUserId_fkey` (`ownerUserId`),
  CONSTRAINT `MediaAsset_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MediaAsset`
--

LOCK TABLES `MediaAsset` WRITE;
/*!40000 ALTER TABLE `MediaAsset` DISABLE KEYS */;
INSERT INTO `MediaAsset` VALUES (1,3,'dummy.mp3','dcb61039-cca7-4644-8ebe-df1aab1296a8.mp3','audio/mpeg',20,'uploads/audio/tracks/dcb61039-cca7-4644-8ebe-df1aab1296a8.mp3','/uploads/audio/tracks/dcb61039-cca7-4644-8ebe-df1aab1296a8.mp3','AUDIO',NULL,'2026-06-07 17:39:13.678'),(2,3,'real_audio.wav','97b6c72e-080b-47de-9cf7-0cf894300522.wav','audio/wav',176444,'uploads/audio/tracks/97b6c72e-080b-47de-9cf7-0cf894300522.wav','/uploads/audio/tracks/97b6c72e-080b-47de-9cf7-0cf894300522.wav','AUDIO',NULL,'2026-06-07 18:05:20.225'),(3,4,'real_episode_audio.wav','7c1a01b9-a60d-41bd-8310-651a2dcfd4dc.wav','audio/wav',176444,'uploads/audio/episodes/7c1a01b9-a60d-41bd-8310-651a2dcfd4dc.wav','/uploads/audio/episodes/7c1a01b9-a60d-41bd-8310-651a2dcfd4dc.wav','AUDIO',NULL,'2026-06-07 18:19:49.755');
/*!40000 ALTER TABLE `MediaAsset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_fkey` (`userId`),
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PlaybackEvent`
--

DROP TABLE IF EXISTS `PlaybackEvent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PlaybackEvent` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playbackSessionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` int DEFAULT NULL,
  `trackId` int DEFAULT NULL,
  `episodeId` int DEFAULT NULL,
  `eventType` enum('TRACK_STARTED','TRACK_PROGRESS','TRACK_COMPLETED','EPISODE_STARTED','EPISODE_PROGRESS','EPISODE_COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `playedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `durationMs` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PlaybackEvent_playbackSessionId_idx` (`playbackSessionId`),
  KEY `PlaybackEvent_eventType_idx` (`eventType`),
  KEY `PlaybackEvent_userId_fkey` (`userId`),
  KEY `PlaybackEvent_trackId_fkey` (`trackId`),
  KEY `PlaybackEvent_episodeId_fkey` (`episodeId`),
  CONSTRAINT `PlaybackEvent_episodeId_fkey` FOREIGN KEY (`episodeId`) REFERENCES `PodcastEpisode` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PlaybackEvent_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PlaybackEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PlaybackEvent`
--

LOCK TABLES `PlaybackEvent` WRITE;
/*!40000 ALTER TABLE `PlaybackEvent` DISABLE KEYS */;
INSERT INTO `PlaybackEvent` VALUES (1,'6f5254bf-25ec-4592-8bc0-89504e1e04ab',2,1,NULL,'TRACK_STARTED','2026-06-07 17:26:13.568',NULL),(2,'812c719d-a2d6-4811-9dc4-1c634ff1a721',3,4,NULL,'TRACK_STARTED','2026-06-07 17:39:50.363',NULL),(3,'a35669b7-a253-405e-86dc-6cde167cf498',3,5,NULL,'TRACK_STARTED','2026-06-07 18:05:39.876',NULL),(4,'9a5099b2-fd58-4ecc-82cf-d8d6e71aac6c',4,NULL,1,'EPISODE_STARTED','2026-06-07 18:20:26.055',NULL),(5,'a27d8d20-23d5-45a8-8623-6b2f7eb19ada',7,4,NULL,'TRACK_STARTED','2026-06-08 06:14:05.279',NULL),(6,'0aa8b447-3df3-4c72-a5be-29744d101f85',7,4,NULL,'TRACK_STARTED','2026-06-08 06:14:07.772',NULL),(7,'ed22d710-f8e1-474b-bef4-4008597bae39',7,3,NULL,'TRACK_STARTED','2026-06-08 06:14:10.992',NULL),(8,'3517008b-67fd-4a47-a286-7782e0918c5e',7,4,NULL,'TRACK_STARTED','2026-06-08 06:14:12.903',NULL);
/*!40000 ALTER TABLE `PlaybackEvent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Playlist`
--

DROP TABLE IF EXISTS `Playlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Playlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Playlist_userId_fkey` (`userId`),
  CONSTRAINT `Playlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Playlist`
--

LOCK TABLES `Playlist` WRITE;
/*!40000 ALTER TABLE `Playlist` DISABLE KEYS */;
INSERT INTO `Playlist` VALUES (1,2,'Demo Public Playlist','A demo playlist created during seed.',NULL,1,'2026-06-07 17:18:25.111','2026-06-07 17:18:25.111'),(2,2,'My Playlist #4937',NULL,NULL,0,'2026-06-07 17:20:41.474','2026-06-07 17:20:41.474');
/*!40000 ALTER TABLE `Playlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PlaylistTrack`
--

DROP TABLE IF EXISTS `PlaylistTrack`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PlaylistTrack` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playlistId` int NOT NULL,
  `trackId` int NOT NULL,
  `addedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PlaylistTrack_playlistId_trackId_key` (`playlistId`,`trackId`),
  KEY `PlaylistTrack_trackId_fkey` (`trackId`),
  CONSTRAINT `PlaylistTrack_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PlaylistTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PlaylistTrack`
--

LOCK TABLES `PlaylistTrack` WRITE;
/*!40000 ALTER TABLE `PlaylistTrack` DISABLE KEYS */;
/*!40000 ALTER TABLE `PlaylistTrack` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PodcastEpisode`
--

DROP TABLE IF EXISTS `PodcastEpisode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PodcastEpisode` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showId` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `audioUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publishedAt` datetime(3) DEFAULT NULL,
  `scheduledAt` datetime(3) DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','HIDDEN','ARCHIVED','REMOVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PodcastEpisode_showId_fkey` (`showId`),
  CONSTRAINT `PodcastEpisode_showId_fkey` FOREIGN KEY (`showId`) REFERENCES `PodcastShow` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PodcastEpisode`
--

LOCK TABLES `PodcastEpisode` WRITE;
/*!40000 ALTER TABLE `PodcastEpisode` DISABLE KEYS */;
INSERT INTO `PodcastEpisode` VALUES (1,1,'Episode 1',NULL,NULL,'/uploads/audio/episodes/7c1a01b9-a60d-41bd-8310-651a2dcfd4dc.wav','2026-06-07 18:19:49.777',NULL,'HIDDEN','2026-06-07 18:18:58.734','2026-06-07 18:32:59.320'),(2,2,'Demo Episode 1','The first episode of the demo podcast.',3600,NULL,NULL,NULL,'PUBLISHED','2026-06-08 06:00:27.941','2026-06-08 06:00:27.941');
/*!40000 ALTER TABLE `PodcastEpisode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PodcastShow`
--

DROP TABLE IF EXISTS `PodcastShow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PodcastShow` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ownerId` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','HIDDEN','ARCHIVED','REMOVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PodcastShow_ownerId_fkey` (`ownerId`),
  CONSTRAINT `PodcastShow_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PodcastShow`
--

LOCK TABLES `PodcastShow` WRITE;
/*!40000 ALTER TABLE `PodcastShow` DISABLE KEYS */;
INSERT INTO `PodcastShow` VALUES (1,4,'My First Podcast',NULL,NULL,'PUBLISHED','2026-06-07 18:18:15.860','2026-06-07 18:18:15.860'),(2,4,'Demo Podcast Show','This is a demo podcast show.',NULL,'PUBLISHED','2026-06-08 06:00:27.906','2026-06-08 06:00:27.906');
/*!40000 ALTER TABLE `PodcastShow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PodcastTeamMember`
--

DROP TABLE IF EXISTS `PodcastTeamMember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PodcastTeamMember` (
  `id` int NOT NULL AUTO_INCREMENT,
  `showId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('OWNER','MANAGER','ADMIN','EDITOR','PRODUCER','VIEWER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PodcastTeamMember_showId_userId_key` (`showId`,`userId`),
  KEY `PodcastTeamMember_userId_fkey` (`userId`),
  CONSTRAINT `PodcastTeamMember_showId_fkey` FOREIGN KEY (`showId`) REFERENCES `PodcastShow` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PodcastTeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PodcastTeamMember`
--

LOCK TABLES `PodcastTeamMember` WRITE;
/*!40000 ALTER TABLE `PodcastTeamMember` DISABLE KEYS */;
INSERT INTO `PodcastTeamMember` VALUES (1,1,4,'OWNER','2026-06-07 18:18:15.860'),(2,2,4,'OWNER','2026-06-08 06:00:27.906');
/*!40000 ALTER TABLE `PodcastTeamMember` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SavedAlbum`
--

DROP TABLE IF EXISTS `SavedAlbum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SavedAlbum` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `albumId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SavedAlbum_userId_albumId_key` (`userId`,`albumId`),
  KEY `SavedAlbum_albumId_fkey` (`albumId`),
  CONSTRAINT `SavedAlbum_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `Album` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SavedAlbum_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SavedAlbum`
--

LOCK TABLES `SavedAlbum` WRITE;
/*!40000 ALTER TABLE `SavedAlbum` DISABLE KEYS */;
/*!40000 ALTER TABLE `SavedAlbum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SubscribedShow`
--

DROP TABLE IF EXISTS `SubscribedShow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SubscribedShow` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `showId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SubscribedShow_userId_showId_key` (`userId`,`showId`),
  KEY `SubscribedShow_showId_fkey` (`showId`),
  CONSTRAINT `SubscribedShow_showId_fkey` FOREIGN KEY (`showId`) REFERENCES `PodcastShow` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SubscribedShow_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SubscribedShow`
--

LOCK TABLES `SubscribedShow` WRITE;
/*!40000 ALTER TABLE `SubscribedShow` DISABLE KEYS */;
/*!40000 ALTER TABLE `SubscribedShow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Track`
--

DROP TABLE IF EXISTS `Track`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Track` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artistId` int NOT NULL,
  `albumId` int DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int DEFAULT NULL,
  `audioUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coverUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trackNumber` int DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','HIDDEN','ARCHIVED','REMOVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Track_artistId_fkey` (`artistId`),
  KEY `Track_albumId_fkey` (`albumId`),
  CONSTRAINT `Track_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `Album` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Track_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Track`
--

LOCK TABLES `Track` WRITE;
/*!40000 ALTER TABLE `Track` DISABLE KEYS */;
INSERT INTO `Track` VALUES (1,1,1,'Demo Track 1 - The Beginning',180,'/audio/demo1.mp3',NULL,NULL,'PUBLISHED','2026-06-07 17:18:25.049','2026-06-07 17:18:25.049'),(2,1,1,'Demo Track 2 - No Audio',200,NULL,NULL,NULL,'PUBLISHED','2026-06-07 17:18:25.069','2026-06-07 17:18:25.069'),(3,1,1,'Demo Track 3 - The Finale',210,'/audio/demo3.mp3',NULL,NULL,'PUBLISHED','2026-06-07 17:18:25.088','2026-06-07 17:18:25.088'),(4,2,NULL,'My First Song',NULL,'/uploads/audio/tracks/dcb61039-cca7-4644-8ebe-df1aab1296a8.mp3',NULL,NULL,'PUBLISHED','2026-06-07 17:38:47.492','2026-06-07 17:39:13.713'),(5,2,NULL,'Real Audio Test',NULL,'/uploads/audio/tracks/97b6c72e-080b-47de-9cf7-0cf894300522.wav',NULL,NULL,'HIDDEN','2026-06-07 18:05:20.251','2026-06-07 18:32:38.034');
/*!40000 ALTER TABLE `Track` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `defaultRole` enum('ADMIN','USER','ARTIST','PODCASTER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'admin@example.com','$2b$10$GR8f3lxgQpXn2MaYtTpVLuanh7Qa.my7zP2fs11Fb1GCXqllgBsdO','Admin User','ADMIN','2026-06-07 16:36:56.886','2026-06-08 06:00:28.209'),(2,'user@example.com','$2b$10$GR8f3lxgQpXn2MaYtTpVLuanh7Qa.my7zP2fs11Fb1GCXqllgBsdO','Standard User','USER','2026-06-07 16:36:56.923','2026-06-08 06:00:28.296'),(3,'artist@example.com','$2b$10$GR8f3lxgQpXn2MaYtTpVLuanh7Qa.my7zP2fs11Fb1GCXqllgBsdO','Artist User','ARTIST','2026-06-07 16:36:56.945','2026-06-08 06:00:28.327'),(4,'podcaster@example.com','$2b$10$GR8f3lxgQpXn2MaYtTpVLuanh7Qa.my7zP2fs11Fb1GCXqllgBsdO','Podcaster User','PODCASTER','2026-06-07 16:36:56.964','2026-06-08 06:00:28.351'),(5,'user1@example.com','$2b$10$0RZJQk/.9evlBy97DyDcU.rRMRBO6KzmQHAz7Se2t4SIEYSPmr.OG','User 1','USER','2026-06-07 16:54:26.149','2026-06-07 16:54:26.149'),(6,'browser@example.com','$2b$10$UUAsCpviQ.C2wq6KMb.01O51l9iydLspjljtdJVh.lU6jAT.Aqpii','Test Browser','ARTIST','2026-06-07 17:00:39.395','2026-06-07 18:32:18.718'),(7,'tkt310505@gmail.com','$2b$10$wdT2PYu5HvZP.4F2x5YkxOhVAcZCQKvy4MNv5lXoEqfs6.7td6p/e','Gemini','USER','2026-06-08 06:13:46.623','2026-06-08 06:13:46.623');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('63989a6c-fb99-4c8f-ba45-e1d81d351381','b36f1861b2e87f896c6a7850985f2bf80af7a8a5f4fdee1b4ed4b76983fe0096','2026-06-07 16:28:41.596','20260607162832_init',NULL,NULL,'2026-06-07 16:28:32.078',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-08 22:18:12
