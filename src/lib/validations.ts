import { z } from 'zod';

/**
 * Centralized validation schemas for all write operations
 * These enforce strict payload validation at the application layer
 */

// UUID validation helper
const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Message validation schema
 */
export const messageSchema = z.object({
    content: z
        .string()
        .min(1, 'Message cannot be empty')
        .max(5000, 'Message is too long (max 5000 characters)')
        .transform(val => val.trim()),
    conversation_id: uuidSchema,
    sender_id: uuidSchema,
});

export type MessagePayload = z.infer<typeof messageSchema>;

/**
 * Connection request validation schema
 */
export const connectionRequestSchema = z.object({
    requester_id: uuidSchema,
    receiver_id: uuidSchema,
}).refine(
    data => data.requester_id !== data.receiver_id,
    { message: 'Cannot connect with yourself' }
);

export type ConnectionRequestPayload = z.infer<typeof connectionRequestSchema>;

/**
 * Endorsement validation schema
 */
export const endorsementSchema = z.object({
    endorser_id: uuidSchema,
    endorsed_id: uuidSchema,
}).refine(
    data => data.endorser_id !== data.endorsed_id,
    { message: 'Cannot endorse yourself' }
);

export type EndorsementPayload = z.infer<typeof endorsementSchema>;

/**
 * Startup interest validation schema
 */
export const startupInterestSchema = z.object({
    user_id: uuidSchema,
    startup_id: uuidSchema,
    interest_type: z.enum(['talent', 'investor']).optional(),
});

export type StartupInterestPayload = z.infer<typeof startupInterestSchema>;

/**
 * User report validation schema
 */
export const userReportSchema = z.object({
    reporter_id: uuidSchema,
    reported_id: uuidSchema,
    reason: z
        .string()
        .min(1, 'Reason is required')
        .max(100, 'Reason is too long'),
    details: z
        .string()
        .max(1000, 'Details are too long')
        .optional()
        .nullable(),
}).refine(
    data => data.reporter_id !== data.reported_id,
    { message: 'Cannot report yourself' }
);

export type UserReportPayload = z.infer<typeof userReportSchema>;

/**
 * Pitch report validation schema (for investors)
 */
export const pitchReportSchema = z.object({
    investor_id: uuidSchema,
    startup_id: uuidSchema,
    score: z
        .number()
        .int('Score must be a whole number')
        .min(1, 'Score must be at least 1')
        .max(10, 'Score must be at most 10'),
    recommendation: z
        .string()
        .min(1, 'Recommendation is required')
        .max(50, 'Recommendation is too long'),
    summary: z
        .string()
        .max(2000, 'Summary is too long')
        .optional()
        .nullable(),
    strengths: z
        .array(z.string().max(200))
        .max(10, 'Too many strengths listed')
        .optional()
        .nullable(),
    weaknesses: z
        .array(z.string().max(200))
        .max(10, 'Too many weaknesses listed')
        .optional()
        .nullable(),
});

export type PitchReportPayload = z.infer<typeof pitchReportSchema>;

/**
 * Startup update validation schema
 */
export const startupUpdateSchema = z.object({
    startup_id: uuidSchema,
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title is too long'),
    description: z
        .string()
        .max(2000, 'Description is too long')
        .optional()
        .nullable(),
    tag: z
        .enum(['milestone', 'hiring', 'product', 'funding', 'general'])
        .optional()
        .nullable(),
    media_url: z
        .string()
        .url('Invalid media URL')
        .optional()
        .nullable(),
});

export type StartupUpdatePayload = z.infer<typeof startupUpdateSchema>;

/**
 * Profile achievement validation schema
 */
export const profileAchievementSchema = z.object({
    user_id: uuidSchema,
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title is too long'),
    achievement_type: z
        .string()
        .min(1, 'Type is required')
        .max(50, 'Type is too long'),
    description: z
        .string()
        .max(500, 'Description is too long')
        .optional()
        .nullable(),
    year: z
        .number()
        .int()
        .min(1900, 'Year is invalid')
        .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
        .optional()
        .nullable(),
    proof_link: z
        .string()
        .url('Invalid link format')
        .optional()
        .nullable(),
});

export type ProfileAchievementPayload = z.infer<typeof profileAchievementSchema>;

/**
 * Validate a payload against a schema
 * Returns either the validated data or null with errors
 */
export function validatePayload<T>(
    data: unknown,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.issues.map(issue => issue.message);
    return { success: false, errors };
}
