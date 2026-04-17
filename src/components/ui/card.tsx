import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-[color:var(--color-border)] bg-[color:var(--color-panel)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    />
  );
}
