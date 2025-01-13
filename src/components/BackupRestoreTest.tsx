import { useState } from 'react';
import { localDB } from '../lib/localStorage';
import { Download, Upload, Trash, Plus, RefreshCw } from 'lucide-react';

export function BackupRestoreTest() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const addTestData = () => {
    try {
      localDB.insert('products', {
        name: "Test iPhone",
        sku: "TEST-123",
        price: 999,
        current_stock: 10,
        category: "Smartphones"
      });
      setStatus('Test data added successfully');
      setError('');
    } catch (err) {
      setError('Failed to add test data');
    }
  };

  const createBackup = () => {
    try {
      localDB.exportBackup();
      setStatus('Backup created successfully');
      setError('');
    } catch (err) {
      setError('Failed to create backup');
    }
  };

  const clearData = () => {
    try {
      localStorage.clear();
      setStatus('Data cleared successfully');
      setError('');
    } catch (err) {
      setError('Failed to clear data');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await localDB.restoreBackup(file);
      setStatus('Data restored successfully');
      setError('');
    } catch (err) {
      setError('Failed to restore data');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6">Backup/Restore Test Panel</h2>

      <div className="space-y-4">
        {/* Add Test Data */}
        <button
          onClick={addTestData}
          className="w-full p-3 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <Plus size={20} />
          Add Test Data
        </button>

        {/* Create Backup */}
        <button
          onClick={createBackup}
          className="w-full p-3 flex items-center justify-center gap-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
        >
          <Download size={20} />
          Create Backup
        </button>

        {/* Clear Data */}
        <button
          onClick={clearData}
          className="w-full p-3 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
        >
          <Trash size={20} />
          Clear All Data
        </button>

        {/* Restore Data */}
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            className="hidden"
            id="restore-file"
          />
          <label
            htmlFor="restore-file"
            className="w-full p-3 flex items-center justify-center gap-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 cursor-pointer"
          >
            <Upload size={20} />
            Restore from Backup
          </label>
        </div>

        {/* View Current Data */}
        <button
          onClick={() => console.log('Current Data:', {
            products: localDB.getAll('products'),
            sales: localDB.getAll('sales'),
            customers: localDB.getAll('customers')
          })}
          className="w-full p-3 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <RefreshCw size={20} />
          View Current Data
        </button>

        {/* Status Messages */}
        {status && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg">
            ✅ {status}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
} 