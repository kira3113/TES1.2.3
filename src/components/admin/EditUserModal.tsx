import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { toast } from 'react-hot-toast';
import type { User } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User) => void;
  user: User;
}

export function EditUserModal({ isOpen, onClose, onSubmit, user }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [roles] = useState(() => roleService.getRoles());
  const { session } = useAuth();
  const isAdmin = session?.roleId === 'admin';

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    status: user.status
  });

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        ...(isAdmin && formData.password ? { password: formData.password } : {})
      };
      
      const updatedUser = userService.updateUser(user.id, updateData);
      onSubmit(updatedUser);
      toast.success('User updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update user');
      setErrors(['An unexpected error occurred']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Edit User</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <ul className="list-disc list-inside text-sm text-red-600">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password (leave empty to keep current)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded"
                placeholder="Enter new password"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Updating...
                </>
              ) : (
                'Update User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 