"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type ScrollableMainProps = {
  children: ReactNode;
  className?: string;
};

type ScrollMetrics = {
  canScroll: boolean;
  thumbTop: number;
  thumbHeight: number;
};

const TRACK_INSET_PX = 8;
const MIN_THUMB_PX = 24;

function measureScroll(element: HTMLElement): ScrollMetrics {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const canScroll = scrollHeight > clientHeight + 1;

  if (!canScroll) {
    return { canScroll: false, thumbTop: 0, thumbHeight: 0 };
  }

  const trackHeight = Math.max(clientHeight - TRACK_INSET_PX * 2, 0);
  const thumbHeight = Math.max(
    (clientHeight / scrollHeight) * trackHeight,
    MIN_THUMB_PX,
  );
  const maxScroll = scrollHeight - clientHeight;
  const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
  const thumbTop = scrollRatio * (trackHeight - thumbHeight);

  return { canScroll, thumbTop, thumbHeight };
}

export function ScrollableMain({ children, className }: ScrollableMainProps) {
  const ref = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    canScroll: false,
    thumbTop: 0,
    thumbHeight: 0,
  });
  const [indicatorVisible, setIndicatorVisible] = useState(false);

  const updateMetrics = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    setMetrics(measureScroll(element));
  }, []);

  const revealIndicator = useCallback(() => {
    setIndicatorVisible(true);
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setIndicatorVisible(false);
    }, 900);
  }, []);

  const onScroll = useCallback(() => {
    updateMetrics();
    revealIndicator();
  }, [revealIndicator, updateMetrics]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    updateMetrics();

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(element);

    const mutationObserver = new MutationObserver(updateMetrics);
    mutationObserver.observe(element, { childList: true, subtree: true });

    element.addEventListener("scroll", onScroll, { passive: true });
    const onWheelOrTouch = () => {
      updateMetrics();
      revealIndicator();
    };

    element.addEventListener("wheel", onWheelOrTouch, { passive: true });
    element.addEventListener("touchmove", onWheelOrTouch, { passive: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("wheel", onWheelOrTouch);
      element.removeEventListener("touchmove", onWheelOrTouch);
      window.clearTimeout(hideTimerRef.current);
    };
  }, [onScroll, revealIndicator, updateMetrics]);

  return (
    <div
      className={cn(
        "relative min-h-0 min-w-0 flex-1 overflow-hidden",
        className,
      )}
    >
      <main
        ref={ref}
        className="app-scroll h-full overflow-x-hidden overflow-y-auto overscroll-y-contain"
      >
        {children}
      </main>
      {metrics.canScroll && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute end-1 top-2 bottom-2 z-10 w-1.5 transition-opacity duration-300",
            indicatorVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className="absolute inset-x-0 rounded-full bg-[rgba(112,132,153,0.55)]"
            style={{
              top: `${metrics.thumbTop}px`,
              height: `${metrics.thumbHeight}px`,
            }}
          />
        </div>
      )}
    </div>
  );
}
