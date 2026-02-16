import React from "react";

interface TaskCardProps {
  title: string;
  description?: string;
  duration: number;
  priority: "low" | "medium" | "high";
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskCard({
  title,
  description,
  duration,
  priority,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const priorityColors = {
    low: "border-blue-200 bg-blue-50",
    medium: "border-yellow-200 bg-yellow-50",
    high: "border-red-200 bg-red-50",
  };

  return (
    <div
      className={`rounded-lg border-2 p-4 ${priorityColors[priority]}`}
      data-testid="task-card"
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-lg font-semibold" data-testid="task-title">
          {title}
        </h3>
        <span
          className="rounded bg-gray-200 px-2 py-1 text-xs"
          data-testid="task-duration"
        >
          {duration}m
        </span>
      </div>

      {description && (
        <p
          className="mb-3 text-sm text-gray-600"
          data-testid="task-description"
        >
          {description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium uppercase ${
            priority === "high"
              ? "text-red-600"
              : priority === "medium"
                ? "text-yellow-600"
                : "text-blue-600"
          }`}
          data-testid="task-priority"
        >
          {priority}
        </span>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-blue-600 hover:underline"
              data-testid="edit-button"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-sm text-red-600 hover:underline"
              data-testid="delete-button"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
