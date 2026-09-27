import { z } from "zod";

export const siteIdParamsSchema = z.object({
    id: z.string().uuid(),
});
