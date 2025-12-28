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
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
      throw new Error(`Environment variable validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export const env = validateEnv();

/**
 * Type-safe environment variable access
 */
export type Env = z.infer<typeof envSchema>;
