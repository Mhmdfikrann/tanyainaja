import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 text-sm text-[color:var(--color-foreground)] shadow-sm outline-none transition",
          "placeholder:text-[color:var(--color-muted-foreground)] focus:border-[color:var(--color-primary)] focus:ring-4 focus:ring-[color:var(--color-primary-soft)]",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
