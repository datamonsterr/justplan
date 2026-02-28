import { beforeEach, describe, expect, it } from "vitest";
import type { AnySupabaseClient } from "./base.service";
import {
  createTaskSchema,
  createTaskService,
  updateTaskSchema,
} from "./task.service";

type QueryAction = "select" | "insert" | "update" | "delete";

interface QueryFilter {
  operator: "eq" | "is" | "in" | "not";
  column: string;
  value: unknown;
}

interface QueryRequest {
  table: string;
  action: QueryAction;
  payload?: unknown;
  filters: QueryFilter[];
}

interface QueryResponse {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
}

function createSupabaseMock(
  resolver: (
    request: QueryRequest,
    callIndex: number
  ) => QueryResponse | Promise<QueryResponse>,
  calls: QueryRequest[]
): AnySupabaseClient {
  function createQuery(table: string) {
    const request: QueryRequest = {
      table,
      action: "select",
      filters: [],
    };

    const execute = async (): Promise<QueryResponse> => {
      const snapshot: QueryRequest = {
        ...request,
        filters: [...request.filters],
      };
      const result = await resolver(snapshot, calls.length);
      calls.push(snapshot);
      return result;
    };

    const query = {
      select(selection: unknown) {
        if (request.action === "select") {
          request.payload = selection;
        }
        return query;
      },
      insert(payload: unknown) {
        request.action = "insert";
        request.payload = payload;
        return query;
      },
      update(payload: unknown) {
        request.action = "update";
        request.payload = payload;
        return query;
      },
      delete() {
        request.action = "delete";
        return query;
      },
      eq(column: string, value: unknown) {
        request.filters.push({ operator: "eq", column, value });
        return query;
      },
      is(column: string, value: unknown) {
        request.filters.push({ operator: "is", column, value });
        return query;
      },
      in(column: string, value: unknown) {
        request.filters.push({ operator: "in", column, value });
        return query;
      },
      not(column: string, _operator: string, value: unknown) {
        request.filters.push({ operator: "not", column, value });
        return query;
      },
      order() {
        return query;
      },
      async single() {
        const result = await execute();
        return {
          ...result,
          data: Array.isArray(result.data)
            ? (result.data[0] ?? null)
            : result.data,
        };
      },
      async maybeSingle() {
        const result = await execute();
        return {
          ...result,
          data: Array.isArray(result.data)
            ? (result.data[0] ?? null)
            : result.data,
        };
      },
      then<TResult1 = QueryResponse, TResult2 = never>(
        onfulfilled?:
          | ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null
      ) {
        return execute().then(onfulfilled, onrejected);
      },
    };

    return query;
  }

  return {
    from(table: string) {
      return createQuery(table);
    },
  } as unknown as AnySupabaseClient;
}

function buildTaskRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    title: "Task",
    description: null,
    estimated_duration_minutes: 30,
    deadline: null,
    priority: "medium",
    workflow_state_id: null,
    is_scheduled: false,
    scheduled_start: null,
    scheduled_end: null,
    is_pinned: false,
    google_task_id: null,
    google_calendar_event_id: null,
    parent_task_id: null,
    depends_on_task_id: null,
    ai_generated: false,
    metadata: {},
    created_at: "2026-02-27T00:00:00.000Z",
    updated_at: "2026-02-27T00:00:00.000Z",
    deleted_at: null,
    workflow_states: null,
    ...overrides,
  };
}

describe("TaskService", () => {
  const userId = "user-1";
  const taskId = "11111111-1111-4111-8111-111111111111";
  const parentId = "22222222-2222-4222-8222-222222222222";
  const dependencyId = "33333333-3333-4333-8333-333333333333";

  let calls: QueryRequest[];

  beforeEach(() => {
    calls = [];
  });

  it("accepts date-only deadline for create task payload", () => {
    const parsed = createTaskSchema.safeParse({
      title: "Task with date",
      estimatedDurationMinutes: 30,
      deadline: "2026-03-05",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts null deadline for update payload", () => {
    const parsed = updateTaskSchema.safeParse({
      deadline: null,
    });

    expect(parsed.success).toBe(true);
  });

  it("fails createTask when dependency task does not exist", async () => {
    const supabase = createSupabaseMock(
      () => ({ data: null, error: null }),
      calls
    );
    const service = createTaskService(supabase, userId);

    const result = await service.createTask({
      title: "Blocked task",
      estimatedDurationMinutes: 30,
      dependsOnTaskId: dependencyId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Dependency task not found");
  });

  it("maps parentTaskId to parent_task_id on update", async () => {
    const supabase = createSupabaseMock((_request, index) => {
      if (index === 0) {
        return {
          data: [buildTaskRow({ id: taskId, parent_task_id: parentId })],
          error: null,
        };
      }
      return { data: null, error: null };
    }, calls);
    const service = createTaskService(supabase, userId);

    const result = await service.updateTask(taskId, {
      parentTaskId: parentId,
    });

    expect(result.success).toBe(true);

    const updateCall = calls.find(
      (request) => request.table === "tasks" && request.action === "update"
    );
    expect(updateCall).toBeDefined();
    expect(updateCall?.payload).toMatchObject({
      parent_task_id: parentId,
    });
  });

  it("soft deletes a task and all nested subtasks", async () => {
    const childId = "44444444-4444-4444-8444-444444444444";
    const grandChildId = "55555555-5555-4555-8555-555555555555";
    const siblingChildId = "66666666-6666-4666-8666-666666666666";

    const supabase = createSupabaseMock((_request, index) => {
      if (index === 0) {
        return {
          data: [
            { id: taskId, parent_task_id: null },
            { id: childId, parent_task_id: taskId },
            { id: grandChildId, parent_task_id: childId },
            { id: siblingChildId, parent_task_id: taskId },
          ],
          error: null,
        };
      }
      if (index === 1) {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    }, calls);
    const service = createTaskService(supabase, userId);

    const result = await service.deleteTask(taskId);

    expect(result.success).toBe(true);
    const updateCall = calls.find(
      (request) => request.table === "tasks" && request.action === "update"
    );
    expect(updateCall).toBeDefined();

    const inFilter = updateCall?.filters.find(
      (filter) => filter.operator === "in"
    );
    expect(inFilter).toBeDefined();
    expect(new Set(inFilter?.value as string[])).toEqual(
      new Set([taskId, childId, grandChildId, siblingChildId])
    );
  });
});
