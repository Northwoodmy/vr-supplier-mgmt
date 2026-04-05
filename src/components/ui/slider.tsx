"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  disabled,
  max = 100,
  min = 0,
  name,
  orientation = "horizontal",
  step = 1,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  className?: string
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none select-none items-center justify-center outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      disabled={disabled}
      max={max}
      min={min}
      name={name}
      orientation={orientation}
      step={step}
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full",
          orientation === "horizontal" ? "h-1.5 w-full" : "h-full w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute transition-all",
            orientation === "horizontal" ? "h-full" : "w-full",
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-shadow focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-offset-0 aria-disabled:pointer-events-none aria-disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
