import { z } from 'zod';

export const enrollmentCreateBodySchema = z.object({
    studentId: z.coerce.number().int().positive(),
    sectionId: z.coerce.number().int().positive(),
    accessCode: z.string().trim().min(1).optional(),
});

export const enrollmentUpdateBodySchema = z.object({
    status: z.enum(['enrolled', 'dropped', 'completed', 'waitlisted']),
    accessCode: z.string().trim().min(1).optional(),
});
