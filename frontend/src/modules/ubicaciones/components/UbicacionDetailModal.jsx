import L from 'leaflet';

import {
  MapContainer,
  Marker,
  TileLayer,
} from 'react-leaflet';

function createDetailIcon() {
  return L.divIcon({
    className: 'locations-map-div-icon',
    html: `
      <div class="locations-detail-marker">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 34],
  });
}

function UbicacionDetailModal({
  open,
  ubicacion,
  onClose,
}) {
  if (!open || !ubicacion) return null;

  const latitud = Number(ubicacion.latitud);
  const longitud = Number(ubicacion.longitud);

  const hasCoordinates =
    Number.isFinite(latitud) &&
    Number.isFinite(longitud);

  return (
    <div className="locations-modal-overlay">
      <section className="locations-detail-modal">
        <header className="locations-modal-header">
          <div>
            <span>Detalle geográfico</span>
            <h4>{ubicacion.nombre}</h4>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="locations-detail-body">
          <div className="locations-detail-grid">
            <article>
              <span>Código</span>
              <strong>
                UBI-{String(ubicacion.id).padStart(4, '0')}
              </strong>
            </article>

            <article>
              <span>Estado</span>
              <strong>
                {ubicacion.estado === false
                  ? 'Inactiva'
                  : 'Activa'}
              </strong>
            </article>

            <article>
              <span>Latitud</span>
              <strong>
                {hasCoordinates
                  ? latitud.toFixed(6)
                  : 'Sin definir'}
              </strong>
            </article>

            <article>
              <span>Longitud</span>
              <strong>
                {hasCoordinates
                  ? longitud.toFixed(6)
                  : 'Sin definir'}
              </strong>
            </article>
          </div>

          {hasCoordinates ? (
            <div className="locations-detail-map">
              <MapContainer
                center={[latitud, longitud]}
                zoom={13}
                className="locations-detail-leaflet"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                  position={[latitud, longitud]}
                  icon={createDetailIcon()}
                />
              </MapContainer>
            </div>
          ) : (
            <div className="locations-detail-no-map">
              <i className="bi bi-map" />
              <span>
                Esta ubicación no tiene coordenadas configuradas.
              </span>
            </div>
          )}
        </div>

        <footer className="locations-modal-footer">
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

export default UbicacionDetailModal;
