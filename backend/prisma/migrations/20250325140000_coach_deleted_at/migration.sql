-- Soft delete de coaches
ALTER TABLE `Coach` ADD COLUMN `deleted_at` DATETIME(3) NULL;
