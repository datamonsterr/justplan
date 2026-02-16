# JustPlan - Requirements Document

**Project Name:** JustPlan  
**Version:** 1.0  
**Date:** February 17, 2026  
**Target Launch:** Phase 1 MVP

---

## Executive Summary

JustPlan is an intelligent time management application that enhances the Reclaim.ai concept with **customizable workflow states** for task management. It combines automatic scheduling with flexible, user-defined task workflows (similar to Jira's state management) to provide a more powerful and personalized planning experience.

**Core Value Proposition:**  
While Reclaim.ai provides excellent auto-scheduling, it lacks flexibility in task workflow management. JustPlan bridges this gap by allowing users to define custom task states and automatic state transitions based on conditions (deadlines, priority, time-based rules), while maintaining the convenience of automatic calendar scheduling.

---

## Project Goals

### Primary Goals

1. **Automatic Intelligent Scheduling** - Analyze working hours, personal time, task priorities, and deadlines to automatically place tasks on calendar
2. **Customizable Workflow States** - Allow users to define task states and automatic transitions (like Jira workflows)
3. **Seamless Google Integration** - Two-way sync with Google Calendar and Google Tasks
4. **Personal → Team Extensibility** - Start with personal use, architect for 2-10 person team expansion

### Secondary Goals

- Reduce manual calendar management overhead
- Provide clear visibility of task progression through workflow states
- Minimize context switching between multiple task management tools

---

## Target Users

### Phase 1: Individual Users

- **Primary:** Knowledge workers who manage multiple projects with varying deadlines
- **Secondary:** Freelancers and consultants juggling client work
- **Characteristics:**
  - Already use Google Calendar + Google Tasks
  - Frustrated with manual task scheduling
  - Want more control over task workflow states than basic "To-Do" vs "Done"

### Phase 2: Small Teams (2-10 people)

- Team leads who need to coordinate work
- Small startups or agencies
- Remote teams needing shared workflow visibility

---

## Core Features

### 1. Calendar Management

#### 1.1 Calendar View

- **Display:** Week/Month/Day views showing scheduled tasks and events
- **Integration:** Real-time sync with Google Calendar
- **Functionality:**
  - View all scheduled time blocks
  - Distinguish between auto-scheduled tasks, manual events, and busy time
  - Drag-and-drop to manually adjust scheduling (triggers re-optimization)

#### 1.2 Working Hours Configuration

- **Personal Hours:** Define work hours, personal time, break times
- **Weekly Patterns:** Different schedules for different days
- **Time Zones:** Support for users traveling or working across time zones
- **Minimum/Maximum Task Duration:** Set preferences for task block sizes

### 2. Task Management

#### 2.1 Task Creation & Properties

- **Basic Fields:**
  - Title (required)
  - Description (optional, markdown support)
  - Estimated duration (required for scheduling)
  - Deadline (optional but recommended)
  - Priority level (High, Medium, Low)
- **Workflow Fields:**
  - Current state (e.g., Backlog, In Progress, Blocked, Done)
  - State history (audit trail)
  - Automatic state transition rules

- **Scheduling Fields:**
  - Scheduling preference (auto/manual)
  - Time constraints (must be scheduled after X date, before Y time)
  - Splitting allowed (can break into multiple time blocks?)

#### 2.2 Google Tasks Integration

- **Two-way sync:**
  - Import existing Google Tasks with metadata
  - Create tasks in app → sync to Google Tasks
  - Complete tasks in Google Tasks → update in app
  - Update task details → sync changes
- **Conflict Resolution:** App is source of truth for scheduling; preserve user edits

### 3. Customizable Workflow System

This is the **core differentiator** from Reclaim.ai.

#### 3.1 Default Workflow (MVP)

```
Backlog → Ready → In Progress → Review → Done
                              ↓
                          Blocked
```

**State Definitions:**

- **Backlog:** Tasks not yet ready to work on
- **Ready:** Tasks available to be scheduled and worked on
- **In Progress:** Currently being worked on
- **Blocked:** Cannot proceed due to external dependency
- **Review:** Work complete, awaiting review/validation
- **Done:** Completed

#### 3.2 Custom States (5-10 maximum)

- **User Creation:** Add custom states with names, colors, descriptions
- **State Properties:**
  - Name (e.g., "Urgent", "Awaiting Feedback", "Deferred")
  - Color coding (for visual calendar representation)
  - Scheduling behavior (should auto-schedule? priority level?)
  - Terminal state flag (e.g., "Done", "Cancelled")

#### 3.3 Automatic State Transitions

**Condition-Based Transitions:**

Users can define rules like:

```
IF deadline is within 1 day AND state = "Ready"
THEN transition to "Urgent"

IF task is overdue AND state = "In Progress"
THEN transition to "Overdue"

IF blocked for > 3 days
THEN transition to "Backlog" and notify user
```

**Supported Conditions:**

- Time-based (X hours/days before deadline)
- Overdue detection
- State duration (been in state for X time)
- Manual triggers (user actions)
- Calendar blockers (scheduled time passed)

**Transition Actions:**

- Change state
- Update priority
- Trigger notifications
- Reschedule on calendar

#### 3.4 Workflow Templates (Phase 2)

Pre-built templates users can adopt:

- **Simple:** To-Do → In Progress → Done
- **GTD-Inspired:** Inbox → Next Actions → Waiting For → Someday/Maybe → Done
- **Eisenhower Matrix:** Urgent/Important quadrants as states
- **Kanban-style:** Backlog → Selected → In Progress → Review → Done

### 4. Automatic Scheduling Engine

#### 4.1 Core Algorithm

The scheduler must:

1. **Read availability** from Google Calendar (existing events, busy times)
2. **Respect working hours** configured by user
3. **Prioritize tasks** based on:
   - Deadline proximity
   - Current workflow state (Urgent > Ready > Backlog)
   - User-defined priority
   - Task dependencies
4. **Optimize packing** to minimize fragmentation
5. **Leave buffer time** between tasks (configurable)

#### 4.2 Scheduling Strategy

- **High priority/urgent tasks:** Schedule first in optimal time slots
- **Deep work tasks:** Schedule during focus time blocks (morning for most users)
- **Quick tasks:** Fill gaps between larger blocks
- **Deadline-driven:** Work backward from deadline, ensure completion time
- **Rescheduling:** Automatically adjust when new tasks added or priorities change

#### 4.3 User Overrides

- Manual drag-and-drop adjustments are respected
- "Pin" tasks to specific times
- Mark time blocks as "flexible" vs "fixed"
- Snooze/defer tasks (reschedule for later)

### 5. Google Integration

#### 5.1 Google Calendar - Two-Way Sync

- **Read:** Import all calendar events to understand availability
- **Write:** Create time blocks for scheduled tasks
- **Update:** Modify time blocks when tasks rescheduled
- **Delete:** Remove blocks when tasks completed/removed
- **Sync Frequency:** Real-time (webhook-based) or polling every 5 minutes

#### 5.2 Google Tasks - Two-Way Sync

- **Import:** Pull all Google Tasks with metadata
- **Create:** New tasks in app → create in Google Tasks
- **Update:** Changes in app ↔ changes in Google Tasks
- **Complete:** Mark complete in either system, sync status
- **Conflict Resolution:**
  - Timestamp-based (most recent change wins)
  - User notification for major conflicts
  - Preserve task state/workflow in app (Google Tasks doesn't support)

#### 5.3 Authentication & Permissions

- OAuth 2.0 with Google
- Required scopes:
  - `calendar.readonly` + `calendar.events` for calendar sync
  - `tasks` for Google Tasks read/write
- Secure token storage in Supabase

---

## Non-Functional Requirements

### Performance

- Calendar view loads in < 1 second
- Task state transitions update in < 500ms
- Scheduling algorithm completes in < 3 seconds for 100 tasks
- Google sync latency < 10 seconds

### Scalability (Phase 2)

- Support up to 10 users per team
- Handle 1,000+ tasks per user
- Concurrent editing with optimistic UI updates

### Security

- End-to-end encryption for sensitive task data
- Row-level security in Supabase (multi-tenant ready)
- Secure Google OAuth token handling
- HTTPS everywhere

### Usability

- Intuitive drag-and-drop interface
- Mobile-responsive design (desktop first, mobile later)
- Keyboard shortcuts for power users
- Undo/redo for critical actions

### Reliability

- 99.9% uptime target
- Automatic retry for failed Google syncs
- Graceful degradation if Google services unavailable
- Data backup and recovery

---

## Out of Scope (For MVP)

These features are explicitly **NOT** included in Phase 1:

1. ❌ Mobile native apps (iOS/Android) - web only
2. ❌ Team collaboration features (comments, assignments)
3. ❌ Integration with tools beyond Google (Jira, Asana, Notion, etc.)
4. ❌ AI-powered task estimation or smart suggestions
5. ❌ Recurring tasks with complex patterns
6. ❌ Time tracking and analytics/reporting
7. ❌ Email integration
8. ❌ Public API for third-party integrations
9. ❌ Advanced permissions and roles (admin, viewer, etc.)
10. ❌ Custom notifications (Slack, email digests, etc.)

---

## Success Criteria

### MVP Success Metrics

1. **Functional:** User can create tasks, define workflow states, and see tasks auto-scheduled on calendar
2. **Integration:** Google Calendar + Tasks sync working bidirectionally
3. **Performance:** Scheduling algorithm handles 50+ tasks without lag
4. **Usability:** New user can schedule first task within 5 minutes

### Phase 1 Completion

- 10 beta users actively using daily for 2+ weeks
- 90%+ user satisfaction with auto-scheduling accuracy
- Zero critical bugs in production
- Positive feedback on workflow customization feature

---

## Constraints & Assumptions

### Technical Constraints

- Must use Google APIs (Calendar v3, Tasks v1)
- Rate limits: Google Calendar API (1M queries/day), Tasks API (50K queries/day)
- Browser support: Chrome, Firefox, Safari (latest 2 versions)
- Database: PostgreSQL via Supabase

### Business Constraints

- Solo development initially
- Minimal hosting costs (< $50/month for 100 users)
- Open to team expansion in 6 months

### Assumptions

- Users have Google accounts
- Users are comfortable with OAuth permissions
- Primary usage is desktop (responsive mobile is secondary)
- Users understand basic concepts like "workflow states" and "deadlines"

---

## Risks & Mitigations

| Risk                                          | Impact | Probability | Mitigation                                                                       |
| --------------------------------------------- | ------ | ----------- | -------------------------------------------------------------------------------- |
| Google API changes breaking integration       | High   | Medium      | Abstract Google APIs behind interface layer; monitor deprecation notices         |
| Scheduling algorithm too slow for many tasks  | High   | Medium      | Implement background job queue; optimize algorithm; cache results                |
| Users find workflow customization too complex | Medium | Medium      | Provide excellent defaults; progressive disclosure of advanced features          |
| Two-way sync conflicts                        | Medium | High        | Implement robust conflict resolution; make app source of truth for workflow data |
| Poor mobile experience hurts adoption         | Low    | High        | Accept desktop-first approach; plan mobile optimization for Phase 2              |

---

## Glossary

- **Auto-scheduling:** Automatic placement of tasks on calendar based on availability and priorities
- **Workflow State:** A stage in a task's lifecycle (e.g., Backlog, In Progress, Done)
- **State Transition:** Moving a task from one state to another, either manually or automatically
- **Time Block:** A scheduled period on the calendar allocated to a specific task
- **Working Hours:** User-configurable time periods when they're available to work
- **Two-way Sync:** Changes made in either system (app or Google) are reflected in the other

---

## Next Steps

1. Review and validate requirements with stakeholders
2. Create detailed architecture document
3. Design database schema
4. Create phased development plan
5. Begin Phase 1 implementation
