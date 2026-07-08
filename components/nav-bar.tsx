'use client';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { UserProfileButton } from './header/profile/user-profile-button';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getUserName,
  isRecommendedTabHidden,
  parseMarkdownLinks,
  redirectToAuthSpaJoinTenant,
} from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { NotificationDropdown } from '@iblai/iblai-js/web-containers';
import { isLoggedIn, useTenantMetadata } from '@iblai/iblai-js/web-utils';

import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useMediaQuery } from 'react-responsive';
import { WithPermissions } from '@/hoc';
import { config } from '@/lib/config';
import { isDiscoverEnabled } from '@/utils/discover-visibility';

interface NavBarProps {
  sidebarOpen: boolean;
  activePage: string;
  onMenuClick: () => void;
}

export function NavBar({ activePage, onMenuClick }: NavBarProps) {
  const tenant = useTenantParam();
  const isUserLoggedIn = isLoggedIn();
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: tenant,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery({ minWidth: 915 });
  const isTabletRange = useMediaQuery({ minWidth: 760, maxWidth: 915 });
  const isMobile = useMediaQuery({ maxWidth: 760 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const { metadata } = useTenantMetadata({ org: tenant });
  // Discover (menu item + search bar) is gated by both the config flag and the
  // tenant's `enable_discover_page` metadata; the config flag supersedes it.
  const discoverEnabled = isDiscoverEnabled({
    hideDiscoverTab: config.settings.hideDiscoverTab(),
    enableDiscoverPage: metadata?.enable_discover_page,
  });
  const aiAnalyticsHeaderMenuEnabled = config.settings.aiAnalyticsHeaderMenuEnabled();
  const studioHeaderMenuEnabled = config.settings.studioHeaderMenuEnabled();
  const additionalLeftHeaderMenuItems = parseMarkdownLinks(
    config.settings.additionalLeftHeaderMenuItems(),
  );
  const additionalRightHeaderMenuItems = parseMarkdownLinks(
    config.settings.additionalRightHeaderMenuItems(),
  );

  useEffect(() => {
    setSearchQuery(decodeURIComponent(searchParams.get('q') || ''));
  }, [searchParams]);

  const handleViewNotifications = useCallback(
    (notificationId?: string) => {
      router.push(`/platform/${tenant}/notifications/${notificationId ?? ''}`);
    },
    [router],
  );

  const handleFormSubmit = () => {
    if (activePage === 'discover') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', encodeURIComponent(searchQuery));
      router.push(url.pathname + url.search);
    } else {
      router.push(`/platform/${tenant}/discover?q=${encodeURIComponent(searchQuery)}`);
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
          {/* Mobile hamburger — opens the PlatformSidebar mobile sheet, which
              only renders for logged-in users, so hide it when logged out. */}
          {isUserLoggedIn && (
            <button
              onClick={onMenuClick}
              className="mr-3 rounded-sm text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] hover:text-[var(--navbar-hover-text)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none focus:ring-inset md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}

          {/* Navigation Links */}
          {shouldShowNavLinks() && (
            <nav className="ml-8 hidden h-full items-center space-x-6 md:flex">
              {isUserLoggedIn && (
                <>
                  <Link
                    href={`/platform/${tenant}/home`}
                    className={`text-sm font-medium ${
                      activePage === 'home'
                        ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                        : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                    } flex h-full items-center`}
                  >
                    Home
                  </Link>
                  <Link
                    href={`/platform/${tenant}/profile`}
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
                      href={`/platform/${tenant}/recommended`}
                      className={`text-sm font-medium ${
                        activePage === 'recommended'
                          ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                          : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                      } flex h-full items-center`}
                    >
                      Recommended
                    </Link>
                  )}
                </>
              )}
              {discoverEnabled && (
                <Link
                  href={`/platform/${tenant}/discover`}
                  className={`text-sm font-medium ${
                    activePage === 'discover' && !activePage.startsWith('course')
                      ? 'border-b-2 border-[var(--navbar-active-border)] text-[var(--navbar-active-text)]'
                      : 'text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]'
                  } flex h-full items-center`}
                >
                  Discover
                </Link>
              )}
              {additionalLeftHeaderMenuItems.map((menu, index) => (
                <Link
                  key={`left-header-menu-${index}`}
                  href={menu.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full items-center text-sm font-medium text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)]"
                >
                  {menu.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {discoverEnabled && (
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
                        aria-label="Open search"
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
                          aria-label="Close search"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            </form>
          )}

          {/* AI Analytics Button */}
          {!(isTabletRange && searchVisible) &&
            studioHeaderMenuEnabled &&
            (departmentMemberCheck?.is_platform_admin ||
              departmentMemberCheck?.is_department_admin) && (
              <Link
                href={config.urls.studioUrl()}
                target="_blank"
                className="ml-2 hidden items-center text-sm font-medium whitespace-nowrap text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)] md:flex"
              >
                Studio
              </Link>
            )}
          {!(isTabletRange && searchVisible) && aiAnalyticsHeaderMenuEnabled && (
            <WithPermissions rbacResource={`/platforms/${tenant}/#can_view_analytics`}>
              {({ hasPermission }) =>
                hasPermission && (
                  <Link
                    href={`/platform/${tenant}/analytics`}
                    className="hidden items-center text-sm font-medium whitespace-nowrap text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)] md:flex"
                  >
                    AI Analytics
                  </Link>
                )
              }
            </WithPermissions>
          )}
          {!(isTabletRange && searchVisible) &&
            additionalRightHeaderMenuItems.map((menu, index) => (
              <Link
                key={`right-header-menu-${index}`}
                href={menu.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center text-sm font-medium whitespace-nowrap text-[var(--navbar-text)] hover:text-[var(--navbar-hover-text)] md:flex"
              >
                {menu.label}
              </Link>
            ))}
          {/* Auth Buttons (logged out) */}
          {!isUserLoggedIn && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => redirectToAuthSpaJoinTenant(tenant, undefined, true)}
                className="rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium whitespace-nowrap text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => redirectToAuthSpaJoinTenant(tenant, undefined, true)}
                className="rounded-sm border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium whitespace-nowrap text-[var(--navbar-text)] hover:bg-[var(--navbar-hover-bg)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Notification Bell */}
          {isUserLoggedIn && (
            <NotificationDropdown
              org={tenant}
              userId={getUserName()}
              isAdmin={departmentMemberCheck?.is_platform_admin}
              onViewNotifications={handleViewNotifications}
            />
          )}
          {isUserLoggedIn && (
            <div className="relative">
              <UserProfileButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
