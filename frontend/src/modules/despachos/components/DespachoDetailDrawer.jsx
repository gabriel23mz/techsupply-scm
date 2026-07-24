import { useNavigate } from 'react-router-dom';

import DespachoStatusBadge from './DespachoStatusBadge';

function getPedido(despacho) {
  return despacho?.pedido ?? null;
}

function getCliente(despacho) {
  const pedido = getPedido(despacho);

  return pedido?.cliente ?? null;
}

function getUsuario(despacho) {
  const pedido = getPedido(despacho);

  return pedido?.usuario ?? null;
}

function getJornada(despacho) {
  return despacho?.jornada ?? null;
}

function formatCode(prefix, id, length = 5) {
  return `${prefix}-${String(id ?? 0).padStart(
    length,
    '0',
  )}`;
}

function formatDateTime(value) {
  if (!value) return 'No registrada';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No registrada';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
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

function DetailItem({ label, value, wide = false }) {
  return (
    <div
      className={`dispatch-detail-item ${
        wide ? 'wide' : ''
      }`}
    >
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

function DespachoDetailDrawer({
  open,
  despacho,
  type,
  isLoading,
  onClose,
}) {
  const navigate = useNavigate();

  if (!open) {
    return null;
  }

  const pedido = getPedido(despacho);
  const cliente = getCliente(despacho);
  const usuario = getUsuario(despacho);
  const jornada = getJornada(despacho);

  const responsable = [
    usuario?.nombre,
    usuario?.apellido,
  ]
    .filter(Boolean)
    .join(' ');

  const routeSummary = despacho?.ruta_resumen ?? {};
  const routeJson = despacho?.ruta_json ?? {};
  const routePoints = Array.isArray(
    despacho?.ruta_detalle,
  )
    ? despacho.ruta_detalle
    : [];

  const origin =
    routeSummary.origen ??
    routeJson.desde?.nombre ??
    routeJson.origen?.nombre ??
    'Origen no disponible';

  const destination =
    routeSummary.destino ??
    routeJson.hasta?.nombre ??
    routeJson.destino?.nombre ??
    cliente?.ubicacion?.nombre ??
    'Destino no disponible';

  const coordinates =
    routeSummary.total_coordenadas ??
    (Array.isArray(routeJson.geometria)
      ? routeJson.geometria.length
      : 0);

  return (
    <div
      className="dispatch-drawer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside className="dispatch-detail-drawer">
        <header className="dispatch-drawer-header">
          <div>
            <span>
              {type === 'route'
                ? 'Tramo logístico'
                : 'Detalle administrativo'}
            </span>

            <h4>
              {despacho?.id
                ? formatCode('DSP', despacho.id)
                : 'Despacho'}
            </h4>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="dispatch-drawer-body">
          {isLoading || !despacho ? (
            <div className="dispatch-drawer-loading">
              <span className="spinner-border text-primary" />
              <h5>Cargando detalle...</h5>
            </div>
          ) : type === 'summary' ? (
            <>
              <section className="dispatch-summary-hero">
                <div>
                  <span>Número de despacho</span>
                  <strong>
                    {formatCode('DSP', despacho.id)}
                  </strong>
                </div>

                <DespachoStatusBadge
                  estado={despacho.estado}
                />
              </section>

              <section className="dispatch-detail-section">
                <h5>Información principal</h5>

                <div className="dispatch-detail-grid">
                  <DetailItem
                    label="Pedido"
                    value={formatCode(
                      'PED',
                      despacho.pedido_id,
                    )}
                  />

                  <DetailItem
                    label="Cliente"
                    value={cliente?.nombre}
                  />

                  <DetailItem
                    label="Responsable"
                    value={responsable}
                  />

                  <DetailItem
                    label="Jornada"
                    value={
                     jornada?.id
                      ? formatCode('JR', jornada.id)
                      : 'Sin jornada'
                    }
                  />

                  <DetailItem
                    label="Orden de entrega"
                    value={
                      despacho.orden_entrega
                        ? `Punto ${despacho.orden_entrega}`
                        : 'No definido'
                    }
                  />

                  <DetailItem
                    label="Distancia"
                    value={formatDistance(
                      despacho.distancia_total,
                    )}
                  />

                  <DetailItem
                    label="Tiempo estimado"
                    value={formatDuration(
                      despacho.tiempo_estimado,
                    )}
                  />

                  <DetailItem
                    label="Fecha estimada"
                    value={formatDateTime(
                      despacho.fecha_estimada_entrega,
                    )}
                  />

                  <DetailItem
                    label="Fecha de salida"
                    value={formatDateTime(
                      despacho.fecha_salida,
                    )}
                  />

                  <DetailItem
                    label="Fecha de entrega"
                    value={formatDateTime(
                      despacho.fecha_entrega,
                    )}
                  />

                  <DetailItem
                    wide
                    label="Dirección del cliente"
                    value={cliente?.direccion}
                  />
                </div>
              </section>

              <section className="dispatch-route-summary-card">
                <div className="dispatch-route-summary-icon">
                  <i className="bi bi-signpost-split" />
                </div>

                <div>
                  <span>Tramo asignado</span>
                  <strong>
                    {origin} → {destination}
                  </strong>
                  <small>
                    Este es el recorrido individual del despacho,
                    no la ruta completa de la jornada.
                  </small>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="dispatch-route-info">
                <i className="bi bi-info-circle" />

                <p>
                  Esta vista representa únicamente el tramo
                  asignado a este despacho. Para consultar la
                  ruta completa, abre la jornada asociada.
                </p>
              </div>

              <section className="dispatch-route-overview">
                <article>
                  <div className="dispatch-route-node-icon origin">
                    <i className="bi bi-building" />
                  </div>

                  <span>Origen del tramo</span>
                  <strong>{origin}</strong>
                </article>

                <i className="bi bi-arrow-right dispatch-route-arrow" />

                <article>
                  <div className="dispatch-route-node-icon destination">
                    <i className="bi bi-geo-alt-fill" />
                  </div>

                  <span>Destino del tramo</span>
                  <strong>{destination}</strong>
                </article>
              </section>

              <section className="dispatch-route-metrics">
                <div>
                  <span>Distancia</span>
                  <strong>
                    {formatDistance(
                      despacho.distancia_total,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Tiempo estimado</span>
                  <strong>
                    {formatDuration(
                      despacho.tiempo_estimado,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Coordenadas</span>
                  <strong>{coordinates}</strong>
                </div>
              </section>

              {routePoints.length > 0 && (
                <section className="dispatch-detail-section">
                  <h5>Nodos del tramo</h5>

                  <div className="dispatch-route-list">
                    {routePoints.map((point, index) => (
                      <div
                        className="dispatch-route-list-item"
                        key={`${point.id}-${index}`}
                      >
                        <span>{index + 1}</span>

                        <div>
                          <strong>
                            {point.nombre ??
                              `Ubicación ${point.id}`}
                          </strong>

                          <small>
                            {index === 0
                              ? 'Inicio del tramo'
                              : index === routePoints.length - 1
                                ? 'Destino del tramo'
                                : 'Nodo intermedio'}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!routePoints.length && (
                <section className="dispatch-route-no-nodes">
                  <i className="bi bi-bezier2" />

                  <div>
                    <strong>
                      Geometría disponible
                    </strong>

                    <span>
                      El backend no devolvió nombres de nodos
                      intermedios, pero el tramo conserva
                      {coordinates
                        ? ` ${coordinates} coordenadas`
                        : ' su origen y destino'}.
                    </span>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <footer className="dispatch-drawer-footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          {jornada?.id && (
            <button
              type="button"
              className="btn btn-primary"
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
              <i className="bi bi-map me-2" />
              Ver jornada completa
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

export default DespachoDetailDrawer;
