import {
  ROLES,
} from '../constants/permissions.js';

export function normalizePermissions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(
    value
      .map((permission) =>
        String(permission ?? '').trim(),
      )
      .filter(Boolean),
  )];
}

export function canAccessDefinition({
  access,
  permissions = [],
  role,
}) {
  if (!access) {
    return true;
  }

  const permissionSet =
    permissions instanceof Set
      ? permissions
      : new Set(normalizePermissions(permissions));

  if (
    Array.isArray(access.roles) &&
    access.roles.length > 0 &&
    !access.roles.includes(role)
  ) {
    return false;
  }

  if (
    access.permission &&
    !permissionSet.has(access.permission)
  ) {
    return false;
  }

  if (
    Array.isArray(access.allPermissions) &&
    access.allPermissions.length > 0 &&
    !access.allPermissions.every((permission) =>
      permissionSet.has(permission),
    )
  ) {
    return false;
  }

  if (
    Array.isArray(access.anyPermissions) &&
    access.anyPermissions.length > 0 &&
    !access.anyPermissions.some((permission) =>
      permissionSet.has(permission),
    )
  ) {
    return false;
  }

  return true;
}

const ROLE_LANDING_PATHS = Object.freeze({
  [ROLES.ADMIN]: '/',
  [ROLES.VENTAS]: '/',
  [ROLES.BODEGA]: '/',
  [ROLES.LOGISTICA]: '/',
  [ROLES.CHOFER]: '/',
  [ROLES.COMPRAS]: '/',
});

export function getLandingPath(user) {
  return ROLE_LANDING_PATHS[user?.rol] ?? '/';
}
