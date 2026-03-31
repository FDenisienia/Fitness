import { body, validationResult } from 'express-validator';
import {
  normalizeUsername,
  assertValidUsernameShape,
  rejectIfEmailShape,
} from '../utils/authIdentity.js';

const USERNAME_FIELD = body('username')
  .exists({ checkFalsy: true })
  .withMessage('Usuario requerido')
  .isString()
  .withMessage('Usuario inválido')
  .bail()
  .trim()
  .custom((value) => {
    const n = normalizeUsername(value);
    const emailCheck = rejectIfEmailShape(n);
    if (!emailCheck.ok) {
      throw new Error(emailCheck.message);
    }
    assertValidUsernameShape(n);
    return true;
  });

const PASSWORD_LOGIN = body('password')
  .notEmpty()
  .withMessage('Contraseña requerida');

/** Login solo con username + password (no email). */
export const loginValidator = [USERNAME_FIELD, PASSWORD_LOGIN];

/** Reglas fuertes (mayúscula + número) en `assertPasswordPolicy` en el servicio. */
export const patchPasswordValidator = [
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Contraseña requerida')
    .isString()
    .withMessage('Contraseña inválida'),
];

const ROLE_FIELD = body('role')
  .exists({ checkFalsy: true })
  .withMessage('Rol requerido')
  .customSanitizer((v) => (v == null ? v : String(v).trim().toLowerCase()))
  .isIn(['coach', 'cliente'])
  .withMessage('Rol inválido')
  .custom((role, { req }) => {
    if (role !== 'cliente') return true;
    const id = req.body.coach_id ?? req.body.coachId;
    if (id == null || String(id).trim() === '') {
      throw new Error('coach_id es obligatorio para registrarse como cliente');
    }
    return true;
  });

const PASSWORD_REGISTER = body('password')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener al menos 8 caracteres');

export const registerValidator = [
  ROLE_FIELD,
  USERNAME_FIELD,
  PASSWORD_REGISTER,
  body('email').custom((value, { req }) => {
    const role = String(req.body?.role || '').toLowerCase();
    if (role === 'coach') {
      if (value == null || String(value).trim() === '') {
        throw new Error('Correo electrónico requerido para registro como coach');
      }
    }
    return true;
  }),
  body('email')
    .if(body('role').equals('coach'))
    .isEmail()
    .normalizeEmail()
    .withMessage('Correo electrónico inválido'),
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
