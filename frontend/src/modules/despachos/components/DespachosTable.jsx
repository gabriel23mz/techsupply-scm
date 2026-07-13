import { useNavigate } from 'react-router-dom';

import DespachoStatusBadge from './DespachoStatusBadge';

function getPedido(despacho) {
  return despacho?.Pedido ?? despacho?.pedido ?? null;
}

function getCliente(despacho) {
  const pedido = getPedido(despacho);

  return pedido?.Cliente ?? pedido?.cliente ?? null;
}

function getJornada(despacho) {
  return despacho?.jornada ?? despacho?.JornadaReparto ?? null;
}

function formatCode(prefix, id, length = 5) {
  return `${prefix}-${String(id ?? 0).padStart(
    length,
    '0',
  )}`;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
  }).format(date);
}

function formatDistance(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? `${number.toLocaleString('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} km`
    : 'No calculada';
}

function formatDuration(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes)) {
    return 'No calculado';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder
    ? `${hours} h ${remainder} min`
    : `${hours} h`;
}

function getRouteSummary(despacho) {
  const summary = despacho?.ruta_resumen ?? {};
  const route = despacho?.ruta_json ?? {};

  const origin =
    summary.origen ??
    route.desde?.nombre ??
    route.origen?.nombre ??
    null;

  const destination =
    summary.destino ??
    route.hasta?.nombre ??
    route.destino?.nombre ??
    getCliente(despacho)?.Ubicacion?.nombre ??
    getCliente(despacho)?.ubicacion?.nombre ??
    null;

  return {
    origin: origin ?? 'Origen no disponible',
    destination:
      destination ?? 'Destino no disponible',
  };
}

function DespachosTable({
  despachos,
  hasFilters,
  onOpenSummary,
  onOpenRoute,
  onClearFilters,
}) {
  const navigate = useNavigate();

  if (!despachos.length) {
    return (
      <div className="dispatch-empty">
        <i
          className={
            hasFilters
              ? 'bi bi-search'
              : 'bi bi-truck'
          }
        />

        <h4>
          {hasFilters
            ? 'No se encontraron despachos'
            : 'No existen despachos registrados'}
        </h4>

        <p>
          {hasFilters
            ? 'Prueba con otros criterios de búsqueda o filtros.'
            : 'Los despachos generados desde el Centro Logístico aparecerán aquí automáticamente.'}
        </p>

        {hasFilters && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClearFilters}
          >
            <i className="bi bi-eraser me-2" />
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dispatch-table-wrapper">
      <table className="table dispatch-table mb-0">
        <thead>
          <tr>
            <th>Despacho</th>
            <th>Pedido / Cliente</th>
            <th>Jornada</th>
            <th>Destino</th>
            <th>Fechas</th>
            <th>Distancia / Tiempo</th>
            <th>Estado</th>
            <th className="text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {despachos.map((despacho) => {
            const pedido = getPedido(despacho);
            const cliente = getCliente(despacho);
            const jornada = getJornada(despacho);
            const route = getRouteSummary(despacho);

            return (
              <tr key={despacho.id}>
                <td>
                  <button
                    type="button"
                    className="dispatch-code"
                    onClick={() =>
                      onOpenSummary(despacho)
                    }
                  >
                    {formatCode('DSP', despacho.id)}
                  </button>

                  <span className="dispatch-table-subtext">
                    Orden de entrega:{' '}
                    {despacho.orden_entrega ?? '—'}
                  </span>
                </td>

                <td>
                  <strong>
                    {formatCode(
                      'PED',
                      despacho.pedido_id,
                    )}
                  </strong>

                  <span className="dispatch-table-subtext">
                    {cliente?.nombre ??
                      'Cliente no disponible'}
                  </span>
                </td>

                <td>
                  {jornada?.id ? (
                    <>
                      <strong className="dispatch-journey-code">
                        {formatCode(
                          'JR',
                          jornada.id,
                        )}
                      </strong>

                      <span className="dispatch-table-subtext">
                        {String(
                          jornada.estado ?? '',
                        ).replaceAll('_', ' ')}
                      </span>
                    </>
                  ) : (
                    <span className="dispatch-table-subtext">
                      Sin jornada asociada
                    </span>
                  )}
                </td>

                <td>
                  <div className="dispatch-destination">
                    <i className="bi bi-geo-alt-fill" />

                    <div>
                      <strong>
                        {route.destination}
                      </strong>

                      <span>
                        Tramo individual del despacho
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="dispatch-date-line">
                    Creado: {formatDate(
                      despacho.created_at ??
                        despacho.createdAt,
                    )}
                  </span>

                  <span className="dispatch-date-line">
                    Estimada: {formatDate(
                      despacho.fecha_estimada_entrega,
                    )}
                  </span>
                </td>

                <td>
                  <strong>
                    {formatDistance(
                      despacho.distancia_total,
                    )}
                  </strong>

                  <span className="dispatch-table-subtext">
                    {formatDuration(
                      despacho.tiempo_estimado,
                    )}
                  </span>
                </td>

                <td>
                  <DespachoStatusBadge
                    estado={despacho.estado}
                  />
                </td>

                <td>
                  <div className="dispatch-actions">
                    <button
                      type="button"
                      title="Ver resumen"
                      onClick={() =>
                        onOpenSummary(despacho)
                      }
                    >
                      <i className="bi bi-eye" />
                    </button>

                    <button
                      type="button"
                      title="Ver tramo del despacho"
                      onClick={() =>
                        onOpenRoute(despacho)
                      }
                    >
                      <i className="bi bi-signpost-split" />
                    </button>

                    {jornada?.id &&
                    ![
                      'ENTREGADO',
                      'NO_ENTREGADO',
                      'CANCELADO',
                    ].includes(despacho.estado) ? (
                      <button
                        type="button"
                        title="Abrir jornada"
                        onClick={() =>
                          navigate(
                            `/centro-logistico/jornadas/${jornada.id}`,
                            {
                              state: {
                                from: '/despachos',
                              },
                            },
                          )
                        }
                      >
                        <i className="bi bi-box-arrow-up-right" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="disabled"
                        disabled
                        title="Sin jornada activa"
                      >
                        <i className="bi bi-dash-lg" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DespachosTable;
