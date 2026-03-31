-- Login por username; email opcional (coaches); clientes pueden tener email NULL.

ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL;

UPDATE `User` u
INNER JOIN (
  SELECT
    id,
    LOWER(SUBSTRING_INDEX(email, '@', 1)) AS base,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(SUBSTRING_INDEX(email, '@', 1))
      ORDER BY id
    ) AS rn
  FROM `User`
) t ON u.id = t.id
SET u.username = CASE
  WHEN t.rn = 1 THEN t.base
  ELSE CONCAT(t.base, '_', t.rn)
END;

UPDATE `User` SET username = CONCAT('user_', `id`) WHERE `username` IS NULL OR `username` = '';

ALTER TABLE `User` MODIFY `username` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

ALTER TABLE `User` MODIFY `email` VARCHAR(191) NULL;
