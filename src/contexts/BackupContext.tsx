import { createContext, useContext, useEffect, useState } from 'react';
import { backupSystem } from '../lib/backupSystem';

interface BackupContextType {
  isBackupInProgress: boolean;
  lastBackupTime: string | null;
  createManualBackup: () => Promise<void>;
}

const BackupContext = createContext<BackupContextType | null>(null);

export function BackupProvider({ children }: { children: React.ReactNode }) {
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  useEffect(() => {
    // Handle startup backup
    const handleStartup = async () => {
      setIsBackupInProgress(true);
      try {
        await backupSystem.handleStartupBackup();
        const latest = backupSystem.getLatestBackup();
        if (latest) setLastBackupTime(latest.timestamp);
      } catch (error) {
        console.error('Startup backup failed:', error);
      }
      setIsBackupInProgress(false);
    };

    // Handle shutdown backup
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      await backupSystem.handleShutdownBackup();
    };

    handleStartup();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const createManualBackup = async () => {
    setIsBackupInProgress(true);
    try {
      await backupSystem.createBackup('manual');
      const latest = backupSystem.getLatestBackup();
      if (latest) setLastBackupTime(latest.timestamp);
    } catch (error) {
      console.error('Manual backup failed:', error);
    }
    setIsBackupInProgress(false);
  };

  return (
    <BackupContext.Provider value={{
      isBackupInProgress,
      lastBackupTime,
      createManualBackup
    }}>
      {children}
    </BackupContext.Provider>
  );
}

export const useBackup = () => {
  const context = useContext(BackupContext);
  if (!context) {
    throw new Error('useBackup must be used within a BackupProvider');
  }
  return context;
}; 