import { z } from "zod";

const isoDateString = z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Must be a valid ISO date or date-time",
    });

export const siteIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const equipmentLoadQuerySchema = z
    .object({
        from: isoDateString.optional(),
        to: isoDateString.optional(),
        minRequests: z.coerce.number().int().min(0).max(100000).optional(),
    })
    .strict();
