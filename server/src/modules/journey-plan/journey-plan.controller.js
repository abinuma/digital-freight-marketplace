import * as journeyPlanService from './journey-plan.service.js';

export async function createJourneyPlan(req, res, next) {
  try {
    const plan = await journeyPlanService.createJourneyPlan(req.user, req.body);
    return res.status(201).json({ data: plan });
  } catch (error) {
    return next(error);
  }
}

export async function updateJourneyPlan(req, res, next) {
  try {
    const plan = await journeyPlanService.updateJourneyPlan(req.user, req.params.id, req.body);
    return res.json({ data: plan });
  } catch (error) {
    return next(error);
  }
}

export async function deleteJourneyPlan(req, res, next) {
  try {
    const plan = await journeyPlanService.deleteJourneyPlan(req.user, req.params.id);
    return res.json({ data: plan });
  } catch (error) {
    return next(error);
  }
}

export async function listMyJourneyPlans(req, res, next) {
  try {
    const plans = await journeyPlanService.listMyJourneyPlans(req.user, req.query);
    return res.json({ data: plans });
  } catch (error) {
    return next(error);
  }
}

export async function getJourneyPlan(req, res, next) {
  try {
    const plan = await journeyPlanService.getJourneyPlan(req.user, req.params.id);
    return res.json({ data: plan });
  } catch (error) {
    return next(error);
  }
}

export async function assignBidToPlan(req, res, next) {
  try {
    const result = await journeyPlanService.assignBidToJourneyPlan(req.user, req.params.id, req.body.bidId);
    return res.status(201).json({ data: result });
  } catch (error) {
    return next(error);
  }
}
