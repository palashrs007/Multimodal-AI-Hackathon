import { enableShareToken, revokeShareToken, getSharedItinerary } from '../services/shareService.js';

export async function createShareLink(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const data = await enableShareToken(tripId, userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function removeShareLink(req, res, next) {
  try {
    const userId = req.user.id;
    const tripId = req.params.id;

    const data = await revokeShareToken(tripId, userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSharedPlan(req, res, next) {
  try {
    const { token } = req.params;
    const data = await getSharedItinerary(token);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
