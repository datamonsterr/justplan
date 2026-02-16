# JustPlan - Test Plan

**Project:** JustPlan  
**Version:** 1.0  
**Date:** February 17, 2026  
**Testing Philosophy:** Test Pyramid (70% Unit, 20% Integration, 10% E2E)

---

## Testing Strategy Overview

```
           ╱╲
          ╱  ╲      E2E Tests (Manual + Automated)
         ╱────╲     ~10% - Main user flows
        ╱      ╲
       ╱────────╲   Integration Tests
      ╱          ╲  ~20% - API + DB + External services
     ╱────────────╲
    ╱              ╲ Unit Tests
   ╱────────────────╲ ~70% - Functions, utilities, pure logic
  ╱__________________╲
```

**Principles:**

- ✅ Write tests before code (TDD when possible)
- ✅ Fast feedback: Unit tests run in < 1 second
- ✅ Isolated: Tests don't depend on each other
- ✅ Repeatable: Same input = same output
- ✅ Maintainable: Clear, readable test code

---

## Test Coverage Goals

| Layer                 | Target Coverage | Tools                         |
| --------------------- | --------------- | ----------------------------- |
| **Unit Tests**        | 80%+            | Vitest                        |
| **Integration Tests** | 70%+            | Vitest + Supabase Test Client |
| **E2E Tests**         | Critical paths  | Playwright                    |
| **Manual Tests**      | New features    | Chrome MCP Agent              |

---

## 1. Unit Tests (70%)

**Scope:** Test individual functions, utilities, and pure logic in isolation.

### 1.1 Scheduling Algorithm

**Files:**

- `lib/scheduling/algorithm.ts`
- `lib/scheduling/availability.ts`
- `lib/scheduling/priority.ts`

**Test Cases:**

#### `algorithm.test.ts`

```typescript
describe("scheduleTasksGreedy", () => {
  it("should schedule single task in available slot", () => {
    const tasks = [mockTask({ duration: 60, priority: "high" })];
    const availability = [mockSlot({ start: "09:00", end: "17:00" })];

    const schedule = scheduleTasksGreedy(tasks, availability);

    expect(schedule).toHaveLength(1);
    expect(schedule[0].start).toBe("09:00");
    expect(schedule[0].end).toBe("10:00");
  });

  it("should prioritize high priority tasks", () => {
    const tasks = [
      mockTask({ id: "1", duration: 60, priority: "low" }),
      mockTask({ id: "2", duration: 60, priority: "high" }),
    ];
    const availability = [mockSlot({ start: "09:00", end: "11:00" })];

    const schedule = scheduleTasksGreedy(tasks, availability);

    expect(schedule[0].taskId).toBe("2"); // High priority first
    expect(schedule[1].taskId).toBe("1");
  });

  it("should respect task deadlines", () => {
    const tomorrow = addDays(new Date(), 1);
    const tasks = [
      mockTask({ duration: 60, deadline: tomorrow, priority: "low" }),
    ];
    const availability = [mockSlot({ start: "09:00", end: "17:00" })];

    const schedule = scheduleTasksGreedy(tasks, availability);

    expect(isBefore(schedule[0].end, tomorrow)).toBe(true);
  });

  it("should add buffer time between tasks", () => {
    const tasks = [
      mockTask({ id: "1", duration: 60 }),
      mockTask({ id: "2", duration: 60 }),
    ];
    const availability = [mockSlot({ start: "09:00", end: "17:00" })];
    const bufferMinutes = 15;

    const schedule = scheduleTasksGreedy(tasks, availability, {
      bufferMinutes,
    });

    const gap = differenceInMinutes(schedule[1].start, schedule[0].end);
    expect(gap).toBe(bufferMinutes);
  });

  it("should not schedule task if no suitable slot", () => {
    const tasks = [mockTask({ duration: 120 })];
    const availability = [mockSlot({ start: "09:00", end: "10:00" })]; // Only 60 min

    const schedule = scheduleTasksGreedy(tasks, availability);

    expect(schedule).toHaveLength(0);
  });

  it("should handle task splitting for long tasks", () => {
    const tasks = [mockTask({ duration: 180, canSplit: true })];
    const availability = [
      mockSlot({ start: "09:00", end: "10:00" }), // 60 min
      mockSlot({ start: "14:00", end: "16:00" }), // 120 min
    ];

    const schedule = scheduleTasksGreedy(tasks, availability);

    expect(schedule).toHaveLength(2);
    expect(schedule[0].duration).toBe(60);
    expect(schedule[1].duration).toBe(120);
  });

  it("should remove allocated time from availability", () => {
    const tasks = [
      mockTask({ id: "1", duration: 60 }),
      mockTask({ id: "2", duration: 60 }),
    ];
    const availability = [mockSlot({ start: "09:00", end: "11:00" })];

    const schedule = scheduleTasksGreedy(tasks, availability);

    expect(schedule).toHaveLength(2);
    expect(schedule[0].start).toBe("09:00");
    expect(schedule[1].start).toBe("10:00");
  });
});
```

#### `availability.test.ts`

```typescript
describe("calculateAvailability", () => {
  it("should return working hours as available slots", () => {
    const workingHours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    ];
    const date = nextMonday(new Date());

    const slots = calculateAvailability(date, workingHours, []);

    expect(slots).toHaveLength(1);
    expect(format(slots[0].start, "HH:mm")).toBe("09:00");
    expect(format(slots[0].end, "HH:mm")).toBe("17:00");
  });

  it("should exclude existing events from availability", () => {
    const workingHours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    ];
    const date = nextMonday(new Date());
    const busyTimes = [{ start: setHours(date, 10), end: setHours(date, 11) }];

    const slots = calculateAvailability(date, workingHours, busyTimes);

    expect(slots).toHaveLength(2);
    expect(format(slots[0].start, "HH:mm")).toBe("09:00");
    expect(format(slots[0].end, "HH:mm")).toBe("10:00");
    expect(format(slots[1].start, "HH:mm")).toBe("11:00");
    expect(format(slots[1].end, "HH:mm")).toBe("17:00");
  });

  it("should handle multiple days", () => {
    const workingHours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
    ];
    const startDate = nextMonday(new Date());
    const endDate = addDays(startDate, 2);

    const slots = calculateAvailability(startDate, workingHours, [], endDate);

    expect(slots.length).toBeGreaterThanOrEqual(2);
  });

  it("should respect timezone", () => {
    const workingHours = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    ];
    const date = nextMonday(new Date());

    const slots = calculateAvailability(
      date,
      workingHours,
      [],
      date,
      "America/New_York"
    );

    // Verify timezone is applied correctly
    expect(slots[0].start.toISOString()).toContain("T14:00:00"); // 9 AM EST = 2 PM UTC
  });
});
```

#### `priority.test.ts`

```typescript
describe("prioritizeTasks", () => {
  it("should sort by priority first", () => {
    const tasks = [
      mockTask({ id: "1", priority: "low" }),
      mockTask({ id: "2", priority: "high" }),
      mockTask({ id: "3", priority: "medium" }),
    ];

    const sorted = prioritizeTasks(tasks);

    expect(sorted[0].priority).toBe("high");
    expect(sorted[1].priority).toBe("medium");
    expect(sorted[2].priority).toBe("low");
  });

  it("should apply workflow state priority boost", () => {
    const tasks = [
      mockTask({ id: "1", priority: "medium", stateBoost: 0 }),
      mockTask({ id: "2", priority: "low", stateBoost: 10 }), // Urgent state
    ];

    const sorted = prioritizeTasks(tasks);

    expect(sorted[0].id).toBe("2"); // Low + boost wins over medium
  });

  it("should prioritize by deadline when priority equal", () => {
    const tomorrow = addDays(new Date(), 1);
    const nextWeek = addDays(new Date(), 7);
    const tasks = [
      mockTask({ id: "1", priority: "high", deadline: nextWeek }),
      mockTask({ id: "2", priority: "high", deadline: tomorrow }),
    ];

    const sorted = prioritizeTasks(tasks);

    expect(sorted[0].id).toBe("2"); // Sooner deadline first
  });

  it("should handle tasks without deadlines", () => {
    const tomorrow = addDays(new Date(), 1);
    const tasks = [
      mockTask({ id: "1", priority: "high", deadline: null }),
      mockTask({ id: "2", priority: "high", deadline: tomorrow }),
    ];

    const sorted = prioritizeTasks(tasks);

    expect(sorted[0].id).toBe("2"); // With deadline comes first
    expect(sorted[1].id).toBe("1");
  });
});
```

### 1.2 Workflow Engine

**Files:**

- `lib/workflows/transitions.ts`
- `lib/workflows/conditions.ts`

**Test Cases:**

#### `transitions.test.ts`

```typescript
describe("evaluateTransitions", () => {
  it("should transition when deadline within threshold", () => {
    const task = mockTask({
      deadline: addHours(new Date(), 12),
      stateId: "ready-state-id",
    });
    const transitions = [
      mockTransition({
        fromStateId: "ready-state-id",
        toStateId: "urgent-state-id",
        conditionType: "deadline_within",
        conditionValue: { hours: 24 },
      }),
    ];

    const results = evaluateTransitions(task, transitions);

    expect(results).toHaveLength(1);
    expect(results[0].toStateId).toBe("urgent-state-id");
  });

  it("should not transition if condition not met", () => {
    const task = mockTask({
      deadline: addDays(new Date(), 3),
      stateId: "ready-state-id",
    });
    const transitions = [
      mockTransition({
        fromStateId: "ready-state-id",
        conditionType: "deadline_within",
        conditionValue: { hours: 24 },
      }),
    ];

    const results = evaluateTransitions(task, transitions);

    expect(results).toHaveLength(0);
  });

  it("should handle time_in_state condition", () => {
    const threeDaysAgo = subDays(new Date(), 3);
    const task = mockTask({
      stateId: "blocked-state-id",
      stateEnteredAt: threeDaysAgo,
    });
    const transitions = [
      mockTransition({
        fromStateId: "blocked-state-id",
        toStateId: "backlog-state-id",
        conditionType: "time_in_state",
        conditionValue: { days: 2 },
      }),
    ];

    const results = evaluateTransitions(task, transitions);

    expect(results).toHaveLength(1);
  });

  it("should only evaluate enabled transitions", () => {
    const task = mockTask({ stateId: "ready-state-id" });
    const transitions = [
      mockTransition({
        fromStateId: "ready-state-id",
        isEnabled: false,
      }),
    ];

    const results = evaluateTransitions(task, transitions);

    expect(results).toHaveLength(0);
  });
});
```

#### `conditions.test.ts`

```typescript
describe("checkDeadlineWithin", () => {
  it("should return true when deadline within hours", () => {
    const deadline = addHours(new Date(), 12);

    const result = checkDeadlineWithin(deadline, { hours: 24 });

    expect(result).toBe(true);
  });

  it("should return false when deadline outside threshold", () => {
    const deadline = addDays(new Date(), 3);

    const result = checkDeadlineWithin(deadline, { hours: 24 });

    expect(result).toBe(false);
  });

  it("should handle days parameter", () => {
    const deadline = addDays(new Date(), 2);

    const result = checkDeadlineWithin(deadline, { days: 3 });

    expect(result).toBe(true);
  });
});

describe("checkOverdue", () => {
  it("should return true when past deadline", () => {
    const deadline = subHours(new Date(), 1);

    const result = checkOverdue(deadline, {});

    expect(result).toBe(true);
  });

  it("should respect grace period", () => {
    const deadline = subMinutes(new Date(), 30);

    const result = checkOverdue(deadline, { gracePeriodHours: 1 });

    expect(result).toBe(false); // Still within grace period
  });
});
```

### 1.3 Utility Functions

**Files:**

- `lib/utils.ts`
- `lib/date-utils.ts`
- `lib/validation.ts`

```typescript
describe("formatDuration", () => {
  it("should format minutes to hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("should handle hours only", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("should handle minutes only", () => {
    expect(formatDuration(45)).toBe("45m");
  });
});

describe("validateTaskInput", () => {
  it("should validate correct task data", () => {
    const input = {
      title: "Test task",
      estimatedDurationMinutes: 60,
      priority: "high",
    };

    const result = validateTaskInput(input);

    expect(result.success).toBe(true);
  });

  it("should reject invalid duration", () => {
    const input = {
      title: "Test task",
      estimatedDurationMinutes: -10,
    };

    const result = validateTaskInput(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain("duration");
  });
});
```

### 1.4 React Hooks

**Files:**

- `hooks/use-tasks.ts`
- `hooks/use-calendar.ts`

```typescript
describe("useTasks", () => {
  it("should fetch tasks on mount", async () => {
    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks).toBeDefined();
    });
  });

  it("should filter tasks by state", async () => {
    const { result } = renderHook(() => useTasks({ state: "in-progress" }));

    await waitFor(() => {
      expect(result.current.tasks.every((t) => t.state === "in-progress")).toBe(
        true
      );
    });
  });

  it("should handle optimistic updates", async () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.updateTask("task-id", { priority: "high" });
    });

    // Immediately reflects in UI
    expect(result.current.tasks.find((t) => t.id === "task-id").priority).toBe(
      "high"
    );
  });
});
```

---

## 2. Integration Tests (20%)

**Scope:** Test interactions between components, database operations, and external APIs.

### 2.1 Database Operations

**Files:**

- `services/task.service.test.ts`
- `services/calendar.service.test.ts`
- `services/workflow.service.test.ts`

```typescript
describe("TaskService", () => {
  let supabase: SupabaseClient;
  let userId: string;

  beforeEach(async () => {
    // Use Supabase test client with separate test DB
    supabase = createTestClient();
    userId = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestData(userId);
  });

  describe("createTask", () => {
    it("should create task in database", async () => {
      const input = {
        title: "Test task",
        estimatedDurationMinutes: 60,
        priority: "high",
        workflowStateId: "ready-state-id",
      };

      const task = await TaskService.createTask(userId, input);

      expect(task.id).toBeDefined();
      expect(task.userId).toBe(userId);
      expect(task.title).toBe(input.title);

      // Verify in DB
      const { data } = await supabase
        .from("tasks")
        .select()
        .eq("id", task.id)
        .single();

      expect(data).toBeDefined();
    });

    it("should enforce row level security", async () => {
      const otherUserId = await createTestUser();

      await expect(
        TaskService.createTask(otherUserId, {
          title: "Unauthorized",
          estimatedDurationMinutes: 60,
        })
      ).rejects.toThrow(); // RLS blocks access
    });

    it("should validate input schema", async () => {
      await expect(
        TaskService.createTask(userId, {
          title: "", // Empty title
          estimatedDurationMinutes: -10, // Negative
        })
      ).rejects.toThrow();
    });

    it("should assign default workflow state", async () => {
      const task = await TaskService.createTask(userId, {
        title: "Test",
        estimatedDurationMinutes: 60,
        // No workflowStateId provided
      });

      expect(task.workflowStateId).toBeDefined();
    });
  });

  describe("scheduleTask", () => {
    it("should update task schedule and create calendar event", async () => {
      const task = await TaskService.createTask(userId, {
        title: "Test",
        estimatedDurationMinutes: 60,
      });

      const schedule = {
        start: addHours(new Date(), 2),
        end: addHours(new Date(), 3),
      };

      const updated = await TaskService.scheduleTask(task.id, schedule);

      expect(updated.isScheduled).toBe(true);
      expect(updated.scheduledStart).toEqual(schedule.start);
      expect(updated.scheduledEnd).toEqual(schedule.end);
      expect(updated.googleCalendarEventId).toBeDefined();
    });
  });

  describe("transitionTaskState", () => {
    it("should change task state and log history", async () => {
      const task = await TaskService.createTask(userId, {
        title: "Test",
        estimatedDurationMinutes: 60,
        workflowStateId: "ready-state-id",
      });

      const updated = await TaskService.transitionTaskState(
        task.id,
        "in-progress-state-id",
        "manual"
      );

      expect(updated.workflowStateId).toBe("in-progress-state-id");

      // Verify history logged
      const { data: history } = await supabase
        .from("task_state_history")
        .select()
        .eq("task_id", task.id);

      expect(history).toHaveLength(1);
      expect(history[0].fromStateId).toBe("ready-state-id");
      expect(history[0].toStateId).toBe("in-progress-state-id");
    });
  });
});
```

### 2.2 Google API Integration

**Files:**

- `lib/google/calendar-client.test.ts`
- `lib/google/tasks-client.test.ts`

```typescript
describe("GoogleCalendarClient", () => {
  let client: GoogleCalendarClient;
  let mockAccessToken: string;

  beforeEach(() => {
    mockAccessToken = "test-token";
    client = new GoogleCalendarClient(mockAccessToken);
  });

  describe("listEvents", () => {
    it("should fetch events from Google Calendar API", async () => {
      // Mock Google API response
      mockGoogleApi({
        endpoint: "/calendar/v3/calendars/primary/events",
        response: {
          items: [
            {
              id: "event-1",
              summary: "Meeting",
              start: { dateTime: "2026-02-17T10:00:00Z" },
              end: { dateTime: "2026-02-17T11:00:00Z" },
            },
          ],
        },
      });

      const events = await client.listEvents("primary", {
        timeMin: new Date("2026-02-17"),
        timeMax: new Date("2026-02-18"),
      });

      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe("Meeting");
    });

    it("should handle rate limiting with retry", async () => {
      mockGoogleApi({
        endpoint: "/calendar/v3/calendars/primary/events",
        statusCode: 429, // Rate limited
        retryAfter: 1,
      });

      // Should retry after delay
      const events = await client.listEvents("primary", {});

      expect(events).toBeDefined();
    });

    it("should handle authentication errors", async () => {
      mockGoogleApi({
        endpoint: "/calendar/v3/calendars/primary/events",
        statusCode: 401,
      });

      await expect(client.listEvents("primary", {})).rejects.toThrow(
        "Authentication failed"
      );
    });
  });

  describe("createEvent", () => {
    it("should create event in Google Calendar", async () => {
      const eventData = {
        summary: "Task: Complete report",
        start: { dateTime: "2026-02-17T14:00:00Z" },
        end: { dateTime: "2026-02-17T15:00:00Z" },
        description: "Auto-scheduled by JustPlan",
      };

      mockGoogleApi({
        endpoint: "/calendar/v3/calendars/primary/events",
        method: "POST",
        response: { id: "new-event-id", ...eventData },
      });

      const event = await client.createEvent("primary", eventData);

      expect(event.id).toBe("new-event-id");
      expect(event.summary).toBe(eventData.summary);
    });

    it("should batch multiple event creations", async () => {
      const events = [
        {
          summary: "Task 1",
          start: "2026-02-17T10:00:00Z",
          end: "2026-02-17T11:00:00Z",
        },
        {
          summary: "Task 2",
          start: "2026-02-17T14:00:00Z",
          end: "2026-02-17T15:00:00Z",
        },
      ];

      const created = await client.batchCreateEvents("primary", events);

      expect(created).toHaveLength(2);
    });
  });
});
```

### 2.3 API Routes

**Files:**

- `app/api/tasks/route.test.ts`
- `app/api/schedule/route.test.ts`

```typescript
describe("POST /api/tasks", () => {
  it("should create task via API", async () => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        title: "New task",
        estimatedDurationMinutes: 60,
        priority: "high",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe("New task");
  });

  it("should require authentication", async () => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    expect(response.status).toBe(401);
  });

  it("should validate input", async () => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        title: "", // Invalid
        estimatedDurationMinutes: -10,
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

---

## 3. E2E Tests (10%)

**Scope:** Test critical user flows from browser perspective using Playwright.

### 3.1 Test Setup

```typescript
// tests/e2e/setup.ts
import { test as base } from "@playwright/test";

export const test = base.extend({
  // Auto-login before each test
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.click('button:has-text("Login with Google")');

    // Mock Google OAuth for testing
    await page.route("**/auth/callback", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ access_token: "test-token" }),
      });
    });

    await page.waitForURL("/dashboard");
    await use(page);
  },
});
```

### 3.2 Critical User Flows

#### E2E Test 1: User Authentication Flow

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "./setup";

test.describe("Authentication", () => {
  test("user can login with Google", async ({ page }) => {
    await page.goto("/");

    await page.click('button:has-text("Login with Google")');

    // Should redirect to Google OAuth
    await expect(page).toHaveURL(/accounts.google.com/);

    // After OAuth completion (mocked)
    await expect(page).toHaveURL("/dashboard");

    // User profile visible
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test("user can logout", async ({ authenticatedPage }) => {
    await authenticatedPage.click('[data-testid="user-menu"]');
    await authenticatedPage.click('button:has-text("Logout")');

    await expect(authenticatedPage).toHaveURL("/");
  });
});
```

#### E2E Test 2: Task Management Flow

```typescript
// tests/e2e/tasks.spec.ts
import { test, expect } from "./setup";

test.describe("Task Management", () => {
  test("complete task lifecycle", async ({ authenticatedPage: page }) => {
    // Create task
    await page.click('button:has-text("New Task")');
    await page.fill('[name="title"]', "Complete project documentation");
    await page.fill('[name="estimatedDurationMinutes"]', "120");
    await page.selectOption('[name="priority"]', "high");
    await page.fill('[name="deadline"]', "2026-02-20T17:00");
    await page.click('button:has-text("Create")');

    // Verify task appears in list
    await expect(
      page.locator("text=Complete project documentation")
    ).toBeVisible();

    // Edit task
    await page.click(
      '[data-testid="task-item"]:has-text("Complete project documentation")'
    );
    await page.click('button:has-text("Edit")');
    await page.fill('[name="description"]', "Write comprehensive docs");
    await page.click('button:has-text("Save")');

    // Verify edit saved
    await expect(page.locator("text=Write comprehensive docs")).toBeVisible();

    // Change state
    await page.selectOption('[data-testid="task-state"]', "In Progress");
    await expect(page.locator('[data-testid="task-state"]')).toHaveValue(
      "In Progress"
    );

    // Complete task
    await page.click('button:has-text("Mark Complete")');
    await expect(page.locator('[data-testid="task-state"]')).toHaveValue(
      "Done"
    );

    // Delete task
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');

    // Task removed from list
    await expect(
      page.locator("text=Complete project documentation")
    ).not.toBeVisible();
  });
});
```

#### E2E Test 3: Auto-Scheduling Flow

```typescript
// tests/e2e/scheduling.spec.ts
import { test, expect } from "./setup";

test.describe("Auto-Scheduling", () => {
  test("schedule tasks automatically", async ({ authenticatedPage: page }) => {
    // Configure working hours
    await page.click('a:has-text("Settings")');
    await page.click('a:has-text("Working Hours")');
    await page.selectOption('[name="monday-start"]', "09:00");
    await page.selectOption('[name="monday-end"]', "17:00");
    await page.click('button:has-text("Save")');

    // Create multiple tasks
    await page.click('a:has-text("Tasks")');

    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("New Task")');
      await page.fill('[name="title"]', `Task ${i}`);
      await page.fill('[name="estimatedDurationMinutes"]', "60");
      await page.click('button:has-text("Create")');
    }

    // Trigger auto-schedule
    await page.click('button:has-text("Auto-Schedule")');

    // Wait for scheduling to complete
    await expect(page.locator("text=Scheduling complete")).toBeVisible({
      timeout: 10000,
    });

    // View calendar
    await page.click('a:has-text("Calendar")');

    // Verify tasks appear on calendar
    await expect(
      page.locator('[data-testid="calendar-event"]:has-text("Task 1")')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="calendar-event"]:has-text("Task 2")')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="calendar-event"]:has-text("Task 3")')
    ).toBeVisible();

    // Verify scheduled within working hours
    const event1 = await page
      .locator('[data-testid="calendar-event"]:has-text("Task 1")')
      .getAttribute("data-start-time");
    expect(parseInt(event1)).toBeGreaterThanOrEqual(9); // After 9 AM
    expect(parseInt(event1)).toBeLessThanOrEqual(17); // Before 5 PM
  });

  test("manual reschedule via drag and drop", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/calendar");

    const task = page.locator(
      '[data-testid="calendar-event"]:has-text("Task 1")'
    );
    const targetSlot = page.locator(
      '[data-testid="calendar-slot"][data-time="14:00"]'
    );

    // Drag task to new time
    await task.dragTo(targetSlot);

    // Verify task moved
    const newTime = await task.getAttribute("data-start-time");
    expect(newTime).toBe("14:00");

    // Verify synced to Google Calendar
    await expect(page.locator("text=Synced to Google Calendar")).toBeVisible();
  });
});
```

#### E2E Test 4: Workflow Transition Flow

```typescript
// tests/e2e/workflows.spec.ts
import { test, expect } from "./setup";

test.describe("Workflow Transitions", () => {
  test("automatic state transition on deadline", async ({
    authenticatedPage: page,
  }) => {
    // Create task with near deadline
    await page.click('button:has-text("New Task")');
    await page.fill('[name="title"]', "Urgent task");
    await page.fill('[name="estimatedDurationMinutes"]', "60");

    // Set deadline to 12 hours from now
    const nearDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
    await page.fill(
      '[name="deadline"]',
      nearDeadline.toISOString().slice(0, 16)
    );
    await page.click('button:has-text("Create")');

    // Task should be in "Ready" state initially
    await expect(page.locator('[data-testid="task-state"]')).toHaveText(
      "Ready"
    );

    // Wait for automatic transition (background job runs every minute in test)
    await page.waitForTimeout(65000); // 65 seconds
    await page.reload();

    // Should transition to "Urgent" (deadline within 24 hours rule)
    await expect(page.locator('[data-testid="task-state"]')).toHaveText(
      "Urgent"
    );
  });

  test("configure custom workflow transition", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/settings/workflows");

    // Create custom state
    await page.click('button:has-text("Add State")');
    await page.fill('[name="stateName"]', "Needs Review");
    await page.click('[name="color"][value="#8B5CF6"]');
    await page.click('button:has-text("Create State")');

    // Add transition rule
    await page.click('button:has-text("Add Transition")');
    await page.selectOption('[name="fromState"]', "In Progress");
    await page.selectOption('[name="toState"]', "Needs Review");
    await page.selectOption('[name="condition"]', "manual");
    await page.click('button:has-text("Save Transition")');

    // Verify transition created
    await expect(page.locator("text=In Progress → Needs Review")).toBeVisible();
  });
});
```

#### E2E Test 5: Google Integration Flow

```typescript
// tests/e2e/google-integration.spec.ts
import { test, expect } from "./setup";

test.describe("Google Integration", () => {
  test("sync Google Tasks to app", async ({ authenticatedPage: page }) => {
    // Mock Google Tasks API response
    await page.route("**/tasks/v1/lists/*/tasks", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [{ id: "gtask-1", title: "Imported task from Google" }],
        }),
      });
    });

    await page.goto("/settings/integrations");
    await page.click('button:has-text("Sync Google Tasks")');

    await expect(page.locator("text=1 task imported")).toBeVisible();

    // Verify task appears
    await page.goto("/tasks");
    await expect(page.locator("text=Imported task from Google")).toBeVisible();
  });

  test("view Google Calendar events", async ({ authenticatedPage: page }) => {
    await page.goto("/calendar");

    // Should show both app tasks and Google events
    await expect(page.locator('[data-testid="google-event"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-task"]')).toBeVisible();

    // Different visual styling
    const googleEvent = page.locator('[data-testid="google-event"]').first();
    const hasGoogleStyle = await googleEvent.evaluate((el) =>
      el.classList.contains("border-dashed")
    );
    expect(hasGoogleStyle).toBe(true);
  });
});
```

---

## 4. Manual Testing with Chrome MCP Agent

See `.github/agents/manual-testing/AGENT.md` for the custom testing agent configuration.

---

## Test Data Management

### 4.1 Test Fixtures

```typescript
// tests/fixtures/tasks.ts
export const mockTask = (overrides = {}) => ({
  id: uuid(),
  userId: "test-user-id",
  title: "Test task",
  description: "",
  estimatedDurationMinutes: 60,
  deadline: null,
  priority: "medium",
  workflowStateId: "ready-state-id",
  isScheduled: false,
  scheduledStart: null,
  scheduledEnd: null,
  isPinned: false,
  googleTaskId: null,
  googleCalendarEventId: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

export const mockWorkflowState = (overrides = {}) => ({
  id: uuid(),
  userId: "test-user-id",
  name: "Ready",
  color: "#3B82F6",
  order: 1,
  isTerminal: false,
  shouldAutoSchedule: true,
  schedulingPriorityBoost: 0,
  createdAt: new Date(),
  ...overrides,
});
```

### 4.2 Test Database Seed

```sql
-- tests/seed-test-data.sql
-- Run before test suite to populate test database

INSERT INTO users (id, email, google_user_id, full_name) VALUES
  ('test-user-1', 'test1@example.com', 'google-123', 'Test User 1'),
  ('test-user-2', 'test2@example.com', 'google-456', 'Test User 2');

INSERT INTO user_settings (user_id, timezone, default_task_duration_minutes) VALUES
  ('test-user-1', 'America/New_York', 60),
  ('test-user-2', 'Europe/London', 60);

INSERT INTO working_hours (user_id, day_of_week, start_time, end_time, is_working_day) VALUES
  ('test-user-1', 1, '09:00', '17:00', true),
  ('test-user-1', 2, '09:00', '17:00', true),
  ('test-user-1', 3, '09:00', '17:00', true),
  ('test-user-1', 4, '09:00', '17:00', true),
  ('test-user-1', 5, '09:00', '17:00', true);
```

---

## Test Execution

### Local Development

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (headless)
npm run test:e2e

# E2E tests (UI mode for debugging)
npm run test:e2e:ui

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Coverage Requirements

### Phase-Specific Coverage

| Phase   | Unit | Integration | E2E     | Manual                |
| ------- | ---- | ----------- | ------- | --------------------- |
| Phase 0 | 60%+ | 40%+        | -       | Basic smoke tests     |
| Phase 1 | 70%+ | 60%+        | 1 flow  | Critical paths        |
| Phase 2 | 80%+ | 70%+        | 3 flows | Scheduling validation |
| Phase 3 | 80%+ | 70%+        | 5 flows | Workflow scenarios    |
| Phase 4 | 85%+ | 75%+        | 5 flows | Full regression       |

---

## Success Criteria

✅ **Phase completion blocked unless:**

- All unit tests pass
- Integration tests pass
- E2E tests cover critical paths
- Coverage meets phase requirements
- No critical bugs in test environment
- Manual testing checklist completed

---

## Next Steps

1. ✅ Test plan documented
2. ⬜ Create manual testing agent
3. ⬜ Set up Vitest configuration
4. ⬜ Set up Playwright configuration
5. ⬜ Create test fixtures and mocks
6. ⬜ Write first unit tests (TDD)
