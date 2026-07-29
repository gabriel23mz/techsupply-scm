import {
  ROLES,
  ROLE_LABELS,
} from '../../shared/constants/permissions';

export const USER_ROLE_OPTIONS = Object.freeze([
  {
    value: ROLES.ADMIN,
    label: ROLE_LABELS[ROLES.ADMIN],
    description: 'Administración completa del sistema.',
    icon: 'bi bi-shield-check',
  },
  {
    value: ROLES.VENTAS,
    label: ROLE_LABELS[ROLES.VENTAS],
    description: 'Gestión comercial de clientes y pedidos.',
    icon: 'bi bi-graph-up-arrow',
  },
  {
    value: ROLES.BODEGA,
    label: ROLE_LABELS[ROLES.BODEGA],
    description: 'Preparación física y carga de jornadas.',
    icon: 'bi bi-box-seam',
  },
  {
    value: ROLES.LOGISTICA,
    label: ROLE_LABELS[ROLES.LOGISTICA],
    description: 'Planificación y supervisión de la distribución.',
    icon: 'bi bi-diagram-3',
  },
  {
    value: ROLES.CHOFER,
    label: ROLE_LABELS[ROLES.CHOFER],
    description: 'Ejecución de jornadas y registro de entregas.',
    icon: 'bi bi-person-vcard',
  },
  {
    value: ROLES.COMPRAS,
    label: ROLE_LABELS[ROLES.COMPRAS],
    description: 'Acceso informativo al dominio de compras.',
    icon: 'bi bi-bag-check',
  },
]);

const ROLE_TONES = Object.freeze({
  [ROLES.ADMIN]: 'primary',
  [ROLES.VENTAS]: 'info',
  [ROLES.BODEGA]: 'warning',
  [ROLES.LOGISTICA]: 'success',
  [ROLES.CHOFER]: 'info',
  [ROLES.COMPRAS]: 'warning',
});

const ROLE_ICONS = Object.freeze({
  [ROLES.ADMIN]: 'bi bi-shield-check',
  [ROLES.VENTAS]: 'bi bi-graph-up-arrow',
  [ROLES.BODEGA]: 'bi bi-box-seam',
  [ROLES.LOGISTICA]: 'bi bi-diagram-3',
  [ROLES.CHOFER]: 'bi bi-person-vcard',
  [ROLES.COMPRAS]: 'bi bi-bag-check',
});

export function getUserRoleLabel(role) {
  return ROLE_LABELS[role] ?? String(role ?? 'Sin rol');
}

export function getUserRoleTone(role) {
  return ROLE_TONES[role] ?? 'neutral';
}

export function getUserRoleIcon(role) {
  return ROLE_ICONS[role] ?? 'bi bi-person';
}

export function getUserFullName(user) {
  return [
    user?.nombre,
    user?.apellido,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Usuario sin nombre';
}

export function formatUserDate(value) {
  if (!value) return 'No disponible';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No disponible';
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
