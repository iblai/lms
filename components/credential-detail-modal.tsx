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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-tl-lg rounded-tr-lg rounded-bl-lg rounded-br-lg max-w-lg w-full flex flex-col h-[85vh]">
        {/* Fixed Header */}
        <div className="p-4 border-b rounded-tl-lg rounded-tr-lg border-gray-200 flex justify-between items-center bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30">
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
          <div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 overflow-hidden mb-4 rounded-full border-4 border-[var(--primary-light)] shadow-lg">
              <Image
                src={credential?.credentialDetails?.iconImage || CREDENTIAL_DEFAULT_IMG}
                alt={credential?.credentialDetails?.name || 'Credential'}
                width={112}
                height={112}
                className="h-full w-full object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text)] text-center">
              Charles Foster, Admin
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Award className="h-4 w-4 text-[var(--primary)]" />
              <p className="text-base text-gray-600">
                Issued by {credential?.credentialDetails?.issuerDetails?.name || '-'}
              </p>
            </div>
          </div>

          {/* Credential Description */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">
              A completion credential for {credential?.course?.name || 'a course'} was issued to{' '}
              {credential?.recipient?.name || credential?.recipient?.username || 'You'} on{' '}
              {dayjs(credential?.issuedOn).format('MMM D, YYYY')}.
            </p>
          </div>
          {/* Course Section with Image */}
          {!_.isEmpty(credential?.course) && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Course
                </h3>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="w-24 h-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                  <Image
                    src={ramdomCourseImg}
                    alt={credential?.course?.name || 'Course'}
                    width={96}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-[var(--primary)] font-medium text-sm">
                    {credential?.course?.name || 'Course'}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Issue Date */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
                Issued on
              </h3>
            </div>
            <div className="p-4">
              <p className="text-[var(--primary)] font-medium text-sm">
                {dayjs(credential?.issuedOn).format('MMM D, YYYY')}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Download and Share Buttons */}
        <div className="p-4 rounded-bl-lg border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 flex justify-end gap-3">
          {/* Download Button */}
          <button
            onClick={() => inBrowserPrint(certificateElement.current)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity shadow-sm"
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
