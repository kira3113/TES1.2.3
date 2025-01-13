import { useState } from 'react';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import type { Role, Permission } from '../../types/permission';
import { roleTemplates } from '../../data/roleTemplates';
import { isRolePermissions } from '../../utils/typeGuards';

const DEFAULT_PERMISSIONS: Permission[] = [
  'manage_users', 'view_users',
  'manage_products', 'view_products',
  'manage_sales', 'view_sales',
  'manage_customers', 'view_customers',
  'view_reports',
  'manage_settings',
  'view_logs',
  'manage_backups'
];

const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: 'Manage Users',
  view_users: 'View Users',
  manage_products: 'Manage Products',
  view_products: 'View Products',
  manage_sales: 'Manage Sales',
  view_sales: 'View Sales',
  manage_customers: 'Manage Customers',
  view_customers: 'View Customers',
  view_reports: 'View Reports',
  manage_settings: 'Manage Settings',
  view_logs: 'View Logs',
  manage_backups: 'Manage Backups'
};

interface PermissionsManagerProps {
  roles: Role[];
  onUpdateRole: (role: Role) => void;
  onCreateRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
}

export function PermissionsManager({ roles, onUpdateRole, onCreateRole, onDeleteRole }: PermissionsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: Object.fromEntries(
      DEFAULT_PERMISSIONS.map(p => [p, false])
    ) as Role['permissions']
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handlePermissionToggle = (permission: Permission, role?: Role) => {
    if (role) {
      const updatedRole = {
        ...role,
        permissions: {
          ...role.permissions,
          [permission]: !role.permissions[permission]
        }
      };
      onUpdateRole(updatedRole);
      return;
    }

    setNewRole(prev => {
      const currentPermissions = prev.permissions || {};
      if (!isRolePermissions(currentPermissions)) {
        return prev;
      }
      return {
        ...prev,
        permissions: {
          ...currentPermissions,
          [permission]: !currentPermissions[permission]
        }
      };
    });
  };

  const handleCreateRole = () => {
    if (!newRole.name) return;
    
    onCreateRole({
      id: crypto.randomUUID(),
      name: newRole.name,
      description: newRole.description || '',
      permissions: newRole.permissions as Role['permissions']
    });

    setNewRole({
      name: '',
      description: '',
      permissions: Object.fromEntries(
        DEFAULT_PERMISSIONS.map(p => [p, false])
      ) as Role['permissions']
    });
    setIsCreating(false);
    setSelectedTemplate('');
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    if (templateName) {
      const template = roleTemplates.find(t => t.name === templateName);
      if (template) {
        setNewRole({
          name: template.name,
          description: template.description,
          permissions: { ...template.permissions }
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">Role & Permissions</h2>
          <p className="text-sm text-gray-500">Manage user roles and their permissions</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <Plus size={16} />
          Add Role
        </button>
      </div>

      {/* Role Creation Form */}
      {isCreating && (
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={newRole.name}
              onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Store Manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newRole.description}
              onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Role description..."
            />
          </div>

          <div>
            <h3 className="font-medium mb-2">Permissions</h3>
            <div className="grid grid-cols-3 gap-4">
              {DEFAULT_PERMISSIONS.map(permission => (
                <label key={permission} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newRole.permissions?.[permission] || false}
                    onChange={() => handlePermissionToggle(permission)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm">{PERMISSION_LABELS[permission]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start from Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Custom Role</option>
              {roleTemplates.map(template => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRole}
              disabled={!newRole.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create Role
            </button>
          </div>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-4">
        {roles.map(role => (
          <div key={role.id} className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <Shield size={16} className="text-blue-600" />
                  {role.name}
                  {role.isSystem && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      System Role
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">{role.description}</p>
              </div>
              {!role.isSystem && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingRole(role)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${role.name} role?`)) {
                        onDeleteRole(role.id);
                      }
                    }}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {DEFAULT_PERMISSIONS.map(permission => (
                <label
                  key={permission}
                  className={`flex items-center gap-2 ${role.isSystem ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={role.permissions[permission]}
                    onChange={() => !role.isSystem && handlePermissionToggle(permission, role)}
                    disabled={role.isSystem}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm">{PERMISSION_LABELS[permission]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Edit Role: {editingRole.name}</h3>
            {/* Add your edit form here */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle save changes
                  setEditingRole(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 