export interface Backup {
  id: string;
  timestamp: string;
  size: number;
  type: 'auto' | 'manual' | 'startup' | 'shutdown';
  data: {
    products: any[];
    customers: any[];
    sales: any[];
    settings: any;
  };
  metadata: {
    productsCount: number;
    customersCount: number;
    salesCount: number;
    version: string;
  };
}

export interface BackupSystem {
  // Core backup operations
  createBackup: (type: Backup['type']) => Promise<Backup>;
  restoreBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  downloadBackup: (backupId: string) => Promise<void>;
  
  // Backup management
  getBackups: () => Backup[];
  getLatestBackup: () => Backup | null;
  
  // Auto-backup triggers
  handleStartupBackup: () => Promise<void>;
  handleShutdownBackup: () => Promise<void>;
  handleDataChange: () => Promise<void>;
} 