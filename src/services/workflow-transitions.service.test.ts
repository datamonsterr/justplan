import { beforeEach, describe, expect, it, vi } from "vitest";

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
}

const { addJobMock, createAdminClientMock } = vi.hoisted(() => ({
  addJobMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/redis/queue", () => ({
  workflowTransitionsQueue: {
    add: addJobMock,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import {
  evaluateWorkflowTransitions,
  queueWorkflowTransitionEvaluation,
} from "./workflow-transitions.service";

function createSupabaseMock(
  resolver: (request: QueryRequest, callIndex: number) => QueryResponse | Promise<QueryResponse>,
  calls: QueryRequest[]
) {
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
          data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data,
        };
      },
      async maybeSingle() {
        const result = await execute();
        return {
          ...result,
          data: Array.isArray(result.data) ? (result.data[0] ?? null) : result.data,
        };
      },
      then<TResult1 = QueryResponse, TResult2 = never>(
        onfulfilled?:
          | ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
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
  };
}

describe("workflow-transitions.service", () => {
  beforeEach(() => {
    addJobMock.mockReset();
    createAdminClientMock.mockReset();
  });

  it("queues transition evaluation jobs", async () => {
    addJobMock.mockResolvedValue({ id: "job-123" });

    const result = await queueWorkflowTransitionEvaluation({
      userId: "user-1",
      taskIds: ["task-1"],
    });

    expect(result.jobId).toBe("job-123");
    expect(addJobMock).toHaveBeenCalledWith(
      "evaluate-transitions",
      { userId: "user-1", taskIds: ["task-1"] },
      expect.objectContaining({
        priority: 5,
        attempts: 3,
      })
    );
  });

  it("evaluates transitions and writes task state history", async () => {
    const calls: QueryRequest[] = [];
    const supabase = createSupabaseMock(
      (_request, index) => {
        if (index === 0) {
          return {
            data: [
              { id: "state-open", is_terminal: false },
              { id: "state-done", is_terminal: true },
            ],
            error: null,
          };
        }
        if (index === 1) {
          return {
            data: [
              {
                id: "transition-1",
                from_state_id: "state-open",
                to_state_id: "state-done",
                condition_type: "overdue",
                condition_value: null,
                created_at: "2026-02-26T00:00:00.000Z",
              },
            ],
            error: null,
          };
        }
        if (index === 2) {
          return {
            data: [
              {
                id: "task-1",
                workflow_state_id: "state-open",
                deadline: "2026-02-26T00:00:00.000Z",
                scheduled_end: null,
                created_at: "2026-02-20T00:00:00.000Z",
              },
            ],
            error: null,
          };
        }
        if (index === 3) {
          return {
            data: [],
            error: null,
          };
        }
        if (index === 4) {
          return {
            data: [],
            error: null,
          };
        }
        if (index === 5) {
          return {
            data: null,
            error: null,
          };
        }
        if (index === 6) {
          return {
            data: [{ id: "history-1" }],
            error: null,
          };
        }
        return {
          data: null,
          error: null,
        };
      },
      calls
    );

    createAdminClientMock.mockReturnValue(supabase);

    const result = await evaluateWorkflowTransitions({
      userId: "user-1",
    });

    expect(result.success).toBe(true);
    expect(result.evaluated).toBe(1);
    expect(result.transitioned).toBe(1);
    expect(result.errors).toEqual([]);

    const taskUpdateCall = calls.find(
      (call) => call.table === "tasks" && call.action === "update"
    );
    expect(taskUpdateCall).toBeDefined();
    expect(taskUpdateCall?.payload).toMatchObject({
      workflow_state_id: "state-done",
    });

    const historyInsertCall = calls.find(
      (call) => call.table === "task_state_history" && call.action === "insert"
    );
    expect(historyInsertCall).toBeDefined();
    expect(historyInsertCall?.payload).toMatchObject({
      task_id: "task-1",
      from_state_id: "state-open",
      to_state_id: "state-done",
      trigger_type: "automatic",
      transition_rule_id: "transition-1",
    });
  });
});
