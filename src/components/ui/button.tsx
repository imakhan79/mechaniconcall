import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900",
        primary: "bg-sky-700 text-white hover:bg-sky-800 focus-visible:ring-sky-700 shadow-sm",
        accent: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 shadow-sm",
        emergency: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-lg shadow-red-600/30",
        outline: "border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900",
        ghost: "hover:bg-neutral-100 text-neutral-900",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        link: "text-sky-700 underline-offset-4 hover:underline",
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
