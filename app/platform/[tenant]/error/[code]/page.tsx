'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { config } from '@/lib/config';
import { hideInitialLoader } from '@/lib/initial-loader';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';

const ERROR_MAP: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  '401': {
    title: 'Authentication Required',
    description: 'You need to sign in to access this resource.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"
        />
      </svg>
    ),
  },
  '402': {
    title: 'Payment Required',
    description: 'You need to pay to access this resource.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
  },
  '403': {
    title: 'Unauthorized Resource',
    description: "The resource you're trying to access is unauthorized.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
  },
  '404': {
    title: 'Page Not Found',
    description: "The page you're looking for doesn't exist or has been moved.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
        />
      </svg>
    ),
  },
  '500': {
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again later.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
  },
  'unauthorized-tenant': {
    title: 'Unauthorized Resource',
    description:
      "The resource you're trying to access belongs to a different platform and cannot be accessed here.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="h-16 w-16"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
  },
};

const DEFAULT_ERROR = {
  title: 'Something Went Wrong',
  description: 'An unexpected error occurred. Please try again or contact support.',
  icon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-16 w-16"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  ),
};

export default function ErrorPage() {
  const params = useParams();
  const code = params.code as string;
  const tenant = useTenantParam();
  const { getSupportEmail } = useTenantMetadata({ org: tenant });
  const supportEmail = getSupportEmail() || config.settings.supportEmail();

  const { title, description, icon } = ERROR_MAP[code] ?? DEFAULT_ERROR;

  useEffect(() => {
    hideInitialLoader();
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        {/* Icon ring */}
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-amber-100 text-amber-500">
          {icon}
        </div>

        {/* Error code badge */}
        <span className="mb-4 inline-block rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold tracking-widest text-amber-600 uppercase">
          {code}
        </span>

        <h1 className="mb-3 text-2xl font-bold text-gray-800">{title}</h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">{description}</p>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/platform/${tenant}`}
            className="w-full rounded-md bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 sm:w-auto"
          >
            Back to Home
          </Link>
          <a
            href={`mailto:${supportEmail}`}
            className="w-full rounded-md border border-amber-300 px-6 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 sm:w-auto"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
