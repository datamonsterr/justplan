# JustPlan Documentation

> **Intelligent time management with customizable workflows**

Welcome to the JustPlan project documentation! This folder contains comprehensive design documents to guide the development of JustPlan from concept to production.

---

## 📚 Document Overview

### [01. Requirements](./01-requirements.md)
**Complete feature specifications and project scope**

- Executive summary and value proposition
- Target users and success criteria
- Detailed feature breakdown:
  - Calendar management & working hours
  - Task management with Google integration
  - Customizable workflow states (the killer feature!)
  - Automatic scheduling engine
  - Two-way Google Calendar/Tasks sync
- Non-functional requirements (performance, security, scalability)
- Out-of-scope items for MVP
- Risks and mitigations

**Read this first** to understand what we're building and why.

---

### [02. Development Plan](./02-development-plan.md)
**Phased roadmap with actionable tasks**

- **Phase 0** (Week 1-2): Foundation & infrastructure setup
- **Phase 1** (Week 3-6): MVP core - task CRUD + Google read integration
- **Phase 2** (Week 7-10): Auto-scheduling engine
- **Phase 3** (Week 11-13): Custom workflows with automatic transitions
- **Phase 4** (Week 14-16): Polish, optimization, production readiness
- **Phase 5** (Week 17-20): Team collaboration features

Each phase includes:
- Objectives and deliverables
- Detailed task breakdowns
- Acceptance criteria
- Success metrics

**Use this** to track progress and understand what to build next.

---

### [03. Architecture](./03-architecture.md)
**System design and technical decisions**

- High-level architecture diagrams
- Complete tech stack:
  - Frontend: Next.js 14+, React, TypeScript, Tailwind, Shadcn UI
  - Backend: Next.js API, Supabase (PostgreSQL + Auth)
  - Infrastructure: Vercel, Upstash Redis, Google APIs
- Detailed component layer descriptions
- Authentication, data flow, and scheduling engine architecture
- Google integration patterns (two-way sync)
- Architectural Decision Records (ADRs)
- Security, performance, and monitoring strategies
- Deployment architecture and cost estimates

**Reference this** when making technical decisions or onboarding engineers.

---

### [04. Database Schema](./04-database-schema.md)
**Complete data model and SQL definitions**

- Entity Relationship Diagram (ERD)
- Detailed table definitions with constraints
- Row-Level Security (RLS) policies for multi-tenancy
- Database functions and triggers
- Useful queries for common operations
- Migration strategy
- Performance optimization indexes
- Backup and recovery procedures

**Use this** when implementing database migrations or writing queries.

---

### [05. Test Plan](./05-test-plan.md)
**Comprehensive testing strategy and test cases**

- Test pyramid approach (70% Unit, 20% Integration, 10% E2E)
- Detailed unit test specifications for:
  - Scheduling algorithm
  - Workflow engine
  - Utility functions
  - React hooks
- Integration tests for:
  - Database operations
  - Google API integration
  - API routes
- E2E tests for critical user flows:
  - Authentication
  - Task management
  - Auto-scheduling
  - Workflow transitions
  - Google integration
- Manual testing agent (Chrome MCP)
- Test fixtures and seed data
- CI/CD test automation

**Use this** when writing tests or setting up test infrastructure.

---

## 🚀 Quick Start

### For Project Stakeholders
1. Read [Requirements](./01-requirements.md) - understand the vision
2. Review [Development Plan](./02-development-plan.md) - see the roadmap
3. Check timeline (20 weeks total, MVP at week 10)

### For Developers
1. Review [Architecture](./03-architecture.md) - understand the system design
2. Study [Database Schema](./04-database-schema.md) - learn the data model
3. Follow [Development Plan](./02-development-plan.md) - execute phase by phase

### To Begin Implementation
1. Set up development environment (see Phase 0 in Development Plan)
2. Create Supabase project
3. Apply database migrations (from Database Schema doc)
4. Initialize Next.js project
5. Start with Phase 0 tasks

---

## 🎯 Project Vision

**JustPlan** enhances the Reclaim.ai concept by adding **customizable Jira-like workflow states** to task management. Instead of just "To-Do" vs "Done", users can define states like:

- Backlog → Ready → In Progress → Review → Done
- With automatic transitions based on conditions (deadline proximity, overdue, time in state)

This provides the benefits of automatic scheduling (like Reclaim.ai) with the flexibility of custom workflows (like Jira), all integrated seamlessly with Google Calendar and Tasks.

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────┐
│    Next.js 14 (App Router)              │
│    - Server Components                   │
│    - Server Actions                      │
│    - React Client Components            │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────────┐
│Supabase│ │Schedule│ │ Google   │
│ ─ Auth │ │ Engine │ │ APIs     │
│ ─ DB   │ │ ─ Redis│ │ ─Calendar│
│ ─ RLS  │ │ ─ Queue│ │ ─ Tasks  │
└──────┘  └──────┘  └──────────┘
```

---

## 📊 Key Metrics & Success Criteria

### MVP Success (End of Phase 2)
- ✅ User can create and manage 50+ tasks
- ✅ Tasks automatically scheduled on calendar
- ✅ Two-way Google sync working reliably
- ✅ Scheduling algorithm handles 100+ tasks in < 5 seconds

### Production Ready (End of Phase 4)
- ✅ 10 beta users using daily for 2+ weeks
- ✅ 90%+ satisfaction with auto-scheduling
- ✅ Zero critical bugs
- ✅ Custom workflows rated "useful" by 70%+ users

---

## 🛠️ Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend** | Next.js API, Supabase (PostgreSQL), BullMQ (job queue) |
| **Infrastructure** | Vercel (hosting), Upstash Redis, Google APIs |
| **DevOps** | GitHub Actions, Vitest, Playwright, ESLint |

---

## 📅 Timeline

| Phase | Duration | End Date | Milestone |
|-------|----------|----------|-----------|
| Phase 0 | 2 weeks | Week 2 | Infrastructure ready |
| Phase 1 | 4 weeks | Week 6 | Task management + Google read |
| Phase 2 | 4 weeks | Week 10 | **MVP Launch** (auto-scheduling) |
| Phase 3 | 3 weeks | Week 13 | Custom workflows |
| Phase 4 | 3 weeks | Week 16 | **Public Beta** |
| Phase 5 | 4 weeks | Week 20 | Team features |

**Total:** ~5 months from start to full vision

---

## 🔐 Security & Privacy

- **Authentication:** Google OAuth via Supabase Auth
- **Multi-tenancy:** Row-Level Security (RLS) in PostgreSQL
- **Encryption:** TLS in transit, encryption at rest (Supabase)
- **Data Isolation:** Users can only access their own data
- **Token Security:** Google tokens stored encrypted, never exposed to client

---

## 💰 Estimated Costs

**Monthly operating costs (100 users):**
- Vercel: $0-20
- Supabase: $0-25
- Upstash Redis: $0
- Domain: $10
- **Total: $10-55/month**

Scales comfortably to 1,000 users before major infrastructure changes needed.

---

## 📖 Additional Resources

### Internal Links
- [Requirements](./01-requirements.md)
- [Development Plan](./02-development-plan.md)
- [Architecture](./03-architecture.md)
- [Database Schema](./04-database-schema.md)
- [Test Plan](./05-test-plan.md)

### External References
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Google Tasks API](https://developers.google.com/tasks)

---

## 🤝 Contributing

When ready to implement:
1. Create a new branch for your phase/feature
2. Follow the task breakdown in the Development Plan
3. Write tests before implementation (TDD)
4. Commit frequently with clear messages
5. Open PR when phase is complete

---

## 📝 Document Maintenance

These documents are living artifacts. Update them when:
- Requirements change or new features are prioritized
- Architectural decisions are made (add new ADRs)
- Database schema is modified (update migrations)
- Phases are completed (mark progress in Development Plan)

**Last Updated:** February 17, 2026  
**Version:** 1.0  
**Status:** ✅ Planning Complete, Ready for Implementation

---

## ✨ What Makes JustPlan Special

1. **Customizable Workflows** - Define your own task states and automatic transitions
2. **Automatic Scheduling** - Let the app figure out when to work on what
3. **Google Integration** - Works seamlessly with your existing tools
4. **Personal → Team** - Start solo, grow to team collaboration
5. **Open & Extensible** - Built to adapt to your workflow, not the other way around

Let's build something great! 🚀
