import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/types";

interface StatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

const LABELS: Record<ItemStatus, string> = {
  AVAILABLE: "Свободен",
  RESERVED: "Уже берут",
  COLLECTING: "Сбор",
  FULFILLED: "Куплен",
  UNAVAILABLE: "Недоступен",
};

const COLORS: Record<ItemStatus, string> = {
  AVAILABLE: "bg-success/10 text-success",
  RESERVED: "bg-warning/10 text-warning",
  COLLECTING: "bg-primary/10 text-primary",
  FULFILLED: "bg-muted/50 text-muted",
  UNAVAILABLE: "bg-danger/10 text-danger",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
        COLORS[status] || "bg-muted/50 text-muted",
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}
