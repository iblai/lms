import { config } from '@/lib/config';
import { isTauriApp } from '@/lib/utils';
import { LOCALSTORAGE_KEYS } from '../constants/storage';
import { getLocalStorageItem } from './localstorage';
import { QUERY_PARAMS } from '@/constants/global';
import { MarkdownMenuItem } from '@/types/utils';

// Set to true during any intentional navigation away from the app (tenant switch,
// logout) to suppress concurrent auth redirects that would race and cancel it.
let _suppressAuthRedirect = false;
export const setTenantSwitching = (value: boolean) => {
  _suppressAuthRedirect = value;
};

/**
 * Checks if a given string is valid JSON
 * @param {string} text - The string to check for JSON validity
 * @returns {boolean} - Returns true if the string is valid JSON, false otherwise
 */
export const isJSON: (text: string) => boolean = (text) => {
  if (typeof text !== 'string') {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Checks if the current window is running inside an iframe
 * @returns {boolean} - Returns true if the window is inside an iframe, false otherwise
 */
export const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

/**
 * Retrieves the current tenant from localStorage
 * @returns {Promise<string>} - Returns the tenant string from localStorage or empty string if not found
 */
export function getTenant() {
  // return "main"
  return getLocalStorageItem(LOCALSTORAGE_KEYS.TENANT) || '';
}

export function getTenants() {
  const tenants = getLocalStorageItem(LOCALSTORAGE_KEYS.TENANTS);
  return tenants && isJSON(tenants) ? JSON.parse(tenants) : [];
}

/**
 * Retrieves the organization from the current tenant in localStorage
 * @returns {string | null} - Returns the organization string from the current tenant or null if not found
 */
export function getOrg() {
  const currentTenant = getLocalStorageItem(LOCALSTORAGE_KEYS.CURRENT_TENANT);
  return currentTenant && isJSON(currentTenant) ? JSON.parse(currentTenant)?.org : null;
}

/**
 * Retrieves the user ID from userData in localStorage
 * @returns {string | null} - Returns the user ID string or null if not found
 */
export function getUserId() {
  const userData = getLocalStorageItem(LOCALSTORAGE_KEYS.USER_DATA);
  return userData && isJSON(userData) ? JSON.parse(userData)?.user_id : null;
}

/**
 * Retrieves the user's display name from userData in localStorage
 * @returns {string | null} - Returns the user's display name or null if not found
 */
export function getUserName() {
  const userData = getLocalStorageItem(LOCALSTORAGE_KEYS.USER_DATA);
  return userData && isJSON(userData) ? JSON.parse(userData)?.user_nicename : null;
}

/**
 * Retrieves the user's display name from userData in localStorage
 * @returns {string | null} - Returns the user's display name or null if not found
 */
export function getUserEmail() {
  const userData = getLocalStorageItem(LOCALSTORAGE_KEYS.USER_DATA);
  return userData && isJSON(userData) ? JSON.parse(userData)?.user_email : null;
}

/**
 * Gets a random course image from the /images/courses/ directory
 * @returns {string} - Returns the path to a random course image
 */
export function getRandomCourseImage(): string {
  const courseImages = [
    '/images/courses/c1s.jpeg',
    '/images/courses/c2s.jpeg',
    '/images/courses/c3s.jpeg',
    '/images/courses/c4s.jpeg',
    '/images/courses/c5s.jpeg',
    '/images/courses/c6s.jpeg',
    '/images/courses/c7s.jpeg',
    '/images/courses/c8s.jpeg',
  ];
  const randomIndex = Math.floor(Math.random() * courseImages.length);
  return courseImages[randomIndex];
}

export function getContentImage(imagePath: string): string {
  return imagePath || getRandomCourseImage();
}

/**
 * Converts a string to a URL-friendly slug
 * @param {string} text - The string to convert to a slug
 * @returns {string} - Returns the slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim(); // Remove leading/trailing spaces
}

/**
 * Returns an array of month data with value (month number) and label (month name)
 * @returns {Array<{value: number, label: string}>} - Returns array of month data
 */
export function getMonthsData(): Array<{ value: number; label: string }> {
  return [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
}

export const inBrowserPrint = (layoutToPrint: HTMLDivElement | null) => {
  if (layoutToPrint) {
    layoutToPrint.classList.add('in-browser-printable');
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .in-browser-printable, .in-browser-printable * {
          visibility: visible;
        }
        .in-browser-printable {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
    layoutToPrint.classList.remove('in-browser-printable');
  }
};

export function getDiscoverFacetsToHide() {
  const facetsToHide = config.settings.discoverFacetsToHide();
  return facetsToHide ? facetsToHide.split(',') : [];
}

export function isRecommendedTabHidden() {
  return config.settings.hideRecommendedTab();
}

export function getTimeAgo(createdAt: string) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMilliseconds = now.getTime() - created.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hrs ago`;
  } else {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
}

export async function redirectToAuthSpa(
  redirectTo?: string,
  platformKey?: string,
  logout?: boolean,
  saveRedirect = true,
) {
  // Suppress auth redirects while an intentional navigation is already in flight
  if (_suppressAuthRedirect) return;
  localStorage.clear();

  if (logout) {
    // Delete authentication cookies for cross-SPA synchronization
    const currentDomain = window.location.hostname;
    deleteCookieOnAllDomains('ibl_current_tenant', currentDomain);
    deleteCookieOnAllDomains('ibl_user_data', currentDomain);
    deleteCookieOnAllDomains('ibl_tenant', currentDomain);
  }

  const redirectPath = redirectTo ?? `${window.location.pathname}${window.location.search}`;

  console.log('################### [redirectToAuthSpa] redirectPath', redirectPath);

  // Never save sso-login routes as redirect paths
  if (
    !redirectPath.startsWith('/sso-login') &&
    !redirectPath.startsWith('/sso-login-complete') &&
    saveRedirect
  ) {
    window.localStorage.setItem(LOCALSTORAGE_KEYS.REDIRECT_TO, redirectPath);
  }

  const platform = platformKey ?? getTenant();

  const redirectToUrl = isTauriApp() ? 'iblai-skills://' : `${window.location.origin}`;

  let authRedirectUrl = `${config.urls.auth()}/login?${QUERY_PARAMS.APP}=${config.settings.appName()}`;

  authRedirectUrl += `&${QUERY_PARAMS.REDIRECT_TO}=${redirectToUrl}`;

  if (platform) {
    authRedirectUrl += `&${QUERY_PARAMS.TENANT}=${platform}`;
  }
  if (logout) {
    authRedirectUrl += '&logout=1';
  }

  window.location.href = authRedirectUrl;
}

export function hasNonExpiredAuthToken() {
  const token = getLocalStorageItem(LOCALSTORAGE_KEYS.AUTH_TOKEN);
  if (!token) {
    console.log('################### [hasNonExpiredAuthToken] axd token is not defined', token);
    return true;
  }

  const tokenExpiry = getLocalStorageItem(LOCALSTORAGE_KEYS.TOKEN_EXPIRY);
  if (!tokenExpiry) {
    console.log(
      '################### [hasNonExpiredAuthToken] axd token expiry is not defined',
      tokenExpiry,
    );
    return true;
  }

  const expiryDate = new Date(tokenExpiry);
  if (isNaN(expiryDate.getTime())) {
    console.log('################### [hasNonExpiredAuthToken] axd token expiry date', expiryDate);
    return false;
  }

  const currentDate = new Date();
  if (expiryDate <= currentDate) {
    console.log(
      '################### [hasNonExpiredAuthToken] axd token expiry date is less than current date ',
      expiryDate,
      currentDate,
    );
    return false;
  }

  return true;
}

export function isInIframe() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window?.self !== window?.top;
}

export function deleteCookie(name: string, path: string, domain: string) {
  // Set the cookie expiration date to the past
  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  // Set the cookie value to empty
  const cookieValue = name + '=;';
  // Set the path attribute
  const pathValue = path ? 'path=' + path + ';' : '';
  // Set the domain attribute
  const domainValue = domain ? 'domain=' + domain + ';' : '';

  // Delete the cookie for the given path and domain
  document.cookie = cookieValue + expires + pathValue + domainValue;
}

export function getDomainParts(domain: string) {
  const parts = domain.split('.');
  const domains = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    domains.push(parts.slice(i).join('.'));
  }
  return domains;
}

export function deleteCookieOnAllDomains(name: string, childDomain: string) {
  getDomainParts(childDomain).forEach((domainPart) => {
    deleteCookie(name, '/', domainPart);
    deleteCookie(name, '', domainPart);
  });
}

export function getParentDomain(domain?: string) {
  if (!domain) {
    return '';
  }
  const parts = domain.split('.');
  return parts.length > 1 ? `.${parts.slice(-2).join('.')}` : domain;
}

/**
 * Helper to set a cookie with base domain for cross-SPA sharing
 */
function setCookieForAuth(name: string, value: string, days: number = 365): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const hostname = window.location.hostname;
  let baseDomain = hostname;

  // Calculate base domain
  if (hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      baseDomain = `.${parts.slice(-2).join('.')}`;
    }
  }

  const domainAttr = baseDomain ? `;domain=${baseDomain}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=None;Secure${domainAttr}`;
}

export function clearCookies() {
  // Clear cookies
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    deleteCookieOnAllDomains(name, window.location.hostname);
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;Domain=${getParentDomain(
      window.location.hostname,
    )}`;
  }
}

export const onAccountDeleted = () => {
  setTimeout(() => {
    handleLogout();
  }, 3000);
};

export const handleLogout = (
  redirectUrl = window.location.origin,
  callback?: () => void,
  alternateTenant?: string,
  enforceLogin?: boolean,
) => {
  const tenant = alternateTenant ?? getTenant();
  _suppressAuthRedirect = true;
  window.localStorage.clear();
  window.localStorage.setItem(LOCALSTORAGE_KEYS.TENANT, tenant ?? '');

  clearCookies();
  callback?.();

  if (!isInIframe()) {
    window.location.href = `${config.urls.auth()}/logout?redirect-to=${redirectUrl}${tenant ? '&tenant=' + tenant : ''}${enforceLogin ? '&enforce-login=1' : ''}`;
    // Set logout timestamp cookie to trigger logout on other SPAs
    setCookieForAuth('ibl_logout_timestamp', Date.now().toString());
    setTimeout(() => {
      _suppressAuthRedirect = false;
    }, 2000);
  } else {
    _suppressAuthRedirect = false;
  }
};

export const parseMarkdownLinks = (markdownString: string): MarkdownMenuItem[] => {
  const links: MarkdownMenuItem[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  try {
    while ((match = linkRegex.exec(markdownString)) !== null) {
      links.push({
        label: match[1],
        link: match[2],
      });
    }

    return links;
  } catch (error) {
    return [];
  }
};

/**
 * Redirects to the auth SPA's login/complete endpoint for the given tenant,
 * forwarding back to `redirectTo` (defaults to the current URL) on success.
 * Use when the app needs to acquire/refresh a session for a specific tenant
 * without clearing local storage (unlike `handleTenantSwitch`).
 */
export const switchTenant = (tenantKey: string, redirectTo?: string) => {
  const params = new URLSearchParams({
    tenant: tenantKey,
    'redirect-to': redirectTo ?? window.location.href,
  }).toString();
  window.location.href = `${config.urls.auth()}/login/complete?${params}`;
};

export const handleTenantSwitch = async (tenant: string, saveRedirect = false) => {
  // Suppress concurrent auth redirects SYNCHRONOUSLY before any await, so no
  // pending microtask (e.g. an in-flight syncCookiesToLocalStorage completing)
  // can call redirectToAuthSpa before the flag is set.
  _suppressAuthRedirect = true;

  // Clear current tenant cookie before switching
  const { clearCurrentTenantCookie } = await import('@iblai/iblai-js/web-utils');
  clearCurrentTenantCookie();

  // Preserve the current path before clearing localStorage
  const currentPath = `${window.location.pathname}${window.location.search}`;
  localStorage.clear();

  const url = `${config.urls.auth()}/login/complete`;
  const param = new URLSearchParams({
    tenant,
    'redirect-to': window.location.origin,
  }).toString();

  localStorage.setItem('tenant', tenant);
  if (saveRedirect) {
    localStorage.setItem('redirect-to', currentPath);
  }
  window.location.href = `${url}?${param}`;
  setTimeout(() => {
    _suppressAuthRedirect = false;
  }, 2000);
};

export const DEFAULT_OVERVIEW_PLACEHOLDER = `<section class="about">
  <h2>About This Course</h2>
  <p>Include your long course description here. The long course description should contain 150-400 words.</p>
  <p>This is paragraph 2 of the long course description. Add more paragraphs as needed. Make sure to enclose them in paragraph tags.</p>
</section>
<section class="prerequisites">
  <h2>Requirements</h2>
  <p>Add information about the skills and knowledge students need to take this course.</p>
</section>
<section class="course-staff">
  <h2>Course Staff</h2>
  <article class="teacher">
    <div class="teacher-image">
      <img src="/static/images/placeholder-faculty.png" align="left" alt="Course Staff Image #1" />
    </div>
    <h3>Staff Member #1</h3>
    <p>Biography of instructor/staff member #1</p>
  </article>
  <article class="teacher">
    <div class="teacher-image">
      <img src="/static/images/placeholder-faculty.png" align="left" alt="Course Staff Image #2" />
    </div>
    <h3>Staff Member #2</h3>
    <p>Biography of instructor/staff member #2</p>
  </article>
</section>
<section class="faq">
  <section class="responses">
    <h2>Frequently Asked Questions</h2>
    <article class="response">
      <h3>What web browser should I use?</h3>
      <p>The Open edX platform works best with current versions of Chrome, Edge, Firefox, or Safari.</p>
      <p>See our <a href="https://edx.readthedocs.org/projects/open-edx-learner-guide/en/latest/front_matter/browsers.html">list of supported browsers</a> for the most up-to-date information.</p>
    </article>
    <article class="response">
      <h3>Question #2</h3>
      <p>Your answer would be displayed here.</p>
    </article>
  </section>
</section>`;
