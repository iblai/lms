export interface DiscoverContentCardProps {
  title: string;
  contentType: string;
  url: string;
  image: string;
  /**
   * Course whose metadata supplies the artwork when `image` is empty —
   * enrollment payloads carry none. Looked up lazily, once the card is
   * near the viewport.
   */
  imageCourseId?: string;
  id: string;
  /** The current user is enrolled in this content ("Enrolled" pill). */
  enrolled?: boolean;
  /** This content is recommended for the user ("Recommended" pill). */
  recommended?: boolean;
}

export interface DiscoverContent {
  type: string;
  data: Record<string, any>;
}

export interface GenericPagination {
  count: number;
  current_page: number;
  total_pages?: number;
}
