import { useState } from 'react';
import { X, FileText, Table, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { User } from '../../types/user';

interface ExportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  selectedUsers: string[];
  onExport: () => void;
}

export function ExportUsersModal({ isOpen, onClose, users, selectedUsers, onExport }: ExportUsersModalProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('excel');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const usersToExport = selectedUsers.length > 0
    ? users.filter(user => selectedUsers.includes(user.id))
    : users;

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = usersToExport.map(user => ({
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Status: user.status,
        'Last Login': new Date(user.lastLogin).toLocaleString()
      }));

      if (format === 'csv') {
        // Export as CSV
        const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login'];
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => 
              JSON.stringify(row[header as keyof typeof row])
            ).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `users_export_${new Date().toISOString()}.csv`);
      } else {
        // Export as Excel
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Users');
        XLSX.writeFile(wb, `users_export_${new Date().toISOString()}.xlsx`);
      }

      onExport();
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Export Users</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Exporting {usersToExport.length} user{usersToExport.length !== 1 ? 's' : ''}
            </p>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                  className="text-blue-600"
                />
                <Table size={20} className="text-gray-400" />
                <div>
                  <p className="font-medium">Excel Format</p>
                  <p className="text-sm text-gray-500">Export as .xlsx file</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="text-blue-600"
                />
                <FileText size={20} className="text-gray-400" />
                <div>
                  <p className="font-medium">CSV Format</p>
                  <p className="text-sm text-gray-500">Export as .csv file</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 