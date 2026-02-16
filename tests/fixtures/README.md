# Test Data Fixtures

**Purpose:** Reusable test data for unit, integration, and E2E tests  
**Location:** `tests/fixtures/`

---

## User Fixtures

```typescript
// tests/fixtures/users.ts
import { User } from '@/types'

export const testUsers = {
  powerUser: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'poweruser@justplan.test',
    googleUserId: 'google-poweruser-123',
    fullName: 'Power User',
    avatarUrl: 'https://i.pravatar.cc/150?u=poweruser',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  
  basicUser: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'basicuser@justplan.test',
    googleUserId: 'google-basicuser-456',
    fullName: 'Basic User',
    avatarUrl: 'https://i.pravatar.cc/150?u=basicuser',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  },
  
  teamLead: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'teamlead@justplan.test',
    googleUserId: 'google-teamlead-789',
    fullName: 'Team Lead',
    avatarUrl: 'https://i.pravatar.cc/150?u=teamlead',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01')
  }
} as const

export const mockUser = (overrides: Partial<User> = {}): User => ({
  ...testUsers.powerUser,
  ...overrides
})
```

---

## Task Fixtures

```typescript
// tests/fixtures/tasks.ts
import { Task, TaskPriority } from '@/types'
import { addDays, addHours } from 'date-fns'

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  userId: testUsers.powerUser.id,
  title: 'Test Task',
  description: '',
  estimatedDurationMinutes: 60,
  deadline: null,
  priority: 'medium' as TaskPriority,
  workflowStateId: defaultWorkflowStates.ready.id,
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
  ...overrides
})

export const taskTemplates = {
  urgent: createMockTask({
    title: 'Urgent: Critical Bug Fix',
    priority: 'high',
    deadline: addHours(new Date(), 4),
    estimatedDurationMinutes: 120
  }),
  
  quickTask: createMockTask({
    title: 'Quick: Update docs',
    priority: 'low',
    estimatedDurationMinutes: 15
  }),
  
  scheduled: createMockTask({
    title: 'Scheduled: Weekly review',
    isScheduled: true,
    scheduledStart: addHours(new Date(), 2),
    scheduledEnd: addHours(new Date(), 3)
  }),
  
  overdue: createMockTask({
    title: 'Overdue: Complete report',
    deadline: addDays(new Date(), -1),
    priority: 'high'
  }),
  
  longTask: createMockTask({
    title: 'Long: Refactor entire module',
    estimatedDurationMinutes: 480, // 8 hours
    priority: 'medium',
    deadline: addDays(new Date(), 7)
  }),
  
  withDeadline: (daysFromNow: number) => createMockTask({
    title: `Task due in ${daysFromNow} days`,
    deadline: addDays(new Date(), daysFromNow),
    priority: daysFromNow <= 1 ? 'high' : 'medium'
  })
}

// Bulk task generation
export const generateTasks = (count: number, template?: Partial<Task>): Task[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockTask({
      title: `Task ${i + 1}`,
      ...template
    })
  )
}
```

---

## Workflow State Fixtures

```typescript
// tests/fixtures/workflow-states.ts
import { WorkflowState } from '@/types'

export const defaultWorkflowStates = {
  backlog: {
    id: '10000000-0000-0000-0000-000000000001',
    userId: testUsers.powerUser.id,
    name: 'Backlog',
    color: '#9CA3AF',
    order: 0,
    isTerminal: false,
    shouldAutoSchedule: false,
    schedulingPriorityBoost: -5,
    createdAt: new Date('2026-01-01')
  },
  
  ready: {
    id: '10000000-0000-0000-0000-000000000002',
    userId: testUsers.powerUser.id,
    name: 'Ready',
    color: '#3B82F6',
    order: 1,
    isTerminal: false,
    shouldAutoSchedule: true,
    schedulingPriorityBoost: 0,
    createdAt: new Date('2026-01-01')
  },
  
  inProgress: {
    id: '10000000-0000-0000-0000-000000000003',
    userId: testUsers.powerUser.id,
    name: 'In Progress',
    color: '#F59E0B',
    order: 2,
    isTerminal: false,
    shouldAutoSchedule: true,
    schedulingPriorityBoost: 5,
    createdAt: new Date('2026-01-01')
  },
  
  blocked: {
    id: '10000000-0000-0000-0000-000000000004',
    userId: testUsers.powerUser.id,
    name: 'Blocked',
    color: '#EF4444',
    order: 3,
    isTerminal: false,
    shouldAutoSchedule: false,
    schedulingPriorityBoost: -10,
    createdAt: new Date('2026-01-01')
  },
  
  review: {
    id: '10000000-0000-0000-0000-000000000005',
    userId: testUsers.powerUser.id,
    name: 'Review',
    color: '#8B5CF6',
    order: 4,
    isTerminal: false,
    shouldAutoSchedule: true,
    schedulingPriorityBoost: 3,
    createdAt: new Date('2026-01-01')
  },
  
  done: {
    id: '10000000-0000-0000-0000-000000000006',
    userId: testUsers.powerUser.id,
    name: 'Done',
    color: '#10B981',
    order: 5,
    isTerminal: true,
    shouldAutoSchedule: false,
    schedulingPriorityBoost: 0,
    createdAt: new Date('2026-01-01')
  }
} as const

export const mockWorkflowState = (overrides: Partial<WorkflowState> = {}): WorkflowState => ({
  ...defaultWorkflowStates.ready,
  id: crypto.randomUUID(),
  ...overrides
})
```

---

## Workflow Transition Fixtures

```typescript
// tests/fixtures/workflow-transitions.ts
import { WorkflowTransition, TransitionConditionType } from '@/types'

export const mockTransition = (overrides: Partial<WorkflowTransition> = {}): WorkflowTransition => ({
  id: crypto.randomUUID(),
  userId: testUsers.powerUser.id,
  fromStateId: defaultWorkflowStates.ready.id,
  toStateId: defaultWorkflowStates.inProgress.id,
  conditionType: 'manual' as TransitionConditionType,
  conditionValue: {},
  isEnabled: true,
  createdAt: new Date(),
  ...overrides
})

export const transitionRules = {
  readyToUrgent: mockTransition({
    fromStateId: defaultWorkflowStates.ready.id,
    toStateId: defaultWorkflowStates.inProgress.id,
    conditionType: 'deadline_within',
    conditionValue: { hours: 24 }
  }),
  
  inProgressToOverdue: mockTransition({
    fromStateId: defaultWorkflowStates.inProgress.id,
    toStateId: defaultWorkflowStates.blocked.id,
    conditionType: 'overdue',
    conditionValue: { gracePeriodHours: 0 }
  }),
  
  blockedToBacklog: mockTransition({
    fromStateId: defaultWorkflowStates.blocked.id,
    toStateId: defaultWorkflowStates.backlog.id,
    conditionType: 'time_in_state',
    conditionValue: { days: 3 }
  }),
  
  reviewToDone: mockTransition({
    fromStateId: defaultWorkflowStates.review.id,
    toStateId: defaultWorkflowStates.done.id,
    conditionType: 'manual',
    conditionValue: {}
  })
}
```

---

## Working Hours Fixtures

```typescript
// tests/fixtures/working-hours.ts
import { WorkingHours } from '@/types'

export const standardWorkWeek: WorkingHours[] = [
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isWorkingDay: false }
]

export const flexibleSchedule: WorkingHours[] = [
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 1, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 2, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 3, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 4, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 5, startTime: '10:00', endTime: '14:00', isWorkingDay: true },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
  { id: crypto.randomUUID(), userId: testUsers.powerUser.id, dayOfWeek: 6, startTime: '00:00', endTime: '00:00', isWorkingDay: false }
]
```

---

## Calendar Event Fixtures

```typescript
// tests/fixtures/calendar-events.ts
import { GoogleCalendarEvent } from '@/types'
import { addHours, startOfDay } from 'date-fns'

export const mockCalendarEvent = (overrides: Partial<GoogleCalendarEvent> = {}): GoogleCalendarEvent => ({
  id: crypto.randomUUID(),
  userId: testUsers.powerUser.id,
  googleEventId: `google-event-${crypto.randomUUID()}`,
  calendarId: 'primary',
  summary: 'Calendar Event',
  description: '',
  startTime: addHours(new Date(), 2),
  endTime: addHours(new Date(), 3),
  isAllDay: false,
  isRecurring: false,
  recurrenceRule: null,
  syncedAt: new Date(),
  ...overrides
})

export const eventTemplates = {
  meeting: mockCalendarEvent({
    summary: 'Team Standup',
    startTime: addHours(startOfDay(new Date()), 10),
    endTime: addHours(startOfDay(new Date()), 10.5)
  }),
  
  lunch: mockCalendarEvent({
    summary: 'Lunch Break',
    startTime: addHours(startOfDay(new Date()), 12),
    endTime: addHours(startOfDay(new Date()), 13)
  }),
  
  allDay: mockCalendarEvent({
    summary: 'Company Holiday',
    startTime: startOfDay(new Date()),
    endTime: startOfDay(addDays(new Date(), 1)),
    isAllDay: true
  }),
  
  recurring: mockCalendarEvent({
    summary: 'Weekly Review',
    isRecurring: true,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR'
  })
}
```

---

## Time Slot Fixtures

```typescript
// tests/fixtures/time-slots.ts
import { TimeSlot } from '@/types'
import { setHours, setMinutes } from 'date-fns'

export const mockTimeSlot = (overrides: Partial<TimeSlot> = {}): TimeSlot => ({
  start: setHours(setMinutes(new Date(), 0), 9),
  end: setHours(setMinutes(new Date(), 0), 10),
  ...overrides
})

export const timeSlotTemplates = {
  morning: mockTimeSlot({
    start: setHours(new Date(), 9),
    end: setHours(new Date(), 12)
  }),
  
  afternoon: mockTimeSlot({
    start: setHours(new Date(), 14),
    end: setHours(new Date(), 17)
  }),
  
  shortSlot: mockTimeSlot({
    start: setHours(new Date(), 14),
    end: setHours(setMinutes(new Date(), 30), 14)
  }),
  
  fullDay: mockTimeSlot({
    start: setHours(new Date(), 9),
    end: setHours(new Date(), 17)
  })
}

export const generateTimeSlots = (
  startHour: number,
  endHour: number,
  slotDurationMinutes: number
): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const totalMinutes = (endHour - startHour) * 60
  const slotCount = Math.floor(totalMinutes / slotDurationMinutes)
  
  for (let i = 0; i < slotCount; i++) {
    const startMinutes = startHour * 60 + i * slotDurationMinutes
    const endMinutes = startMinutes + slotDurationMinutes
    
    slots.push({
      start: setMinutes(setHours(new Date(), Math.floor(startMinutes / 60)), startMinutes % 60),
      end: setMinutes(setHours(new Date(), Math.floor(endMinutes / 60)), endMinutes % 60)
    })
  }
  
  return slots
}
```

---

## Database Seed Data

```typescript
// tests/fixtures/seed.ts
import { SupabaseClient } from '@supabase/supabase-js'

export async function seedTestDatabase(supabase: SupabaseClient) {
  // Insert test users
  await supabase.from('users').insert([
    testUsers.powerUser,
    testUsers.basicUser,
    testUsers.teamLead
  ])
  
  // Insert default workflow states for each user
  for (const user of Object.values(testUsers)) {
    const states = Object.values(defaultWorkflowStates).map(state => ({
      ...state,
      id: crypto.randomUUID(),
      userId: user.id
    }))
    
    await supabase.from('workflow_states').insert(states)
  }
  
  // Insert working hours for power user
  await supabase.from('working_hours').insert(
    standardWorkWeek.map(wh => ({ ...wh, userId: testUsers.powerUser.id }))
  )
  
  // Insert sample tasks
  const tasks = generateTasks(10, { userId: testUsers.powerUser.id })
  await supabase.from('tasks').insert(tasks)
  
  console.log('✅ Test database seeded successfully')
}

export async function cleanupTestDatabase(supabase: SupabaseClient) {
  const testUserIds = Object.values(testUsers).map(u => u.id)
  
  await supabase.from('tasks').delete().in('user_id', testUserIds)
  await supabase.from('workflow_transitions').delete().in('user_id', testUserIds)
  await supabase.from('workflow_states').delete().in('user_id', testUserIds)
  await supabase.from('working_hours').delete().in('user_id', testUserIds)
  await supabase.from('user_settings').delete().in('user_id', testUserIds)
  await supabase.from('users').delete().in('id', testUserIds)
  
  console.log('✅ Test database cleaned up')
}
```

---

## Mock API Responses

```typescript
// tests/fixtures/api-mocks.ts

export const mockGoogleCalendarResponse = {
  kind: 'calendar#events',
  etag: '"test-etag"',
  summary: 'Test Calendar',
  items: [
    {
      kind: 'calendar#event',
      id: 'event-1',
      summary: 'Team Meeting',
      start: { dateTime: '2026-02-17T10:00:00-05:00' },
      end: { dateTime: '2026-02-17T11:00:00-05:00' }
    }
  ]
}

export const mockGoogleTasksResponse = {
  kind: 'tasks#tasks',
  etag: '"test-etag"',
  items: [
    {
      kind: 'tasks#task',
      id: 'task-1',
      title: 'Complete report',
      status: 'needsAction',
      due: '2026-02-20T00:00:00.000Z'
    }
  ]
}

export const mockSupabaseResponse = {
  data: [taskTemplates.urgent],
  error: null,
  count: 1,
  status: 200,
  statusText: 'OK'
}
```

---

## Usage Examples

### In Unit Tests

```typescript
import { createMockTask, taskTemplates } from '@/tests/fixtures/tasks'

describe('TaskService', () => {
  it('should prioritize urgent tasks', () => {
    const tasks = [
      createMockTask({ priority: 'low' }),
      taskTemplates.urgent,
      createMockTask({ priority: 'medium' })
    ]
    
    const sorted = prioritizeTasks(tasks)
    
    expect(sorted[0]).toEqual(taskTemplates.urgent)
  })
})
```

### In Integration Tests

```typescript
import { seedTestDatabase, cleanupTestDatabase } from '@/tests/fixtures/seed'

describe('Database Integration', () => {
  beforeAll(async () => {
    await seedTestDatabase(supabase)
  })
  
  afterAll(async () => {
    await cleanupTestDatabase(supabase)
  })
  
  it('should query tasks', async () => {
    const { data } = await supabase.from('tasks').select()
    expect(data.length).toBeGreaterThan(0)
  })
})
```

### In E2E Tests

```typescript
import { testUsers } from '@/tests/fixtures/users'

test('login as power user', async ({ page }) => {
  await page.goto('/login')
  // Use fixture credentials
  await login(page, testUsers.powerUser.email, 'Test123!@#')
  await expect(page).toHaveURL('/dashboard')
})
```

---

## Next Steps

1. ✅ Test fixtures created
2. ⬜ Import fixtures into test files
3. ⬜ Seed test database
4. ⬜ Configure test environments
5. ⬜ Run first tests with fixtures
