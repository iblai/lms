'use client';

import type React from 'react';

import { motion } from 'framer-motion';
import { Upload, Linkedin, Twitter, Facebook, Check } from 'lucide-react';
import Image from 'next/image';
import type { ProfileSlideProps } from './types';
import { useContext } from 'react';
import { StartPageContext } from '@/hooks/start/start-page-context';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { getTenant } from '@/utils/helpers';

export default function ProfileSlide({ isDragging, setIsDragging }: ProfileSlideProps) {
  const { metadataLoaded, isSkillsResumeFeatureHidden } = useTenantMetadata({
    org: getTenant(),
  });
  const {
    handleProfileImageSelect,
    profileImage,
    handleSocialLinksUpdate,
    handleFileUpload,
    fields,
  } = useContext(StartPageContext);
  return (
    <motion.div
      key="slide4"
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
      <div className="absolute bottom-0 left-0 z-0 h-80 w-80 translate-x-10 translate-y-20 rounded-full bg-amber-100/20"></div>

      <div
        className="scrollbar-hide relative z-10 max-h-[70vh] overflow-y-auto p-6 sm:p-8 md:p-12"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="space-y-6 sm:space-y-8">
          {/* Profile Picture */}
          <div className="rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="mb-2 text-base font-medium text-gray-600 sm:text-lg">
              Profile Picture (Optional)
            </h3>
            <p className="mb-4 text-xs text-gray-500 sm:text-sm">
              Add a photo to personalize your profile
            </p>

            <div className="flex justify-center">
              <div
                className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-amber-200 sm:h-24 sm:w-24"
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = 'image/*';
                  fileInput.onchange = (e) =>
                    handleProfileImageSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
                  fileInput.click();
                }}
              >
                {profileImage ? (
                  <Image
                    src={profileImage || '/placeholder.svg'}
                    alt="Profile picture"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Upload className="h-5 w-5 text-gray-400 sm:h-6 sm:w-6" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Networks */}
          <div className="rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="mb-2 text-base font-medium text-gray-600 sm:text-lg">
              Social Networks (Optional)
            </h3>
            <p className="mb-4 text-xs text-gray-500 sm:text-sm">
              Add your social network profiles
            </p>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  LinkedIn Profile
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Linkedin className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="linkedin.com/in/username"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-xs focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none sm:text-sm"
                    value={fields.socialLinks.linkedin}
                    onChange={(e) =>
                      handleSocialLinksUpdate({
                        socialType: 'linkedin',
                        socialLink: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  X Profile
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Twitter className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="twitter.com/username"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-xs focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none sm:text-sm"
                    value={fields.socialLinks.twitter}
                    onChange={(e) =>
                      handleSocialLinksUpdate({
                        socialType: 'twitter',
                        socialLink: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                  Facebook Profile
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Facebook className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="facebook.com/username"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-xs focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none sm:text-sm"
                    value={fields.socialLinks.facebook}
                    onChange={(e) =>
                      handleSocialLinksUpdate({
                        socialType: 'facebook',
                        socialLink: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          {metadataLoaded && !isSkillsResumeFeatureHidden() && (
            <div
              className={`border-2 border-dashed ${
                isDragging ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'
              } flex cursor-pointer flex-col items-center justify-center rounded-lg p-4 transition-colors hover:bg-gray-100 sm:p-8`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);

                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => {
                // Create a file input and trigger it
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'application/pdf';
                fileInput.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    handleFileUpload(files[0]);
                  }
                };
                fileInput.click();
              }}
            >
              {fields.resume ? (
                <>
                  <div className="mb-2 flex items-center justify-center text-amber-500">
                    <Check className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <p className="text-center text-xs font-medium text-gray-700 sm:text-sm">
                    {fields.resume.name}
                  </p>
                  <p className="mt-1 text-center text-xs text-gray-500">
                    {(fields.resume.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    className="mt-3 text-xs text-amber-500 hover:text-amber-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Pass null to the same handler that sets the file
                      handleFileUpload(null as unknown as File);
                    }}
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-6 w-6 text-amber-500 sm:h-8 sm:w-8" />
                  <p className="text-center text-xs text-gray-600 sm:text-sm">
                    Drag and drop your resume here
                  </p>
                  <p className="mt-1 text-center text-xs text-gray-500">(PDF up to 25MB)</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
