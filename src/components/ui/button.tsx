import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "secondary" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]",
        variant === "default" &&
          "bg-[color:var(--color-primary)] text-white shadow-lg shadow-[color:var(--color-primary-soft)] hover:bg-[color:var(--color-primary-strong)]",
        variant === "outline" &&
          "border border-[color:var(--color-border)] bg-[color:var(--color-panel)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]",
        variant === "secondary" && "bg-[color:var(--color-muted)] text-[color:var(--color-foreground)] hover:bg-[#1b1f2a]",
        variant === "ghost" && "text-[color:var(--color-foreground)] hover:bg-[color:var(--color-muted)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "default" && "h-11 px-5 text-sm",
        size === "sm" && "h-9 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        size === "icon" && "h-10 w-10 rounded-2xl",
        className,
      )}
      {...props}
    />
  );
});
