import * as React from "react"
import { cn } from "@/lib/utils"

export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    >
      {children}
    </div>
  )
}

export function AvatarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  return (
    <img
      className={cn("aspect-square h-full w-full object-cover object-center", className)}
      src={src}
      alt={alt || "Profile"}
    />
  )
}

export function AvatarFallback({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-muted", className)}>
      {children || "?"}
    </div>
  )
}


