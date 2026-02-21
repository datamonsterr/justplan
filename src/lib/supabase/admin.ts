import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Admin Supabase client with elevated privileges
 * 
 * SECURITY WARNING:
 * - This client uses the Secret Key which bypasses Row Level Security (RLS)
 * - Only use this client in server-side code (API routes, Server Actions, Edge Functions)
 * - NEVER expose this client to the browser or client components
 * - Always validate user permissions before performing operations
 * 
 * Use cases:
 * - Administrative operations (user management, bulk updates)
 * - Background jobs (cleanup, scheduled tasks)
 * - System-level operations that need to bypass RLS
 * - Data migration and seeding scripts
 * 
 * @example
 * ```typescript
 * import { createAdminClient } from '@/lib/supabase/admin';
 * 
 * // In an API route or Server Action
 * export async function deleteAccount(userId: string) {
 *   // Verify the requesting user has permission
 *   const { user } = await getCurrentUser();
 *   if (user.id !== userId && !user.is_admin) {
 *     throw new Error('Unauthorized');
 *   }
 *   
 *   const supabase = createAdminClient();
 *   await supabase.from('users').delete().eq('id', userId);
 * }
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
