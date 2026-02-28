import { describe, expect, it } from "vitest";
import {
  evaluateTransitionCondition,
  getConditionHours,
} from "./transition-conditions";

describe("transition-conditions", () => {
  const baseTask = {
    id: "task-1",
    deadline: null,
    scheduledEnd: null,
    workflowStateId: "state-1",
    createdAt: "2026-02-27T00:00:00.000Z",
  };

  it("parses hours from condition value", () => {
    expect(getConditionHours({ hours: 12 })).toBe(12);
    expect(getConditionHours({ days: 2 })).toBe(48);
    expect(getConditionHours(null)).toBe(24);
  });

  it("evaluates overdue correctly", () => {
    expect(
      evaluateTransitionCondition({
        conditionType: "overdue",
        conditionValue: null,
        task: { ...baseTask, deadline: "2026-02-26T00:00:00.000Z" },
        now: new Date("2026-02-27T00:00:00.000Z"),
      })
    ).toBe(true);
  });

  it("evaluates deadline_within window", () => {
    expect(
      evaluateTransitionCondition({
        conditionType: "deadline_within",
        conditionValue: { hours: 24 },
        task: { ...baseTask, deadline: "2026-02-27T12:00:00.000Z" },
        now: new Date("2026-02-27T00:00:00.000Z"),
      })
    ).toBe(true);

    expect(
      evaluateTransitionCondition({
        conditionType: "deadline_within",
        conditionValue: { hours: 1 },
        task: { ...baseTask, deadline: "2026-02-27T12:00:00.000Z" },
        now: new Date("2026-02-27T00:00:00.000Z"),
      })
    ).toBe(false);
  });

  it("evaluates time_in_state threshold", () => {
    expect(
      evaluateTransitionCondition({
        conditionType: "time_in_state",
        conditionValue: { hours: 3 },
        task: baseTask,
        transitionedAt: new Date("2026-02-26T20:00:00.000Z"),
        now: new Date("2026-02-27T00:00:00.000Z"),
      })
    ).toBe(true);
  });

  it("evaluates task_completed from completed parent map", () => {
    expect(
      evaluateTransitionCondition({
        conditionType: "task_completed",
        conditionValue: null,
        task: baseTask,
        completedParentIds: new Set(["task-1"]),
        now: new Date("2026-02-27T00:00:00.000Z"),
      })
    ).toBe(true);
  });

  it("evaluates scheduled_time_passed correctly", () => {
    expect(
      evaluateTransitionCondition({
        conditionType: "scheduled_time_passed",
        conditionValue: null,
        task: { ...baseTask, scheduledEnd: "2026-02-26T23:59:00.000Z" },
        now: new Date("2026-02-27T00:00:00.000Z"),
      })
    ).toBe(true);
  });
});

