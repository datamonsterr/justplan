import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "./TaskList";
import { mockTasks, mockWorkflowStates } from "@/lib/mock-data";

describe("TaskList Component", () => {
  const defaultProps = {
    tasks: mockTasks,
    workflows: mockWorkflowStates,
  };

  it("renders task list with header", () => {
    render(<TaskList {...defaultProps} />);
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your tasks and track progress")
    ).toBeInTheDocument();
  });

  it("displays add task button", () => {
    render(<TaskList {...defaultProps} />);
    expect(screen.getByText("Add Task")).toBeInTheDocument();
  });

  it("calls onAddTask when add button clicked", async () => {
    const onAddTask = vi.fn();
    render(<TaskList {...defaultProps} onAddTask={onAddTask} />);

    await userEvent.click(screen.getByText("Add Task"));
    expect(onAddTask).toHaveBeenCalledTimes(1);
  });

  it("displays search input", () => {
    render(<TaskList {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search tasks...")).toBeInTheDocument();
  });

  it("filters tasks by search query", async () => {
    render(<TaskList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    await userEvent.type(searchInput, "database");

    // Should show only tasks matching "database"
    await waitFor(() => {
      expect(screen.getByText("Design database schema")).toBeInTheDocument();
      expect(
        screen.queryByText("Implement Google Calendar sync")
      ).not.toBeInTheDocument();
    });
  });

  it("displays tasks grouped by workflow state", () => {
    render(<TaskList {...defaultProps} />);

    // Check workflow state headers
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows task count", () => {
    render(<TaskList {...defaultProps} />);
    expect(
      screen.getByText(`Showing ${mockTasks.length} of ${mockTasks.length} tasks`)
    ).toBeInTheDocument();
  });

  it("shows clear filters button when filters applied", async () => {
    render(<TaskList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    await userEvent.type(searchInput, "test");

    expect(screen.getByText("Clear filters")).toBeInTheDocument();
  });

  it("clears filters when clear button clicked", async () => {
    render(<TaskList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    await userEvent.type(searchInput, "test");

    await userEvent.click(screen.getByText("Clear filters"));

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
  });

  it("shows empty state when no tasks match filters", async () => {
    render(<TaskList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search tasks...");
    await userEvent.type(searchInput, "nonexistent task query xyz");

    await waitFor(() => {
      expect(screen.getByText("No tasks found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your filters")
      ).toBeInTheDocument();
    });
  });

  it("calls onEditTask when edit button clicked", async () => {
    const onEditTask = vi.fn();
    render(<TaskList {...defaultProps} onEditTask={onEditTask} />);

    const editButtons = screen.getAllByTestId("edit-button");
    await userEvent.click(editButtons[0]);

    expect(onEditTask).toHaveBeenCalledTimes(1);
    expect(onEditTask).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(String),
      title: expect.any(String),
    }));
  });

  it("calls onDeleteTask when delete button clicked", async () => {
    const onDeleteTask = vi.fn();
    render(<TaskList {...defaultProps} onDeleteTask={onDeleteTask} />);

    const deleteButtons = screen.getAllByTestId("delete-button");
    await userEvent.click(deleteButtons[0]);

    expect(onDeleteTask).toHaveBeenCalledTimes(1);
  });
});
