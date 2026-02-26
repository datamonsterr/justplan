/**
 * Custom Transition Edge for React Flow
 * Represents a workflow transition with condition label
 */

"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "reactflow";
import { cn } from "@/lib/utils";

export interface TransitionEdgeData {
  conditionType: string;
  conditionValue?: Record<string, unknown>;
  isEnabled: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Human-readable condition labels
const CONDITION_LABELS: Record<string, string> = {
  deadline_within: "Deadline Near",
  overdue: "Overdue",
  time_in_state: "Time Elapsed",
  manual: "Manual",
  task_completed: "Completed",
  scheduled_time_passed: "Scheduled Passed",
};

function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style,
}: EdgeProps<TransitionEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const conditionLabel = data?.conditionType
    ? CONDITION_LABELS[data.conditionType] || data.conditionType
    : "Transition";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: data?.isEnabled ? "#6B7280" : "#D1D5DB",
          strokeDasharray: data?.isEnabled ? "none" : "5,5",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            "absolute px-2 py-1 rounded text-[10px] font-medium pointer-events-all",
            "bg-background border shadow-sm",
            selected && "ring-1 ring-primary",
            !data?.isEnabled && "opacity-50"
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {conditionLabel}
          {data?.conditionValue && (
            <span className="ml-1 text-muted-foreground">
              {formatConditionValue(data.conditionType, data.conditionValue)}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/**
 * Format condition value for display
 */
function formatConditionValue(
  type: string,
  value: Record<string, unknown>
): string {
  switch (type) {
    case "deadline_within":
      return `(${value.hours || value.days}${value.hours ? "h" : "d"})`;
    case "time_in_state":
      return `(${value.hours || value.days}${value.hours ? "h" : "d"})`;
    default:
      return "";
  }
}

export default memo(TransitionEdge);
