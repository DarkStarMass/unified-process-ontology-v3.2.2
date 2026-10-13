import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary";

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium",
        "transition-[background-color,opacity,transform] duration-150",
        "active:opacity-80 disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "secondary" && "border border-border bg-card text-foreground",
        className,
      )}
      {...props}
    />
  );
}
