"use client"

import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface ThemedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function ThemedButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ThemedButtonProps) {
  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)]"
      case "secondary":
        return "bg-gradient-to-r from-[var(--button-secondary-gradient-from)] to-[var(--button-secondary-gradient-to)] hover:opacity-90 text-[var(--button-secondary-text)]"
      case "accent":
        return "bg-gradient-to-r from-[var(--button-accent-gradient-from)] to-[var(--button-accent-gradient-to)] text-[var(--button-accent-text)] hover:opacity-[var(--button-accent-hover-opacity)]"
      case "outline":
        return "border border-[var(--border)] hover:bg-[var(--background-dark)] text-[var(--text)]"
      case "ghost":
        return "hover:bg-[var(--background-dark)] text-[var(--text)]"
      default:
        return "bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)]"
    }
  }

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm"
      case "md":
        return "px-4 py-2"
      case "lg":
        return "px-6 py-3 text-lg"
      default:
        return "px-4 py-2"
    }
  }

  return (
    <button
      className={cn(
        "rounded-md font-medium transition-all shadow-sm",
        getVariantClasses(),
        getSizeClasses(),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
