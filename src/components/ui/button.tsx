import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground",
        primary: "bg-brand-500 text-background hover:bg-brand-600 focus-visible:ring-brand-500 shadow-sm shadow-brand-500/20",
        accent: "bg-success text-white hover:bg-success/90 focus-visible:ring-success shadow-sm",
        emergency: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger shadow-lg shadow-danger/30",
        outline: "border border-border bg-transparent hover:bg-surface-2 text-foreground",
        ghost: "hover:bg-surface-2 text-foreground",
        secondary: "bg-surface-2 text-foreground hover:bg-surface-2/70",
        link: "text-brand-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, ...props }, ref) => (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
