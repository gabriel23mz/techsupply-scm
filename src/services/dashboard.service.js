import {
  ROLES,
} from '../constants/permissions.js';

import {
  ForbiddenError,
  UnauthorizedError,
} from '../utils/errors.js';

import {
  buildAdminSummary,
  buildDriverSummary,
  buildLogisticsSummary,
  buildPurchasingSummary,
  buildSalesSummary,
  buildWarehouseSummary,
} from './dashboard/dashboard.summary.js';

import {
  buildAdminNotifications,
  buildDriverNotifications,
  buildLogisticsNotifications,
  buildPurchasingNotifications,
  buildSalesNotifications,
  buildWarehouseNotifications,
} from './dashboard/dashboard.notifications.js';

import {
  normalizeLimit,
} from './dashboard/dashboard.shared.js';

const summaryBuilders = {
  [ROLES.ADMIN]: buildAdminSummary,
  [ROLES.VENTAS]: buildSalesSummary,
  [ROLES.BODEGA]: buildWarehouseSummary,
  [ROLES.LOGISTICA]: buildLogisticsSummary,
  [ROLES.CHOFER]: buildDriverSummary,
  [ROLES.COMPRAS]: buildPurchasingSummary,
};

const notificationBuilders = {
  [ROLES.ADMIN]: buildAdminNotifications,
  [ROLES.VENTAS]: buildSalesNotifications,
  [ROLES.BODEGA]: buildWarehouseNotifications,
  [ROLES.LOGISTICA]: buildLogisticsNotifications,
  [ROLES.CHOFER]: buildDriverNotifications,
  [ROLES.COMPRAS]: buildPurchasingNotifications,
};

const assertDashboardUser = (user) => {
  if (!user) {
    throw new UnauthorizedError(
      'Autenticación requerida para consultar el dashboard',
      'DASHBOARD_AUTH_REQUERIDA',
    );
  }

  if (
    !summaryBuilders[user.rol] ||
    !notificationBuilders[user.rol]
  ) {
    throw new ForbiddenError(
      'El rol autenticado no dispone de dashboard',
      'DASHBOARD_ROL_NO_SOPORTADO',
    );
  }
};

const buildNotifications = async (
  user,
  limit,
) => {
  const builder = notificationBuilders[user.rol];

  if (
    user.rol === ROLES.VENTAS ||
    user.rol === ROLES.CHOFER
  ) {
    return builder(user, limit);
  }

  return builder(limit);
};

export const obtenerResumen = async (user) => {
  assertDashboardUser(user);

  const builder = summaryBuilders[user.rol];

  const [summary, alerts] = await Promise.all([
    builder(user),
    buildNotifications(user, 4),
  ]);

  return {
    rol: user.rol,
    actualizado_en: new Date().toISOString(),
    metricas: summary.metricas,
    alertas: alerts,
    accesos: summary.accesos,
    contexto: summary.contexto ?? {},
  };
};

export const obtenerNotificaciones = async (
  user,
  options = {},
) => {
  assertDashboardUser(user);

  const limit = normalizeLimit(
    options.limit,
    8,
    20,
  );

  const items = await buildNotifications(
    user,
    limit,
  );

  return {
    rol: user.rol,
    actualizado_en: new Date().toISOString(),
    total: items.length,
    items,
  };
};
