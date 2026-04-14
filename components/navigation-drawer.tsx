'use client';

import { X, Home, User, BookOpen, Search, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { getTenant } from '@/utils/helpers';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const pathname = usePathname();
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });

  const navigationItems = [
    {
      name: 'Home',
      href: '/home',
      icon: Home,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Recommended',
      href: '/recommended',
      icon: BookOpen,
    },
    {
      name: 'Discover',
      href: '/discover',
      icon: Search,
    },
    ...(((departmentMemberCheck?.is_platform_admin ||
      departmentMemberCheck?.is_department_admin) && [
      {
        name: 'AI Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
    ]) ||
      []),
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-40 bg-black md:hidden" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b px-4 md:h-24">
          <Logo variant="small" />
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive
                        ? 'border border-amber-200 bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-amber-700' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
