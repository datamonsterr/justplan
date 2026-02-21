"use client";

import * as React from "react";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

import { TopNavbar } from "@/components/layout/top-navbar";
import { AICopilotSidebar } from "@/components/layout/ai-copilot-sidebar";
import { TaskSidebar } from "@/components/layout/task-sidebar";
import { CalendarView } from "@/components/layout/calendar-view";
import { BottomPanel } from "@/components/layout/bottom-panel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const [bottomPanelOpen, setBottomPanelOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<string | null>(null);
  const [aiSidebarCollapsed, setAiSidebarCollapsed] = React.useState(false);
  const [taskSidebarCollapsed, setTaskSidebarCollapsed] = React.useState(false);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(taskId);
    setBottomPanelOpen(true);
  };

  const handleBottomPanelClose = () => {
    setBottomPanelOpen(false);
    setSelectedTask(null);
  };

  const toggleAiSidebar = () => {
    setAiSidebarCollapsed(!aiSidebarCollapsed);
  };

  const toggleTaskSidebar = () => {
    setTaskSidebarCollapsed(!taskSidebarCollapsed);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Main Content Area - Three column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left AI Copilot Sidebar */}
        <div
          className={cn(
            "h-full border-r bg-card transition-all duration-300",
            aiSidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
          )}
        >
          <AICopilotSidebar />
        </div>

        {/* Center Calendar Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Toggle buttons for sidebars */}
          <div className="absolute left-2 top-2 z-30 flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleAiSidebar}
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              title={aiSidebarCollapsed ? "Show AI Copilot" : "Hide AI Copilot"}
            >
              {aiSidebarCollapsed ? (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          
          <div className="absolute right-2 top-2 z-30 flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTaskSidebar}
              className="h-7 w-7 bg-background/80 backdrop-blur-sm"
              title={taskSidebarCollapsed ? "Show Tasks" : "Hide Tasks"}
            >
              {taskSidebarCollapsed ? (
                <PanelRightOpen className="h-3.5 w-3.5" />
              ) : (
                <PanelRightClose className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="absolute inset-0">
            <CalendarView onTaskSelect={handleTaskSelect} />
          </div>
          
          {/* Bottom Panel - Auto-hide */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 z-40 border-t bg-card shadow-lg transition-transform duration-300 ease-in-out",
              bottomPanelOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={{ height: bottomPanelOpen ? "240px" : "0" }}
          >
            <BottomPanel
              taskId={selectedTask}
              onClose={handleBottomPanelClose}
            />
          </div>
        </div>

        {/* Right Task Sidebar */}
        <div
          className={cn(
            "h-full border-l bg-card transition-all duration-300",
            taskSidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
          )}
        >
          <TaskSidebar onTaskSelect={handleTaskSelect} />
        </div>
      </div>
    </div>
  );
}
