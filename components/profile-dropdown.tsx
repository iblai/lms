'use client';

import { User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRef, useEffect } from 'react';
import { useTenantParam } from '@/hooks/use-tenant-param';

interface ProfileDropdownProps {
  onClose: () => void;
  onAccountClick: () => void;
}

export function ProfileDropdown({ onClose, onAccountClick }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tenant = useTenantParam();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 z-50 mt-2 w-48 rounded-sm border border-gray-200 bg-white py-2 shadow-lg"
    >
      <Link
        href={`/platform/${tenant}/profile`}
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        onClick={onClose}
      >
        <User className="mr-3 h-4 w-4 text-gray-500" />
        Profile
      </Link>
      <button
        className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => {
          onAccountClick();
          onClose();
        }}
      >
        <Settings className="mr-3 h-4 w-4 text-gray-500" />
        Account
      </button>
      <button
        className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        onClick={() => {
          // Handle logout logic here
          console.log('Logging out...');
          onClose();
        }}
      >
        <LogOut className="mr-3 h-4 w-4 text-gray-500" />
        Log Out
      </button>
    </div>
  );
}
