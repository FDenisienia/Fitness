-- Instancia por cliente: ejercicios clonados y series con peso asignado (no modifica rutina base)
CREATE TABLE `client_routine_exercises` (
    `id` VARCHAR(191) NOT NULL,
    `client_routine_id` VARCHAR(191) NOT NULL,
    `source_routine_exercise_id` VARCHAR(191) NULL,
    `exercise_id` VARCHAR(191) NULL,
    `custom_name` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `instructions` TEXT NULL,
    `rest` VARCHAR(191) NULL,
    `video_url` VARCHAR(191) NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `session_index` INTEGER NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `calorias_por_rep` DOUBLE NULL,
    `calorias_por_min` DOUBLE NULL,
    `time` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `client_routine_exercises_client_routine_id_idx`(`client_routine_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `client_routine_exercise_sets` (
    `id` VARCHAR(191) NOT NULL,
    `client_routine_exercise_id` VARCHAR(191) NOT NULL,
    `set_number` INTEGER NOT NULL,
    `reps` VARCHAR(191) NULL,
    `assigned_weight` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `client_routine_exercise_sets_client_routine_exercise_id_set_number_key`(`client_routine_exercise_id`, `set_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `client_routine_exercises` ADD CONSTRAINT `client_routine_exercises_client_routine_id_fkey` FOREIGN KEY (`client_routine_id`) REFERENCES `ClientRoutine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `client_routine_exercises` ADD CONSTRAINT `client_routine_exercises_source_routine_exercise_id_fkey` FOREIGN KEY (`source_routine_exercise_id`) REFERENCES `RoutineExercise`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `client_routine_exercises` ADD CONSTRAINT `client_routine_exercises_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `ExerciseLibrary`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `client_routine_exercise_sets` ADD CONSTRAINT `client_routine_exercise_sets_client_routine_exercise_id_fkey` FOREIGN KEY (`client_routine_exercise_id`) REFERENCES `client_routine_exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
