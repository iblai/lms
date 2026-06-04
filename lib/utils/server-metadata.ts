import { config } from '@/lib/config';

// Server-safe default app information for skillsAI
const DEFAULT_APP_INFORMATION = {
  metaTitle: 'skillsAI',
  favicon: '/favicon.ico',
  description: 'Build Your Skills with AI',
  logo: '/skills-logo.png',
};

interface AppWebConfig {
  authorize_only_password_login?: boolean;
  title?: string;
  display_title_info?: string;
  display_description_info?: string;
  display_images?: Array<{ image: string; alt: string }>;
  display_logo?: string;
  display_slide_panel_logo?: string;
  favicon?: string;
  privacy_policy_url?: string;
  terms_of_use_url?: string;
}

interface TenantMetadata {
  platform_key: string;
  platform_name: string;
  metadata: {
    show_faq?: boolean;
    show_help?: boolean;
    support_email?: string;
    show_web_search?: string;
    accessibility_menu?: boolean;
    auth_web_skillsai?: AppWebConfig;
    auth_web_mentorai?: AppWebConfig;
    auth_web_analyticsai?: AppWebConfig;
    [key: string]: unknown;
  };
}

interface CustomDomain {
  id: number;
  custom_domain: string;
  spa: string;
  spa_display?: string;
  registered_with_dns_pro?: boolean;
  dns_pro_display?: string;
  instructions?: string;
  platform_id?: number;
  platform_key?: string;
  platform_name?: string;
  platform_metadata?: {
    auth_web_skillsai?: AppWebConfig;
    auth_web_mentorai?: AppWebConfig;
    auth_web_analyticsai?: AppWebConfig;
  };
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

interface CustomDomainsResponse {
  custom_domains: CustomDomain[];
  count: number;
}

/**
 * Fetches tenant metadata from the server
 */
async function fetchTenantMetadata(tenantKey: string): Promise<TenantMetadata | null> {
  try {
    const baseUrl = config.urls.dm();
    const url = `${baseUrl}/api/core/orgs/${tenantKey}/metadata/`;

    const response = await fetch(url, {
      cache: 'no-store', // Ensure fresh data for metadata
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch tenant metadata:', error);
    return null;
  }
}

/**
 * Fetches custom domain metadata from the server
 */
async function fetchCustomDomainMetadata(domain: string): Promise<AppWebConfig | null> {
  try {
    const baseUrl = config.urls.dm();
    const response = await fetch(
      `${baseUrl}/api/custom-domains?domain=${encodeURIComponent(domain)}`,
      {
        cache: 'no-store', // Ensure fresh data for metadata
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: CustomDomainsResponse = await response.json();

    // Check if we have a response with custom_domains array
    if (data && Array.isArray(data.custom_domains)) {
      // Find first match where skillsai is contained in the spa key
      const match = data.custom_domains.find((cd: CustomDomain) =>
        cd.spa?.toLowerCase().includes('skillsai'),
      );

      if (match?.platform_metadata) {
        const metadata = match.platform_metadata.auth_web_skillsai;
        return metadata || null;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch custom domain data:', error);
    return null;
  }
}

/**
 * Parses a cookie string and returns the value of a specific cookie
 */
function getCookieValue(cookieString: string | null, name: string): string | null {
  if (!cookieString) return null;

  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValueParts.join('='));
    }
  }
  return null;
}

/**
 * Fetches metadata for the app based on domain and tenant
 * Priority: custom domain > tenant cookie > defaults
 */
export async function fetchAppMetadata(
  host?: string,
  tenantCookie?: string | null,
): Promise<{ title: string; favicon: string; description: string; logo: string }> {
  const defaults = DEFAULT_APP_INFORMATION;

  let metadata: AppWebConfig | null = null;

  // Priority 1: Fetch custom domain metadata if host is provided
  if (host) {
    metadata = await fetchCustomDomainMetadata(host);
  }

  // Priority 2: Fetch tenant metadata if tenantCookie is provided and no custom domain metadata found
  if (!metadata && tenantCookie) {
    const tenantData = await fetchTenantMetadata(tenantCookie);

    if (tenantData?.metadata) {
      metadata = tenantData.metadata.auth_web_skillsai || null;
    }
  }

  // Apply metadata if found, otherwise use defaults
  if (metadata && typeof metadata === 'object') {
    return {
      title: metadata.title || metadata.display_title_info || defaults.metaTitle,
      favicon: metadata.favicon || defaults.favicon,
      description: metadata.display_description_info || defaults.description,
      logo: metadata.display_logo || defaults.logo,
    };
  }

  // Fallback to defaults
  return {
    title: defaults.metaTitle,
    favicon: defaults.favicon,
    description: defaults.description,
    logo: defaults.logo,
  };
}

/**
 * Extracts tenant key from cookies
 * Priority: ibl_current_tenant (JSON with key) > tenant (plain string)
 *
 * Note: localStorage is not accessible server-side, so we rely on cookies
 * that are synced from localStorage by the auth-provider
 */
export function extractTenantFromCookies(cookieString: string | null): string | null {
  if (!cookieString) return null;

  // Priority 1: Try ibl_current_tenant (JSON format with 'key' property)
  const currentTenantCookie = getCookieValue(cookieString, 'ibl_current_tenant');
  if (currentTenantCookie) {
    try {
      const parsed = JSON.parse(currentTenantCookie);
      if (parsed?.key) {
        return parsed.key;
      }
    } catch {
      // If parsing fails, the cookie might be corrupted, continue to fallback
    }
  }

  // Priority 2: Try plain 'tenant' cookie (simple string value)
  const tenantCookie = getCookieValue(cookieString, 'tenant');
  if (tenantCookie) {
    return tenantCookie;
  }

  return null;
}

// Check if we're in a development environment
export const isDevelopment = process.env.NODE_ENV === 'development';

// Log environment information (useful for debugging)
export const logEnvironmentInfo = (): void => {
  if (typeof window === 'undefined') {
    console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Server] API Base URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}`);
  }
};
