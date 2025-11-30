export interface GlobalNotification {
  global_id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export interface UserNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationResponse {
  global: GlobalNotification[];
  user: UserNotification[];
}
