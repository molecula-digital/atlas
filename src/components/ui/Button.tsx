"use client"

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

// Outline-only by design — no variant carries a solid background.
const buttonVariants = cva(
  "rounded border bg-transparent font-mono font-semibold [&_svg:not([class*='size-'])]:size-3.5 inline-flex items-center justify-center whitespace-nowrap transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-hidden focus-visible:border-accent group/button select-none",
  {
    variants: {
      variant: {
        default:
          "border-accent/60 text-accent hover:border-accent hover:bg-accent/10",
        outline:
          "border-border text-primary hover:border-accent/50 hover:text-accent",
        secondary:
          "border-border text-secondary hover:border-accent/50 hover:text-accent",
        ghost:
          "border-transparent text-secondary hover:text-accent hover:border-border",
        destructive:
          "border-red-500/40 text-red-500 hover:border-red-500/70 hover:bg-red-500/10",
        link: "border-transparent text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-6 gap-1.5 px-2 text-[11px]",
        xs: "h-5 gap-1 px-1.5 text-[10px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-6 gap-1 px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        lg: "h-7 gap-1.5 px-3 text-xs",
        icon: "size-6 p-0",
        "icon-xs": "size-5 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-6 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-lg": "size-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
