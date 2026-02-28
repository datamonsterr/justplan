/**
 * Task Parser Tests
 */

import { describe, it, expect } from "vitest";
import {
  parseTaskInput,
  formatTaskSyntax,
  getAutocompleteSuggestions,
  applyAutocompleteSuggestion,
  getInlineAutocompleteSuggestion,
  getNextSuggestionIndex,
  hasOpenTaskBracket,
  type ParsedTask,
} from "./task-parser";

describe("parseTaskInput", () => {
  describe("basic parsing", () => {
    it("parses simple title without brackets", () => {
      const result = parseTaskInput("Write report");
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Write report");
    });

    it("handles empty input", () => {
      const result = parseTaskInput("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Input is empty");
    });

    it("handles whitespace-only input", () => {
      const result = parseTaskInput("   ");
      expect(result.success).toBe(false);
    });
  });

  describe("duration parsing", () => {
    it("parses hours (hr)", () => {
      const result = parseTaskInput("Task [2hr]");
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBe(120);
    });

    it("parses hours (h)", () => {
      const result = parseTaskInput("Task [3h]");
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBe(180);
    });

    it("parses minutes (min)", () => {
      const result = parseTaskInput("Task [30min]");
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBe(30);
    });

    it("parses minutes (m)", () => {
      const result = parseTaskInput("Task [45m]");
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBe(45);
    });

    it("parses decimal hours", () => {
      const result = parseTaskInput("Task [1.5hr]");
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBe(90);
    });

    it("ignores durations outside valid range", () => {
      const result = parseTaskInput("Task [2min]"); // Too short
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBeUndefined();
    });
  });

  describe("priority parsing", () => {
    it("parses high priority", () => {
      const result = parseTaskInput("Task [high]");
      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe("high");
    });

    it("parses medium priority (med)", () => {
      const result = parseTaskInput("Task [med]");
      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe("medium");
    });

    it("parses low priority (l)", () => {
      const result = parseTaskInput("Task [l]");
      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe("low");
    });

    it("parses urgent as high", () => {
      const result = parseTaskInput("Task [urgent]");
      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe("high");
    });

    it("parses ! as high", () => {
      const result = parseTaskInput("Task [!]");
      expect(result.success).toBe(true);
      expect(result.data?.priority).toBe("high");
    });
  });

  describe("workflow state parsing", () => {
    it("parses backlog", () => {
      const result = parseTaskInput("Task [backlog]");
      expect(result.success).toBe(true);
      expect(result.data?.workflowState).toBe("Backlog");
    });

    it("parses in-progress", () => {
      const result = parseTaskInput("Task [in-progress]");
      expect(result.success).toBe(true);
      expect(result.data?.workflowState).toBe("In Progress");
    });

    it("parses wip as In Progress", () => {
      const result = parseTaskInput("Task [wip]");
      expect(result.success).toBe(true);
      expect(result.data?.workflowState).toBe("In Progress");
    });

    it("parses todo as Ready", () => {
      const result = parseTaskInput("Task [todo]");
      expect(result.success).toBe(true);
      expect(result.data?.workflowState).toBe("Ready");
    });

    it("parses done", () => {
      const result = parseTaskInput("Task [done]");
      expect(result.success).toBe(true);
      expect(result.data?.workflowState).toBe("Done");
    });
  });

  describe("deadline parsing", () => {
    it("parses ISO date", () => {
      const result = parseTaskInput("Task [before 2026-02-25]");
      expect(result.success).toBe(true);
      expect(result.data?.deadline).toBe("2026-02-25");
    });

    it("parses month day format", () => {
      const result = parseTaskInput("Task [before Feb 25]");
      expect(result.success).toBe(true);
      expect(result.data?.deadline).toMatch(/^\d{4}-02-25$/);
    });

    it("parses by prefix", () => {
      const result = parseTaskInput("Task [by 2026-03-01]");
      expect(result.success).toBe(true);
      expect(result.data?.deadline).toBe("2026-03-01");
    });

    it("parses due prefix", () => {
      const result = parseTaskInput("Task [due 2026-03-01]");
      expect(result.success).toBe(true);
      expect(result.data?.deadline).toBe("2026-03-01");
    });

    it("parses tomorrow", () => {
      const result = parseTaskInput("Task [before tomorrow]");
      expect(result.success).toBe(true);
      expect(result.data?.deadline).toBeDefined();
    });
  });

  describe("combined attributes", () => {
    it("parses duration and priority", () => {
      const result = parseTaskInput("Write report [2hr:high]");
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Write report");
      expect(result.data?.estimatedDurationMinutes).toBe(120);
      expect(result.data?.priority).toBe("high");
    });

    it("parses all attributes", () => {
      const result = parseTaskInput(
        "Prepare presentation [4hr:high:in-progress:before 2026-02-28]"
      );
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Prepare presentation");
      expect(result.data?.estimatedDurationMinutes).toBe(240);
      expect(result.data?.priority).toBe("high");
      expect(result.data?.workflowState).toBe("In Progress");
      expect(result.data?.deadline).toBe("2026-02-28");
    });

    it("parses attributes in any order", () => {
      const result = parseTaskInput("Task [high:2hr:ready]");
      expect(result.success).toBe(true);
      expect(result.data?.estimatedDurationMinutes).toBe(120);
      expect(result.data?.priority).toBe("high");
      expect(result.data?.workflowState).toBe("Ready");
    });
  });
});

describe("formatTaskSyntax", () => {
  it("formats task with all attributes", () => {
    const task: ParsedTask = {
      title: "Write report",
      estimatedDurationMinutes: 120,
      priority: "high",
      workflowState: "In Progress",
      deadline: "2026-02-28",
    };
    const result = formatTaskSyntax(task);
    expect(result).toBe(
      "Write report [2hr:high:in-progress:before 2026-02-28]"
    );
  });

  it("formats task with only title", () => {
    const task: ParsedTask = { title: "Simple task" };
    const result = formatTaskSyntax(task);
    expect(result).toBe("Simple task");
  });

  it("formats minutes correctly", () => {
    const task: ParsedTask = {
      title: "Quick task",
      estimatedDurationMinutes: 45,
    };
    const result = formatTaskSyntax(task);
    expect(result).toBe("Quick task [45m]");
  });
});

describe("getAutocompleteSuggestions", () => {
  it("suggests durations when typing in brackets", () => {
    const suggestions = getAutocompleteSuggestions("Task [");
    expect(suggestions).toContain("30m");
    expect(suggestions).toContain("1hr");
  });

  it("suggests priorities", () => {
    const suggestions = getAutocompleteSuggestions("Task [2hr:");
    expect(suggestions).toContain("high");
    expect(suggestions).toContain("medium");
    expect(suggestions).toContain("low");
  });

  it("suggests states as the next component after priority", () => {
    const suggestions = getAutocompleteSuggestions("Task [2hr:high:");
    expect(suggestions).toContain("ready");
    expect(suggestions).toContain("in-progress");
  });

  it("returns empty array for text without brackets", () => {
    const suggestions = getAutocompleteSuggestions("Task");
    expect(suggestions).toEqual([]);
  });
});

describe("applyAutocompleteSuggestion", () => {
  it("completes first component and appends colon for next component", () => {
    const updated = applyAutocompleteSuggestion("Write report [", "2hr");
    expect(updated).toBe("Write report [2hr:");
  });

  it("replaces current component and keeps flow to next component", () => {
    const updated = applyAutocompleteSuggestion("Write report [2hr:h", "high");
    expect(updated).toBe("Write report [2hr:high:");
  });

  it("does not append colon after deadline suggestion", () => {
    const updated = applyAutocompleteSuggestion(
      "Write report [2hr:high:ready:",
      "before tomorrow"
    );
    expect(updated).toBe("Write report [2hr:high:ready:before tomorrow");
  });

  it("returns original input when no open bracket exists", () => {
    const updated = applyAutocompleteSuggestion("Write report", "2hr");
    expect(updated).toBe("Write report");
  });
});

describe("inline and keyboard suggestion helpers", () => {
  it("detects open bracket correctly", () => {
    expect(hasOpenTaskBracket("Task [2hr")).toBe(true);
    expect(hasOpenTaskBracket("Task [2hr]")).toBe(false);
  });

  it("returns inline suffix for partial token", () => {
    const suffix = getInlineAutocompleteSuggestion("Task [2hr:h", "high");
    expect(suffix).toBe("igh");
  });

  it("returns full suggestion when current token is empty", () => {
    const suffix = getInlineAutocompleteSuggestion("Task [2hr:", "high");
    expect(suffix).toBe("high");
  });

  it("cycles suggestion index next/previous", () => {
    expect(getNextSuggestionIndex(0, 3, "next")).toBe(1);
    expect(getNextSuggestionIndex(2, 3, "next")).toBe(0);
    expect(getNextSuggestionIndex(0, 3, "previous")).toBe(2);
  });
});
