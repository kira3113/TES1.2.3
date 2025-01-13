import type { Role, Permission } from '../types/permission';

interface RoleHierarchyNode {
  role: Role;
  children: RoleHierarchyNode[];
}

export function buildRoleHierarchy(roles: Role[]): RoleHierarchyNode[] {
  const roleMap = new Map<string, RoleHierarchyNode>(
    roles.map(role => [role.id, { role, children: [] }])
  );
  const roots: RoleHierarchyNode[] = [];

  for (const role of roles) {
    if (role.parentRoleId && roleMap.has(role.parentRoleId)) {
      const parent = roleMap.get(role.parentRoleId)!;
      parent.children.push(roleMap.get(role.id)!);
    } else {
      roots.push(roleMap.get(role.id)!);
    }
  }

  return roots;
}

export function getAllInheritedPermissions(role: Role, roles: Role[]): Permission[] {
  const permissions = new Set<Permission>();
  
  // Add direct permissions
  Object.entries(role.permissions)
    .filter(([_, hasPermission]) => hasPermission)
    .forEach(([permission]) => permissions.add(permission as Permission));

  // Add inherited permissions
  let currentRole = role;
  while (currentRole.parentRoleId) {
    const parentRole = roles.find(r => r.id === currentRole.parentRoleId);
    if (!parentRole) break;

    Object.entries(parentRole.permissions)
      .filter(([_, hasPermission]) => hasPermission)
      .forEach(([permission]) => permissions.add(permission as Permission));

    currentRole = parentRole;
  }

  return Array.from(permissions);
}

export function getEffectivePermissions(role: Role, roles: Role[]): Role['permissions'] {
  const inheritedPermissions = getAllInheritedPermissions(role, roles);
  const effectivePermissions = { ...role.permissions };

  // Ensure inherited permissions are set to true
  inheritedPermissions.forEach(permission => {
    effectivePermissions[permission] = true;
  });

  return effectivePermissions;
} 