import {
  Button,
  LoadingState,
  Modal,
  StatusBadge,
} from '../../../../shared/ui';

function formatRouteCode(id) {
  return `RUT-${String(id).padStart(4, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${distance.toFixed(2)} km`
    : '0,00 km';
}

function RutaDetailModal({
  loading,
  onClose,
  open,
  ruta,
}) {
  return (
    <Modal
      open={open && Boolean(ruta)}
      title={ruta ? formatRouteCode(ruta.id) : 'Detalle de ruta'}
      description="Conexión vial registrada entre dos ubicaciones logísticas."
      size="md"
      onClose={onClose}
      footer={(
        <Button onClick={onClose}>Cerrar</Button>
      )}
    >
      {loading ? (
        <LoadingState label="Cargando ruta..." />
      ) : ruta ? (
        <div className="routes-detail-content">
          <section className="routes-detail-route">
            <article>
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              <span>Origen</span>
              <strong>{ruta.origen?.nombre ?? 'No disponible'}</strong>
            </article>
            <i className="bi bi-arrow-right routes-detail-arrow" aria-hidden="true" />
            <article>
              <i className="bi bi-flag-fill" aria-hidden="true" />
              <span>Destino</span>
              <strong>{ruta.destino?.nombre ?? 'No disponible'}</strong>
            </article>
          </section>
          <section className="routes-detail-grid">
            <div>
              <span>Distancia vial</span>
              <strong>{formatDistance(ruta.distancia_km)}</strong>
            </div>
            <div>
              <span>Estado</span>
              <StatusBadge tone="success" icon="bi bi-check-circle" dot={false}>
                Activa
              </StatusBadge>
            </div>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

export default RutaDetailModal;
