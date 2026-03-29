import * as contactService from '../services/contactService.js';

export async function submitContact(req, res, next) {
  try {
    const payload = contactService.validateContactPayload(req.body);
    await contactService.sendContactEmail(payload);
    res.json({ success: true, message: 'Mensaje enviado' });
  } catch (err) {
    next(err);
  }
}
