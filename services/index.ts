import { LOCALSTORAGE_KEYS } from '@/constants/storage';
import { config } from '@/lib/config';
import { getLocalStorageItem } from '@/utils/localstorage';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export function customFakeBaseQuery({
  baseUrl,
  token,
  includeCredentials = false,
}: {
  baseUrl: string;
  token?: string;
  includeCredentials?: boolean;
}) {
  return fetchBaseQuery({
    baseUrl: baseUrl,
    credentials: includeCredentials ? 'include' : 'omit',
    prepareHeaders: (headers, _) => {
      if (token) {
        headers.set('Authorization', token);
      }
      //headers.set('content-type', 'application/json');
      return headers;
    },
  });
}

export function customDMFakeBaseQuery() {
  return customFakeBaseQuery({
    baseUrl: config.urls.dm(),
    token: `Token ` + getLocalStorageItem(LOCALSTORAGE_KEYS.DM_TOKEN_KEY) || '',
    includeCredentials: false,
  });
}

export function customAXDFakeBaseQuery() {
  return customFakeBaseQuery({
    baseUrl: config.urls.axd(),
    token: `Token ` + getLocalStorageItem(LOCALSTORAGE_KEYS.AXD_TOKEN_KEY) || '',
    includeCredentials: false,
  });
}

export function customLMSFakeBaseQuery() {
  return customFakeBaseQuery({
    baseUrl: config.urls.lms(),
    includeCredentials: true,
  });
}

export function customStudioFakeBaseQuery() {
  return customFakeBaseQuery({
    baseUrl: config.urls.studio(),
    includeCredentials: true,
  });
}
