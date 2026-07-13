function formatRouteCode(id) {
  return `RUT-${String(id).padStart(4, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return '0,00 km';
  }

  return `${new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(distance)} km`;
}

function RutaDetailModal({
  open,
  ruta,
  onClose,
}) {
  if (!open || !ruta) {
    return null;
  }

  return (
    <div className="routes-modal-overlay">
      <section className="routes-detail-modal">
        <header className="routes-modal-header">
          <div>
            <span>
              Detalle de conexión
            </span>

            <h4>
              {formatRouteCode(ruta.id)}
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

        <div className="routes-modal-body">
          <div className="routes-detail-route">
            <article>
              <i className="bi bi-geo-alt-fill" />

              <span>Origen</span>

              <strong>
                {ruta.origen?.nombre ??
                  'No disponible'}
              </strong>
            </article>

            <div className="routes-detail-arrow">
              <i className="bi bi-arrow-right" />
            </div>

            <article>
              <i className="bi bi-flag-fill" />

              <span>Destino</span>

              <strong>
                {ruta.destino?.nombre ??
                  'No disponible'}
              </strong>
            </article>
          </div>

          <div className="routes-detail-grid">
            <div>
              <span>Distancia</span>
              <strong>
                {formatDistance(
                  ruta.distancia_km,
                )}
              </strong>
            </div>

            <div>
              <span>Estado</span>
              <strong>Activa</strong>
            </div>

            <div>
              <span>Origen ID</span>
              <strong>
                {ruta.origen_id}
              </strong>
            </div>

            <div>
              <span>Destino ID</span>
              <strong>
                {ruta.destino_id}
              </strong>
            </div>
          </div>
        </div>

        <footer className="routes-modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  );
}

export default RutaDetailModal;

