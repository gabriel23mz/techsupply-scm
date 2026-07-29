import {
  DataTable,
} from '../../../shared/ui';

import DespachoStatusBadge from './DespachoStatusBadge';

function formatCode(prefix, id, length = 5) {
  return `${prefix}-${String(id ?? 0).padStart(length, '0')}`;
}

function formatDate(value) {
  if (!value) return 'No registrada';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-EC').format(date);
}

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${distance.toFixed(2)} km`
    : 'No calculada';
}

function formatDuration(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes)) return 'No calculado';

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours ? `${hours} h ${remainder} min` : `${remainder} min`;
}

function getDestination(despacho) {
  return despacho.ruta_resumen?.destino ??
    despacho.ruta_json?.hasta?.nombre ??
    despacho.ruta_json?.destino?.nombre ??
    despacho.pedido?.cliente?.ubicacion?.nombre ??
    'Destino no disponible';
}

function DespachosTable({
  despachos,
  error,
  hasFilters,
  loading,
  onOpenJourney,
  onOpenRoute,
  onOpenSummary,
  onRetry,
}) {
  return (
    <DataTable
      className="dispatch-table"
      caption="Listado de despachos"
      rows={despachos}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={
        hasFilters
          ? 'No se encontraron despachos'
          : 'No existen despachos registrados'
      }
      emptyMessage={
        hasFilters
          ? 'Prueba con otros criterios de búsqueda o filtros.'
          : 'Los despachos generados desde Jornadas aparecerán aquí automáticamente.'
      }
      columns={[
        {
          id: 'despacho',
          header: 'Despacho',
          width: '11%',
          cell: (despacho) => (
            <div className="dispatch-primary-cell">
              <strong>{formatCode('DSP', despacho.id)}</strong>
              <span>Orden: {despacho.orden_entrega ?? '—'}</span>
            </div>
          ),
        },
        {
          id: 'pedido',
          header: 'Pedido / Cliente',
          width: '22%',
          cell: (despacho) => (
            <div className="dispatch-primary-cell">
              <strong>{formatCode('PED', despacho.pedido_id)}</strong>
              <span>{despacho.pedido?.cliente?.nombre ?? 'Cliente no disponible'}</span>
            </div>
          ),
        },
        {
          id: 'jornada',
          header: 'Jornada',
          width: '13%',
          cell: (despacho) => despacho.jornada?.id ? (
            <button
              type="button"
              className="dispatch-journey-link"
              onClick={() => onOpenJourney(despacho.jornada)}
            >
              <strong>{formatCode('JR', despacho.jornada.id)}</strong>
              <span>{String(despacho.jornada.estado ?? '').replaceAll('_', ' ')}</span>
            </button>
          ) : (
            <span className="dispatch-muted">Sin jornada</span>
          ),
        },
        {
          id: 'destino',
          header: 'Destino',
          width: '16%',
          cell: (despacho) => (
            <div className="dispatch-destination">
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              <span>{getDestination(despacho)}</span>
            </div>
          ),
        },
        {
          id: 'recorrido',
          header: 'Recorrido',
          width: '12%',
          cell: (despacho) => (
            <div className="dispatch-primary-cell">
              <strong>{formatDistance(despacho.distancia_total)}</strong>
              <span>{formatDuration(despacho.tiempo_estimado)}</span>
            </div>
          ),
        },
        {
          id: 'fecha',
          header: 'Registro',
          width: '11%',
          cell: (despacho) => formatDate(despacho.created_at ?? despacho.createdAt),
        },
        {
          id: 'estado',
          header: 'Estado',
          width: '11%',
          cell: (despacho) => <DespachoStatusBadge estado={despacho.estado} />,
        },
      ]}
      actions={(despacho) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver despacho',
          onClick: () => onOpenSummary(despacho),
        },
        {
          id: 'route',
          icon: 'bi bi-signpost-split',
          label: 'Ver tramo del despacho',
          onClick: () => onOpenRoute(despacho),
        },
        {
          id: 'journey',
          icon: 'bi bi-box-arrow-up-right',
          label: despacho.jornada?.id ? 'Abrir jornada' : 'Sin jornada asociada',
          disabled: !despacho.jornada?.id,
          onClick: () => onOpenJourney(despacho.jornada),
        },
      ]}
    />
  );
}

export default DespachosTable;
