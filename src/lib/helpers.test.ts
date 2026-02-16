import { describe, it, expect } from "vitest";
import {
  formatDuration,
  calculateWeeklyWorkingMinutes,
  isWithinWorkingHours,
  getPriorityColor,
} from "./helpers";

describe("formatDuration", () => {
  it("should format minutes only", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(30)).toBe("30m");
  });

  it("should format hours only", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(135)).toBe("2h 15m");
  });

  it("should handle zero", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("should throw error for negative values", () => {
    expect(() => formatDuration(-10)).toThrow("Duration cannot be negative");
  });
});

describe("calculateWeeklyWorkingMinutes", () => {
  it("should calculate total working minutes", () => {
    const workingHours = [
      { startTime: "09:00", endTime: "17:00", isWorkingDay: true }, // 8 hours
      { startTime: "09:00", endTime: "17:00", isWorkingDay: true }, // 8 hours
      { startTime: "00:00", endTime: "00:00", isWorkingDay: false }, // 0 hours
    ];

    expect(calculateWeeklyWorkingMinutes(workingHours)).toBe(960); // 16 hours = 960 minutes
  });

  it("should handle empty array", () => {
    expect(calculateWeeklyWorkingMinutes([])).toBe(0);
  });

  it("should skip non-working days", () => {
    const workingHours = [
      { startTime: "09:00", endTime: "17:00", isWorkingDay: false },
      { startTime: "09:00", endTime: "17:00", isWorkingDay: false },
    ];

    expect(calculateWeeklyWorkingMinutes(workingHours)).toBe(0);
  });
});

describe("isWithinWorkingHours", () => {
  const workingHours = { startTime: "09:00", endTime: "17:00" };

  it("should return true for times within working hours", () => {
    const date = new Date("2026-02-17T10:00:00");
    expect(isWithinWorkingHours(date, workingHours)).toBe(true);
  });

  it("should return false for times before working hours", () => {
    const date = new Date("2026-02-17T08:00:00");
    expect(isWithinWorkingHours(date, workingHours)).toBe(false);
  });

  it("should return false for times after working hours", () => {
    const date = new Date("2026-02-17T18:00:00");
    expect(isWithinWorkingHours(date, workingHours)).toBe(false);
  });

  it("should return true at start time", () => {
    const date = new Date("2026-02-17T09:00:00");
    expect(isWithinWorkingHours(date, workingHours)).toBe(true);
  });

  it("should return false at end time", () => {
    const date = new Date("2026-02-17T17:00:00");
    expect(isWithinWorkingHours(date, workingHours)).toBe(false);
  });
});

describe("getPriorityColor", () => {
  it("should return red for high priority", () => {
    expect(getPriorityColor(5)).toBe("text-red-500");
    expect(getPriorityColor(10)).toBe("text-red-500");
  });

  it("should return yellow for medium priority", () => {
    expect(getPriorityColor(0)).toBe("text-yellow-500");
    expect(getPriorityColor(3)).toBe("text-yellow-500");
  });

  it("should return blue for low priority", () => {
    expect(getPriorityColor(-1)).toBe("text-blue-500");
    expect(getPriorityColor(-5)).toBe("text-blue-500");
  });

  it("should return gray for very low priority", () => {
    expect(getPriorityColor(-6)).toBe("text-gray-500");
    expect(getPriorityColor(-10)).toBe("text-gray-500");
  });
});
