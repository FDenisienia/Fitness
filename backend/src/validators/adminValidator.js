import { body, validationResult } from 'express-validator';
import {
  normalizeUsername,
  assertValidUsernameShape,
  rejectIfEmailShape,
} from '../utils/authIdentity.js';

const USERNAME_OPTIONAL = body('username')
  .optional({ values: 'falsy' })
  .isString()
  .withMessage('Usuario inválido')
  .bail()
  .trim()
  .custom((value) => {
    if (value == null || String(value).trim() === '') return true;
    const n = normalizeUsername(value);
    const emailCheck = rejectIfEmailShape(n);
    if (!emailCheck.ok) {
      throw new Error(emailCheck.message);
    }
    assertValidUsernameShape(n);
    return true;
  });

const PASSWORD_OPTIONAL = body('password')
  .optional({ values: 'falsy' })
  .isString()
  .withMessage('Contraseña inválida')
  .custom((value) => {
    if (value != null && String(value).trim() !== '' && String(value).length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    return true;
  });

const NAME_OPTIONAL = body('name')
  .optional()
  .isString()
  .withMessage('Nombre inválido')
  .bail()
  .trim()
  .isLength({ min: 1, max: 120 })
  .withMessage('El nombre debe tener entre 1 y 120 caracteres.');

const LAST_NAME_OPTIONAL = body('lastName')
  .optional({ nullable: true })
  .isString()
  .withMessage('Apellido inválido')
  .bail()
  .trim()
  .isLength({ max: 120 })
  .withMessage('El apellido no puede superar 120 caracteres.');

const EMAIL_OPTIONAL = body('email')
  .optional()
  .isString()
  .bail()
  .trim()
  .notEmpty()
  .withMessage('El correo no puede estar vacío.')
  .bail()
  .isEmail()
  .normalizeEmail()
  .withMessage('Correo electrónico inválido');

/** PUT /admin/me — el servicio exige al menos un cambio real. */
export const updateAdminMeValidator = [
  NAME_OPTIONAL,
  LAST_NAME_OPTIONAL,
  EMAIL_OPTIONAL,
  USERNAME_OPTIONAL,
  PASSWORD_OPTIONAL,
];

/** PUT /admin/coaches/:id — mismos campos que update coach; password opcional. */
export const updateAdminCoachValidator = [
  body('username')
    .optional({ values: 'falsy' })
    .isString()
    .bail()
    .trim()
    .custom((value) => {
      if (value == null || String(value).trim() === '') return true;
      const n = normalizeUsername(value);
      const emailCheck = rejectIfEmailShape(n);
      if (!emailCheck.ok) throw new Error(emailCheck.message);
      assertValidUsernameShape(n);
      return true;
    }),
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('password')
    .optional({ values: 'falsy' })
    .isString()
    .custom((value) => {
      if (value != null && String(value).trim() !== '' && String(value).length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      return true;
    }),
  body('name').optional().isString().trim(),
  body('lastName').optional().isString().trim(),
  body('phone').optional(),
  body('specialty').optional(),
  body('bio').optional(),
  body('subscriptionPlan').optional().isString(),
  body('subscriptionStatus').optional().isString(),
];

export function validateAdmin(req, res, next) {
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
