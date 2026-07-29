import {
  Button,
  Drawer,
  LoadingState,
} from '../../../shared/ui';

import DespachoStatusBadge from './DespachoStatusBadge';

function formatCode(prefix, id, length = 5) {
  return `${prefix}-${String(id ?? 0).padStart(length, '0')}`;
}

function formatDateTime(value) {
  if (!value) return 'No registrada';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-EC', {
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

  if (!Number.isFinite(minutes)) return 'No calculado';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={`dispatch-detail-item${wide ? ' dispatch-detail-item--wide' : ''}`}>
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

function DespachoDetailDrawer({
  despacho,
  isLoading,
  onClose,
  onOpenJourney,
  open,
  type,
}) {
  const pedido = despacho?.pedido ?? null;
  const cliente = pedido?.cliente ?? null;
  const usuario = pedido?.usuario ?? null;
  const jornada = despacho?.jornada ?? null;
  const responsable = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(' ');
  const routeSummary = despacho?.ruta_resumen ?? {};
  const routeJson = despacho?.ruta_json ?? {};
  const routePoints = Array.isArray(despacho?.ruta_detalle)
    ? despacho.ruta_detalle
    : [];
  const origin = routeSummary.origen ??
    routeJson.desde?.nombre ??
    routeJson.origen?.nombre ??
    'Origen no disponible';
  const destination = routeSummary.destino ??
    routeJson.hasta?.nombre ??
    routeJson.destino?.nombre ??
    cliente?.ubicacion?.nombre ??
    'Destino no disponible';
  const coordinates = routeSummary.total_coordenadas ??
    (Array.isArray(routeJson.geometria) ? routeJson.geometria.length : 0);

  return (
    <Drawer
      open={open}
      title={despacho?.id ? formatCode('DSP', despacho.id) : 'Despacho'}
      description={type === 'route'
        ? 'Recorrido individual asignado al despacho.'
        : 'Información administrativa y operativa del despacho.'}
      size="lg"
      onClose={onClose}
      footer={(
        <>
          <Button tone="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {jornada?.id && (
            <Button
              icon="bi bi-map"
              onClick={() => onOpenJourney(jornada)}
            >
              Ver jornada completa
            </Button>
          )}
        </>
      )}
    >
      {isLoading || !despacho ? (
        <LoadingState label="Cargando detalle del despacho..." />
      ) : type === 'summary' ? (
        <div className="dispatch-detail">
          <section className="dispatch-detail-hero">
            <div>
              <span>Número de despacho</span>
              <strong>{formatCode('DSP', despacho.id)}</strong>
            </div>
            <DespachoStatusBadge estado={despacho.estado} />
          </section>

          <section className="dispatch-detail-grid">
            <DetailItem label="Pedido" value={formatCode('PED', despacho.pedido_id)} />
            <DetailItem label="Cliente" value={cliente?.nombre} />
            <DetailItem label="Responsable" value={responsable} />
            <DetailItem
              label="Jornada"
              value={jornada?.id ? (jornada.codigo ?? formatCode('JR', jornada.id)) : 'Sin jornada'}
            />
            <DetailItem
              label="Orden de entrega"
              value={despacho.orden_entrega ? `Punto ${despacho.orden_entrega}` : 'No definido'}
            />
            <DetailItem label="Distancia" value={formatDistance(despacho.distancia_total)} />
            <DetailItem label="Tiempo estimado" value={formatDuration(despacho.tiempo_estimado)} />
            <DetailItem label="Fecha estimada" value={formatDateTime(despacho.fecha_estimada_entrega)} />
            <DetailItem label="Fecha de salida" value={formatDateTime(despacho.fecha_salida)} />
            <DetailItem label="Fecha de entrega" value={formatDateTime(despacho.fecha_entrega)} />
            <DetailItem wide label="Dirección del cliente" value={cliente?.direccion} />
          </section>

          <section className="dispatch-route-summary">
            <i className="bi bi-signpost-split" aria-hidden="true" />
            <div>
              <span>Tramo asignado</span>
              <strong>{origin} → {destination}</strong>
              <small>Este recorrido pertenece al despacho, no a la jornada completa.</small>
            </div>
          </section>
        </div>
      ) : (
        <div className="dispatch-route-detail">
          <section className="dispatch-route-overview">
            <article>
              <i className="bi bi-building" aria-hidden="true" />
              <span>Origen del tramo</span>
              <strong>{origin}</strong>
            </article>
            <i className="bi bi-arrow-right" aria-hidden="true" />
            <article>
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              <span>Destino del tramo</span>
              <strong>{destination}</strong>
            </article>
          </section>

          <section className="dispatch-route-metrics">
            <DetailItem label="Distancia" value={formatDistance(despacho.distancia_total)} />
            <DetailItem label="Tiempo estimado" value={formatDuration(despacho.tiempo_estimado)} />
            <DetailItem label="Coordenadas" value={coordinates} />
          </section>

          <section className="dispatch-route-points">
            <h3>Nodos del tramo</h3>
            {routePoints.length > 0 ? routePoints.map((point, index) => (
              <div className="dispatch-route-point" key={`${point.id ?? 'point'}-${index}`}>
                <span>{index + 1}</span>
                <div>
                  <strong>{point.nombre ?? `Ubicación ${point.id ?? index + 1}`}</strong>
                  <small>
                    {index === 0
                      ? 'Inicio del tramo'
                      : index === routePoints.length - 1
                        ? 'Destino del tramo'
                        : 'Nodo intermedio'}
                  </small>
                </div>
              </div>
            )) : (
              <p className="dispatch-route-empty">
                El backend conserva la geometría del tramo, pero no devolvió nombres de nodos intermedios.
              </p>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}

export default DespachoDetailDrawer;
