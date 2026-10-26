import { Router } from "express";
import * as journeyPlanController from "./journey-plan.controller.js";
import { authorize } from "../../shared/middleware/authorize.js";
import { validate } from "../../shared/middleware/validate.js";
import {
  assignBidSchema,
  createJourneyPlanSchema,
  updateJourneyPlanSchema,
  deleteJourneyPlanSchema,
  journeyPlanIdParamsSchema,
  listJourneyPlansQuerySchema,
} from "./journey-plan.validation.js";

const router = Router();

router.post(
  "/journey-plans",
  authorize("TRANSPORTER"),
  validate(createJourneyPlanSchema),
  journeyPlanController.createJourneyPlan,
);

router.get(
  "/journey-plans",
  authorize("TRANSPORTER"),
  validate(listJourneyPlansQuerySchema),
  journeyPlanController.listMyJourneyPlans,
);

router.put(
  "/journey-plans/:id",
  authorize("TRANSPORTER"),
  validate(updateJourneyPlanSchema),
  journeyPlanController.updateJourneyPlan,
);

router.delete(
  "/journey-plans/:id",
  authorize("TRANSPORTER"),
  validate(deleteJourneyPlanSchema),
  journeyPlanController.deleteJourneyPlan,
);

router.get(
  "/journey-plans/my",
  authorize("TRANSPORTER"),
  validate(listJourneyPlansQuerySchema),
  journeyPlanController.listMyJourneyPlans,
);

router.get(
  "/journey-plans/:id",
  validate(journeyPlanIdParamsSchema),
  journeyPlanController.getJourneyPlan,
);

router.post(
  "/journey-plans/:id/assignments",
  authorize("TRANSPORTER"),
  validate(assignBidSchema),
  journeyPlanController.assignBidToPlan,
);

export default router;
