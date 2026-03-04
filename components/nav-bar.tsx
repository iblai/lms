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
    <header className="bg-[var(--navbar-bg)] border-b border-[var(--border)] h-16 md:h-20 flex-shrink-0">
      <div className="h-full px-4 sm:px-6 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center h-full">
          <button
            onClick={onMenuClick}
            className="md:hidden rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)] mr-3"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Replace direct Image with Logo component */}
          <Logo variant="small" />

          {/* Navigation Links */}
          {shouldShowNavLinks() && (
            <nav className="hidden md:flex ml-8 space-x-6 h-full items-center">
              <Link
                href="/home"
                className={`text-sm font-medium ${
                  activePage === 'home'
                    ? 'text-[var(--navbar-active-text)] border-b-2 border-[var(--navbar-active-border)]'
                    : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                } h-full flex items-center`}
              >
                Home
              </Link>
              <Link
                href="/profile"
                className={`text-sm font-medium ${
                  activePage === 'profile'
                    ? 'text-[var(--navbar-active-text)] border-b-2 border-[var(--navbar-active-border)]'
                    : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                } h-full flex items-center`}
              >
                Profile
              </Link>
              {!isRecommendedTabHidden() && (
                <Link
                  href="/recommended"
                  className={`text-sm font-medium ${
                    activePage === 'recommended'
                      ? 'text-[var(--navbar-active-text)] border-b-2 border-[var(--navbar-active-border)]'
                      : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                  } h-full flex items-center`}
                >
                  Recommended
                </Link>
              )}
              <Link
                href="/discover"
                className={`text-sm font-medium ${
                  activePage === 'discover' && !activePage.startsWith('course')
                    ? 'text-[var(--navbar-active-text)] border-b-2 border-[var(--navbar-active-border)]'
                    : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                } h-full flex items-center`}
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
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[var(--text-light)]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--border)] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
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
                      className="rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="relative flex-1">
                        <div
                          onClick={() => handleFormSubmit()}
                          className="absolute inset-y-0 left-3 flex items-center pointer-events-none"
                        >
                          <Search className="h-4 w-4 text-[var(--text-light)]" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search"
                          className="w-full pl-10 pr-4 py-2 bg-white border border-[var(--border)] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => setSearchVisible(!searchVisible)}
                        className="rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)]"
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
                    className="rounded-sm bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-xs lg:text-sm font-medium text-[var(--button-primary-text)] whitespace-nowrap h-[38px] hidden md:flex items-center hover:opacity-[var(--button-primary-hover-opacity)]"
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
