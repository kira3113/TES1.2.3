import { useBackup } from '../contexts/BackupContext';
import { Save } from 'lucide-react';

export function BackupIndicator() {
  const { isBackupInProgress, lastBackupTime } = useBackup();

  if (!isBackupInProgress && !lastBackupTime) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
      {isBackupInProgress ? (
        <>
          <Save className="animate-spin text-blue-600" size={16} />
          <span className="text-sm text-gray-600">Backup in progress...</span>
        </>
      ) : lastBackupTime ? (
        <>
          <Save className="text-green-600" size={16} />
          <span className="text-sm text-gray-600">
            Last backup: {new Date(lastBackupTime).toLocaleString()}
          </span>
        </>
      ) : null}
    </div>
  );
} 