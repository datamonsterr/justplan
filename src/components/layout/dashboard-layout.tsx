"use client";

import * as React from "react";

import { TopNavbar } from "@/components/layout/top-navbar";
import { AICopilotSidebar } from "@/components/layout/ai-copilot-sidebar";
import { TaskSidebar } from "@/components/layout/task-sidebar";
import { CalendarView } from "@/components/layout/calendar-view";
import { BottomPanel } from "@/components/layout/bottom-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const [bottomPanelOpen, setBottomPanelOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<string | null>(null);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTask(taskId);
    setBottomPanelOpen(true);
  };

  const handleBottomPanelClose = () => {
    setBottomPanelOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Navbar - Ultra-thin 36px */}
      <TopNavbar />

      {/* Main Content Area - IDE-inspired layout */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          {/* Left AI Copilot Sidebar */}
          <ResizablePanel
            defaultSize={22}
            minSize={18}
            maxSize={35}
            className="min-w-0"
          >
            <AICopilotSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Calendar Area */}
          <ResizablePanel defaultSize={48} minSize={35} className="min-w-0">
            <div className="relative h-full">
              <CalendarView onTaskSelect={handleTaskSelect} />
              
              {/* Bottom Panel - Auto-hide */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 border-t bg-card shadow-lg transition-transform duration-300 ease-in-out",
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
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Task Sidebar */}
          <ResizablePanel
            defaultSize={30}
            minSize={25}
            maxSize={40}
            className="min-w-0"
          >
            <TaskSidebar onTaskSelect={handleTaskSelect} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
