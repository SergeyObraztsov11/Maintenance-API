import { z } from "zod";

const priorities = ["low", "medium", "high", "critical"];
const statuses = ["new", "in_progress", "done", "rejected"];

export const requestIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const requestListQuerySchema = z
    .object({
        status: z.enum(statuses).optional(),
        priority: z.enum(priorities).optional(),
        equipmentId: z.string().uuid().optional(),
        sortBy: z
            .enum([
                "title",
                "priority",
                "status",
                "plannedAt",
                "createdAt",
                "updatedAt",
            ])
            .optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict();

export const createRequestBodySchema = z
    .object({
        equipmentId: z.string().uuid(),
        title: z.string().min(5).max(120),
        description: z.string().max(2000).optional(),
        priority: z.enum(priorities),
        plannedAt: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: "plannedAt must be a valid ISO date-time",
            })
            .optional()
            .nullable(),
    })
    .strict();

export const updateRequestBodySchema = z
    .object({
        equipmentId: z.string().uuid().optional(),
        title: z.string().min(5).max(120).optional(),
        description: z.string().max(2000).optional(),
        priority: z.enum(priorities).optional(),
        plannedAt: z
            .string()
            .refine((value) => !Number.isNaN(Date.parse(value)), {
                message: "plannedAt must be a valid ISO date-time",
            })
            .optional()
            .nullable(),
    })
    .strict();

export const changeStatusBodySchema = z
    .object({
        status: z.enum(statuses),
    })
    .strict();
