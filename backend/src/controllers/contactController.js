import * as contactService from '../services/contactService.js';
import { AppError, ServiceUnavailableError } from '../utils/errors.js';

export async function submitContact(req, res, next) {
  try {
    const payload = contactService.validateContactPayload(req.body);
    await contactService.sendContactEmail(payload);
    res.json({ success: true, message: 'Mensaje enviado' });
  } catch (err) {
    if (err instanceof AppError) return next(err);
    console.error('[contact]', err);
    next(
      new ServiceUnavailableError(
        'No se pudo enviar el mensaje. Revisá CONTACT_SMTP_USER, CONTACT_SMTP_PASS y que el host permita SMTP; mirá los logs del servidor para el detalle.'
      )
    );
  }
}
