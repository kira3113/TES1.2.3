import type { Role } from '../types/permission';
import { getEffectivePermissions } from '../utils/roleHierarchy';
import { roleTemplates } from '../data/roleTemplates';

const ROLES_KEY = 'roles';

export const roleService = {
  getRoles(): Role[] {
    return roleTemplates;
  },

  saveRoles(roles: Role[]): void {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  },

  createRole(role: Partial<Role> & Pick<Role, 'name' | 'permissions'>): Role {
    const roles = this.getRoles();
    const newRole: Role = {
      ...role,
      id: role.id || role.name.toLowerCase().replace(/\s+/g, '-'),
      description: role.description || '',
    };
    
    roles.push(newRole);
    this.saveRoles(roles);
    return newRole;
  },

  updateRole(roleId: string, roleData: Partial<Role>): Role {
    const roles = this.getRoles();
    const roleIndex = roles.findIndex(r => r.id === roleId);
    
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    if (roles[roleIndex].isSystem) {
      throw new Error('Cannot modify system role');
    }

    const updatedRole = {
      ...roles[roleIndex],
      ...roleData,
      id: roleId // Ensure ID doesn't change
    };

    roles[roleIndex] = updatedRole;
    this.saveRoles(roles);
    return updatedRole;
  },

  deleteRole(roleId: string): void {
    const roles = this.getRoles();
    const role = roles.find(r => r.id === roleId);
    
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    this.saveRoles(roles.filter(r => r.id !== roleId));
  },

  hasPermission(roleId: string, permission: keyof Role['permissions']): boolean {
    const role = this.getRoles().find(r => r.id === roleId);
    if (!role) return false;
    
    // If it's the admin role, grant all permissions
    if (role.id === 'admin') return true;
    
    const roles = this.getRoles();
    const effectivePermissions = getEffectivePermissions(role, roles);
    return effectivePermissions[permission] || false;
  },

  getChildRoles(roleId: string): Role[] {
    const roles = this.getRoles();
    return roles.filter(role => role.parentRoleId === roleId);
  },

  canAssignRole(assignerRoleId: string, roleToAssignId: string): boolean {
    const roles = this.getRoles();
    const assignerRole = roles.find(r => r.id === assignerRoleId);
    const roleToAssign = roles.find(r => r.id === roleToAssignId);
    
    if (!assignerRole || !roleToAssign) return false;
    
    // Check if assigner role is an ancestor of the role to assign
    let currentRole = roleToAssign;
    while (currentRole.parentRoleId) {
      if (currentRole.parentRoleId === assignerRoleId) return true;
      currentRole = roles.find(r => r.id === currentRole.parentRoleId)!;
    }
    
    return false;
  }
}; 