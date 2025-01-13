import { useState, useEffect } from 'react';
import { Shield, Edit, Trash2, UserPlus, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { AddUserModal } from '../components/admin/AddUserModal';
import { EditUserModal } from '../components/admin/EditUserModal';
import { ExportUsersModal } from '../components/admin/ExportUsersModal';
import { ActivityLogs } from '../components/admin/ActivityLogs';
import { PermissionsManager } from '../components/admin/PermissionsManager';
import { userService } from '../services/userService';
import { activityService } from '../services/activityService';
import { roleService } from '../services/roleService';
import { toast } from 'react-hot-toast';
import type { User } from '../types/user';
import type { Role } from '../types/permission';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AdminNavigation } from '../components/admin/AdminNavigation';
import type { AdminSection } from '../types/admin';

export default function Admin() {
  const [selectedSection, setSelectedSection] = useState<AdminSection>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<User['role'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<User['status'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { hasPermission } = usePermissions('admin');

  useEffect(() => {
    // Load users from localStorage on mount
    setUsers(userService.getUsers());
  }, []);

  useEffect(() => {
    // Load roles from localStorage on mount
    setRoles(roleService.getRoles());
  }, []);

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'staff': return 'bg-green-100 text-green-700';
    }
  };

  const getStatusBadgeColor = (status: User['status']) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700';
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    activityService.addLog(
      'create_user',
      'admin', // TODO: Replace with actual admin user ID
      'admin@example.com', // TODO: Replace with actual admin email
      `Created new user: ${newUser.name}`,
      { user: newUser }
    );
  };

  const handleEditUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    activityService.addLog(
      'update_user',
      'admin',
      'admin@example.com',
      `Updated user: ${updatedUser.name}`,
      { user: updatedUser }
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userToDelete = users.find(u => u.id === userId);
        userService.deleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
        activityService.addLog(
          'delete_user',
          'admin',
          'admin@example.com',
          `Deleted user: ${userToDelete?.name}`,
          { userId, userName: userToDelete?.name }
        );
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'email':
          return order * a.email.localeCompare(b.email);
        case 'role':
          return order * a.role.localeCompare(b.role);
        case 'status':
          return order * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (!selectedUsers.length) return;
    
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
      
      try {
        const usersToDelete = users.filter(u => selectedUsers.includes(u.id));
        selectedUsers.forEach(id => userService.deleteUser(id));
        setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        toast.success('Users deleted successfully');
        activityService.addLog(
          'bulk_update',
          'admin',
          'admin@example.com',
          `Bulk deleted ${selectedUsers.length} users`,
          { action: 'delete', users: usersToDelete }
        );
      } catch (error) {
        toast.error('Failed to delete users');
      }
    } else {
      const newStatus: User['status'] = action === 'activate' ? 'active' : 'inactive';
      try {
        const updatedUsers = selectedUsers.map(id => userService.updateUser(id, { status: newStatus }));
        setUsers(prev => prev.map(user => {
          const updated = updatedUsers.find(u => u.id === user.id);
          return updated || user;
        }));
        toast.success(`Users ${action}d successfully`);
        activityService.addLog(
          'bulk_update',
          'admin',
          'admin@example.com',
          `Bulk ${action}d ${selectedUsers.length} users`,
          { action, users: updatedUsers }
        );
      } catch (error) {
        toast.error(`Failed to ${action} users`);
      }
    }
    
    setSelectedUsers([]);
  };

  const handleExportUsers = () => {
    activityService.addLog(
      'export_users',
      'admin',
      'admin@example.com',
      `Exported ${selectedUsers.length ? selectedUsers.length : 'all'} users`,
      { selectedUsers: selectedUsers.length ? selectedUsers : 'all' }
    );
  };

  const handleUpdateRole = (updatedRole: Role) => {
    try {
      const updated = roleService.updateRole(updatedRole.id, updatedRole);
      setRoles(prev => prev.map(role => 
        role.id === updated.id ? updated : role
      ));
      toast.success('Role updated successfully');
      activityService.addLog(
        'update_user',
        'admin',
        'admin@example.com',
        `Updated role: ${updated.name}`,
        { role: updated }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleCreateRole = (newRole: Role) => {
    try {
      const created = roleService.createRole(newRole);
      setRoles(prev => [...prev, created]);
      toast.success('Role created successfully');
      activityService.addLog(
        'create_user',
        'admin',
        'admin@example.com',
        `Created new role: ${created.name}`,
        { role: created }
      );
    } catch (error) {
      toast.error('Failed to create role');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    try {
      const roleToDelete = roles.find(r => r.id === roleId);
      roleService.deleteRole(roleId);
      setRoles(prev => prev.filter(role => role.id !== roleId));
      toast.success('Role deleted successfully');
      activityService.addLog(
        'delete_user',
        'admin',
        'admin@example.com',
        `Deleted role: ${roleToDelete?.name}`,
        { roleId, roleName: roleToDelete?.name }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="text-blue-600" size={32} />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-500">System administration and management</p>
        </div>
      </div>

      {/* Section Selector */}
      <AdminNavigation
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        roleId="admin" // TODO: Replace with actual user's role
      />

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm">
        {selectedSection === 'users' && (
          <ProtectedRoute
            requiredPermissions={['view_users']}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">User Management</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    disabled={!hasPermission('manage_users')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                  >
                    <UserPlus size={16} />
                    Add User
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  </div>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as User['role'] | 'all')}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as User['status'] | 'all')}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'role' | 'status')}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="email">Sort by Email</option>
                    <option value="role">Sort by Role</option>
                    <option value="status">Sort by Status</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border rounded-lg hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="mb-4 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-600">
                    {selectedUsers.length} users selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === paginatedUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(paginatedUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Login</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, user.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(user.lastLogin).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingUser(user)}
                              disabled={!hasPermission('manage_users')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={!hasPermission('manage_users')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded ${
                        currentPage === page
                          ? 'bg-blue-50 text-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        )}

        {selectedSection === 'backup' && (
          <ProtectedRoute
            requiredPermissions={['manage_backups']}
          >
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Backup & Restore</h2>
              <p className="text-gray-600">Backup functionality will be implemented here.</p>
            </div>
          </ProtectedRoute>
        )}
        {selectedSection === 'logs' && (
          <div className="p-6">
            <ActivityLogs />
          </div>
        )}
        {selectedSection === 'settings' && (
          <div className="p-6">
            <PermissionsManager
              roles={roles}
              onUpdateRole={handleUpdateRole}
              onCreateRole={handleCreateRole}
              onDeleteRole={handleDeleteRole}
            />
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
      />

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEditUser}
          user={editingUser}
        />
      )}

      <ExportUsersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        users={filteredUsers}
        selectedUsers={selectedUsers}
        onExport={handleExportUsers}
      />
    </div>
  );
} 