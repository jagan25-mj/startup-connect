import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeError, RateLimitError, RATE_LIMITS } from './security';
import {
    messageSchema,
    connectionRequestSchema,
    endorsementSchema,
    pitchReportSchema,
    validatePayload
} from './validations';

/**
 * Security-focused tests for CollabHub platform
 * Tests verify security behavior, not UI functionality
 */

describe('Security: Error Normalization', () => {
    it('should not expose internal error details', () => {
        const internalError = new Error('PGRST301: JWT expired at 123456789');
        const normalized = normalizeError(internalError);

        // Should not contain internal details
        expect(normalized).not.toContain('PGRST301');
        expect(normalized).not.toContain('123456789');

        // Should return safe message
        expect(normalized).toBe('Your session has expired. Please sign in again.');
    });

    it('should handle duplicate key errors safely', () => {
        const dupeError = new Error('duplicate key value violates unique constraint "idx_endorsements_unique"');
        const normalized = normalizeError(dupeError);

        expect(normalized).not.toContain('idx_endorsements_unique');
        expect(normalized).toBe('This action has already been performed.');
    });

    it('should return generic message for unknown errors', () => {
        const unknownError = new Error('Some internal database error with sensitive info');
        const normalized = normalizeError(unknownError);

        expect(normalized).toBe('An error occurred. Please try again.');
        expect(normalized).not.toContain('database');
    });

    it('should handle non-Error objects', () => {
        const normalized = normalizeError({ code: 500, secret: 'api_key_123' });

        expect(normalized).toBe('An error occurred. Please try again.');
        expect(normalized).not.toContain('api_key');
    });
});

describe('Security: Rate Limit Configuration', () => {
    it('should have reasonable limits configured', () => {
        // Verify limits are not too permissive
        expect(RATE_LIMITS.connection_request).toBeLessThanOrEqual(50);
        expect(RATE_LIMITS.message_send).toBeLessThanOrEqual(200);
        expect(RATE_LIMITS.endorsement).toBeLessThanOrEqual(20);
        expect(RATE_LIMITS.report).toBeLessThanOrEqual(10);

        // Verify limits are not too restrictive
        expect(RATE_LIMITS.connection_request).toBeGreaterThanOrEqual(5);
        expect(RATE_LIMITS.message_send).toBeGreaterThanOrEqual(10);
    });

    it('should have correct RateLimitError structure', () => {
        const resetAt = new Date(Date.now() + 60000); // 1 minute from now
        const error = new RateLimitError(resetAt);

        expect(error.name).toBe('RateLimitError');
        expect(error.message).toBe('Too many requests. Please try again later.');
        expect(error.retryAfter).toBeGreaterThan(0);
        expect(error.retryAfter).toBeLessThanOrEqual(60);
    });
});

describe('Security: Payload Validation', () => {
    describe('messageSchema', () => {
        it('should reject empty messages', () => {
            const result = validatePayload({
                content: '',
                conversation_id: 'valid-uuid-here',
                sender_id: 'valid-uuid-here',
            }, messageSchema);

            expect(result.success).toBe(false);
        });

        it('should reject messages exceeding length limit', () => {
            const result = validatePayload({
                content: 'a'.repeat(5001),
                conversation_id: '00000000-0000-0000-0000-000000000001',
                sender_id: '00000000-0000-0000-0000-000000000002',
            }, messageSchema);

            expect(result.success).toBe(false);
        });

        it('should accept valid messages', () => {
            const result = validatePayload({
                content: 'Hello, this is a valid message!',
                conversation_id: '00000000-0000-0000-0000-000000000001',
                sender_id: '00000000-0000-0000-0000-000000000002',
            }, messageSchema);

            expect(result.success).toBe(true);
        });
    });

    describe('connectionRequestSchema', () => {
        it('should prevent self-connection', () => {
            const userId = '00000000-0000-0000-0000-000000000001';
            const result = validatePayload({
                requester_id: userId,
                receiver_id: userId,
            }, connectionRequestSchema);

            expect(result.success).toBe(false);
        });

        it('should reject invalid UUIDs', () => {
            const result = validatePayload({
                requester_id: 'not-a-uuid',
                receiver_id: '00000000-0000-0000-0000-000000000001',
            }, connectionRequestSchema);

            expect(result.success).toBe(false);
        });
    });

    describe('endorsementSchema', () => {
        it('should prevent self-endorsement', () => {
            const userId = '00000000-0000-0000-0000-000000000001';
            const result = validatePayload({
                endorser_id: userId,
                endorsed_id: userId,
            }, endorsementSchema);

            expect(result.success).toBe(false);
        });
    });

    describe('pitchReportSchema', () => {
        it('should enforce score range 1-10', () => {
            const basePayload = {
                investor_id: '00000000-0000-0000-0000-000000000001',
                startup_id: '00000000-0000-0000-0000-000000000002',
                recommendation: 'invest',
            };

            // Score 0 should fail
            expect(validatePayload({ ...basePayload, score: 0 }, pitchReportSchema).success).toBe(false);

            // Score 11 should fail
            expect(validatePayload({ ...basePayload, score: 11 }, pitchReportSchema).success).toBe(false);

            // Score 5 should pass
            expect(validatePayload({ ...basePayload, score: 5 }, pitchReportSchema).success).toBe(true);
        });
    });
});

describe('Security: Input Sanitization', () => {
    it('should trim message content', () => {
        const result = validatePayload({
            content: '   Hello with whitespace   ',
            conversation_id: '00000000-0000-0000-0000-000000000001',
            sender_id: '00000000-0000-0000-0000-000000000002',
        }, messageSchema);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.content).toBe('Hello with whitespace');
        }
    });
});
