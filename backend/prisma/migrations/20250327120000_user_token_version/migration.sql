-- Invalidación de sesiones tras cambio de contraseña (JWT stateless)
ALTER TABLE `User` ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;
