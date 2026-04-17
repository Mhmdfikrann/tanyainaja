import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-muted)] px-4 py-3 text-sm text-[color:var(--color-foreground)] shadow-sm outline-none transition",
        "placeholder:text-[color:var(--color-muted-foreground)] focus:border-[color:var(--color-primary)] focus:ring-4 focus:ring-[color:var(--color-primary-soft)]",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
