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
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-gray-50/30 z-0"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/20 rounded-full -translate-x-20 -translate-y-20 z-0"></div>

      <div
        className="relative z-10 p-6 sm:p-8 md:p-12 max-h-[70vh] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-600 text-center mb-6 sm:mb-8">
          Select Your Role
        </h2>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for a role"
            className="w-full pl-10 pr-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <p className="text-sm font-medium text-gray-500 mb-4">
          {fields.roles.length} Selected Roles
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                  isRoleSelected(role)
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
                }`}
                onClick={() => handleToggleRole(role)}
              >
                <div className="flex items-start">
                  {isRoleSelected(role) && (
                    <div className="mr-2 mt-1 text-amber-500">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-600 capitalize text-sm sm:text-base">
                      {role.data.name}
                    </h3>
                    {role.data?.data?.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
