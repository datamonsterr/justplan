# Plan: Refactor UI Documentation with AI Copilot Vision (Updated)

The current [06-ui.md](docs/06-ui.md) is incomplete and misaligned with the project's comprehensive requirements in [01-requirements.md](docs/01-requirements.md). Based on your clarifications, you want an **IDE-inspired layout** with a **left AI copilot sidebar** (with tool access to CRUD tasks and calendar), **syntax-based task input** for MVP, **productivity-focused color palette** (calm + alerts), and **time blocks showing solid for scheduled, dotted for AI-suggested** tasks. Subtasks under 30 minutes won't display individually in the calendar, but the parent task will show subtask count. You also want a **comprehensive Settings page** with workflow visual editor (drag-drop state diagram builder), import/export functionality, and left sidebar navigation. Both the UI document and requirements doc need updating.

**Key Decisions from Discussion:**
- Layout: IDE-inspired (left AI sidebar, right task sidebar, center calendar, bottom auto-hide panel)
- AI Copilot: Chat interface with tool access to manage tasks, find calendar slots, modify workflows (JSON-configurable)
- Task Input: Syntax parser with autocomplete (MVP feature)
- Color Style: Productivity-focused (Reclaim.ai-like: calm backgrounds, bright urgency alerts, soft states)
- Subtask Display: Hide <30min subtasks from calendar, show count indicator on parent
- Time Block Visual: Solid background for scheduled, dotted background for AI-suggested
- Workflow Management: JSON-based with visual editor, import/export, shareable templates
- Settings Layout: Left sidebar navigation + search + right content area
- Scope: Rewrite 06-ui.md completely + update 01-requirements.md with new UI features

**Steps:**

1. **Analyze UX Requirements with Persona & Journey Mapping**
   - Use AI to identify user archetypes (busy professionals, students, project managers)
   - Map key user journeys: task creation via syntax, AI copilot interaction, calendar rescheduling, **workflow customization**
   - Document pain points from traditional calendar apps that JustPlan solves
   - Define usability metrics (task creation <30s, calendar navigation 1-click, AI response <2s, **workflow export <5s**)
   - Create cognitive load analysis for IDE-inspired layout (justify panel placement)

2. **Generate Design System using UI/UX Pro Max**
   - Run `python3 .github/skills/ui-ux-pro-max/scripts/search.py "productivity saas calendar time management" --design-system -p "JustPlan"`
   - Extract:
     - Color palette recommendation (productivity-focused: calm + alerts)
     - Typography pairings (readable for task lists + elegant for headings)
     - UI style (likely Modern Minimalist or Productivity-focused)
     - Spacing and layout tokens
     - Animation timing for transitions
   - Document accessibility requirements (WCAG 2.1 AA compliance)
   - Define z-index scale for panels (navbar: 50, modals: 40, sidebars: 30, bottom panel: 20)

3. **Design Calendar Visual System**
   - **Time Block Differentiation:**
     - Scheduled (confirmed): Solid background color based on workflow state
     - AI-suggested (flexible): Dotted/dashed background pattern, lighter opacity
     - Pinned (fixed): Border indicator + lock icon
     - Blocked (external): Striped pattern with muted color
   - **Workflow State Colors:**
     - Backlog: Gray (#71717A)
     - Ready: Blue (#3B82F6)
     - In Progress: Orange (#F97316)
     - Blocked: Red (#EF4444)
     - Review: Purple (#A855F7)
     - Done: Green (#10B981)
   - **Visual Hierarchy:**
     - High priority: Bold border + brighter color
     - Subtask indicator: Small badge with count (e.g., "3 subtasks")
     - Duration display: Show estimated time on block
     - Overflow handling: "..." truncation + hover tooltip
   - Define hover states, drag preview, drop zones

4. **Specify Task Input Syntax Parser**
   - **Syntax Specification:**
     ```
     <task name> [duration:min-max:typeOfHour:after datetime to datetime]
     
     Components:
     - task name: Free text (required)
     - duration: e.g., 1hr, 30m, 2.5hr (required)
     - min-max: Range like 30m-2hr (optional, defaults to duration±25%)
     - typeOfHour: Working hour / Focus time / Any time (optional, from user settings)
     - after datetime to datetime: Scheduling window (optional, defaults to ASAP to deadline)
     
     Examples:
     - "Review PR [45m]"
     - "Write proposal [2hr:1hr-3hr:Focus time]"
     - "Call client [30m:Any time:after 9AM 2/20 to 5PM 2/21]"
     ```
   - **Autocomplete Behavior:**
     - On `[`, show inline gray suggestion: `[duration:min-max:typeOfHour:after start to end]`
     - As user types each segment, suggestion updates
     - Dropdown suggestions below input:
       - duration: 15m, 30m, 45m, 1hr, 1.5hr, 2hr, 3hr, 4hr
       - typeOfHour: Load from user working hours settings
       - datetime: Calendar picker + natural language ("tomorrow", "next week")
     - Tab key advances to next segment
     - Parser validates on blur, shows errors inline
   - **Form Fallback:** Button to switch to traditional form if syntax is confusing

5. **Design AI Copilot Sidebar (Left Panel)**
   - **Layout:**
     - Chat interface with message bubbles (user vs assistant)
     - Input field at bottom with "Ask AI..." placeholder
     - Tool execution indicators (loading states, success/error badges)
     - Collapsible to icon-only mode (hamburger menu)
   - **Capabilities to Highlight:**
     - "Find me 30 minutes for a meeting tomorrow morning"
     - "Create a task: Finish report [2hr:Focus time:before Feb 25]"
     - "Show tasks due this week"
     - "Move all 'Blocked' tasks to next week"
     - "Update workflow: add 'QA' state after 'Review'"
     - **"Export my workflow as JSON"**
     - **"Import workflow template: Kanban"**
   - **Tool Access Indicators:**
     - Show which tool is being called (e.g., 🗓️ Checking calendar, ✏️ Creating task, ⚙️ Modifying workflow)
     - Display results inline (e.g., "Found 3 slots: 9-9:30 AM, 2-2:30 PM, 4-4:30 PM")
     - Offer quick actions (buttons to accept/reject AI suggestions)
   - **Workflow JSON Configuration:**
     - AI can read/write workflow states via JSON structure
     - Example: `{"states": [{"name": "Backlog", "color": "#71717A", "transitions": [...]}]}`
     - Provide examples in UI doc for common modifications

6. **Design Bottom Panel (Time Block Details)**
   - **Trigger:** Click on any time block in calendar
   - **Layout:**
     - Auto-hide (slides up from bottom)
     - Shows task title, description, workflow state badge, priority badge
     - Subtask list with progress checkboxes (if parent task)
     - Actions: Edit, Delete, Reschedule, Pin, Mark as Done, AI Breakdown
     - Drag handle to resize panel height
   - **Subtask Display:**
     - Indented list with duration estimates
     - Checkbox to mark complete (updates parent progress %)
     - Reorder via drag-and-drop
     - Dependencies shown with arrow icon (e.g., "Depends on: Task A")
   - **Quick Edit:**
     - Inline editing for title, description, duration
     - Dropdown for workflow state change
     - Date/time pickers for rescheduling

7. **Design Navigator Top Navbar**
   - **Ultra-Thin Design (40px height):**
     - Left: "Current Task" button (shows top-priority task in progress)
     - Center: Global search bar (searches tasks, calendar events, AI chat history)
     - Right: Avatar + dropdown (Settings, Working Hours, Logout)
   - **Search Behavior:**
     - Live results dropdown
     - Categories: Tasks, Events, Past Conversations
     - Keyboard shortcuts (Cmd+K / Ctrl+K)
   - **Current Task Button:**
     - Shows title + elapsed time
     - Click to jump to task in calendar or task list
     - Status indicator (green dot = in progress)
   - **Avatar Dropdown Menu:**
     - Profile section: Avatar, name, email
     - Quick actions: Settings (opens Settings page), Keyboard Shortcuts
     - Theme toggle: Light/Dark mode switcher
     - Account: Logout button

8. **Design Right Task Sidebar**
   - **Layout:**
     - "Add New Task" button at top (opens syntax input or form)
     - Grouped by workflow states (collapsible sections)
     - Search + filters (priority, deadline, duration, state)
     - Subtask indentation with tree lines
   - **Task Card Design:**
     - Title (truncated with tooltip on hover)
     - Duration badge + priority dot
     - Deadline indicator (turns red if <24 hours)
     - Workflow state badge
     - If parent: Subtask count indicator
     - Drag handle for reordering
   - **Interactions:**
     - Click to open in bottom panel
     - Drag to reorder or change state (Kanban-style)
     - Right-click for context menu (Edit, Duplicate, AI Breakdown, Delete)

9. **Design Settings Page Layout**
   - **Access:** Click avatar dropdown → Settings (opens full-page modal or route to `/settings`)
   - **Three-Column Layout:**
     - **Left Sidebar (200px wide):**
       - Search bar at very top (filters settings sections)
       - Navigation menu:
         - 🔧 General
         - 🎨 Appearance
         - 👤 Account & Profile
         - 🔄 Workflow Configuration
         - ⏰ Working Hours
         - 🔔 Notifications
         - 🔗 Integrations (Google Calendar, Tasks)
         - ⌨️ Keyboard Shortcuts
         - 📦 Data & Privacy (Export data, Delete account)
       - Active section highlighted with accent color background
       - Icons + labels for each section
     - **Main Content Area (right side, fills remaining space):**
       - Section title + description at top
       - Form fields, toggles, buttons, visual editors
       - Save buttons fixed at bottom of each section
     - **Top Bar (spans full width):**
       - "Settings" title on left
       - Breadcrumb if in subsection (e.g., "Settings / Workflow / Edit State")
       - Close button (X) on right to return to dashboard
   - **Search Functionality:**
     - Filters settings sections in left sidebar as user types
     - Shows matching sections + highlights matching keywords in content
     - Example: Search "dark" → highlights "Appearance" section + "Dark mode" toggle

10. **Design Workflow Configuration Section (Settings)**
    - **Two Views (Tab Switcher at top):**
      - **Visual Editor Tab** (default)
      - **JSON Editor Tab** (advanced users)
      - **Templates Tab** (import/export)
    
    - **Visual Editor Tab - State Diagram Builder:**
      - **Canvas Area (center):**
        - Drag-drop canvas with grid background (subtle dots)
        - State nodes displayed as rounded rectangles with:
          - State name (editable inline)
          - Color picker dot (click to change)
          - Handle dots on edges (for drawing transitions)
        - Transition arrows between states with labels
        - Zoom controls (bottom-right): +/- buttons, reset, fit to screen
        - Minimap (bottom-left corner) for navigation
      - **Toolbar (top of canvas):**
        - "Add State" button (creates new node)
        - "Auto Layout" button (arranges nodes neatly)
        - "Undo/Redo" buttons
        - "Save" button (saves to database)
      - **Side Panel (right, 300px, slides in when node selected):**
        - State Properties:
          - Name input
          - Color picker (with preset palette)
          - Description textarea
          - Icon selector (optional badge icon)
        - Transitions:
          - List of outgoing transitions
          - "Add Transition" button
          - For each transition:
            - Target state dropdown
            - Condition builder (Time-based, Priority-based, Duration-based)
            - Example: "If deadline within 3 days → Move to Urgent"
      - **Interaction Behaviors:**
        - Click node to select (shows properties in side panel)
        - Drag node to reposition
        - Drag from handle dot to another node to create transition
        - Click arrow to edit transition conditions
        - Double-click node name to rename inline
        - Right-click node for context menu (Duplicate, Delete, Set as Default)
        - Drag to canvas to pan, scroll to zoom
      - **Default States (pre-populated on first use):**
        - Backlog → Ready → In Progress → Review → Done
        - Blocked state (can transition from any state)
    
    - **JSON Editor Tab:**
      - **Monaco Editor (VS Code editor component):**
        - Syntax highlighting for JSON
        - Auto-formatting on paste
        - Validation errors inline
        - Line numbers
      - **Schema Example Shown Above Editor:**
        ```json
        {
          "version": "1.0",
          "states": [
            {
              "id": "backlog",
              "name": "Backlog",
              "color": "#71717A",
              "description": "Tasks to be prioritized",
              "isDefault": true,
              "transitions": [
                {
                  "to": "ready",
                  "conditions": [
                    {
                      "type": "deadline_proximity",
                      "value": 7,
                      "unit": "days",
                      "operator": "less_than"
                    }
                  ]
                }
              ]
            }
          ]
        }
        ```
      - **Actions:**
        - "Validate" button (checks JSON schema)
        - "Format" button (prettify JSON)
        - "Import from File" button (upload .json)
        - "Save" button (applies changes)
    
    - **Templates Tab:**
      - **Template Library (grid layout):**
        - Pre-built workflow templates:
          - "Kanban" (To Do → In Progress → Done)
          - "Software Development" (Backlog → Dev → QA → Review → Deploy → Done)
          - "GTD (Getting Things Done)" (Inbox → Next Actions → Waiting → Someday → Done)
          - "Academic" (Assigned → Research → Draft → Review → Submit → Graded)
          - "Freelance" (Inquiry → Proposal → Active → Review → Complete → Invoiced)
        - Each template card shows:
          - Template name + description
          - Visual preview (miniature state diagram)
          - "Preview" button (shows full diagram in modal)
          - "Use Template" button (loads into editor, replaces current)
      - **Import/Export Section:**
        - "Export Current Workflow" button:
          - Downloads JSON file: `justplan-workflow-YYYY-MM-DD.json`
          - Option to include transition history data
        - "Import Workflow" button:
          - File upload (accepts .json)
          - Validation before import
          - Option: "Replace" or "Merge" with existing workflow
        - **Share Workflow (future):**
          - Generate shareable link (read-only)
          - Option to publish to community templates

11. **Design Appearance Section (Settings)**
    - **Theme Selector:**
      - Radio buttons: Light, Dark, System (auto)
      - Live preview thumbnail for each theme
    - **Color Accent Picker:**
      - Preset colors matching workflow state palette
      - Custom color picker (advanced)
    - **Font Size:**
      - Slider: Small (12px), Medium (14px), Large (16px), Extra Large (18px)
      - Live preview of task card
    - **Density:**
      - Compact, Comfortable, Spacious (affects padding/spacing)
    - **Calendar View Preferences:**
      - Default view: Day/Week/Month dropdown
      - Week starts on: Sunday/Monday dropdown
      - Show weekends: Toggle

12. **Design Working Hours Section (Settings)**
    - **Weekly Schedule Builder:**
      - 7-day grid (Monday-Sunday rows)
      - Each day has:
        - Active toggle (off = no working hours)
        - Time range sliders or inputs: Start time, End time
        - "Add Break" button (lunch break, etc.)
      - Visual timeline preview (24-hour bar with colored working hours)
    - **Presets:**
      - "9-5 Weekdays" button
      - "Flexible Hours" button
      - "Student Schedule" button (shorter blocks)
    - **Focus Time Configuration:**
      - Define "Deep Work" hours (e.g., 9-11 AM daily)
      - Buffer time between tasks slider (5-30 minutes)
    - **Save & Apply:** Button at bottom

13. **Design Integrations Section (Settings)**
    - **Google Calendar:**
      - Connection status indicator (Connected / Not Connected)
      - "Connect Google Account" button (OAuth flow)
      - Sync settings:
        - Sync direction: Two-way / One-way (JustPlan → Google) / One-way (Google → JustPlan)
        - Sync interval: Real-time / Every 5 min / Every 15 min
        - Calendar selection: Dropdown of Google calendars to sync with
      - "Disconnect" button
    - **Google Tasks:**
      - Similar connection flow and settings
    - **Webhook URL (advanced):**
      - Input field for custom webhook on task completion

14. **Specify Drag-to-Resize Behavior**
    - **Resizable Panels:**
      - Left AI sidebar: 250px (min) - 500px (max), default 320px
      - Right task sidebar: 300px (min) - 600px (max), default 400px
      - Bottom panel: 200px (min) - 60% viewport (max), default 300px
      - Settings left sidebar: 200px fixed (not resizable for consistency)
    - **Drag Handles:**
      - Vertical handles between panels (4px width, hover increases to 8px)
      - Cursor changes to `col-resize` or `row-resize`
      - Double-click handle to reset to defaults
    - **Responsive Behavior:**
      - On tablet (<1024px): Sidebars collapse to icon-only, expand on click
      - On mobile (<768px): Full-screen views with bottom tab navigation

15. **Document Accessibility & Performance Requirements**
    - **Accessibility:**
      - WCAG 2.1 AA compliance (4.5:1 contrast ratios)
      - Keyboard navigation: Tab order, Arrow keys for calendar + workflow canvas navigation
      - Screen reader support: aria-labels for all interactive elements, workflow editor announces node selection
      - Focus indicators: 2px ring with accent color
      - Settings search keyboard shortcut: Cmd+Shift+, (or Ctrl+Shift+,)
    - **Performance:**
      - Calendar renders <1s for 100 tasks
      - Drag-and-drop <16ms frame time (60fps) for task cards and workflow nodes
      - AI copilot response streaming (start <500ms, complete <3s)
      - Lazy load task list (virtualized scrolling for >50 tasks)
      - Settings page loads <500ms
      - Workflow canvas handles 10-15 states without lag
    - **Animations:**
      - Panel resize: No animation (immediate for performance)
      - Task state transitions: 200ms ease-in-out
      - Bottom panel slide: 250ms ease-out
      - Hover states: 150ms ease-in-out
      - Settings section transitions: 300ms ease-in-out

16. **Create Mermaid Diagrams for Visual Documentation**
    - **Layout Structure Diagram** (flowchart showing panel relationships)
    - **Task Input Syntax Diagram** (railroad diagram or flowchart)
    - **User Journey for Task Creation** (sequence diagram)
    - **Calendar Time Block State Diagram** (state transitions: suggested → scheduled → completed)
    - **AI Copilot Interaction Flow** (sequence diagram)
    - **Workflow State Diagram Example** (shows default Kanban workflow with transitions)
    - **Settings Navigation Flowchart** (sections and their sub-pages)
    - Embed these diagrams in the rewritten [06-ui.md](docs/06-ui.md)

17. **Rewrite [06-ui.md](docs/06-ui.md) with Complete Specifications**
    - Structure:
      - Overview & Design Philosophy
      - Design System (colors, typography, spacing)
      - Layout Architecture (with Mermaid diagrams)
      - Component Specifications:
        - Top Navbar
        - Left AI Copilot Sidebar
        - Center Calendar Area
        - Right Task Sidebar
        - Bottom Panel
        - Settings Page (all sections detailed)
      - Interactions & Behaviors
      - Accessibility & Performance
      - Implementation Notes (technical constraints, libraries suggested)
    - Include code examples for:
      - Syntax parser (TypeScript parsing logic)
      - Workflow JSON schema (Zod validation)
      - Monaco Editor integration for JSON editing
    - Reference Shadcn UI components to use:
      - Dialog, Tabs, Select, Input, Textarea, Button, Badge, Card, Dropdown Menu
      - Custom components needed: Canvas, State Node, Transition Arrow
    - Link to Mermaid diagrams throughout

18. **Update [01-requirements.md](docs/01-requirements.md) with New UI Features**
    - Add sections:
      - **FR-09: AI Copilot Interface** (chat with tool access, workflow commands)
      - **FR-10: Syntax-Based Task Input** (parser with autocomplete, grammar spec)
      - **FR-11: IDE-Inspired Layout** (resizable panels specification, responsive breakpoints)
      - **FR-12: Enhanced Calendar Visualization** (solid vs dotted blocks, subtask indicators, color system)
      - **FR-13: Visual Workflow Editor** (drag-drop state diagram builder, import/export, templates)
      - **FR-14: Comprehensive Settings System** (sections: general, appearance, account, workflow, working hours, integrations)
      - **FR-15: Workflow Import/Export** (JSON format, template library, sharing capability)
    - Update non-functional requirements:
      - UI responsiveness targets (calendar <1s, settings <500ms, workflow editor 60fps)
      - Accessibility compliance (WCAG 2.1 AA, keyboard navigation for all features)
      - Animation performance budgets (16ms frame time, smooth 60fps)
    - Add workflow transition rules section with condition types:
      - Time-based (deadline proximity, time in state)
      - Priority-based (priority level changes)
      - Duration-based (estimated duration thresholds)
      - Manual (user-triggered state changes)
    - Add workflow JSON schema specification with example

19. **Update [02-development-plan.md](docs/02-development-plan.md) with New Phase Breakdown**
    - **Phase 1 additions:**
      - Settings page UI implementation (left sidebar nav, sections)
      - Workflow visual editor (canvas, state nodes, transitions UI)
      - Workflow JSON import/export functionality
      - Task syntax parser with autocomplete
    - **Phase 2 additions:**
      - AI Copilot backend integration (tool access to workflow CRUD)
      - Workflow template library (pre-built workflows)
      - Workflow sharing/publishing feature
    - Update testing requirements for new features:
      - E2E tests: Syntax parser edge cases, workflow editor interactions
      - Unit tests: JSON schema validation, syntax tokenizer
      - Integration tests: Workflow import/export, settings persistence

**Verification:**

- [06-ui.md](docs/06-ui.md) is complete (no cut-off sections), comprehensive (all UI elements specified including Settings page and workflow editor), and professionally structured
- [01-requirements.md](docs/01-requirements.md) includes new UI features (FR-09 through FR-15) with functional requirements and acceptance criteria
- [02-development-plan.md](docs/02-development-plan.md) updated with new implementation tasks for Phase 1 and Phase 2
- Design system is based on actual UI/UX Pro Max recommendations (not guessed)
- All Mermaid diagrams render correctly (8 diagrams total)
- Syntax parser specification is implementable (clear grammar, edge cases handled, autocomplete logic defined)
- Workflow JSON schema is valid and includes Zod validation example
- Workflow visual editor is implementable (drag-drop library suggestions: React Flow or Xyflow, or custom canvas implementation)
- Color palette provides sufficient contrast (WCAG AA compliant) for all workflow states
- Layout is responsive (breakpoints defined for tablet/mobile, Settings page adapts)
- Settings sections are comprehensive (9 sections: General, Appearance, Account, Workflow, Working Hours, Notifications, Integrations, Keyboard Shortcuts, Data & Privacy)

**Decisions:**
- **Chose IDE-inspired layout over standard dashboard** - Aligns with power user needs, reduces context switching
- **Chose syntax input as MVP feature over deferred** - Faster task creation, reduces clicks (3 clicks → 1 input)
- **Chose productivity-focused color palette** - Balances calm (reduces stress) with urgency alerts (prevents missed deadlines)
- **Chose subtask count indicator over full subtask display in calendar** - Reduces visual clutter, maintains scannable calendar
- **Chose visual workflow editor with JSON fallback** - Accessible to non-technical users, power users get JSON control
- **Chose template library for workflows** - Reduces setup time, showcases best practices, enables sharing
- **Chose Monaco Editor for JSON editing** - Industry-standard editor (VS Code), syntax highlighting, validation
- **Chose full Settings page over in-place editing** - Centralized configuration, easier to discover features, consistent UX

---

This expanded plan creates a **comprehensive, implementable UI specification** that includes the Settings system and visual workflow editor. The workflow management features (import/export, templates, drag-drop editor) make JustPlan highly customizable while remaining accessible to non-technical users.
