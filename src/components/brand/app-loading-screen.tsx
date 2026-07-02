import { AppLogo } from "@/components/brand/app-logo";
import { cn } from "@/lib/utils";

type AppLoadingScreenProps = {
  loadingText?: string;
  className?: string;
};

export function AppLoadingScreen({
  loadingText,
  className,
}: AppLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center gap-5 p-8",
        className,
      )}
    >
      <div className="animate-logo-enter">
        <AppLogo size="xl" animated priority />
      </div>
      {loadingText && (
        <p className="animate-logo-caption text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {loadingText}
        </p>
      )}
    </div>
  );
}
