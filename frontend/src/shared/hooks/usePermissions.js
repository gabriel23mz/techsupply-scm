import {
  useCallback,
  useMemo,
} from 'react';

import {
  useAuth,
} from './useAuth';

import {
  canAccessDefinition,
} from '../routing/access';

export function usePermissions() {
  const {
    permissions,
    user,
  } = useAuth();

  const permissionSet = useMemo(
    () => new Set(permissions),
    [permissions],
  );

  const can = useCallback(
    (permission) =>
      !permission ||
      permissionSet.has(permission),
    [permissionSet],
  );

  const canAny = useCallback(
    (...values) => {
      const expected = values.flat().filter(Boolean);

      return (
        expected.length === 0 ||
        expected.some((permission) =>
          permissionSet.has(permission),
        )
      );
    },
    [permissionSet],
  );

  const canAll = useCallback(
    (...values) => {
      const expected = values.flat().filter(Boolean);

      return expected.every((permission) =>
        permissionSet.has(permission),
      );
    },
    [permissionSet],
  );

  const hasRole = useCallback(
    (...values) =>
      values.flat().filter(Boolean).includes(user?.rol),
    [user?.rol],
  );

  const canAccess = useCallback(
    (access) =>
      canAccessDefinition({
        access,
        permissions: permissionSet,
        role: user?.rol,
      }),
    [permissionSet, user?.rol],
  );

  return {
    can,
    canAll,
    canAny,
    canAccess,
    hasRole,
    permissionSet,
    permissions,
    role: user?.rol ?? null,
  };
}

export default usePermissions;
