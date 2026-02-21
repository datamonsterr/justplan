// Mock AI Copilot data for development

export interface AIMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  tool?: {
    name: string;
    status: "pending" | "success" | "error";
    result?: string;
  };
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export const mockAIMessages: AIMessage[] = [
  {
    id: "1",
    type: "assistant",
    content: "Hi! I'm your AI copilot. I can help you manage tasks, find calendar slots, and optimize your workflows. Try asking me something!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "2",
    type: "user",
    content: "Find me 30 minutes for a meeting tomorrow",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: "3",
    type: "assistant",
    content: "I found 3 available 30-minute slots for tomorrow:\n\n1. 10:00 AM - 10:30 AM\n2. 2:00 PM - 2:30 PM\n3. 4:00 PM - 4:30 PM\n\nWhich slot works best for you?",
    timestamp: new Date(Date.now() - 1000 * 60 * 58), // 58 minutes ago
    tool: {
      name: "🗓️ Calendar search",
      status: "success",
      result: "Found 3 slots",
    },
  },
  {
    id: "4",
    type: "user",
    content: "Book the 2 PM slot",
    timestamp: new Date(Date.now() - 1000 * 60 * 55), // 55 minutes ago
  },
  {
    id: "5",
    type: "assistant",
    content: "Perfect! I've scheduled your meeting for tomorrow at 2:00 PM - 2:30 PM. Would you like me to send calendar invites or add any details to this meeting?",
    timestamp: new Date(Date.now() - 1000 * 60 * 54), // 54 minutes ago
    tool: {
      name: "📅 Schedule created",
      status: "success",
      result: "Meeting booked",
    },
  },
];

export const quickActions: QuickAction[] = [
  {
    id: "1",
    label: "Find time slot",
    prompt: "Find me 30 minutes for a meeting tomorrow",
  },
  {
    id: "2",
    label: "Show due tasks",
    prompt: "Show tasks due this week",
  },
  {
    id: "3",
    label: "Reschedule low priority",
    prompt: "Move low-priority tasks to next week",
  },
  {
    id: "4",
    label: "Break down task",
    prompt: "Break down my largest task into subtasks",
  },
  {
    id: "5",
    label: "Optimize schedule",
    prompt: "Optimize my schedule for deep work",
  },
  {
    id: "6",
    label: "Weekly summary",
    prompt: "Give me a summary of this week's tasks",
  },
];

export const mockAIResponses: Record<string, AIMessage> = {
  "find time": {
    id: Date.now().toString(),
    type: "assistant",
    content: "I found several available time slots in your calendar. Here are my top recommendations based on your working hours and existing commitments...",
    timestamp: new Date(),
    tool: {
      name: "🗓️ Checking calendar",
      status: "success",
      result: "Found 5 slots",
    },
  },
  "show tasks": {
    id: Date.now().toString(),
    type: "assistant",
    content: "You have 8 tasks due this week:\n\n📌 High Priority:\n• Write documentation (Due Feb 22)\n• Design mockups (Due Feb 23)\n\n📋 Medium Priority:\n• Review PRs (Due Feb 21)\n• Update dependencies (Due Feb 24)\n\nWould you like me to reschedule any of these?",
    timestamp: new Date(),
    tool: {
      name: "📋 Task analysis",
      status: "success",
      result: "8 tasks found",
    },
  },
  "reschedule": {
    id: Date.now().toString(),
    type: "assistant",
    content: "I've identified 4 low-priority tasks that can be rescheduled:\n\n• Update dependencies\n• Refactor auth module\n• Review old PRs\n• Clean up backlog\n\nShall I move these to next week?",
    timestamp: new Date(),
    tool: {
      name: "🔄 Analyzing schedule",
      status: "pending",
    },
  },
  "break down": {
    id: Date.now().toString(),
    type: "assistant",
    content: "I'll break down 'Refactor authentication module' (3 hours) into manageable subtasks:\n\n1. Review current auth implementation (30 min)\n2. Design new auth architecture (45 min)\n3. Implement user authentication (60 min)\n4. Add session management (30 min)\n5. Write unit tests (15 min)\n\nShall I create these subtasks and schedule them?",
    timestamp: new Date(),
    tool: {
      name: "✨ AI task breakdown",
      status: "success",
      result: "5 subtasks created",
    },
  },
  "optimize": {
    id: Date.now().toString(),
    type: "assistant",
    content: "I've analyzed your schedule and found opportunities for optimization:\n\n🎯 Deep work blocks:\n• Morning (9-11 AM): Best for complex tasks\n• Afternoon (2-4 PM): Good for focused work\n\n💡 Suggestions:\n1. Move meetings to 11 AM-12 PM and 4-5 PM\n2. Block 9-11 AM for high-priority tasks\n3. Group similar tasks together\n\nWould you like me to apply these changes?",
    timestamp: new Date(),
    tool: {
      name: "🚀 Schedule optimization",
      status: "success",
      result: "3 hours saved",
    },
  },
  "summary": {
    id: Date.now().toString(),
    type: "assistant",
    content: "📊 Week of Feb 17-23, 2026\n\n✅ Completed: 12 tasks (85% on time)\n⏳ In Progress: 3 tasks\n📅 Upcoming: 8 tasks\n\n🏆 Achievements:\n• Completed all high-priority items\n• No overdue tasks\n• 32 hours of productive time\n\n⚠️ Needs attention:\n• 2 tasks approaching deadline\n• Calendar 90% full on Thursday\n\nGreat work this week! 🎉",
    timestamp: new Date(),
    tool: {
      name: "📈 Weekly analysis",
      status: "success",
      result: "Report generated",
    },
  },
};
