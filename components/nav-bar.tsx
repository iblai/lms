'use client';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Logo } from './logo';
import { UserProfileButton } from './header/profile/user-profile-button';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTenant, getUserName, isRecommendedTabHidden } from '@/utils/helpers';
import { NotificationDropdown } from '@iblai/iblai-js/web-containers';

import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useMediaQuery } from 'react-responsive';
import { WithPermissions } from '@/hoc';

interface NavBarProps {
  sidebarOpen: boolean;
  activePage: string;
  onMenuClick: () => void;
}

export function NavBar({ activePage, onMenuClick }: NavBarProps) {
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: getTenant(),
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery({ minWidth: 915 });
  const isTabletRange = useMediaQuery({ minWidth: 760, maxWidth: 915 });
  const isMobile = useMediaQuery({ maxWidth: 760 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    setSearchQuery(decodeURIComponent(searchParams.get('q') || ''));
  }, [searchParams]);

  const handleViewNotifications = useCallback(
    (notificationId?: string) => {
      router.push(`/notifications/${notificationId ?? ''}`);
    },
    [router],
  );

  const handleFormSubmit = () => {
    if (activePage === 'discover') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', encodeURIComponent(searchQuery));
      router.push(url.pathname + url.search);
    } else {
      router.push(`/discover?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  const shouldShowNavLinks = () => {
    if (isDesktop) return true;
    if (isTabletRange && searchVisible) return false; // Hide links when search is open in tablet range
    if (isTabletRange && !searchVisible) return true; // Show links when search is closed in tablet range
    return false; // Hide on mobile
  };

  return (
    <header className="h-16 flex-shrink-0 border-b border-[var(--border)] bg-[var(--navbar-bg)] md:h-20">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 md:px-6 lg:px-8">
        <div className="flex h-full items-center">
          <button
            onClick={onMenuClick}
            className="mr-3 rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none focus:ring-inset md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Replace direct Image with Logo component */}
          <Logo variant="small" />

          {/* Navigation Links */}
          {shouldShowNavLinks() && (
            <nav className="ml-8 hidden h-full items-center space-x-6 md:flex">
              <Link
                href="/home"
                className={`text-sm font-medium ${
                  activePage === 'home'
                    ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                    : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                } flex h-full items-center`}
              >
                Home
              </Link>
              <Link
                href="/profile"
                className={`text-sm font-medium ${
                  activePage === 'profile'
                    ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                    : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                } flex h-full items-center`}
              >
                Profile
              </Link>
              {!isRecommendedTabHidden() && (
                <Link
                  href="/recommended"
                  className={`text-sm font-medium ${
                    activePage === 'recommended'
                      ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                      : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                  } flex h-full items-center`}
                >
                  Recommended
                </Link>
              )}
              <Link
                href="/discover"
                className={`text-sm font-medium ${
                  activePage === 'discover' && !activePage.startsWith('course')
                    ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                    : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                } flex h-full items-center`}
              >
                Discover
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFormSubmit();
            }}
          >
            <>
              {/* Updated Search Bar */}
              {isDesktop && (
                <div className="relative" style={{ width: 'clamp(12rem, 20vw, 16rem)' }}>
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Search className="h-4 w-4 text-[var(--text-light)]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full rounded-sm border border-[var(--border)] bg-white py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {/* Search Icon/Bar for tablet range (915px - 760px) and mobile (≤ 760px) */}
              {(isTabletRange || isMobile) && (
                <>
                  {!searchVisible ? (
                    <button
                      onClick={() => setSearchVisible(!searchVisible)}
                      className="rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none focus:ring-inset"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="flex flex-1 items-center space-x-2">
                      <div className="relative flex-1">
                        <div
                          onClick={() => handleFormSubmit()}
                          className="pointer-events-none absolute inset-y-0 left-3 flex items-center"
                        >
                          <Search className="h-4 w-4 text-[var(--text-light)]" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search"
                          className="w-full rounded-sm border border-[var(--border)] bg-white py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-[var(--primary)] focus:outline-none"
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => setSearchVisible(!searchVisible)}
                        className="rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none focus:ring-inset"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          </form>

          {/* AI Analytics Button */}
          {/* {!(isTabletRange && searchVisible) &&
            (departmentMemberCheck?.is_platform_admin ||
              departmentMemberCheck?.is_department_admin) && (
              <Link
                href="/analytics"
                className="rounded-sm bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-xs lg:text-sm font-medium text-[var(--button-primary-text)] whitespace-nowrap h-[38px] hidden md:flex items-center hover:opacity-[var(--button-primary-hover-opacity)]"
              >
                AI Analytics
              </Link>
            )} */}
          {!(isTabletRange && searchVisible) && (
            <WithPermissions rbacResource={`/platforms/${getTenant()}/#can_view_analytics`}>
              {({ hasPermission }) =>
                hasPermission && (
                  <Link
                    href="/analytics"
                    className="hidden h-[38px] items-center rounded-sm bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-xs font-medium whitespace-nowrap text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)] md:flex lg:text-sm"
                  >
                    AI Analytics
                  </Link>
                )
              }
            </WithPermissions>
          )}
          {/* Notification Bell */}
          <NotificationDropdown
            org={getTenant()}
            userId={getUserName()}
            isAdmin={departmentMemberCheck?.is_platform_admin}
            onViewNotifications={handleViewNotifications}
          />

          <div className="relative">
            <UserProfileButton />
          </div>
        </div>
      </div>
    </header>
  );
}
