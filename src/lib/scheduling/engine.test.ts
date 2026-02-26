/**
 * Scheduling Engine Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateAvailability,
  subtractEventsFromSlot,
  findBestSlot,
  mergeAdjacentSlots,
  calculatePriorityScore,
  rankTasks,
  isOverdue,
  runSchedulingEngine,
  SchedulingTask,
  CalendarEvent,
  UserPreferences,
  TimeSlot,
  DEFAULT_PREFERENCES,
} from "./index";

// Test helpers
function createDate(day: number, hour: number, minute: number = 0): Date {
  const d = new Date("2024-02-19T00:00:00Z"); // Monday
  d.setDate(d.getDate() + day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function createTask(overrides: Partial<SchedulingTask> = {}): SchedulingTask {
  return {
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    title: "Test Task",
    estimatedDuration: 60,
    deadline: null,
    priority: "medium",
    workflowStateId: "state-1",
    scheduledStartTime: null,
    scheduledEndTime: null,
    parentTaskId: null,
    ...overrides,
  };
}

function createEvent(
  start: Date,
  end: Date,
  title: string = "Event",
  isAllDay: boolean = false
): CalendarEvent {
  return {
    id: `event-${Math.random().toString(36).substr(2, 9)}`,
    title,
    start,
    end,
    isAllDay,
    source: "google_calendar",
  };
}

// Tests for availability
describe("Availability Calculator", () => {
  describe("calculateAvailability", () => {
    it("should return working hours for working days", () => {
      const monday = createDate(0, 0); // Monday 00:00
      const tuesday = createDate(1, 0); // Tuesday 00:00
      
      const slots = calculateAvailability(monday, tuesday, [], DEFAULT_PREFERENCES);
      
      expect(slots.length).toBe(1);
      expect(slots[0].start.getHours()).toBe(9);
      expect(slots[0].end.getHours()).toBe(17);
    });

    it("should skip weekends", () => {
      const saturday = createDate(5, 0); // Saturday
      const sunday = createDate(6, 23, 59); // Sunday end
      
      const slots = calculateAvailability(saturday, sunday, [], DEFAULT_PREFERENCES);
      
      expect(slots.length).toBe(0);
    });

    it("should subtract events from available time", () => {
      const monday = createDate(0, 0);
      const tuesday = createDate(1, 0);
      
      // Event from 10:00 to 11:00
      const event = createEvent(createDate(0, 10), createDate(0, 11));
      
      const slots = calculateAvailability(monday, tuesday, [event], DEFAULT_PREFERENCES);
      
      // Should have two slots: 9-10 and 11-17
      expect(slots.length).toBe(2);
      expect(slots[0].start.getHours()).toBe(9);
      expect(slots[0].end.getHours()).toBe(10);
      expect(slots[1].start.getHours()).toBe(11);
      expect(slots[1].end.getHours()).toBe(17);
    });

    it("should block entire day for all-day events", () => {
      const monday = createDate(0, 0);
      const tuesday = createDate(1, 0);
      
      const allDayEvent = createEvent(
        createDate(0, 0),
        createDate(0, 23, 59),
        "All Day",
        true
      );
      
      const slots = calculateAvailability(monday, tuesday, [allDayEvent], DEFAULT_PREFERENCES);
      
      expect(slots.length).toBe(0);
    });
  });

  describe("subtractEventsFromSlot", () => {
    it("should split slot around event", () => {
      const slot: TimeSlot = {
        start: createDate(0, 9),
        end: createDate(0, 17),
      };
      const event = createEvent(createDate(0, 12), createDate(0, 13), "Lunch");
      
      const result = subtractEventsFromSlot(slot, [event]);
      
      expect(result.length).toBe(2);
      expect(result[0].end.getHours()).toBe(12);
      expect(result[1].start.getHours()).toBe(13);
    });

    it("should handle multiple events", () => {
      const slot: TimeSlot = {
        start: createDate(0, 9),
        end: createDate(0, 17),
      };
      const events = [
        createEvent(createDate(0, 10), createDate(0, 11)),
        createEvent(createDate(0, 14), createDate(0, 15)),
      ];
      
      const result = subtractEventsFromSlot(slot, events);
      
      expect(result.length).toBe(3); // 9-10, 11-14, 15-17
    });
  });

  describe("findBestSlot", () => {
    it("should find slot that fits duration", () => {
      const slots: TimeSlot[] = [
        { start: createDate(0, 9), end: createDate(0, 10) },  // 60 min
        { start: createDate(0, 11), end: createDate(0, 15) }, // 240 min
      ];
      
      const result = findBestSlot(90, slots, DEFAULT_PREFERENCES);
      
      expect(result).not.toBeNull();
      expect(result!.start.getHours()).toBe(11);
    });

    it("should return null if no slot fits", () => {
      const slots: TimeSlot[] = [
        { start: createDate(0, 9), end: createDate(0, 10) }, // 60 min
      ];
      
      // Task needs 120 min + break time
      const result = findBestSlot(120, slots, DEFAULT_PREFERENCES);
      
      expect(result).toBeNull();
    });
  });

  describe("mergeAdjacentSlots", () => {
    it("should merge adjacent slots", () => {
      const slots: TimeSlot[] = [
        { start: createDate(0, 9), end: createDate(0, 10) },
        { start: createDate(0, 10), end: createDate(0, 11) },
      ];
      
      const result = mergeAdjacentSlots(slots);
      
      expect(result.length).toBe(1);
      expect(result[0].start.getHours()).toBe(9);
      expect(result[0].end.getHours()).toBe(11);
    });

    it("should not merge non-adjacent slots", () => {
      const slots: TimeSlot[] = [
        { start: createDate(0, 9), end: createDate(0, 10) },
        { start: createDate(0, 11), end: createDate(0, 12) },
      ];
      
      const result = mergeAdjacentSlots(slots);
      
      expect(result.length).toBe(2);
    });
  });
});

// Tests for priority
describe("Priority Calculator", () => {
  describe("calculatePriorityScore", () => {
    const now = createDate(0, 9);

    it("should score urgent priority higher", () => {
      const urgentTask = createTask({ priority: "urgent" });
      const lowTask = createTask({ priority: "low" });
      
      const urgentScore = calculatePriorityScore(urgentTask, now);
      const lowScore = calculatePriorityScore(lowTask, now);
      
      expect(urgentScore.score).toBeGreaterThan(lowScore.score);
    });

    it("should add urgency for approaching deadlines", () => {
      const soonDeadline = createTask({
        deadline: createDate(0, 18), // 9 hours away
      });
      const noDeadline = createTask({
        deadline: null,
      });
      
      const soonScore = calculatePriorityScore(soonDeadline, now);
      const noScore = calculatePriorityScore(noDeadline, now);
      
      expect(soonScore.factors.deadlineUrgency).toBeGreaterThan(noScore.factors.deadlineUrgency);
    });

    it("should apply state priority boost", () => {
      const boostedTask = createTask({
        statePriorityBoost: 30,
      });
      const normalTask = createTask({
        statePriorityBoost: 0,
      });
      
      const boostedScore = calculatePriorityScore(boostedTask, now);
      const normalScore = calculatePriorityScore(normalTask, now);
      
      expect(boostedScore.score).toBe(normalScore.score + 30);
    });
  });

  describe("rankTasks", () => {
    it("should rank tasks by score descending", () => {
      const tasks: SchedulingTask[] = [
        createTask({ priority: "low", title: "Low" }),
        createTask({ priority: "urgent", title: "Urgent" }),
        createTask({ priority: "medium", title: "Medium" }),
      ];
      
      const ranked = rankTasks(tasks);
      
      expect(ranked[0].title).toBe("Urgent");
      expect(ranked[ranked.length - 1].title).toBe("Low");
    });

    it("should exclude tasks with excludeFromScheduling state", () => {
      const tasks: SchedulingTask[] = [
        createTask({ title: "Normal" }),
        createTask({ title: "Excluded", stateExcludeFromScheduling: true }),
      ];
      
      const ranked = rankTasks(tasks);
      
      expect(ranked.length).toBe(1);
      expect(ranked[0].title).toBe("Normal");
    });

    it("should exclude already scheduled tasks", () => {
      const tasks: SchedulingTask[] = [
        createTask({ title: "Unscheduled" }),
        createTask({ title: "Scheduled", scheduledStartTime: new Date() }),
      ];
      
      const ranked = rankTasks(tasks);
      
      expect(ranked.length).toBe(1);
      expect(ranked[0].title).toBe("Unscheduled");
    });
  });

  describe("isOverdue", () => {
    it("should detect overdue tasks", () => {
      const now = createDate(0, 12);
      const overdueTask = createTask({
        deadline: createDate(0, 10), // 2 hours ago
      });
      
      expect(isOverdue(overdueTask, now)).toBe(true);
    });

    it("should not flag future deadlines", () => {
      const now = createDate(0, 12);
      const futureTask = createTask({
        deadline: createDate(0, 18), // 6 hours away
      });
      
      expect(isOverdue(futureTask, now)).toBe(false);
    });
  });
});

// Tests for scheduling engine
describe("Scheduling Engine", () => {
  let preferences: UserPreferences;
  
  beforeEach(() => {
    preferences = { ...DEFAULT_PREFERENCES };
  });

  describe("runSchedulingEngine", () => {
    it("should schedule tasks into available slots", () => {
      const now = createDate(0, 9);
      const tasks: SchedulingTask[] = [
        createTask({ title: "Task 1", estimatedDuration: 60 }),
        createTask({ title: "Task 2", estimatedDuration: 30 }),
      ];
      
      const result = runSchedulingEngine({
        tasks,
        existingEvents: [],
        preferences,
        schedulingWindowDays: 1,
        now,
      });
      
      expect(result.success).toBe(true);
      expect(result.scheduledTasks.length).toBe(2);
      expect(result.stats.tasksScheduled).toBe(2);
    });

    it("should respect event blocks", () => {
      const now = createDate(0, 9);
      const tasks: SchedulingTask[] = [
        createTask({ title: "Task", estimatedDuration: 60 }),
      ];
      const events: CalendarEvent[] = [
        createEvent(createDate(0, 9), createDate(0, 10)), // Blocks 9-10
      ];
      
      const result = runSchedulingEngine({
        tasks,
        existingEvents: events,
        preferences,
        schedulingWindowDays: 1,
        now,
      });
      
      expect(result.success).toBe(true);
      expect(result.scheduledTasks[0].start.getHours()).toBeGreaterThanOrEqual(10);
    });

    it("should report unscheduled tasks when no slots available", () => {
      const now = createDate(0, 9);
      const tasks: SchedulingTask[] = [
        createTask({ title: "Task", estimatedDuration: 600 }), // 10 hours, won't fit in 8-hour day
      ];
      
      const result = runSchedulingEngine({
        tasks,
        existingEvents: [],
        preferences,
        schedulingWindowDays: 1,
        now,
      });
      
      expect(result.unscheduledTasks.length).toBe(1);
    });

    it("should schedule higher priority first", () => {
      const now = createDate(0, 9);
      const tasks: SchedulingTask[] = [
        createTask({ title: "Low", priority: "low", estimatedDuration: 60 }),
        createTask({ title: "High", priority: "high", estimatedDuration: 60 }),
      ];
      
      const result = runSchedulingEngine({
        tasks,
        existingEvents: [],
        preferences,
        schedulingWindowDays: 1,
        now,
      });
      
      // High priority should get earlier slot
      const highTask = result.scheduledTasks.find(
        (s) => tasks.find((t) => t.id === s.taskId)?.title === "High"
      );
      const lowTask = result.scheduledTasks.find(
        (s) => tasks.find((t) => t.id === s.taskId)?.title === "Low"
      );
      
      expect(highTask!.start.getTime()).toBeLessThan(lowTask!.start.getTime());
    });

    it("should warn about overdue tasks", () => {
      const now = createDate(0, 12);
      const tasks: SchedulingTask[] = [
        createTask({
          title: "Overdue",
          deadline: createDate(0, 10), // Already past
          stateExcludeFromScheduling: false,
        }),
      ];
      
      const result = runSchedulingEngine({
        tasks,
        existingEvents: [],
        preferences,
        schedulingWindowDays: 1,
        now,
      });
      
      expect(result.warnings.some((w) => w.includes("overdue"))).toBe(true);
    });

    it("should calculate utilization correctly", () => {
      const now = createDate(0, 9);
      const tasks: SchedulingTask[] = [
        createTask({ estimatedDuration: 120 }), // 2 hours
        createTask({ estimatedDuration: 120 }), // 2 hours
      ];
      
      const result = runSchedulingEngine({
        tasks,
        existingEvents: [],
        preferences,
        schedulingWindowDays: 1,
        now,
      });
      
      // 4 hours scheduled out of 8 hours available = 50%
      expect(result.stats.totalScheduledMinutes).toBe(240);
      expect(result.stats.utilizationPercent).toBeGreaterThan(0);
    });
  });
});
