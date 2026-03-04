"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function ProfileTabs() {
  const pathname = usePathname();
  const baseProfilePath = "/profile";

  const tabs = [
    { name: "Activity", href: `${baseProfilePath}` },
    { name: "Skills", href: `${baseProfilePath}/skills` },
    { name: "Credentials", href: `${baseProfilePath}/credentials` },
    { name: "Pathways", href: `${baseProfilePath}/pathways` },
    { name: "Programs", href: `${baseProfilePath}/programs` },
    { name: "Courses", href: `${baseProfilePath}/courses` },
    { name: "Public Profile", href: `${baseProfilePath}/public` },
  ];

  const isActive = (href: string) => {
    if (href === baseProfilePath) {
      return pathname === baseProfilePath;
    }
    return pathname.startsWith(href);
  };

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current) {
      const activeTab = navRef.current.querySelector(
        `a[href="${pathname}"]`
      ) as HTMLElement;
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [pathname]);

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background-light)]">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 768px) {
          .scrollbar-default {
            -ms-overflow-style: auto;
            scrollbar-width: auto;
          }
          .scrollbar-default::-webkit-scrollbar {
            display: block;
          }
        }
      `}</style>
      <div className="px-6">
        <nav
          ref={navRef}
          className="flex space-x-8 overflow-x-auto justify-start pt-6 scrollbar-hide md:scrollbar-default"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`whitespace-nowrap pt-2 pb-1 px-1 border-b-2 font-medium text-sm ${
                isActive(tab.href)
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text)] hover:text-[var(--text-dark)] hover:border-[var(--border-dark)]"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
