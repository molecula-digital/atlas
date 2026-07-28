import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * The one button styling source in the app — outline only, matching the
 * header's compact look. No button carries a solid background; emphasis comes
 * from the border/text color and a subtle tint on hover.
 *
 * Use `<Button>` for real buttons and `buttonVariants()` for anchors, links,
 * and Radix triggers that render their own element:
 *
 *   <Link className={buttonVariants({ variant: 'accent', size: 'md' })}>
 *
 * Icons are sized at the call site (`w-3.5 h-3.5`), not by the variants.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded border bg-transparent font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer select-none outline-hidden focus-visible:border-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        accent: "border-accent/60 text-accent hover:border-accent hover:bg-accent/10",
        neutral: "border-border text-primary hover:border-accent/50 hover:text-accent",
        ghost: "border-transparent text-secondary hover:text-accent hover:border-border",
        danger: "border-red-500/40 text-red-500 hover:border-red-500/70 hover:bg-red-500/10",
      },
      size: {
        xs: "gap-1 px-1.5 py-0.5 text-[10px]",
        sm: "px-2 py-1 text-[11px]",
        md: "px-2.5 py-1.5 text-xs",
        lg: "px-3 py-1.5 text-sm",
        // Square icon-only buttons, sized to match the text variants.
        "icon-xs": "w-5 h-5 p-0",
        "icon-sm": "w-6 h-6 p-0",
        "icon-md": "w-7 h-7 p-0",
        "icon-lg": "w-8 h-8 p-0",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

function Button({
  className,
  variant,
  size,
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
