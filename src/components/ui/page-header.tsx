import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--muted))] text-[var(--tg-theme-link-color,var(--primary))]">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      {subtitle && (
        <p
          className={cn(
            "text-xs leading-relaxed text-[var(--tg-theme-hint-color,var(--muted-foreground))]",
            Icon && "ps-[2.625rem]",
          )}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
