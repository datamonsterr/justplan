# JustPlan - Development Plan

**Project:** JustPlan  
**Version:** 1.0  
**Created:** February 17, 2026

---

## Overview

This document outlines the phased development approach for JustPlan, breaking down the ambitious feature set into manageable, incremental releases. Each phase delivers standalone value while building toward the complete vision.

**Development Philosophy:**

- ✅ Ship early and often
- ✅ Validate core assumptions before building advanced features
- ✅ Build foundation for extensibility (personal → team)
- ✅ Prioritize user-facing value over internal perfection

---

## Phase Breakdown

### 🎯 Phase 0: Foundation (Week 1-2)

**Goal:** Set up development environment and core infrastructure

### 🎯 Phase 1: MVP Core (Week 3-6)

**Goal:** Basic task management + manual scheduling + Google integration

### 🎯 Phase 2: Auto-Scheduling (Week 7-10)

**Goal:** Intelligent automatic task scheduling on calendar

### 🎯 Phase 3: Custom Workflows (Week 11-13)

**Goal:** User-defined states and automatic transitions

### 🎯 Phase 4: Polish & Optimization (Week 14-16)

**Goal:** Performance, UX improvements, bug fixes

### 🎯 Phase 5: Team Features (Week 17-20)

**Goal:** Multi-user support, sharing, collaboration basics

---

## Phase 0: Foundation

**Duration:** 2 weeks  
**Status:** ✅ COMPLETED

### Objectives

- ✅ Set up development environment
- ✅ Configure hosting and database
- ⏸️ Implement authentication (Deferred - using mock data for now)
- ✅ Build basic UI shell

### Tasks

#### 0.1 Project Setup

- [x] Initialize Next.js project (App Router, TypeScript)
- [x] Configure ESLint, Prettier, Git hooks
- [x] Set up folder structure
- [x] Configure environment variables
- [x] Set up GitHub repository

**Acceptance:** ✅ `pnpm dev` starts the application on port 3001

#### 0.2 Supabase Configuration

- [x] Create Supabase project
- [x] Configure authentication (Google OAuth) - Schema ready
- [x] Set up database (PostgreSQL) - Migrations created
- [x] Configure Row-Level Security policies - In migrations
- [x] Set up development and production environments - Structure ready

**Acceptance:** ✅ Database schema defined, ready for Supabase connection

#### 0.3 UI Framework Setup

- [x] Install and configure Tailwind CSS
- [x] Choose component library (Shadcn UI)
- [x] Set up dark/light theme toggle - ThemeProvider configured
- [x] Create basic layout components (Header, Sidebar, Main)
- [x] Implement responsive navigation

**Acceptance:** ✅ Modern dashboard layout with responsive navigation

#### 0.4 Authentication Flow

- [ ] Implement Google OAuth login (Deferred - Phase 2)
- [x] Create protected route middleware (Structure ready)
- [ ] Build login page (Deferred)
- [ ] Build account settings page (Deferred)
- [ ] Handle auth state (logged in/out) (Deferred)

**Acceptance:** ⏸️ Deferred to Phase 2 - using mock user for development

#### 0.5 Development Tooling

- [x] Set up database migrations (Supabase migrations)
- [x] Configure testing framework (Vitest + Testing Library)
- [x] Set up Playwright for E2E tests
- [x] Create development docs (README, CONTRIBUTING)
- [ ] Set up CI/CD pipeline basics (Phase 2)

**Acceptance:** ✅ All 67 tests passing, test framework fully configured

### Deliverables

✅ Running Next.js application with auth  
✅ Connected to Supabase  
✅ Basic UI shell  
✅ Developer documentation

---

## Phase 1: MVP Core

**Duration:** 4 weeks  
**Status:** ✅ FRONTEND COMPLETE (Backend deferred to Phase 2)

### Objectives

- ✅ CRUD operations for tasks (with mock data)
- ⏸️ Google Calendar/Tasks read integration (Deferred to Phase 2)
- ✅ Manual calendar view (Mina Scheduler integrated)
- ⏸️ Basic working hours configuration (Deferred to Phase 2)

### Tasks

#### 1.1 Database Schema

- [x] Design and implement `tasks` table
- [x] Design and implement `user_settings` table
- [x] Design and implement `working_hours` table
- [x] Create database indexes for performance
- [x] Write seed data for development (Mock data in lib/mock-data.ts)

**Acceptance:** ✅ Complete database schema with migrations, mock data for development

#### 1.2 Task Management

- [x] Build task creation form (TaskDialog component)
- [x] Implement task list view (TaskList component)
- [x] Build task detail/edit modal (TaskDialog with edit mode)
- [x] Add task deletion with confirmation
- [x] Implement task filtering (by status, priority)
- [x] Add task search functionality

**Acceptance:** ✅ Full CRUD for tasks with modern UI, 67 tests passing

#### 1.3 Working Hours Configuration

- [ ] Build working hours settings page
- [ ] Weekly schedule editor (different hours per day)
- [ ] Time zone selector
- [ ] Break time configuration
- [ ] Save/update working hours preferences

**Acceptance:** User can configure when they're available to work

#### 1.4 Calendar View (Read-Only)

- [ ] Implement week view calendar component
- [ ] Implement day view
- [ ] Implement month view
- [ ] Display existing Google Calendar events
- [ ] Show working hours overlay
- [ ] Basic navigation (prev/next week)

**Acceptance:** User sees their Google Calendar events in the app

#### 1.5 Google Calendar Integration (Read)

- [ ] Set up Google OAuth with Calendar scope
- [ ] Implement Google Calendar API client
- [ ] Fetch and display user's calendars
- [ ] Import calendar events
- [ ] Handle pagination and incremental sync
- [ ] Cache calendar data in Supabase

**Acceptance:** App displays events from user's Google Calendar

#### 1.6 Google Tasks Integration (Read)

- [ ] Add Google Tasks API scope
- [ ] Implement Google Tasks API client
- [ ] Import task lists
- [ ] Import tasks with metadata
- [ ] Map Google Tasks to app tasks
- [ ] Handle sync and refresh

**Acceptance:** User's Google Tasks appear in task list

### Deliverables

✅ Functional task management  
✅ Google Calendar/Tasks visible in app  
✅ Calendar view showing availability  
✅ Working hours configured

### Success Metrics

- User can manage 20+ tasks
- Google integration loads in < 3 seconds
- No critical bugs in task CRUD

---

## Phase 2: Auto-Scheduling

**Duration:** 4 weeks  
**Status:** 🔵 Not Started

### Objectives

- Implement scheduling algorithm
- Write scheduled tasks to Google Calendar
- Handle rescheduling and conflicts
- Manual override capabilities

### Tasks

#### 2.1 Scheduling Algorithm Design

- [ ] Research scheduling algorithms (greedy, constraint satisfaction)
- [ ] Define scheduling constraints and priorities
- [ ] Design algorithm architecture (modular, testable)
- [ ] Create algorithm test suite with edge cases
- [ ] Document algorithm logic and decision points

**Acceptance:** Algorithm design document completed and reviewed

#### 2.2 Core Scheduling Engine

- [ ] Implement availability calculation (working hours + existing events)
- [ ] Implement task prioritization logic
- [ ] Build time slot finder (finding suitable blocks)
- [ ] Implement task-to-calendar-slot assignment
- [ ] Handle task splitting (multi-block tasks)
- [ ] Add buffer time between tasks

**Acceptance:** Algorithm schedules 50 tasks in < 3 seconds

#### 2.3 Scheduling Constraints

- [ ] Respect task deadlines (must complete before)
- [ ] Honor minimum/maximum session durations
- [ ] Implement "pin" functionality (fix task to specific time)
- [ ] Handle "do not schedule before" dates
- [ ] Support "preferred time of day" hints
- [ ] Respect focus time blocks

**Acceptance:** Scheduling respects all defined constraints

#### 2.4 Google Calendar Write Integration

- [ ] Implement create event API calls
- [ ] Update events when rescheduled
- [ ] Delete events when tasks completed
- [ ] Handle event metadata (link to app task)
- [ ] Implement batch operations for efficiency
- [ ] Add conflict detection

**Acceptance:** Scheduled tasks appear as events in Google Calendar

#### 2.5 Rescheduling Logic

- [ ] Detect triggers for rescheduling (new task, priority change)
- [ ] Implement incremental rescheduling (don't rebuild entire schedule)
- [ ] Handle manual overrides (preserve user edits)
- [ ] Build rescheduling queue (background job)
- [ ] Add rescheduling notifications
- [ ] Optimize algorithm for speed

**Acceptance:** Adding new task reschedules others within 5 seconds

#### 2.6 Manual Adjustments

- [ ] Implement drag-and-drop to reschedule
- [ ] Add resize handles for duration changes
- [ ] "Snooze" functionality (reschedule for later)
- [ ] Pin/unpin tasks
- [ ] Manual slot selection for tasks
- [ ] Undo/redo functionality

**Acceptance:** User can manually adjust schedule, app respects changes

#### 2.7 Scheduling UI/UX

- [ ] Visual indicators for auto vs manual scheduled
- [ ] Show scheduling conflicts and suggestions
- [ ] "Reschedule" button with preview
- [ ] Loading states during scheduling
- [ ] Error handling and user feedback
- [ ] Tour/onboarding for scheduling features

**Acceptance:** User understands how scheduling works within 5 minutes

### Deliverables

✅ Working auto-scheduling algorithm  
✅ Tasks automatically placed on calendar  
✅ Two-way Google Calendar sync  
✅ Manual override capabilities

### Success Metrics

- Algorithm handles 100+ tasks
- Scheduling completes in < 5 seconds
- Users find auto-scheduled times acceptable 80%+ of the time
- Zero data loss in Google sync

---

## Phase 3: Custom Workflows

**Duration:** 3 weeks  
**Status:** 🔵 Not Started

### Objectives

- Implement default workflow states
- Enable custom state creation
- Build automatic state transition engine
- Integrate workflow with scheduling

### Tasks

#### 3.1 Workflow Data Model

- [ ] Design `workflow_states` table
- [ ] Design `workflow_transitions` table
- [ ] Design `state_conditions` table
- [ ] Implement state history tracking
- [ ] Create default workflow seed data

**Acceptance:** Database supports workflows with states and transitions

#### 3.2 Default Workflow Implementation

- [ ] Create default states (Backlog, Ready, In Progress, Review, Done)
- [ ] Assign colors and icons to states
- [ ] Implement state display in UI
- [ ] Add state selector to task forms
- [ ] Show state in calendar view (color coding)

**Acceptance:** Tasks have states, visible throughout UI

#### 3.3 State Management UI

- [ ] Build workflow configuration page
- [ ] State creation form
- [ ] State editing (name, color, properties)
- [ ] State deletion (with safeguards)
- [ ] Drag-and-drop state reordering
- [ ] State preview in task list

**Acceptance:** User can create and manage custom states (max 10)

#### 3.4 Transition Rules Engine

- [ ] Design rules DSL (domain-specific language)
- [ ] Implement condition evaluator (deadline proximity, time in state)
- [ ] Build transition executor
- [ ] Create background job for checking transition conditions
- [ ] Add transition history/audit log
- [ ] Implement rollback for failed transitions

**Acceptance:** Tasks automatically transition based on defined rules

#### 3.5 Transition Configuration UI

- [ ] Build transition rule builder (visual)
- [ ] Condition selector (deadline within X, overdue, time in state)
- [ ] Action selector (change state, update priority, notify)
- [ ] Test/preview transitions
- [ ] Enable/disable individual rules
- [ ] Import/export workflow configurations

**Acceptance:** User can create "if-then" rules for automatic transitions

#### 3.6 Workflow Integration with Scheduling

- [ ] State affects scheduling priority
- [ ] "Urgent" state bumps task priority
- [ ] "Blocked" state removes from scheduling
- [ ] State transitions trigger rescheduling
- [ ] Color-coded calendar based on state
- [ ] Filter calendar view by state

**Acceptance:** Workflow states influence scheduling behavior

#### 3.7 Workflow Templates (Stretch Goal)

- [ ] Define 3-4 common workflow templates
- [ ] Template selection on onboarding
- [ ] Template preview and comparison
- [ ] One-click template application
- [ ] Modify template after selection

**Acceptance:** User can start with pre-built workflow or custom

### Deliverables

✅ Custom workflow states  
✅ Automatic state transitions  
✅ Workflow integrated with scheduling  
✅ Visual workflow configuration

### Success Metrics

- Users create at least 1 custom state
- Automatic transitions work reliably
- Workflow features rated "useful" by 70%+ users

---

## Phase 4: Polish & Optimization

**Duration:** 3 weeks  
**Status:** 🔵 Not Started

### Objectives

- Performance optimization
- Bug fixes and edge cases
- UX improvements
- Documentation

### Tasks

#### 4.1 Performance Optimization

- [ ] Profile and optimize scheduling algorithm
- [ ] Implement caching strategy
- [ ] Optimize database queries (indexes, N+1 problems)
- [ ] Reduce bundle size (code splitting)
- [ ] Optimize Google API calls (batching, rate limiting)
- [ ] Add loading states and skeleton screens

**Acceptance:** All pages load in < 1 second

#### 4.2 Error Handling & Resilience

- [ ] Graceful degradation if Google APIs unavailable
- [ ] Retry logic for failed API calls
- [ ] User-friendly error messages
- [ ] Offline mode basics (show cached data)
- [ ] Data consistency checks
- [ ] Backup and restore functionality

**Acceptance:** App handles network failures gracefully

#### 4.3 UX Improvements

- [ ] Keyboard shortcuts for power users
- [ ] Improved mobile responsiveness
- [ ] Onboarding tutorial/tour
- [ ] Empty states and helpful prompts
- [ ] Improved visual hierarchy
- [ ] Accessibility audit (WCAG AA)

**Acceptance:** New user can accomplish key tasks without guidance

#### 4.4 Testing & Quality

- [ ] Unit test coverage > 70%
- [ ] E2E tests for critical paths
- [ ] Google integration tests
- [ ] Scheduling algorithm tests (edge cases)
- [ ] Security audit
- [ ] Load testing (100+ tasks)

**Acceptance:** Test suite catches regressions, runs in < 5 minutes

#### 4.5 Documentation

- [ ] User guide (how to use features)
- [ ] API documentation (if exposing APIs)
- [ ] Architecture documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Video tutorials/demos

**Acceptance:** Documentation allows new users to self-onboard

#### 4.6 Bug Bash & Edge Cases

- [ ] Internal testing with 10+ users
- [ ] Fix reported bugs (prioritize critical)
- [ ] Handle edge cases (timezone changes, DST, etc.)
- [ ] Test with large task lists (500+ tasks)
- [ ] Test with multiple calendars
- [ ] Stress test Google sync

**Acceptance:** No critical bugs, < 5 minor bugs remaining

### Deliverables

✅ Performant, polished application  
✅ Comprehensive test coverage  
✅ Complete documentation  
✅ Production-ready

### Success Metrics

- All core features < 1 second load time
- Zero critical bugs in production
- User satisfaction > 85%
- Test coverage > 70%

---

## Phase 5: Team Features (Future)

**Duration:** 4 weeks  
**Status:** 🔵 Not Started

### Objectives

- Multi-user support
- Shared calendars and tasks
- Basic collaboration
- Team workflow configurations

### Tasks

#### 5.1 Multi-Tenant Architecture

- [ ] Implement team/workspace model
- [ ] User roles (owner, admin, member)
- [ ] Invitation system
- [ ] Team settings page
- [ ] Per-team billing (future)

#### 5.2 Shared Tasks & Calendars

- [ ] Task assignment
- [ ] Shared task visibility
- [ ] Team calendar view
- [ ] Calendar overlay (multiple users)
- [ ] Task delegation

#### 5.3 Collaboration Features

- [ ] Task comments
- [ ] @mentions
- [ ] Activity feed
- [ ] Notifications (in-app)
- [ ] Email notifications

#### 5.4 Team Workflows

- [ ] Team-level workflow templates
- [ ] Shared workflow configurations
- [ ] Workflow permissions
- [ ] Team-wide state transitions

### Deliverables

✅ Team workspaces  
✅ Shared tasks and calendars  
✅ Basic collaboration

### Success Metrics

- 5+ teams actively using
- Team features rated useful by 70%+ users

---

## Technical Debt & Maintenance

### Ongoing Tasks (Every Sprint)

- Security updates (dependencies)
- Performance monitoring
- Bug triage and fixes
- User feedback review
- Google API changes monitoring

### Future Improvements

- Mobile native apps (React Native)
- Additional integrations (Notion, Asana, etc.)
- AI-powered task estimation
- Advanced analytics
- Public API
- Webhooks

---

## Risk Management Plan

### High-Risk Items

1. **Auto-scheduling algorithm complexity**
   - Mitigation: Start with greedy algorithm, iterate based on user feedback
   - Fallback: Allow manual scheduling if auto fails

2. **Google API rate limits**
   - Mitigation: Implement intelligent caching, batch operations
   - Fallback: Queue sync operations, notify user of delays

3. **Two-way sync conflicts**
   - Mitigation: Timestamp-based conflict resolution, app as source of truth
   - Fallback: User chooses winner in conflict UI

### Medium-Risk Items

1. **Performance with large task lists**
   - Mitigation: Pagination, virtualization, algorithm optimization
2. **Complex workflow configurations confusing users**
   - Mitigation: Excellent defaults, progressive disclosure, templates

---

## Success Criteria by Phase

### Phase 0

- ✅ Can log in and see app shell

### Phase 1

- ✅ Can manage tasks
- ✅ Can see Google Calendar events
- ✅ Working hours configured

### Phase 2

- ✅ Tasks automatically scheduled
- ✅ Changes sync to Google Calendar
- ✅ Can manually adjust schedule

### Phase 3

- ✅ Custom workflow states working
- ✅ Automatic state transitions functioning
- ✅ States influence scheduling

### Phase 4

- ✅ Fast, polished, bug-free
- ✅ Comprehensive documentation
- ✅ Ready for beta users

### Phase 5

- ✅ Teams can collaborate
- ✅ Shared workflows

---

## Timeline Summary

| Phase   | Duration | Cumulative | Key Milestone                 |
| ------- | -------- | ---------- | ----------------------------- |
| Phase 0 | 2 weeks  | Week 2     | Auth + Infrastructure         |
| Phase 1 | 4 weeks  | Week 6     | Task management + Google read |
| Phase 2 | 4 weeks  | Week 10    | Auto-scheduling working       |
| Phase 3 | 3 weeks  | Week 13    | Custom workflows              |
| Phase 4 | 3 weeks  | Week 16    | Production ready              |
| Phase 5 | 4 weeks  | Week 20    | Team features                 |

**Total:** ~20 weeks (~5 months) for full vision

**MVP Launch Target:** End of Phase 2 (Week 10)  
**Public Beta:** End of Phase 4 (Week 16)

---

## Next Steps

1. ✅ Requirements document created
2. ✅ Development plan created
3. ⬜ Architecture document (next)
4. ⬜ Database schema design (next)
5. ⬜ Begin Phase 0 implementation
