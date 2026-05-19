import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80",
        "bg-gradient-to-b from-card to-muted/30 p-10 sm:p-14 text-center",
        className
      )}
    >
      <div className="relative mb-4">
        <div
          aria-hidden
          className="absolute inset-0 -m-3 rounded-2xl bg-uni-gradient opacity-15 blur-2xl"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
