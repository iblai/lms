"use client"

import { User, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useRef, useEffect } from "react"

interface ProfileDropdownProps {
  onClose: () => void
  onAccountClick: () => void
}

export function ProfileDropdown({ onClose, onAccountClick }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-48 bg-white rounded-sm shadow-lg border border-gray-200 z-50 py-2"
    >
      <Link
        href="/profile"
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onClose}
      >
        <User className="h-4 w-4 mr-3 text-gray-500" />
        Profile
      </Link>
      <button
        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => {
          onAccountClick()
          onClose()
        }}
      >
        <Settings className="h-4 w-4 mr-3 text-gray-500" />
        Account
      </button>
      <button
        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => {
          // Handle logout logic here
          console.log("Logging out...")
          onClose()
        }}
      >
        <LogOut className="h-4 w-4 mr-3 text-gray-500" />
        Log Out
      </button>
    </div>
  )
}
