export interface DiscoverContentCardProps {
    title: string;
    contentType: string;
    url: string;
    image: string;
    id: string;
  }

export interface DiscoverContent {
    type: string;
    data: Record<string, any>;
}

export interface GenericPagination {
    count:number,
    current_page:number,
    total_pages?:number
}