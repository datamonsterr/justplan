import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDialog } from "./TaskDialog";
import { mockWorkflowStates } from "@/lib/mock-data";

describe("TaskDialog Component", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    workflows: mockWorkflowStates,
    onSave: vi.fn(),
  };

  it("renders create task dialog", () => {
    render(<TaskDialog {...defaultProps} />);
    expect(screen.getByText("Create New Task")).toBeInTheDocument();
    expect(screen.getByText("Add a new task to your workflow")).toBeInTheDocument();
  });

  it("renders edit task dialog when task provided", () => {
    const task = {
      id: "1",
      userId: "user1",
      title: "Test Task",
      description: "Test description",
      estimatedDuration: 60,
      priority: "high" as const,
      workflowState: "Ready",
      isScheduled: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<TaskDialog {...defaultProps} task={task} />);
    expect(screen.getByText("Edit Task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();
  });

  it("displays all form fields", () => {
    render(<TaskDialog {...defaultProps} />);

    expect(screen.getByLabelText("Title *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Duration (minutes) *")).toBeInTheDocument();
    expect(screen.getByLabelText("Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Deadline")).toBeInTheDocument();
  });

  it("calls onSave with form data when submitted", async () => {
    const onSave = vi.fn();
    render(<TaskDialog {...defaultProps} onSave={onSave} />);

    const titleInput = screen.getByLabelText("Title *");
    await userEvent.type(titleInput, "New Task");

    const descriptionInput = screen.getByLabelText("Description");
    await userEvent.type(descriptionInput, "Task description");

    const createButton = screen.getByText("Create");
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Task",
          description: "Task description",
        })
      );
    });
  });

  it("does not submit empty form", async () => {
    const onSave = vi.fn();
    render(<TaskDialog {...defaultProps} onSave={onSave} />);

    const createButton = screen.getByText("Create");
    await userEvent.click(createButton);

    // Form validation should prevent submission
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onOpenChange when cancel clicked", async () => {
    const onOpenChange = vi.fn();
    render(<TaskDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("pre-fills form when editing task", () => {
    const task = {
      id: "1",
      userId: "user1",
      title: "Existing Task",
      description: "Existing description",
      estimatedDuration: 90,
      priority: "medium" as const,
      workflowState: "In Progress",
      deadline: new Date("2024-12-25").toISOString(),
      isScheduled: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<TaskDialog {...defaultProps} task={task} />);

    expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("90")).toBeInTheDocument();
  });

  it("updates button text to Update when editing", () => {
    const task = {
      id: "1",
      userId: "user1",
      title: "Test",
      estimatedDuration: 60,
      priority: "medium" as const,
      workflowState: "Ready",
      isScheduled: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<TaskDialog {...defaultProps} task={task} />);
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.queryByText("Create")).not.toBeInTheDocument();
  });
});
