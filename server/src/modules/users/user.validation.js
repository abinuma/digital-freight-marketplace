import { z } from "zod";
import { ethiopianPhoneSchema } from "../../shared/utils/ethiopianPhone.js";

const userId = z.uuid();

export const userIdParamsSchema = {
  params: z.object({ id: userId }),
};

export const updateProfileSchema = {
  params: z.object({ id: userId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(100).optional(),
      phone: ethiopianPhoneSchema.optional(),
      location: z.string().trim().min(1).max(255).nullable().optional(),
      region: z.string().trim().max(100).nullable().optional(),
      zone: z.string().trim().max(100).nullable().optional(),
      city: z.string().trim().max(100).nullable().optional(),
      profilePhoto: z.string().url().max(500).nullable().optional(),
      availableDays: z.array(z.string().trim()).optional(),
      preferredLoadTypes: z.array(z.string().trim()).optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one profile field to update",
    ),
};

export const paginationQuerySchema = {
  params: z.object({ id: userId }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

export const upsertVehicleSchema = {
  params: z.object({ id: userId }),
  body: z.object({
    type: z.string().trim().min(1).max(50),
    loadSize: z
      .preprocess(
        (val) =>
          typeof val === "string"
            ? val.trim().toUpperCase().replace(/\s+/g, "_")
            : val,
        z.enum(["FULL_LOAD", "HALF_LOAD", "QUARTER_LOAD", "SMALL_LOAD"]),
      )
      .optional()
      .default("FULL_LOAD"),
    capacityTons: z.number().positive().max(99_999_999.99).optional(),
    capacityKg: z.number().positive().max(99_999_999.99).optional(),
    plateNumber: z.string().trim().min(1).max(20),
    photo: z.string().url().max(500).nullable().optional(),
  }),
};

export const availableTransportersQuerySchema = {
  query: z.object({ city: z.string().trim().min(1).max(100) }),
};

export const updateAvailabilitySchema = {
  params: z.object({ id: userId }),
  body: z.object({ lookingForLoads: z.boolean() }),
};
