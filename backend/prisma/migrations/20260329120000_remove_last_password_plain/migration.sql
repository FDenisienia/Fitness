-- Remove plaintext password column (security: never store passwords reversible).
ALTER TABLE `User` DROP COLUMN `last_password_plain`;
