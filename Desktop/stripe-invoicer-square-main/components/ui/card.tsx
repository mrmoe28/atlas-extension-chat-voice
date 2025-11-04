// RESPONSIVE: Card components with fluid padding and typography
import * as React from "react";

import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

// RESPONSIVE: Responsive padding (smaller on mobile, larger on desktop)
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-3 sm:p-4 md:p-6", className)}
      {...props}
    />
  );
}

// RESPONSIVE: Fluid typography that scales with viewport
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-fluid-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

// RESPONSIVE: Responsive text size
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-fluid-sm text-muted-foreground", className)} {...props} />
  );
}

// RESPONSIVE: Responsive padding
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0", className)} {...props} />;
}

// RESPONSIVE: Responsive padding and flex wrap on mobile
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-wrap items-center gap-2 p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0", className)} {...props} />;
}
