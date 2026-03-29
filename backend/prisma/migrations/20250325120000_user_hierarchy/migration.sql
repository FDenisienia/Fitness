-- Jerarquía admin → coach y cliente → coach (User)
-- Tras aplicar, rellenar datos existentes según tu política, p. ej.:
-- UPDATE User u INNER JOIN Coach c ON c.user_id = u.id SET u.created_by_id = '<admin_user_id>' WHERE u.role = 'coach' AND u.created_by_id IS NULL;
-- UPDATE User u INNER JOIN Client cl ON cl.user_id = u.id SET u.assigned_coach_id = cl.coach_id WHERE u.role = 'cliente' AND u.assigned_coach_id IS NULL;

ALTER TABLE `User` ADD COLUMN `created_by_id` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `assigned_coach_id` VARCHAR(191) NULL;

ALTER TABLE `User` ADD CONSTRAINT `User_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `User` ADD CONSTRAINT `User_assigned_coach_id_fkey` FOREIGN KEY (`assigned_coach_id`) REFERENCES `Coach`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
