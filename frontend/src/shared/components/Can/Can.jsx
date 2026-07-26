import {
  usePermissions,
} from '../../hooks/usePermissions';

function Can({
  access,
  allPermissions,
  anyPermissions,
  children,
  fallback = null,
  permission,
  roles,
}) {
  const {
    canAccess,
  } = usePermissions();

  const allowed = canAccess(
    access ?? {
      permission,
      allPermissions,
      anyPermissions,
      roles,
    },
  );

  return allowed ? children : fallback;
}

export default Can;
