import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskCard } from "./TaskCard";

describe("TaskCard Component", () => {
  const defaultProps = {
    title: "Test Task",
    duration: 60,
    priority: "medium" as const,
  };

  it("should render task title and duration", () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.getByTestId("task-title")).toHaveTextContent("Test Task");
    expect(screen.getByTestId("task-duration")).toHaveTextContent("60m");
  });

  it("should render description when provided", () => {
    render(<TaskCard {...defaultProps} description="Task description" />);

    expect(screen.getByTestId("task-description")).toHaveTextContent(
      "Task description"
    );
  });

  it("should not render description when not provided", () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.queryByTestId("task-description")).not.toBeInTheDocument();
  });

  it("should display priority correctly", () => {
    render(<TaskCard {...defaultProps} priority="high" />);

    expect(screen.getByTestId("task-priority")).toHaveTextContent("high");
  });

  it("should apply correct styles for low priority", () => {
    render(<TaskCard {...defaultProps} priority="low" />);

    const card = screen.getByTestId("task-card");
    expect(card).toHaveClass("border-blue-200");
  });

  it("should apply correct styles for medium priority", () => {
    render(<TaskCard {...defaultProps} priority="medium" />);

    const card = screen.getByTestId("task-card");
    expect(card).toHaveClass("border-yellow-200");
  });

  it("should apply correct styles for high priority", () => {
    render(<TaskCard {...defaultProps} priority="high" />);

    const card = screen.getByTestId("task-card");
    expect(card).toHaveClass("border-red-200");
  });

  it("should call onEdit when edit button is clicked", async () => {
    const handleEdit = vi.fn();
    render(<TaskCard {...defaultProps} onEdit={handleEdit} />);

    const editButton = screen.getByTestId("edit-button");
    await userEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it("should call onDelete when delete button is clicked", async () => {
    const handleDelete = vi.fn();
    render(<TaskCard {...defaultProps} onDelete={handleDelete} />);

    const deleteButton = screen.getByTestId("delete-button");
    await userEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it("should not render edit button when onEdit is not provided", () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.queryByTestId("edit-button")).not.toBeInTheDocument();
  });

  it("should not render delete button when onDelete is not provided", () => {
    render(<TaskCard {...defaultProps} />);

    expect(screen.queryByTestId("delete-button")).not.toBeInTheDocument();
  });

  it("should render both action buttons when both callbacks provided", () => {
    render(
      <TaskCard {...defaultProps} onEdit={() => {}} onDelete={() => {}} />
    );

    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
    expect(screen.getByTestId("delete-button")).toBeInTheDocument();
  });
});
