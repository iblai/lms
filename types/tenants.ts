export interface TenantPublic {
  ibl_custom_logo: string;
}

export interface Tenant {
  user_id: number;
  username: string;
  email: string;
  user_active: boolean;
  key: string;
  org: string;
  lms_url: string;
  cms_url: string;
  portal_url: string;
  is_admin: boolean;
  is_staff: boolean;
  added_on: string;
  expired_on: string | null;
  public: TenantPublic;
  active: boolean;
}
