export interface CatalogRole {
  type: 'role';
  data: {
    id: number;
    name: string;
    slug: string;
    data?: Record<string, any>;
    platform: string | null;
    platform_name: string | null;
  };
}
