import { z } from 'zod';

export const prerequisiteBodySchema = z.object({
    courseId: z.coerce.number().int().positive(),
    prerequisiteId: z.coerce.number().int().positive(),
});
