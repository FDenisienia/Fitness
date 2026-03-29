-- Integridad referencial: ejercicios de coach y conversaciones ligadas al Coach.
-- Limpieza previa: valores huérfanos en ExerciseLibrary (no existen en Coach).
UPDATE `ExerciseLibrary`
SET `created_by_id` = NULL
WHERE `created_by_id` IS NOT NULL
  AND `created_by_id` NOT IN (SELECT `id` FROM `Coach`);

-- Alinear coach_id de conversaciones con el coach del cliente (evita fallos al añadir FK).
UPDATE `Conversation` c
INNER JOIN `Client` cl ON cl.`id` = c.`client_id`
SET c.`coach_id` = cl.`coach_id`
WHERE c.`coach_id` <> cl.`coach_id`;

-- Eliminar conversaciones cuyo coach_id no exista (datos inconsistentes previos).
DELETE c FROM `Conversation` c
LEFT JOIN `Coach` co ON co.`id` = c.`coach_id`
WHERE co.`id` IS NULL;

-- FK: ejercicios personalizados del coach se borran con el Coach.
ALTER TABLE `ExerciseLibrary`
ADD CONSTRAINT `ExerciseLibrary_created_by_id_fkey`
FOREIGN KEY (`created_by_id`) REFERENCES `Coach`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- FK: conversación ligada al coach (además del cliente).
ALTER TABLE `Conversation`
ADD CONSTRAINT `Conversation_coach_id_fkey`
FOREIGN KEY (`coach_id`) REFERENCES `Coach`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
