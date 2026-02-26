"use client";

import { useAuth, useUser, useClerk } from "@clerk/nextjs";

/**
 * Custom hook for Clerk authentication in client components
 * Provides a simplified interface for auth state and actions
 */
export function useClerkAuth() {
  const { isLoaded, isSignedIn, userId, signOut } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  const displayName = user?.firstName
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";

  const email = user?.emailAddresses?.[0]?.emailAddress || null;
  const imageUrl = user?.imageUrl || null;

  return {
    // State
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    userId,
    user,
    displayName,
    email,
    imageUrl,

    // Actions
    signOut: () => signOut(),
    openSignIn: () => clerk.openSignIn(),
    openSignUp: () => clerk.openSignUp(),
    openUserProfile: () => clerk.openUserProfile(),
  };
}

export { useAuth, useUser, useClerk } from "@clerk/nextjs";
