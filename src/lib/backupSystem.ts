import { localDB } from './localStorage';
import type { Backup, BackupSystem } from '../types/backup';

export const backupSystem: BackupSystem = {
  async createBackup(type: Backup['type']) {
    const backup: Backup = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      data: {
        products: localDB.getAll('products'),
        customers: localDB.getAll('customers'),
        sales: localDB.getAll('sales'),
        settings: localDB.get('settings')
      },
      size: 0,
      metadata: {
        productsCount: localDB.getAll('products').length,
        customersCount: localDB.getAll('customers').length,
        salesCount: localDB.getAll('sales').length,
        version: '1.0'
      }
    };

    // Calculate size
    const serialized = JSON.stringify(backup);
    backup.size = new Blob([serialized]).size;

    // Store backup
    const backups = this.getBackups();
    backups.push(backup);
    localStorage.setItem('backups', JSON.stringify(backups));

    console.log(`✅ Created ${type} backup:`, backup.id);
    return backup;
  },

  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.getBackups().find(b => b.id === backupId);
    if (!backup) throw new Error('Backup not found');

    // Restore all data
    localDB.set('products', backup.data.products);
    localDB.set('customers', backup.data.customers);
    localDB.set('sales', backup.data.sales);
    localDB.set('settings', backup.data.settings);

    console.log('✅ Restored backup:', backupId);
  },

  async deleteBackup(backupId: string): Promise<void> {
    const backups = this.getBackups().filter(b => b.id !== backupId);
    localStorage.setItem('backups', JSON.stringify(backups));
    console.log('🗑️ Deleted backup:', backupId);
  },

  async downloadBackup(backupId: string): Promise<void> {
    const backup = this.getBackups().find(b => b.id === backupId);
    if (!backup) throw new Error('Backup not found');

    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getBackups() {
    return JSON.parse(localStorage.getItem('backups') || '[]');
  },

  getLatestBackup() {
    const backups = this.getBackups();
    return backups.length > 0 ? backups[backups.length - 1] : null;
  },

  async handleStartupBackup(): Promise<void> {
    await this.createBackup('startup');
  },

  async handleShutdownBackup(): Promise<void> {
    await this.createBackup('shutdown');
  },

  async handleDataChange(): Promise<void> {
    await this.createBackup('auto');
  }
}; 