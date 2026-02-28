import { beforeEach, describe, expect, it, vi } from "vitest";

const { getJobMock } = vi.hoisted(() => ({
  getJobMock: vi.fn(),
}));

vi.mock("@/lib/redis/queue", () => ({
  schedulingQueue: {
    getJob: getJobMock,
  },
}));

import { checkJobAccess } from "./scheduling.service";

describe("checkJobAccess", () => {
  beforeEach(() => {
    getJobMock.mockReset();
  });

  it("returns not_found when the job does not exist", async () => {
    getJobMock.mockResolvedValue(null);

    await expect(checkJobAccess("job-1", "user-1")).resolves.toBe("not_found");
  });

  it("returns forbidden when the job belongs to another user", async () => {
    getJobMock.mockResolvedValue({
      data: { userId: "user-2" },
    });

    await expect(checkJobAccess("job-1", "user-1")).resolves.toBe("forbidden");
  });

  it("returns owned when the user owns the job", async () => {
    getJobMock.mockResolvedValue({
      data: { userId: "user-1" },
    });

    await expect(checkJobAccess("job-1", "user-1")).resolves.toBe("owned");
  });
});
