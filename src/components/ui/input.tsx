import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base placeholder:text-neutral-400 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
