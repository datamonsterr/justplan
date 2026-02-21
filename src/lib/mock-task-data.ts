// Mock Tasks data for development

export interface Task {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  priority: "low" | "medium" | "high";
  deadline?: Date;
  state: string;
  tags?: string[];
  subtasks?: Task[];
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskState {
  name: string;
  color: string;
  count: number;
}

export const mockTaskStates: TaskState[] = [
  { name: "In Progress", color: "orange", count: 2 },
  { name: "Ready", color: "blue", count: 3 },
  { name: "Blocked", color: "red", count: 1 },
  { name: "Review", color: "purple", count: 2 },
  { name: "Backlog", color: "gray", count: 4 },
  { name: "Done", color: "green", count: 15 },
];

export const mockTasks: Record<string, Task[]> = {
  "In Progress": [
    {
      id: "1",
      title: "Write API documentation",
      description: "Complete the API documentation for the new endpoints including authentication, user management, and task operations",
      duration: 120,
      priority: "high",
      deadline: new Date("2026-02-22T17:00:00"),
      state: "In Progress",
      tags: ["documentation", "api"],
      createdAt: new Date("2026-02-20"),
      updatedAt: new Date(),
    },
    {
      id: "2",
      title: "Review pull requests",
      description: "Review open PRs from the team",
      duration: 45,
      priority: "medium",
      state: "In Progress",
      tags: ["review", "code"],
      createdAt: new Date("2026-02-21"),
      updatedAt: new Date(),
      subtasks: [
        {
          id: "2-1",
          title: "PR #123 - Bug fix for authentication",
          duration: 15,
          priority: "medium",
          state: "In Progress",
          createdAt: new Date("2026-02-21"),
          updatedAt: new Date(),
        },
        {
          id: "2-2",
          title: "PR #124 - New feature: Task filtering",
          duration: 30,
          priority: "medium",
          state: "In Progress",
          createdAt: new Date("2026-02-21"),
          updatedAt: new Date(),
        },
      ],
    },
  ],
  "Ready": [
    {
      id: "3",
      title: "Design new feature mockups",
      description: "Create design mockups for the new dashboard layout and task management UI",
      duration: 90,
      priority: "high",
      deadline: new Date("2026-02-23T17:00:00"),
      state: "Ready",
      tags: ["design", "ui"],
      createdAt: new Date("2026-02-19"),
      updatedAt: new Date(),
    },
    {
      id: "4",
      title: "Update dependencies",
      description: "Update all npm packages to latest stable versions",
      duration: 30,
      priority: "low",
      state: "Ready",
      tags: ["maintenance"],
      createdAt: new Date("2026-02-18"),
      updatedAt: new Date(),
    },
    {
      id: "5",
      title: "Setup CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment",
      duration: 60,
      priority: "medium",
      deadline: new Date("2026-02-24T17:00:00"),
      state: "Ready",
      tags: ["devops", "ci/cd"],
      createdAt: new Date("2026-02-20"),
      updatedAt: new Date(),
    },
  ],
  "Blocked": [
    {
      id: "6",
      title: "Integrate payment gateway",
      description: "Waiting for API credentials from payment provider",
      duration: 120,
      priority: "high",
      deadline: new Date("2026-02-25T17:00:00"),
      state: "Blocked",
      tags: ["payment", "integration", "blocked"],
      createdAt: new Date("2026-02-17"),
      updatedAt: new Date(),
    },
  ],
  "Review": [
    {
      id: "7",
      title: "Mobile app wireframes",
      description: "Wireframes ready for stakeholder review",
      duration: 15,
      priority: "medium",
      state: "Review",
      tags: ["design", "mobile"],
      createdAt: new Date("2026-02-19"),
      updatedAt: new Date(),
    },
    {
      id: "8",
      title: "Database migration plan",
      description: "Migration strategy document ready for review",
      duration: 30,
      priority: "high",
      state: "Review",
      tags: ["database", "planning"],
      createdAt: new Date("2026-02-20"),
      updatedAt: new Date(),
    },
  ],
  "Backlog": [
    {
      id: "9",
      title: "Refactor authentication module",
      description: "Modernize auth code and improve security",
      duration: 180,
      priority: "medium",
      state: "Backlog",
      tags: ["refactoring", "security"],
      createdAt: new Date("2026-02-15"),
      updatedAt: new Date(),
    },
    {
      id: "10",
      title: "Add dark mode support",
      description: "Implement dark mode theme across the application",
      duration: 90,
      priority: "low",
      state: "Backlog",
      tags: ["ui", "theme"],
      createdAt: new Date("2026-02-14"),
      updatedAt: new Date(),
    },
    {
      id: "11",
      title: "Performance optimization",
      description: "Analyze and optimize application performance",
      duration: 120,
      priority: "medium",
      state: "Backlog",
      tags: ["performance", "optimization"],
      createdAt: new Date("2026-02-16"),
      updatedAt: new Date(),
    },
    {
      id: "12",
      title: "User onboarding flow",
      description: "Design and implement improved user onboarding experience",
      duration: 180,
      priority: "low",
      state: "Backlog",
      tags: ["ux", "onboarding"],
      createdAt: new Date("2026-02-13"),
      updatedAt: new Date(),
    },
  ],
};

export const taskStatistics = {
  total: 12,
  completed: 15,
  inProgress: 2,
  thisWeek: 6,
  overdue: 0,
  totalHours: 17.75,
  completedThisWeek: 8,
};
