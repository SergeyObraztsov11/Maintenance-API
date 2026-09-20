import { z } from "zod";

const equipmentTypes = ["turbine", "inverter", "sensor", "substation"];
const equipmentStatuses = [
    "operational",
    "maintenance",
    "fault",
    "decommissioned",
];

export const equipmentIdParamsSchema = z.object({
    id: z.string().uuid(),
});

export const equipmentListQuerySchema = z
    .object({
        status: z.enum(equipmentStatuses).optional(),
        type: z.enum(equipmentTypes).optional(),
        sortBy: z
            .enum([
                "name",
                "type",
                "status",
                "installedAt",
                "createdAt",
                "updatedAt",
            ])
            .optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict();

export const createEquipmentBodySchema = z
    .object({
        name: z.string().min(3).max(100),
        type: z.enum(equipmentTypes),
        serialNumber: z.string().min(1),
        location: z.object({
            lat: z.number().min(-90).max(90),
            lon: z.number().min(-180).max(180),
        }),
        status: z.enum(equipmentStatuses),
        installedAt: z
            .string()
            .refine(
                (value) =>
                    !Number.isNaN(Date.parse(value)) &&
                    Date.parse(value) <= Date.now(),
                {
                    message:
                        "installedAt must be a valid ISO date not in the future",
                },
            ),
    })
    .strict();

export const updateEquipmentBodySchema = createEquipmentBodySchema
    .partial()
    .strict();
