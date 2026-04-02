import { z } from 'zod';
import { paginationQuerySchema } from './common.schema.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_ORDER = ['M', 'T', 'W', 'R', 'F', 'S', 'U'];
const DAY_ORDER_INDEX = new Map(DAY_ORDER.map((day, index) => [day, index]));

function normalizeTimeToSql(value) {
    return value ? value + ':00' : value;
}

function isCanonicalDaysValue(value) {
    const normalized = value.toUpperCase().trim();

    if (normalized.length === 0 || normalized.length > DAY_ORDER.length) {
        return false;
    }

    const seen = new Set();
    let previousIndex = -1;

    for (const day of normalized) {
        const index = DAY_ORDER_INDEX.get(day);

        if (index === undefined || seen.has(day) || index <= previousIndex) {
            return false;
        }

        seen.add(day);
        previousIndex = index;
    }

    return true;
}

function compareTimes(startTime, endTime) {
    return startTime.localeCompare(endTime);
}

// Validation schema for section-related operations
export const sectionBodySchema = z
    .object({
        semesterId: z.coerce.number().int().positive(),
        professorId: z.coerce.number().int().positive(),
        capacity: z.coerce.number().int().positive(),
        days: z.string().trim().toUpperCase().refine(isCanonicalDaysValue, 'Days must use unique canonical day codes in order, such as MWF or TR.'),
        startTime: z.string().regex(TIME_PATTERN, 'Start time must be in HH:MM 24-hour format.').optional().transform(normalizeTimeToSql),
        endTime: z.string().regex(TIME_PATTERN, 'End time must be in HH:MM 24-hour format.').optional().transform(normalizeTimeToSql),
    })
    .superRefine((value, ctx) => {
        const hasStartTime = Boolean(value.startTime);
        const hasEndTime = Boolean(value.endTime);

        if (hasStartTime !== hasEndTime) {
            ctx.addIssue({
                code: 'custom',
                message: 'Start time and end time must both be provided together.',
                path: hasStartTime ? ['endTime'] : ['startTime'],
            });
        }

        if (hasStartTime && hasEndTime && compareTimes(value.startTime, value.endTime) >= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Start time must be earlier than end time.',
                path: ['startTime'],
            });
        }
    });

// Validation schema for listing sections
export const getAllSectionsQuerySchema = paginationQuerySchema.extend({
    semesterId: z.coerce.number().int().positive().optional(),
    professorId: z.coerce.number().int().positive().optional(),
});

export const generateAccessCodesBodySchema = z.object({
    numCodes: z.coerce.number().int().positive().max(25).default(3),
});

export const revokeAccessCodesBodySchema = z.object({
    codesToRevoke: z.array(z.string().trim().min(1)).min(1),
});
