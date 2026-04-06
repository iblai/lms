'use client';

import { motion } from 'framer-motion';
import { Search, Check } from 'lucide-react';

import { useStartPage } from '@/hooks/start/use-start-page';
import { useContext, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SkeletonMultiplier } from '../skeleton-multiplier';
import { SkeletonRoleBox } from '../skeleton-role-box';
import { DefaultEmptyBox } from '../default-empty-box';
import { CatalogRole } from '@/types/roles';
import { StartPageContext } from '@/hooks/start/start-page-context';

export default function RoleSelectionSlide() {
  const { fields, handleToggleRole, isRoleSelected } = useContext(StartPageContext);
  const [searchQuery, setSearchQuery] = useState('');
  const { handleRolesFetch, roles, rolesLoading } = useStartPage();

  const handleFetchAllRoles = useDebouncedCallback(() => {
    handleRolesFetch({ searchQuery, limit: 12 + fields.roles.length });
  }, 500);

  useEffect(() => {
    handleFetchAllRoles();
  }, [searchQuery]);

  return (
    <motion.div
      key="slide2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-amber-50/50 to-gray-50/30"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 z-0 h-64 w-64 -translate-x-20 -translate-y-20 rounded-full bg-amber-100/20"></div>

      <div
        className="scrollbar-hide relative z-10 max-h-[70vh] overflow-y-auto p-6 sm:p-8 md:p-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="mb-6 text-center text-xl font-bold text-gray-600 sm:mb-8 sm:text-2xl">
          Select Your Role
        </h2>

        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
          </div>
          <input
            type="text"
            placeholder="Search for a role"
            className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none sm:py-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <p className="mb-4 text-sm font-medium text-gray-500">
          {fields.roles.length} Selected Roles
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {rolesLoading && <SkeletonMultiplier multiplier={12} Skeleton={SkeletonRoleBox} />}
          {!rolesLoading &&
            roles.length > 0 &&
            [
              ...fields.roles,
              ...roles.filter(
                (role) => !fields.roles.some((r: CatalogRole) => r.data.id === role.data.id),
              ),
            ].map((role, index) => (
              <div
                key={index}
                className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 sm:p-4 ${
                  isRoleSelected(role)
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
                }`}
                onClick={() => handleToggleRole(role)}
              >
                <div className="flex items-start">
                  {isRoleSelected(role) && (
                    <div className="mt-1 mr-2 text-amber-500">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 capitalize sm:text-base">
                      {role.data.name}
                    </h3>
                    {role.data?.data?.description && (
                      <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                        {role.data.data?.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
        {!rolesLoading && roles.length === 0 && (
          <DefaultEmptyBox
            message={`No roles${searchQuery ? ` matching "${searchQuery}"` : ''} found.`}
          />
        )}
      </div>
    </motion.div>
  );
}
