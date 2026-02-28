/**
 * Task Syntax Parser
 * Parses task input with bracket notation: "Title [duration:priority:state:before DATE]"
 *
 * Examples:
 * - "Write report [2hr:high]"
 * - "Call client [30m:medium:ready]"
 * - "Prepare presentation [4hr:high:in-progress:before Feb 25]"
 * - "Review code [1hr:low:before 2026-02-28]"
 */

export interface ParsedTask {
  title: string;
  estimatedDurationMinutes?: number;
  priority?: "low" | "medium" | "high";
  workflowState?: string;
  deadline?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedTask;
  error?: string;
  suggestions?: string[];
}

type SyntaxComponent = "duration" | "priority" | "state" | "deadline";

interface OpenBracketContext {
  bracketStart: number;
  content: string;
  currentPart: string;
  currentPartStart: number;
  partsBeforeCurrent: string[];
}

const SYNTAX_COMPONENT_ORDER: SyntaxComponent[] = [
  "duration",
  "priority",
  "state",
  "deadline",
];

const DURATION_SUGGESTIONS = ["30m", "1hr", "2hr", "4hr"];
const PRIORITY_SUGGESTIONS = ["high", "medium", "low"];
const STATE_SUGGESTIONS = [
  "backlog",
  "ready",
  "in-progress",
  "blocked",
  "review",
  "done",
];
const DEADLINE_SUGGESTIONS = [
  "before today",
  "before tomorrow",
  "before next week",
  "before 2026-12-31",
];

// Duration patterns
const DURATION_PATTERNS = [
  { pattern: /^(\d+(?:\.\d+)?)\s*hr?s?$/i, multiplier: 60 }, // 2hr, 2h, 2 hours
  { pattern: /^(\d+(?:\.\d+)?)\s*m(?:ins?)?$/i, multiplier: 1 }, // 30m, 30min, 30 mins
  { pattern: /^(\d+)$/i, multiplier: 1 }, // Just number = minutes
];

// Priority aliases
const PRIORITY_ALIASES: Record<string, "low" | "medium" | "high"> = {
  low: "low",
  l: "low",
  lo: "low",
  medium: "medium",
  med: "medium",
  m: "medium",
  high: "high",
  hi: "high",
  h: "high",
  urgent: "high",
  "!": "high",
  "!!": "high",
  "!!!": "high",
};

// Workflow state aliases (case-insensitive)
const STATE_ALIASES: Record<string, string> = {
  backlog: "Backlog",
  back: "Backlog",
  ready: "Ready",
  todo: "Ready",
  "in-progress": "In Progress",
  inprogress: "In Progress",
  progress: "In Progress",
  doing: "In Progress",
  wip: "In Progress",
  blocked: "Blocked",
  block: "Blocked",
  waiting: "Blocked",
  review: "Review",
  qa: "Review",
  done: "Done",
  complete: "Done",
  completed: "Done",
  finished: "Done",
};

// Date patterns
const DATE_PATTERNS = [
  // ISO date: 2026-02-25
  { pattern: /^(\d{4}-\d{2}-\d{2})$/, parse: (m: string) => m },
  // Month Day: Feb 25, February 25
  {
    pattern:
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})$/i,
    parse: (m: string) => parseMonthDay(m),
  },
  // Day/Month: 25/02, 25-02
  {
    pattern: /^(\d{1,2})[\/\-](\d{1,2})$/,
    parse: (m: string) => parseDayMonth(m),
  },
  // Relative: tomorrow, next week
  {
    pattern: /^(today|tomorrow|next\s+week)$/i,
    parse: (m: string) => parseRelative(m),
  },
];

/**
 * Parse month day format (e.g., "Feb 25")
 */
function parseMonthDay(str: string): string {
  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const match = str.match(/^(\w+)\s+(\d{1,2})$/i);
  if (!match) return "";

  const monthKey = match[1].toLowerCase().slice(0, 3);
  const month = months[monthKey];
  if (!month) return "";

  const day = match[2].padStart(2, "0");
  const year = new Date().getFullYear();

  return `${year}-${month}-${day}`;
}

/**
 * Parse day/month format (e.g., "25/02")
 */
function parseDayMonth(str: string): string {
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (!match) return "";

  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = new Date().getFullYear();

  return `${year}-${month}-${day}`;
}

/**
 * Parse relative date (e.g., "tomorrow")
 */
function parseRelative(str: string): string {
  const now = new Date();
  const lower = str.toLowerCase();

  if (lower === "today") {
    return now.toISOString().split("T")[0];
  }
  if (lower === "tomorrow") {
    now.setDate(now.getDate() + 1);
    return now.toISOString().split("T")[0];
  }
  if (lower === "next week") {
    now.setDate(now.getDate() + 7);
    return now.toISOString().split("T")[0];
  }

  return "";
}

/**
 * Parse duration string to minutes
 */
function parseDuration(str: string): number | undefined {
  const trimmed = str.trim();

  for (const { pattern, multiplier } of DURATION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const minutes = Math.round(value * multiplier);
      // Clamp to valid range
      if (minutes >= 5 && minutes <= 480) {
        return minutes;
      }
    }
  }

  return undefined;
}

/**
 * Parse priority string
 */
function parsePriority(str: string): "low" | "medium" | "high" | undefined {
  const lower = str.toLowerCase().trim();
  return PRIORITY_ALIASES[lower];
}

/**
 * Parse workflow state string
 */
function parseState(str: string): string | undefined {
  const lower = str.toLowerCase().trim();
  return STATE_ALIASES[lower];
}

/**
 * Parse deadline string
 */
function parseDeadline(str: string): string | undefined {
  // Handle "before DATE" format
  let dateStr = str.trim();
  if (dateStr.toLowerCase().startsWith("before ")) {
    dateStr = dateStr.slice(7).trim();
  }
  if (dateStr.toLowerCase().startsWith("by ")) {
    dateStr = dateStr.slice(3).trim();
  }
  if (dateStr.toLowerCase().startsWith("due ")) {
    dateStr = dateStr.slice(4).trim();
  }

  for (const { pattern, parse } of DATE_PATTERNS) {
    if (pattern.test(dateStr)) {
      const result = parse(dateStr);
      if (result) return result;
    }
  }

  return undefined;
}

/**
 * Parse bracket content into task attributes
 */
function parseBracketContent(content: string): Partial<ParsedTask> {
  const result: Partial<ParsedTask> = {};

  // Split by colon but preserve "before DATE" as single unit
  const parts: string[] = [];
  let current = "";
  let inDate = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === ":" && !inDate) {
      if (
        current.toLowerCase().startsWith("before") ||
        current.toLowerCase().startsWith("by") ||
        current.toLowerCase().startsWith("due")
      ) {
        inDate = true;
        current += char;
      } else {
        parts.push(current.trim());
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }

  // Try to identify each part
  for (const part of parts) {
    // Try duration
    const duration = parseDuration(part);
    if (duration !== undefined && !result.estimatedDurationMinutes) {
      result.estimatedDurationMinutes = duration;
      continue;
    }

    // Try priority
    const priority = parsePriority(part);
    if (priority !== undefined && !result.priority) {
      result.priority = priority;
      continue;
    }

    // Try state
    const state = parseState(part);
    if (state !== undefined && !result.workflowState) {
      result.workflowState = state;
      continue;
    }

    // Try deadline
    const deadline = parseDeadline(part);
    if (deadline !== undefined && !result.deadline) {
      result.deadline = deadline;
      continue;
    }
  }

  return result;
}

/**
 * Main parser function
 * @param input - Raw task input string
 * @returns ParseResult with parsed task or error
 */
export function parseTaskInput(input: string): ParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      success: false,
      error: "Input is empty",
    };
  }

  // Extract bracket content if present
  const bracketMatch = trimmed.match(/^(.+?)\s*\[([^\]]+)\]$/);

  if (bracketMatch) {
    const title = bracketMatch[1].trim();
    const bracketContent = bracketMatch[2];

    if (!title) {
      return {
        success: false,
        error: "Task title is required",
      };
    }

    const attributes = parseBracketContent(bracketContent);

    return {
      success: true,
      data: {
        title,
        ...attributes,
      },
    };
  }

  // No brackets - just a title
  return {
    success: true,
    data: {
      title: trimmed,
    },
  };
}

function getOpenBracketContext(
  partialInput: string
): OpenBracketContext | null {
  const openIndex = partialInput.lastIndexOf("[");
  const closeIndex = partialInput.lastIndexOf("]");
  if (openIndex === -1 || closeIndex > openIndex) {
    return null;
  }

  const content = partialInput.slice(openIndex + 1);
  const lastColonIndex = content.lastIndexOf(":");
  const currentPartStart = lastColonIndex === -1 ? 0 : lastColonIndex + 1;
  const currentPart = content.slice(currentPartStart).trimStart();
  const beforeCurrent = content.slice(0, currentPartStart);
  const partsBeforeCurrent = beforeCurrent
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    bracketStart: openIndex,
    content,
    currentPart,
    currentPartStart,
    partsBeforeCurrent,
  };
}

function identifySyntaxComponent(part: string): SyntaxComponent | undefined {
  if (!part.trim()) {
    return undefined;
  }
  if (parseDuration(part) !== undefined) {
    return "duration";
  }
  if (parsePriority(part) !== undefined) {
    return "priority";
  }
  if (parseState(part) !== undefined) {
    return "state";
  }
  if (
    parseDeadline(part) !== undefined ||
    /^(before|by|due)\b/i.test(part.trim())
  ) {
    return "deadline";
  }
  return undefined;
}

function getComponentSuggestions(component: SyntaxComponent): string[] {
  switch (component) {
    case "duration":
      return DURATION_SUGGESTIONS;
    case "priority":
      return PRIORITY_SUGGESTIONS;
    case "state":
      return STATE_SUGGESTIONS;
    case "deadline":
      return DEADLINE_SUGGESTIONS;
  }
}

function getNextExpectedComponent(
  partsBeforeCurrent: string[],
  currentPart: string
): SyntaxComponent | undefined {
  const usedComponents = new Set<SyntaxComponent>();
  for (const part of partsBeforeCurrent) {
    const component = identifySyntaxComponent(part);
    if (component) {
      usedComponents.add(component);
    }
  }

  const trimmedCurrent = currentPart.trim();
  if (!trimmedCurrent) {
    return SYNTAX_COMPONENT_ORDER.find(
      (component) => !usedComponents.has(component)
    );
  }

  const missingComponents = SYNTAX_COMPONENT_ORDER.filter(
    (component) => !usedComponents.has(component)
  );
  const lowerCurrent = trimmedCurrent.toLowerCase();

  for (const component of missingComponents) {
    const matches = getComponentSuggestions(component).some((suggestion) =>
      suggestion.toLowerCase().startsWith(lowerCurrent)
    );
    if (matches) {
      return component;
    }
  }

  return missingComponents[0];
}

/**
 * Generate autocomplete suggestions for partial input
 */
export function getAutocompleteSuggestions(partialInput: string): string[] {
  const context = getOpenBracketContext(partialInput);
  if (!context) {
    return [];
  }

  const expected = getNextExpectedComponent(
    context.partsBeforeCurrent,
    context.currentPart
  );
  if (!expected) {
    return [];
  }

  const query = context.currentPart.trim().toLowerCase();
  const componentSuggestions = getComponentSuggestions(expected).filter(
    (suggestion) => suggestion.toLowerCase().startsWith(query)
  );

  if (componentSuggestions.length > 0) {
    return componentSuggestions.slice(0, 5);
  }

  const fallbackSuggestions = SYNTAX_COMPONENT_ORDER.flatMap((component) =>
    getComponentSuggestions(component)
  )
    .filter((suggestion) => suggestion.toLowerCase().startsWith(query))
    .filter((value, index, all) => all.indexOf(value) === index);

  return fallbackSuggestions.slice(0, 5);
}

/**
 * Whether the current input has an open task syntax bracket.
 */
export function hasOpenTaskBracket(partialInput: string): boolean {
  return getOpenBracketContext(partialInput) !== null;
}

/**
 * Move suggestion index forward/backward in a cyclic list.
 */
export function getNextSuggestionIndex(
  currentIndex: number,
  total: number,
  direction: "next" | "previous"
): number {
  if (total <= 0) {
    return 0;
  }
  const delta = direction === "next" ? 1 : -1;
  return (currentIndex + delta + total) % total;
}

/**
 * Get inline suffix for gray ghost completion text.
 */
export function getInlineAutocompleteSuggestion(
  partialInput: string,
  selectedSuggestion?: string
): string {
  if (!selectedSuggestion) {
    return "";
  }
  const context = getOpenBracketContext(partialInput);
  if (!context) {
    return "";
  }

  const current = context.currentPart.trim();
  if (!current) {
    return selectedSuggestion;
  }

  const lowerCurrent = current.toLowerCase();
  const lowerSuggestion = selectedSuggestion.toLowerCase();
  if (!lowerSuggestion.startsWith(lowerCurrent)) {
    return "";
  }

  return selectedSuggestion.slice(current.length);
}

/**
 * Apply selected suggestion by replacing the current bracket component.
 * Adds ":" when more components are still expected.
 */
export function applyAutocompleteSuggestion(
  partialInput: string,
  suggestion: string
): string {
  const context = getOpenBracketContext(partialInput);
  if (!context) {
    return partialInput;
  }

  const prefix = partialInput.slice(0, context.bracketStart + 1);
  const beforeCurrent = context.content.slice(0, context.currentPartStart);
  let updatedContent = `${beforeCurrent}${suggestion}`;

  const updatedParts = updatedContent
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);
  const usedComponents = new Set<SyntaxComponent>();
  for (const part of updatedParts) {
    const component = identifySyntaxComponent(part);
    if (component) {
      usedComponents.add(component);
    }
  }
  const hasRemainingComponent = SYNTAX_COMPONENT_ORDER.some(
    (component) => !usedComponents.has(component)
  );

  if (hasRemainingComponent && !updatedContent.endsWith(":")) {
    updatedContent += ":";
  }

  return `${prefix}${updatedContent}`;
}

/**
 * Format a parsed task back to syntax string (for display)
 */
export function formatTaskSyntax(task: ParsedTask): string {
  const parts: string[] = [];

  if (task.estimatedDurationMinutes) {
    if (
      task.estimatedDurationMinutes >= 60 &&
      task.estimatedDurationMinutes % 60 === 0
    ) {
      parts.push(`${task.estimatedDurationMinutes / 60}hr`);
    } else {
      parts.push(`${task.estimatedDurationMinutes}m`);
    }
  }

  if (task.priority) {
    parts.push(task.priority);
  }

  if (task.workflowState) {
    parts.push(task.workflowState.toLowerCase().replace(" ", "-"));
  }

  if (task.deadline) {
    parts.push(`before ${task.deadline}`);
  }

  if (parts.length === 0) {
    return task.title;
  }

  return `${task.title} [${parts.join(":")}]`;
}
