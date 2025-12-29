import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  const baseClasses = shimmer 
    ? "relative overflow-hidden rounded-md bg-gradient-to-r from-muted/80 via-accent/90 to-muted/80 bg-[length:200%_100%] animate-shimmer" 
    : "animate-pulse rounded-md bg-muted";
  
  return <div className={cn(baseClasses, className)} {...props} />;
}

export { Skeleton };
