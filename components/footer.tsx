'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { config } from '@/lib/config';
import { MarkdownMenuItem } from '@/types/utils';
import { parseMarkdownLinks } from '@/utils/helpers';
import { useChatState } from './chat-button';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';
import { useCurrentTenant } from '@/utils/localstorage';

export function Footer() {
  const { isOpen } = useChatState();
  const { metadata } = useTenantMetadata({ org: getTenant() });
  const TERMS_OF_USE_LABEL = 'Terms of Use';
  const PRIVACY_POLICY_LABEL = 'Privacy Policy';
  const { currentTenant } = useCurrentTenant();
  const platformName = currentTenant?.platform_name;

  // Determine which icon is active based on the current path
  /* const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  }; */

  const [customMenus, setCustomMenus] = useState<MarkdownMenuItem[]>([]);

  const handleFooterCustomMenus = () => {
    const menuInString = config.settings.footerMenus();
    if (menuInString) {
      const menusList = parseMarkdownLinks(menuInString);
      const updatedMenuList = menusList.map((menu) => {
        if (
          String(menu.label).toLowerCase().includes(TERMS_OF_USE_LABEL.toLowerCase()) &&
          metadata?.auth_web_skillsai?.terms_of_use_url
        ) {
          return {
            ...menu,
            link: metadata?.auth_web_skillsai?.terms_of_use_url,
          };
        }
        if (
          String(menu.label).toLowerCase().includes(PRIVACY_POLICY_LABEL.toLowerCase()) &&
          metadata?.auth_web_skillsai?.privacy_policy_url
        ) {
          return {
            ...menu,
            link: metadata?.auth_web_skillsai?.privacy_policy_url,
          };
        }
        return menu;
      });
      setCustomMenus(updatedMenuList);
    }
  };

  useEffect(() => {
    if (config.settings.footerMenusEnabled()) {
      handleFooterCustomMenus();
    }
  }, [metadata]);

  return (
    <>
      {/* Desktop Copyright Footer — in-flow at the bottom of the sidebar
          inset, so it sits to the right of the fixed PlatformSidebar
          instead of overlaying it. */}
      <footer
        className={`${
          isOpen ? 'hidden sm:flex' : 'flex'
        } w-full shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-sm text-gray-600`}
      >
        <div className="flex space-x-6">
          {customMenus.map((menu, index) => (
            <Link
              target="_blank"
              href={menu.link}
              key={`footer-menu-${index}`}
              className="transition-colors hover:text-amber-500"
            >
              {menu.label}
            </Link>
          ))}
        </div>
        {config.settings.staticCopyrightEnabled() ? (
          config.settings.copyright() && <div>{config.settings.copyright()}</div>
        ) : platformName ? (
          <div>© {platformName}</div>
        ) : (
          config.settings.copyright() && <div>{config.settings.copyright()}</div>
        )}
      </footer>
    </>
  );
}
