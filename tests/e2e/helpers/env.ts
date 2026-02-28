const isTruthy = (value: string | undefined): boolean => {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export const e2eEnv = {
  authEmail: process.env.E2E_AUTH_EMAIL,
  authPassword: process.env.E2E_AUTH_PASSWORD,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  enableGoogleOAuth: isTruthy(process.env.E2E_ENABLE_GOOGLE_OAUTH),
};

export const hasAuthCredentials = (): boolean =>
  Boolean(e2eEnv.authEmail && e2eEnv.authPassword);

export const hasGoogleOAuthConfig = (): boolean =>
  Boolean(e2eEnv.googleClientId && e2eEnv.googleClientSecret);

export const canRunGoogleOAuthE2E = (): boolean =>
  hasAuthCredentials() && hasGoogleOAuthConfig() && e2eEnv.enableGoogleOAuth;
