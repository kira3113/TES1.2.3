export type ActivityType = 
  | 'login'
  | 'logout'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'bulk_update'
  | 'export_users';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  userId: string;
  userEmail: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
} 