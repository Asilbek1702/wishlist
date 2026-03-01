import { cn } from "@/lib/utils";
import { PRIORITY_LABELS } from "@/types";

interface PriorityBadgeProps {
  priority: number;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const labels: Record<number, string> = {
    1: "Было бы неплохо",
    2: "Хочу",
    3: "Очень хочу",
  };
  const colors: Record<number, string> = {
    1: "bg-muted/50 text-muted",
    2: "bg-primary/10 text-primary",
    3: "bg-secondary/10 text-secondary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
        colors[priority] || colors[1],
        className
      )}
    >
      {labels[priority] || PRIORITY_LABELS[priority] || ""}
    </span>
  );
}
