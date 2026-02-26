/**
 * Custom State Node for React Flow
 * Represents a workflow state in the graph
 */

"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export interface StateNodeData {
  id: string;
  name: string;
  color: string;
  order?: number;
  isDefault?: boolean;
  isTerminal?: boolean;
  excludeFromScheduling?: boolean;
  schedulingPriorityBoost?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function StateNode({ data, selected }: NodeProps<StateNodeData>) {
  return (
    <div
      className={cn(
        "min-w-[140px] rounded-lg border-2 bg-card p-3 shadow-md transition-all",
        "hover:shadow-lg",
        selected && "ring-2 ring-primary ring-offset-2",
        data.isTerminal && "border-dashed"
      )}
      style={{ borderColor: data.color }}
    >
      {/* Input handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-card !bg-muted-foreground"
      />

      {/* Node content */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-sm font-medium truncate">{data.name}</span>
        </div>
        
        {/* State properties */}
        <div className="flex flex-wrap gap-1 mt-1">
          {data.isDefault && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              Default
            </span>
          )}
          {data.isTerminal && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Terminal
            </span>
          )}
          {data.excludeFromScheduling && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              No Schedule
            </span>
          )}
          {data.schedulingPriorityBoost && data.schedulingPriorityBoost !== 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {data.schedulingPriorityBoost > 0 ? "+" : ""}
              {data.schedulingPriorityBoost} Priority
            </span>
          )}
        </div>
      </div>

      {/* Output handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-card !bg-muted-foreground"
      />
    </div>
  );
}

export default memo(StateNode);
