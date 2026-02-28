import { auth, currentUser } from "@clerk/nextjs/server";
import {
  forbiddenResponse,
  unauthenticatedResponse,
} from "@/lib/api/error-response";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthErrorCode = "UNAUTHENTICATED" | "FORBIDDEN";

export class ApiAuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "ApiAuthError";
    this.code = code;
    this.status = code === "UNAUTHENTICATED" ? 401 : 403;
  }
}

export interface ApiUserContext {
  clerkUserId: string;
  dbUserId: string;
}

function isNoRowsError(error: { code?: string } | null | undefined): boolean {
  return !!error && error.code === "PGRST116";
}

let usersTableHasClerkUserIdColumn: boolean | null = null;

function isMissingColumnError(
  error: { code?: string; message?: string } | null | undefined,
  column: string
): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "42703") {
    return true;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes(`column "${column.toLowerCase()}"`) ||
    (message.includes("column") && message.includes(column.toLowerCase()))
  );
}

function getClerkPrimaryEmail(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>
) {
  const primary = user.emailAddresses?.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress;
  return primary ?? user.emailAddresses?.[0]?.emailAddress ?? null;
}

async function resolveOrCreateDbUserId(clerkUserId: string): Promise<string> {
  const admin = createAdminClient();
  let canUseClerkUserIdColumn = usersTableHasClerkUserIdColumn !== false;

  if (canUseClerkUserIdColumn) {
    const { data: byClerkId, error: byClerkIdError } = await admin
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (byClerkIdError && !isNoRowsError(byClerkIdError)) {
      if (isMissingColumnError(byClerkIdError, "clerk_user_id")) {
        canUseClerkUserIdColumn = false;
        usersTableHasClerkUserIdColumn = false;
      } else {
        throw new Error(
          `Failed to resolve user by clerk ID: ${byClerkIdError.message}`
        );
      }
    }

    if (byClerkId?.id) {
      usersTableHasClerkUserIdColumn = true;
      return byClerkId.id;
    }
  }

  const clerkProfile = await currentUser();
  if (!clerkProfile) {
    throw new ApiAuthError("UNAUTHENTICATED", "Authentication required");
  }

  const email = getClerkPrimaryEmail(clerkProfile);
  if (!email) {
    throw new ApiAuthError(
      "FORBIDDEN",
      "Authenticated user has no primary email"
    );
  }

  const fullName = [clerkProfile.firstName, clerkProfile.lastName]
    .filter(Boolean)
    .join(" ");

  const { data: byEmail, error: byEmailError } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (byEmailError && !isNoRowsError(byEmailError)) {
    throw new Error(`Failed to resolve user by email: ${byEmailError.message}`);
  }

  if (byEmail?.id) {
    const baseUpdatePayload = {
      full_name: fullName || null,
      avatar_url: clerkProfile.imageUrl || null,
      updated_at: new Date().toISOString(),
    };

    const updatePayload = canUseClerkUserIdColumn
      ? { ...baseUpdatePayload, clerk_user_id: clerkUserId }
      : baseUpdatePayload;

    let { error: updateError } = await admin
      .from("users")
      .update(updatePayload)
      .eq("id", byEmail.id);

    if (
      updateError &&
      canUseClerkUserIdColumn &&
      isMissingColumnError(updateError, "clerk_user_id")
    ) {
      canUseClerkUserIdColumn = false;
      usersTableHasClerkUserIdColumn = false;
      const retryUpdate = await admin
        .from("users")
        .update(baseUpdatePayload)
        .eq("id", byEmail.id);
      updateError = retryUpdate.error;
    }

    if (updateError) {
      throw new Error(`Failed to link user profile: ${updateError.message}`);
    }

    if (canUseClerkUserIdColumn) {
      usersTableHasClerkUserIdColumn = true;
    }
    return byEmail.id;
  }

  const baseInsertPayload = {
    email,
    full_name: fullName || null,
    avatar_url: clerkProfile.imageUrl || null,
  };

  let createResult = await admin
    .from("users")
    .insert(
      canUseClerkUserIdColumn
        ? { ...baseInsertPayload, clerk_user_id: clerkUserId }
        : baseInsertPayload
    )
    .select("id")
    .single();

  if (
    createResult.error &&
    canUseClerkUserIdColumn &&
    isMissingColumnError(createResult.error, "clerk_user_id")
  ) {
    canUseClerkUserIdColumn = false;
    usersTableHasClerkUserIdColumn = false;
    createResult = await admin
      .from("users")
      .insert(baseInsertPayload)
      .select("id")
      .single();
  }

  const { data: created, error: createError } = createResult;

  if (createError) {
    // A concurrent request may have just inserted the row. Resolve once more.
    const retryQuery = admin.from("users").select("id");
    const { data: retryLookup, error: retryError } = canUseClerkUserIdColumn
      ? await retryQuery.eq("clerk_user_id", clerkUserId).maybeSingle()
      : await retryQuery.eq("email", email).maybeSingle();

    if (retryError && !isNoRowsError(retryError)) {
      throw new Error(
        `Failed to resolve user after create race: ${retryError.message}`
      );
    }

    if (retryLookup?.id) {
      return retryLookup.id;
    }

    throw new Error(`Failed to create user profile: ${createError.message}`);
  }

  if (canUseClerkUserIdColumn) {
    usersTableHasClerkUserIdColumn = true;
  }

  return created.id;
}

export async function requireApiUser(): Promise<ApiUserContext> {
  const { userId } = await auth();
  if (!userId) {
    throw new ApiAuthError("UNAUTHENTICATED", "Authentication required");
  }

  const dbUserId = await resolveOrCreateDbUserId(userId);
  return {
    clerkUserId: userId,
    dbUserId,
  };
}

export async function resolveDbUserIdFromClerkId(
  clerkUserId: string
): Promise<string> {
  if (!clerkUserId) {
    throw new ApiAuthError("UNAUTHENTICATED", "Authentication required");
  }
  return resolveOrCreateDbUserId(clerkUserId);
}

export function isApiAuthError(error: unknown): error is ApiAuthError {
  return error instanceof ApiAuthError;
}

export function toApiAuthErrorResponse(error: ApiAuthError) {
  if (error.code === "FORBIDDEN") {
    return forbiddenResponse(error.message);
  }

  return unauthenticatedResponse(error.message);
}
