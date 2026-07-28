export const WAREHOUSE_PREPARATION_PAGE_SIZE = 10;

export const PREPARATION_STATUS_OPTIONS = [
  {
    value: 'TODOS',
    label: 'Todos los avances',
  },
  {
    value: 'SIN_INICIAR',
    label: 'Sin iniciar',
  },
  {
    value: 'EN_PROGRESO',
    label: 'En progreso',
  },
  {
    value: 'COMPLETO',
    label: 'Preparación completa',
  },
];

export function normalizeWarehouseText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

export function normalizeWarehousePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isInteger(page) && page > 0
    ? page
    : 1;
}

export function formatWarehouseOrderCode(id) {
  return `PED-${String(id ?? 0).padStart(5, '0')}`;
}

export function formatWarehouseClientCode(id) {
  return `CLI-${String(id ?? 0).padStart(4, '0')}`;
}

export function formatWarehouseDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
  }).format(date);
}

export function getWarehouseClient(pedido) {
  return pedido?.cliente ?? null;
}

export function getWarehouseLocation(pedido) {
  return getWarehouseClient(pedido)?.ubicacion ?? null;
}

export function getWarehouseDetails(pedido) {
  return Array.isArray(pedido?.detalles)
    ? pedido.detalles
    : [];
}

export function getPreparationProgress(pedido) {
  const details = getWarehouseDetails(pedido);
  const serverProgress = pedido?.progreso_preparacion ?? {};

  const requestedFromDetails = details.reduce(
    (total, detail) => total + Number(detail?.cantidad ?? 0),
    0,
  );
  const preparedFromDetails = details.reduce(
    (total, detail) =>
      total + Number(detail?.cantidad_preparada ?? 0),
    0,
  );

  const requested = Number(
    serverProgress.solicitado ?? requestedFromDetails,
  );
  const prepared = Math.min(
    Number(serverProgress.preparado ?? preparedFromDetails),
    requested,
  );
  const pending = Math.max(requested - prepared, 0);
  const percentage = requested > 0
    ? Math.round((prepared / requested) * 100)
    : 0;
  const complete = Boolean(
    serverProgress.completo ??
      (requested > 0 && prepared === requested),
  );

  let status = 'SIN_INICIAR';

  if (complete) status = 'COMPLETO';
  else if (prepared > 0) status = 'EN_PROGRESO';

  return {
    complete,
    pending,
    percentage,
    prepared,
    requested,
    status,
  };
}

export function getPreparationStatusMeta(status) {
  const meta = {
    SIN_INICIAR: {
      label: 'Sin iniciar',
      tone: 'neutral',
    },
    EN_PROGRESO: {
      label: 'En progreso',
      tone: 'warning',
    },
    COMPLETO: {
      label: 'Completo',
      tone: 'success',
    },
  };

  return meta[status] ?? meta.SIN_INICIAR;
}

export function matchesPreparationStatus(pedido, status) {
  return (
    status === 'TODOS' ||
    getPreparationProgress(pedido).status === status
  );
}

export function validatePreparedQuantity(value, requested) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return 'La cantidad preparada es obligatoria.';
  }

  const quantity = Number(normalized);
  const requestedQuantity = Number(requested ?? 0);

  if (!Number.isInteger(quantity)) {
    return 'Ingresa una cantidad entera.';
  }

  if (quantity < 0) {
    return 'La cantidad no puede ser negativa.';
  }

  if (quantity > requestedQuantity) {
    return `No puede superar las ${requestedQuantity} unidades solicitadas.`;
  }

  return '';
}

export function replaceWarehouseDetail(pedido, updatedDetail) {
  if (!pedido || !updatedDetail) return pedido;

  const detalles = getWarehouseDetails(pedido).map((detail) =>
    Number(detail.id) === Number(updatedDetail.id)
      ? {
        ...detail,
        ...updatedDetail,
        producto: updatedDetail.producto ?? detail.producto,
      }
      : detail,
  );
  const solicitado = detalles.reduce(
    (total, detail) => total + Number(detail?.cantidad ?? 0),
    0,
  );
  const preparado = detalles.reduce(
    (total, detail) =>
      total + Number(detail?.cantidad_preparada ?? 0),
    0,
  );

  return {
    ...pedido,
    detalles,
    progreso_preparacion: {
      solicitado,
      preparado,
      completo: solicitado > 0 && preparado === solicitado,
    },
  };
}

export const WAREHOUSE_LOAD_PAGE_SIZE = 10;

export const LOAD_STATUS_OPTIONS = [
  {
    value: 'TODOS',
    label: 'Todos los avances',
  },
  {
    value: 'SIN_INICIAR',
    label: 'Sin iniciar',
  },
  {
    value: 'EN_PROGRESO',
    label: 'En progreso',
  },
  {
    value: 'COMPLETA',
    label: 'Carga completa',
  },
  {
    value: 'CONFIRMADA',
    label: 'Carga confirmada',
  },
];

export function formatWarehouseJourneyCode(id) {
  return `JR-${String(id ?? 0).padStart(5, '0')}`;
}

export function formatWarehouseDispatchCode(id) {
  return `DES-${String(id ?? 0).padStart(5, '0')}`;
}

export function formatWarehouseTruckLabel(camion) {
  if (!camion) return 'Camión no disponible';

  return [camion.codigo, camion.placa]
    .filter(Boolean)
    .join(' · ') || 'Camión no disponible';
}

export function getWarehouseDispatches(jornada) {
  return Array.isArray(jornada?.despachos)
    ? [...jornada.despachos].sort(
      (left, right) =>
        Number(left?.orden_entrega ?? 0) -
        Number(right?.orden_entrega ?? 0),
    )
    : [];
}

export function getWarehouseDispatchClient(despacho) {
  return despacho?.pedido?.cliente ?? null;
}

export function getWarehouseDispatchLocation(despacho) {
  return getWarehouseDispatchClient(despacho)?.ubicacion ?? null;
}

export function getLoadProgress(jornada) {
  const dispatches = getWarehouseDispatches(jornada);
  const serverProgress = jornada?.progreso_carga ?? {};
  const totalFromDispatches = dispatches.length;
  const loadedFromDispatches = dispatches.filter(
    (dispatch) => Boolean(dispatch?.cargado),
  ).length;
  const total = Number(serverProgress.total ?? totalFromDispatches);
  const loaded = Math.min(
    Number(serverProgress.cargados ?? loadedFromDispatches),
    total,
  );
  const pending = Math.max(total - loaded, 0);
  const percentage = total > 0
    ? Math.round((loaded / total) * 100)
    : 0;
  const confirmed = Boolean(
    jornada?.carga_confirmada ?? jornada?.carga_confirmada_en,
  );
  const complete = Boolean(
    serverProgress.completo ?? (total > 0 && loaded === total),
  );

  let status = 'SIN_INICIAR';

  if (confirmed) status = 'CONFIRMADA';
  else if (complete) status = 'COMPLETA';
  else if (loaded > 0) status = 'EN_PROGRESO';

  return {
    complete,
    confirmed,
    loaded,
    pending,
    percentage,
    status,
    total,
  };
}

export function getLoadStatusMeta(status) {
  const meta = {
    SIN_INICIAR: {
      label: 'Sin iniciar',
      tone: 'neutral',
    },
    EN_PROGRESO: {
      label: 'En progreso',
      tone: 'warning',
    },
    COMPLETA: {
      label: 'Completa',
      tone: 'info',
    },
    CONFIRMADA: {
      label: 'Confirmada',
      tone: 'success',
    },
  };

  return meta[status] ?? meta.SIN_INICIAR;
}

export function matchesLoadStatus(jornada, status) {
  return (
    status === 'TODOS' ||
    getLoadProgress(jornada).status === status
  );
}

export function replaceWarehouseDispatch(jornada, updatedDispatch) {
  if (!jornada || !updatedDispatch) return jornada;

  const despachos = getWarehouseDispatches(jornada).map((dispatch) =>
    Number(dispatch.id) === Number(updatedDispatch.id)
      ? {
        ...dispatch,
        ...updatedDispatch,
        pedido: updatedDispatch.pedido ?? dispatch.pedido,
      }
      : dispatch,
  );
  const cargados = despachos.filter(
    (dispatch) => Boolean(dispatch?.cargado),
  ).length;

  return {
    ...jornada,
    carga_confirmada:
      updatedDispatch.cargado === false
        ? false
        : jornada.carga_confirmada,
    carga_confirmada_en:
      updatedDispatch.cargado === false
        ? null
        : jornada.carga_confirmada_en,
    despachos,
    progreso_carga: {
      total: despachos.length,
      cargados,
      completo:
        despachos.length > 0 && cargados === despachos.length,
    },
  };
}
