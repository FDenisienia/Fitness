import * as coachService from '../services/coachService.js';

export async function list(req, res, next) {
  try {
    const coaches = await coachService.listCoaches();
    res.json({ success: true, data: coaches });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const coach = await coachService.getCoachById(req.params.id);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const result = await coachService.createCoach(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coach = await coachService.updateCoach(req.params.id, req.body);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}
