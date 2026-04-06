"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  labels?: Record<number, string>;
}

const defaultLabels: Record<number, string> = {
  1: "非常差",
  2: "较差",
  3: "一般",
  4: "良好",
  5: "优秀",
};

export function RatingSelector({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  disabled = false,
  labels = defaultLabels,
}: RatingSelectorProps) {
  // 生成刻度值
  const steps: number[] = [];
  for (let i = min; i <= max; i += step) {
    steps.push(i);
  }

  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((stepValue) => {
        const isSelected = value === stepValue;
        const label = labels[stepValue] || `${stepValue}`;

        return (
          <button
            key={stepValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(stepValue)}
            className={cn(
              "flex-1 px-2 py-3 text-sm rounded-lg border transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted hover:border-muted-foreground"
            )}
          >
            <div className="font-semibold">{stepValue}</div>
            <div className="text-xs opacity-70 truncate">{label}</div>
          </button>
        );
      })}
    </div>
  );
}
