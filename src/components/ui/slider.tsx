import * as React from "react";

import { cn } from "@/lib/utils";

type SliderProps = Omit<React.ComponentProps<"input">, "type" | "value"> & {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
};

function Slider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  ...props
}: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0] ?? min}
      onChange={(event) => onValueChange([Number(event.target.value)])}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 dark:bg-zinc-800 dark:accent-zinc-50",
        className,
      )}
      {...props}
    />
  );
}

export { Slider };
