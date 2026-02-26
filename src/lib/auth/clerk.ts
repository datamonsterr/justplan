import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Get the current authenticated user's ID
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get the current authenticated user with full profile
 * @returns Clerk User object or null if not authenticated
 */
export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

/**
 * Require authentication - throws if not authenticated
 * Use in Server Components or API routes that require auth
 * @returns User ID
 * @throws Redirects to sign-in if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId, redirectToSignIn } = await auth();
  
  if (!userId) {
    return redirectToSignIn();
  }
  
  return userId;
}

/**
 * Protect an API route - returns 401 if not authenticated
 * @returns Object with userId and isAuthenticated
 */
export async function protectApiRoute(): Promise<{
  userId: string | null;
  isAuthenticated: boolean;
}> {
  const { userId } = await auth();
  
  return {
    userId,
    isAuthenticated: !!userId,
  };
}

/**
 * Get user's display name
 * @returns Display name or email or "User"
 */
export async function getUserDisplayName(): Promise<string> {
  const user = await currentUser();
  
  if (!user) return "User";
  
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  
  if (user.emailAddresses?.[0]?.emailAddress) {
    return user.emailAddresses[0].emailAddress.split("@")[0];
  }
  
  return "User";
}

/**
 * Get user's primary email
 * @returns Primary email or null
 */
export async function getUserEmail(): Promise<string | null> {
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress || null;
}
