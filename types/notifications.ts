export interface NotificationCount {
  count: number;
}

export interface NotificationContext {
  title?: string;
  message?: string;
  departments?: string[];
  initiated_by?: string;
  platform_key?: string;
  template_data?: {
    message_body: string;
    message_title: string;
  };
}

export interface Notification {
  id: string;
  username: string;
  title: string;
  body: string;
  status: 'READ' | 'UNREAD';
  channel: string | null;
  context: NotificationContext;
  short_message: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}
