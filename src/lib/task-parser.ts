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

// Duration patterns
const DURATION_PATTERNS = [
  { pattern: /^(\d+(?:\.\d+)?)\s*hr?s?$/i, multiplier: 60 },  // 2hr, 2h, 2 hours
  { pattern: /^(\d+(?:\.\d+)?)\s*m(?:ins?)?$/i, multiplier: 1 },   // 30m, 30min, 30 mins
  { pattern: /^(\d+)$/i, multiplier: 1 },                       // Just number = minutes
];

// Priority aliases
const PRIORITY_ALIASES: Record<string, "low" | "medium" | "high"> = {
  "low": "low",
  "l": "low",
  "lo": "low",
  "medium": "medium",
  "med": "medium",
  "m": "medium",
  "high": "high",
  "hi": "high",
  "h": "high",
  "urgent": "high",
  "!": "high",
  "!!": "high",
  "!!!": "high",
};

// Workflow state aliases (case-insensitive)
const STATE_ALIASES: Record<string, string> = {
  "backlog": "Backlog",
  "back": "Backlog",
  "ready": "Ready",
  "todo": "Ready",
  "in-progress": "In Progress",
  "inprogress": "In Progress",
  "progress": "In Progress",
  "doing": "In Progress",
  "wip": "In Progress",
  "blocked": "Blocked",
  "block": "Blocked",
  "waiting": "Blocked",
  "review": "Review",
  "qa": "Review",
  "done": "Done",
  "complete": "Done",
  "completed": "Done",
  "finished": "Done",
};

// Date patterns
const DATE_PATTERNS = [
  // ISO date: 2026-02-25
  { pattern: /^(\d{4}-\d{2}-\d{2})$/, parse: (m: string) => m },
  // Month Day: Feb 25, February 25
  { pattern: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})$/i, 
    parse: (m: string) => parseMonthDay(m) },
  // Day/Month: 25/02, 25-02
  { pattern: /^(\d{1,2})[\/\-](\d{1,2})$/, parse: (m: string) => parseDayMonth(m) },
  // Relative: tomorrow, next week
  { pattern: /^(today|tomorrow|next\s+week)$/i, parse: (m: string) => parseRelative(m) },
];

/**
 * Parse month day format (e.g., "Feb 25")
 */
function parseMonthDay(str: string): string {
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
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
      if (current.toLowerCase().startsWith("before") || 
          current.toLowerCase().startsWith("by") ||
          current.toLowerCase().startsWith("due")) {
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

/**
 * Generate autocomplete suggestions for partial input
 */
export function getAutocompleteSuggestions(partialInput: string): string[] {
  const suggestions: string[] = [];
  
  // If typing in brackets, suggest attributes
  const bracketMatch = partialInput.match(/\[([^\]]*)$/);
  if (bracketMatch) {
    const content = bracketMatch[1].toLowerCase();
    const lastPart = content.split(":").pop() || "";
    
    // Suggest durations
    if (!content.includes("hr") && !content.includes("min") && !content.match(/\d/)) {
      suggestions.push("30m", "1hr", "2hr", "4hr");
    }
    
    // Suggest priorities
    if (!content.includes("high") && !content.includes("medium") && !content.includes("low")) {
      suggestions.push("high", "medium", "low");
    }
    
    // Suggest states if we have some input
    if (lastPart.length > 0) {
      const matchingStates = Object.entries(STATE_ALIASES)
        .filter(([key]) => key.startsWith(lastPart))
        .map(([, value]) => value)
        .filter((v, i, a) => a.indexOf(v) === i);
      suggestions.push(...matchingStates);
    }
    
    // Suggest deadline format
    if (lastPart.startsWith("b") || lastPart.startsWith("d")) {
      suggestions.push("before tomorrow", "before next week");
    }
  }
  
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Format a parsed task back to syntax string (for display)
 */
export function formatTaskSyntax(task: ParsedTask): string {
  const parts: string[] = [];
  
  if (task.estimatedDurationMinutes) {
    if (task.estimatedDurationMinutes >= 60 && task.estimatedDurationMinutes % 60 === 0) {
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
