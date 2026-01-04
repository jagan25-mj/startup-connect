import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'Supabase publishable key is required'),
  VITE_SUPABASE_PROJECT_ID: z.string().min(1, 'Supabase project ID is required'),
});

/**
 * Get environment variables with fallback for development
 * Returns raw values without strict validation to avoid blocking app startup
 */
function getEnvVars() {
  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID || '',
  };
}

/**
 * Validate environment variables (for use in production checks)
 * Returns validation result without throwing
 */
export function validateEnv() {
  const result = envSchema.safeParse(getEnvVars());
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: !result.success
      ? result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      : [],
  };
}

/**
 * Environment variables for use throughout the application
 * Uses direct access to avoid blocking on validation errors
 */
export const env = getEnvVars();

/**
 * Type-safe environment variable access
 */
export type Env = z.infer<typeof envSchema>;
