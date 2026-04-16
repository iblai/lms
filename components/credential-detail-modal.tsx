'use client';
import Image from 'next/image';
import { X, Download, Award, Calendar, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { CustomAssertion } from '../types/credentials';
import { CREDENTIAL_DEFAULT_IMG } from '@/constants/assets';
import dayjs from 'dayjs';
import _ from 'lodash';
import { getRandomCourseImage, inBrowserPrint } from '@/utils/helpers';

interface CredentialDetailModalProps {
  credential: CustomAssertion | null;
  onClose: () => void;
}

export function CredentialDetailModal({ credential, onClose }: CredentialDetailModalProps) {
  const certificateElement = useRef<HTMLDivElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const [ramdomCourseImg] = useState(() => getRandomCourseImage());

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        shareDropdownRef.current &&
        !shareDropdownRef.current.contains(event.target as Node) &&
        shareButtonRef.current &&
        !shareButtonRef.current.contains(event.target as Node)
      ) {
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!credential) {
    return;
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="flex h-[85vh] w-full max-w-lg flex-col rounded-tl-lg rounded-tr-lg rounded-br-lg rounded-bl-lg bg-white">
        {/* Fixed Header */}
        <div className="flex items-center justify-between rounded-tl-lg rounded-tr-lg border-b border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 p-4">
          <h3 className="text-lg font-medium text-[var(--text)]">Credential Details</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-[var(--primary-light)] hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={certificateElement} className="flex-1 overflow-y-auto p-6">
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {/* Credential Badge and Title Section */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-[var(--primary-light)] shadow-lg">
              <Image
                src={credential?.credentialDetails?.iconImage || CREDENTIAL_DEFAULT_IMG}
                alt={credential?.credentialDetails?.name || 'Credential'}
                width={112}
                height={112}
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-center text-xl font-semibold text-[var(--text)]">
              {credential?.credentialDetails?.name}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-[var(--primary)]" />
              <p className="text-base text-gray-600">
                Issued by {credential?.credentialDetails?.issuerDetails?.name || '-'}
              </p>
            </div>
          </div>

          {/* Credential Description */}
          <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm leading-relaxed text-gray-600">
              A completion credential for {credential?.course?.name || 'a course'} was issued to{' '}
              {credential?.recipient?.name || credential?.recipient?.username || 'You'} on{' '}
              {dayjs(credential?.issuedOn).format('MMM D, YYYY')}.
            </p>
          </div>
          {/* Course Section with Image */}
          {!_.isEmpty(credential?.course) && (
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Course
                </h3>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <Image
                    src={ramdomCourseImg}
                    alt={credential?.course?.name || 'Course'}
                    width={96}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--primary)]">
                    {credential?.course?.name || 'Course'}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Issue Date */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
                Issued on
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-[var(--primary)]">
                {dayjs(credential?.issuedOn).format('MMM D, YYYY')}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Download and Share Buttons */}
        <div className="flex justify-end gap-3 rounded-bl-lg border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 p-4">
          {/* Download Button */}
          <button
            onClick={() => inBrowserPrint(certificateElement.current)}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-5 py-2.5 text-sm font-medium text-[var(--button-primary-text)] shadow-sm transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
          >
            <Download className="h-4 w-4" />
            Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
}

export default CredentialDetailModal;
