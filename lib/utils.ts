import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SERVICES } from './constants';
import { config } from './config';
import { LOCALSTORAGE_KEYS } from '@/constants/storage';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isTauriApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export interface CustomQueryArgs extends Omit<FetchArgs, 'url'> {
  url: string;
  service: SERVICES;
  includeCredentials?: boolean;
  isJson?: boolean;
}

export type ExtendedFetchBaseQueryError = FetchBaseQueryError & {
  data?: { detail?: string; message?: string } | string;
};

const isErrorObject = (data: unknown): data is { detail?: string; message?: string } => {
  return typeof data === 'object' && data !== null && ('detail' in data || 'message' in data);
};

export const getServiceUrl = (service: SERVICES) => {
  switch (service) {
    case SERVICES.LMS:
      return config.urls.lms();
    case SERVICES.DM:
      return config.urls.dm();
    case SERVICES.AXD:
      return config.urls.axd();
    case SERVICES.STUDIO:
      return config.urls.studio();
    default:
      return config.urls.dm(); // Default to DM URL if no match
  }
};

function getHeaders(service: SERVICES) {
  switch (service) {
    case SERVICES.LMS:
      return {
        Authorization: `JWT ${window.localStorage.getItem(LOCALSTORAGE_KEYS.EDX_TOKEN_KEY)}`,
      };
    case SERVICES.DM:
      return {
        Authorization: `Token ${window.localStorage.getItem(LOCALSTORAGE_KEYS.DM_TOKEN_KEY)}`,
      };
    case SERVICES.AXD:
      return {
        Authorization: `Token ${window.localStorage.getItem(LOCALSTORAGE_KEYS.AXD_TOKEN_KEY)}`,
      };
    case SERVICES.STUDIO:
      return {
        Authorization: `JWT ${window.localStorage.getItem(LOCALSTORAGE_KEYS.EDX_TOKEN_KEY)}`,
      };
    default:
      return {
        Authorization: `Token ${window.localStorage.getItem(LOCALSTORAGE_KEYS.DM_TOKEN_KEY)}`,
      };
  }
}

const baseQuery = (service: SERVICES, isJson = true) =>
  fetchBaseQuery({
    baseUrl: getServiceUrl(service),
    credentials: 'omit',
    prepareHeaders: (headers) => {
      const authHeaders = getHeaders(service);

      // Remove this in favor of the isForm flag in the future
      if (isJson) {
        headers.set('Content-Type', 'application/json');
      }

      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return headers;
    },
  });

export const iblFetchBaseQuery: BaseQueryFn<
  CustomQueryArgs,
  unknown,
  ExtendedFetchBaseQueryError,
  Record<string, unknown>,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  try {
    const result = await baseQuery(args.service, args.isJson)(args, api, extraOptions);
    if (result.error) {
      const errorData = result.error.data;
      const errorMessage =
        typeof errorData === 'string'
          ? errorData
          : isErrorObject(errorData)
            ? errorData.detail || errorData.message || 'Unknown server error'
            : 'Unknown server error';
      throw new Error(errorMessage); // Let this error bubble up directly
    }
    return { data: result?.data };
  } catch (e) {
    // Only catch unexpected errors that aren't from our explicit error handling above
    if (
      e instanceof Error &&
      e.message !== 'Unknown server error' &&
      !isErrorObject(e) &&
      typeof e !== 'string'
    ) {
      throw new Error('something went wrong fetching data');
    }
    throw e; // Re-throw the original error
  }
};
