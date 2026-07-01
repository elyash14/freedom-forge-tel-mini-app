"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within Tabs.");
  }

  return context;
}

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("min-w-0 space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

function TabsList({ children, className, "aria-label": ariaLabel }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex max-w-full gap-1 overflow-x-auto rounded-lg border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-secondary-bg-color,var(--muted))] p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={cn(
        "shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-all sm:text-sm",
        isActive
          ? "bg-[var(--tg-theme-bg-color,var(--background))] text-[var(--tg-theme-text-color,var(--foreground))] shadow-sm"
          : "text-[var(--tg-theme-hint-color,var(--muted-foreground))] hover:text-[var(--tg-theme-text-color,var(--foreground))]",
        className,
      )}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return (
    <div role="tabpanel" className={cn("min-w-0", className)}>
      {children}
    </div>
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
