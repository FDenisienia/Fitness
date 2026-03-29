-- Última contraseña en texto plano (solo para gestión admin/coach; se actualiza al crear usuario o al cambiar contraseña).
ALTER TABLE `User` ADD COLUMN `last_password_plain` TEXT NULL;
