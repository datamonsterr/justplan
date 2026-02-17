import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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
  const priorityConfig = {
    low: { variant: "secondary" as const, className: "bg-blue-50 border-blue-200" },
    medium: { variant: "default" as const, className: "bg-yellow-50 border-yellow-200" },
    high: { variant: "destructive" as const, className: "bg-red-50 border-red-200" },
  };

  return (
    <Card
      className={cn("hover:shadow-md transition-shadow", priorityConfig[priority].className)}
      data-testid="task-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-none" data-testid="task-title">
            {title}
          </h3>
          <Badge variant="outline" data-testid="task-duration">
            {duration}m
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground" data-testid="task-description">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge 
            variant={priorityConfig[priority].variant}
            className="uppercase"
            data-testid="task-priority"
          >
            {priority}
          </Badge>

          <div className="flex gap-2">
            {onEdit && (
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                data-testid="edit-button"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="ghost"
                size="sm"
                data-testid="delete-button"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
