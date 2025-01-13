import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

function Settings() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions(session?.roleId || '');

  if (!hasPermission('manage_settings')) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">You don't have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      {/* Add your settings content here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p>Settings content coming soon...</p>
      </div>
    </div>
  );
}

export default Settings; 