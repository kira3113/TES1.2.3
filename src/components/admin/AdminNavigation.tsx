import { Users, Database, FileText, Settings } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import type { AdminSection } from '../../types/admin';

interface AdminNavigationProps {
  selectedSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  roleId: string;
}

export function AdminNavigation({ selectedSection, onSectionChange, roleId }: AdminNavigationProps) {
  const { hasPermission } = usePermissions(roleId);

  const sections = [
    {
      id: 'users' as const,
      name: 'User Management',
      icon: Users,
      description: 'Manage user accounts and permissions',
      requiredPermissions: ['manage_users', 'view_users'] as const
    },
    {
      id: 'backup' as const,
      name: 'Backup & Restore',
      icon: Database,
      description: 'Manage system backups and data recovery',
      requiredPermissions: ['manage_backups'] as const
    },
    {
      id: 'logs' as const,
      name: 'System Logs',
      icon: FileText,
      description: 'View system activity and error logs',
      requiredPermissions: ['view_logs'] as const
    },
    {
      id: 'settings' as const,
      name: 'Configuration',
      icon: Settings,
      description: 'System-wide settings and preferences',
      requiredPermissions: ['manage_settings'] as const
    }
  ];

  const availableSections = sections.filter(section => 
    section.requiredPermissions.every(permission => hasPermission(permission))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {availableSections.map(section => (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          className={`p-4 rounded-lg border transition-colors ${
            selectedSection === section.id
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              selectedSection === section.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <section.icon size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-medium">{section.name}</h3>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
} 