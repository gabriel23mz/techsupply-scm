import {
  MapContainer,
  Marker,
  TileLayer,
} from 'react-leaflet';

import L from 'leaflet';

import {
  MapControls,
  MapShell,
  MapViewportController,
} from '../../../shared/maps';

import {
  Drawer,
  StatusBadge,
} from '../../../shared/ui';

import {
  formatCoordinate,
  getLocationPosition,
} from '../ubicacion.utils';

function createDetailIcon() {
  return L.divIcon({
    className: 'locations-map-div-icon',
    html: `
      <div class="locations-detail-marker">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
  });
}

function LocationDetailRow({ label, children }) {
  return (
    <div className="location-detail-row">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

function UbicacionDetailModal({
  onClose,
  open,
  ubicacion,
}) {
  if (!ubicacion) return null;

  const position = getLocationPosition(ubicacion);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={ubicacion.nombre}
      description="Detalle geográfico del nodo operativo."
      size="lg"
    >
      <div className="location-detail-drawer">
        <section className="location-detail-summary">
          <LocationDetailRow label="Estado">
            <StatusBadge
              tone={ubicacion.estado === false ? 'danger' : 'success'}
            >
              {ubicacion.estado === false ? 'Inactiva' : 'Activa'}
            </StatusBadge>
          </LocationDetailRow>

          <LocationDetailRow label="Código">
            UBI-{String(ubicacion.id).padStart(4, '0')}
          </LocationDetailRow>
        </section>

        <section className="location-detail-section">
          <h3>Coordenadas</h3>
          <div className="location-detail-grid">
            <LocationDetailRow label="Latitud">
              {formatCoordinate(ubicacion.latitud)}
            </LocationDetailRow>
            <LocationDetailRow label="Longitud">
              {formatCoordinate(ubicacion.longitud)}
            </LocationDetailRow>
          </div>
        </section>

        {position && (
          <MapShell
            ariaLabel={`Mapa de ${ubicacion.nombre}`}
            className="location-detail-map"
          >
            <MapContainer
              center={position}
              zoom={13}
              zoomControl={false}
              className="location-detail-leaflet"
              scrollWheelZoom
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapViewportController
                positions={[position]}
                singleZoom={13}
              />

              <MapControls
                defaultCenter={position}
                defaultZoom={13}
                showFit={false}
                showReset
                resetLabel="Centrar ubicación"
              />

              <Marker
                position={position}
                icon={createDetailIcon()}
              />
            </MapContainer>
          </MapShell>
        )}
      </div>
    </Drawer>
  );
}

export default UbicacionDetailModal;
