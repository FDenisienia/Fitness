import { body, validationResult } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

/** Reglas fuertes (mayúscula + número) en `assertPasswordPolicy` tras 404/403. Aquí solo tipo. */
export const patchPasswordValidator = [
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Contraseña requerida')
    .isString()
    .withMessage('Contraseña inválida'),
];

export const registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('lastName').optional().trim(),
];

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0]?.msg || 'Datos inválidos',
      details: errors.array(),
    });
  }
  next();
}
