import { supabase } from '@/integrations/supabase/client';

/**
 * Security utilities for CollabHub platform
 * Implements rate limiting, error normalization, and validation helpers
 */

// Rate limit configuration (requests per hour)
export const RATE_LIMITS = {
  connection_request: 20,
  message_send: 100,
  endorsement: 10,
  startup_interest: 30,
  report: 5,
  pitch_report: 10,
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if an action is rate limited for the current user
 * Uses SERVER-SIDE RPC function for enforcement that cannot be bypassed
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[action];
  const now = new Date();
  const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour fallback

  try {
    // Call server-side RPC function for atomic rate limiting
    // This cannot be bypassed by client-side manipulation
    const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
      p_action: action,
      p_limit: limit,
    });

    if (error) {
      // If RPC fails (e.g., migration not applied), fall back to client-side check
      console.warn('Server-side rate limit RPC failed, using fallback:', error.message);
      return checkRateLimitFallback(userId, action);
    }

    // Parse RPC response
    const result = data as { allowed: boolean; remaining: number; reset_at?: string; error?: string };

    if (result.error) {
      console.warn('Rate limit error:', result.error);
      return { allowed: false, remaining: 0, resetAt: now };
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.reset_at ? new Date(result.reset_at) : resetAt,
    };
  } catch (err) {
    console.error('Rate limit check failed:', err);
    // Fail CLOSED for security - reject the request
    return { allowed: false, remaining: 0, resetAt };
  }
}

/**
 * Fallback rate limiting using direct table access
 * Only used if server-side RPC is not available (e.g., migration not applied)
 */
async function checkRateLimitFallback(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  const limit = RATE_LIMITS[action];
  const windowMs = 60 * 60 * 1000; // 1 hour
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('action', action)
      .maybeSingle();

    if (error) {
      // Fail CLOSED - reject the request
      return { allowed: false, remaining: 0, resetAt };
    }

    if (!data) {
      await supabase.from('rate_limits').insert({
        user_id: userId,
        action,
        count: 1,
        reset_at: resetAt.toISOString(),
      });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    const recordResetAt = new Date(data.reset_at);

    if (recordResetAt < now) {
      await supabase
        .from('rate_limits')
        .update({ count: 1, reset_at: resetAt.toISOString() })
        .eq('id', data.id);
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    if (data.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: recordResetAt };
    }

    await supabase
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('id', data.id);

    return { allowed: true, remaining: limit - data.count - 1, resetAt: recordResetAt };
  } catch (err) {
    // Fail CLOSED - reject on error
    return { allowed: false, remaining: 0, resetAt };
  }
}

/**
 * Normalize error messages for safe client display
 * Never expose internal details, stack traces, or sensitive info
 */
export function normalizeError(error: unknown): string {
  // Known safe error messages to pass through
  const safeMessages = [
    'Email already registered',
    'Invalid credentials',
    'Session expired',
    'Network error',
    'Request timeout',
    'Too many requests',
    'Unauthorized',
    'Forbidden',
    'Not found',
    'Already exists',
    'Connection already exists',
  ];

  if (error instanceof Error) {
    const message = error.message;

    // Check for Supabase duplicate key error
    if (message.includes('duplicate key') || message.includes('23505')) {
      return 'This action has already been performed.';
    }

    // Check for auth-related errors
    if (message.includes('JWT') || message.includes('token')) {
      return 'Your session has expired. Please sign in again.';
    }

    // Pass through known safe messages
    for (const safe of safeMessages) {
      if (message.toLowerCase().includes(safe.toLowerCase())) {
        return safe;
      }
    }
  }

  // Default safe message
  return 'An error occurred. Please try again.';
}

/**
 * Validate that the user is authenticated before proceeding
 * Returns null if not authenticated, user ID if authenticated
 */
export async function requireAuth(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return null;
  }

  // Optionally verify the session is still valid
  if (session.expires_at) {
    const expiresAt = new Date(session.expires_at * 1000);
    if (expiresAt < new Date()) {
      // Session expired, attempt refresh
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        return null;
      }
    }
  }

  return session.user.id;
}

// In-memory tracking for abuse detection (resets on page reload)
const violationCounts = new Map<string, { count: number; firstViolation: Date }>();
const ABUSE_THRESHOLD = 5; // Flag user after 5 violations
const ABUSE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Log a security event (minimal, safe logging)
 * Used for rate limit violations, auth failures, etc.
 * Includes abuse detection and alerting
 */
export function logSecurityEvent(
  type: 'rate_limit_exceeded' | 'auth_failure' | 'validation_error' | 'access_denied',
  details: { action?: string; userId?: string; resource?: string }
): void {
  const sanitizedDetails = {
    type,
    action: details.action,
    // Never log full user IDs - just first 8 chars for correlation
    userIdPrefix: details.userId?.slice(0, 8),
    resource: details.resource?.slice(0, 50),
    timestamp: new Date().toISOString(),
  };

  console.warn('[SECURITY]', JSON.stringify(sanitizedDetails));

  // Track violations for abuse detection
  if (details.userId) {
    trackViolation(details.userId, type);
  }
}

/**
 * Track violations for abuse detection
 * Flags users who repeatedly violate security controls
 */
function trackViolation(userId: string, type: string): void {
  const now = new Date();
  const key = `${userId}-${type}`;
  const existing = violationCounts.get(key);

  if (!existing || (now.getTime() - existing.firstViolation.getTime() > ABUSE_WINDOW_MS)) {
    // Start new tracking window
    violationCounts.set(key, { count: 1, firstViolation: now });
    return;
  }

  existing.count++;

  if (existing.count >= ABUSE_THRESHOLD) {
    // Trigger abuse alert
    triggerAbuseAlert(userId, type, existing.count);
    // Reset counter after alerting
    violationCounts.delete(key);
  }
}

/**
 * Trigger abuse alert (placeholder for external integration)
 * In production, this would send to a webhook or alerting service
 */
function triggerAbuseAlert(userId: string, type: string, count: number): void {
  const alert = {
    level: 'ALERT',
    message: 'Repeated security violations detected',
    userIdPrefix: userId.slice(0, 8),
    violationType: type,
    violationCount: count,
    timestamp: new Date().toISOString(),
    // Placeholder: In production, uncomment to send webhook
    // webhookUrl: process.env.SECURITY_WEBHOOK_URL,
  };

  // Console alert (always)
  console.error('[SECURITY ALERT]', JSON.stringify(alert));

  // Placeholder for webhook notification
  // if (process.env.SECURITY_WEBHOOK_URL) {
  //   fetch(process.env.SECURITY_WEBHOOK_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(alert),
  //   }).catch(err => console.error('Webhook failed:', err));
  // }
}

/**
 * Check if a user is currently flagged for abuse
 * Uses server-side RPC to check security events table
 */
export async function checkUserAbuse(userId?: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_user_flagged_for_abuse', {
      p_user_id: userId || null,
    });

    if (error) {
      // If RPC not available, use client-side check
      const now = new Date();
      for (const [key, value] of violationCounts) {
        if (key.startsWith(userId || '') && value.count >= ABUSE_THRESHOLD) {
          if (now.getTime() - value.firstViolation.getTime() <= ABUSE_WINDOW_MS) {
            return true;
          }
        }
      }
      return false;
    }

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Rate limit error for standardized 429 responses
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number;

  constructor(resetAt: Date) {
    const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
    super('Too many requests. Please try again later.');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
