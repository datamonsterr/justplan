import { afterEach, beforeEach, vi } from "vitest";

const FIXED_INTEGRATION_DATE = new Date("2026-01-01T00:00:00.000Z");

process.env.TZ = "UTC";
process.env.JUSTPLAN_INTEGRATION_BOOTSTRAP = "true";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_INTEGRATION_DATE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
