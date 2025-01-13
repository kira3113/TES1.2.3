import type { ActivityLog, ActivityType } from '../types/activity';

const ACTIVITY_LOGS_KEY = 'activity_logs';

export const activityService = {
  getLogs(): ActivityLog[] {
    const logs = localStorage.getItem(ACTIVITY_LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  },

  saveLogs(logs: ActivityLog[]): void {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs));
  },

  addLog(type: ActivityType, userId: string, userEmail: string, description: string, metadata?: Record<string, any>): ActivityLog {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      type,
      userId,
      userEmail,
      description,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    logs.unshift(newLog); // Add to beginning of array
    this.saveLogs(logs);
    return newLog;
  },

  clearLogs(): void {
    this.saveLogs([]);
  },

  getLogsByUser(userId: string): ActivityLog[] {
    return this.getLogs().filter(log => log.userId === userId);
  },

  getLogsByType(type: ActivityType): ActivityLog[] {
    return this.getLogs().filter(log => log.type === type);
  }
}; 