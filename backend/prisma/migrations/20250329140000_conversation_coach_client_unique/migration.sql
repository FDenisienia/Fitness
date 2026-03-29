-- Un solo chat por par coach–alumno: evita duplicados y permite upsert seguro.
-- 1) Mover mensajes de conversaciones duplicadas hacia la fila con id menor (misma pareja).
UPDATE `ChatMessage` m
INNER JOIN `Conversation` c_dup ON c_dup.id = m.conversation_id
INNER JOIN `Conversation` c_keep
  ON c_keep.coach_id = c_dup.coach_id
  AND c_keep.client_id = c_dup.client_id
  AND c_keep.id < c_dup.id
SET m.conversation_id = c_keep.id;

-- 2) Eliminar conversaciones duplicadas (queda una por pareja).
DELETE c_dup FROM `Conversation` c_dup
INNER JOIN `Conversation` c_keep
  ON c_keep.coach_id = c_dup.coach_id
  AND c_keep.client_id = c_dup.client_id
  AND c_keep.id < c_dup.id;

-- 3) Índice único (Prisma @@unique conversation_coach_client_unique).
CREATE UNIQUE INDEX `conversation_coach_client_unique` ON `Conversation`(`coach_id`, `client_id`);
