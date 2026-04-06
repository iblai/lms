'use client';

import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function AnalyticsHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 items-center px-2 sm:px-4 md:h-20 md:px-6">
        <div className="mr-2 flex-shrink-0 sm:mr-4 md:mr-12">
          <Link href="/" className="flex items-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iblai-logo-xs%20%281%29-3UYOVbXjsuvGoUnKYWGIO19nDDgFOV.png"
              alt="ibl.ai Logo"
              width={60}
              height={36}
              className="h-6 w-auto sm:h-7 md:h-8"
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
              className="h-[38px] w-40 rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none sm:w-48 lg:w-64"
            />
          </div>

          <button className="flex h-[38px] items-center rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-xs font-medium whitespace-nowrap text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)] lg:text-sm">
            Skills AI
          </button>
          <button className="flex h-[38px] items-center text-xs font-medium text-gray-600 lg:text-sm">
            Invites
          </button>
          <button className="flex h-[38px] items-center text-xs font-medium text-gray-600 lg:text-sm">
            Downloads
          </button>
          <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full md:h-9 md:w-9">
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
  );
}
