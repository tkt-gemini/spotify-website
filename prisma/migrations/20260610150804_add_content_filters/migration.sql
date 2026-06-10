-- AlterTable
ALTER TABLE `Album` ADD COLUMN `genre` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PodcastEpisode` ADD COLUMN `category` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PodcastShow` ADD COLUMN `category` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Track` ADD COLUMN `genre` VARCHAR(191) NULL;
