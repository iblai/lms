"use client"

import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function AnalyticsHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 md:h-20 items-center px-2 sm:px-4 md:px-6">
        <div className="mr-2 sm:mr-4 md:mr-12 flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iblai-logo-xs%20%281%29-3UYOVbXjsuvGoUnKYWGIO19nDDgFOV.png"
              alt="ibl.ai Logo"
              width={60}
              height={36}
              className="h-6 sm:h-7 md:h-8 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-40 sm:w-48 lg:w-64 rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-[38px]"
            />
          </div>

          <button className="rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-xs lg:text-sm font-medium text-[var(--button-primary-text)] whitespace-nowrap h-[38px] flex items-center hover:opacity-[var(--button-primary-hover-opacity)]">
            Skills AI
          </button>
          <button className="text-xs lg:text-sm font-medium text-gray-600 h-[38px] flex items-center">Invites</button>
          <button className="text-xs lg:text-sm font-medium text-gray-600 h-[38px] flex items-center">Downloads</button>
          <div className="h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-full flex-shrink-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/close-up-portrait-of-smiling-handsome-young-caucasian-man-face-looking-at-camera-on-isolated-light-gray-studio-background-photo%201-tmQMOUyqiWPK9DqErlAU45FIFQeiY8.png"
              alt="Profile"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
