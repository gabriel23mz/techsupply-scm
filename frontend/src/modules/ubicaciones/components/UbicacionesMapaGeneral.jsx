import {
  useMemo,
  useState,
} from 'react';

import L from 'leaflet';

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
} from 'react-leaflet';

import {
  MapControls,
  MapErrorState,
  MapShell,
  MapViewportController,
} from '../../../shared/maps';

import {
  Button,
  SearchField,
  StatusBadge,
} from '../../../shared/ui';

import {
  getLocationPosition,
} from '../ubicacion.utils';

function createLocationIcon(selected) {
  return L.divIcon({
    className: 'locations-map-div-icon',
    html: `
      <div class="locations-general-marker ${selected ? 'selected' : ''}">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -28],
  });
}

function UbicacionesMapaGeneral({
  onView,
  ubicaciones,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(0);

  const validLocations = useMemo(
    () =>
      ubicaciones
        .map((ubicacion) => ({
          ubicacion,
          position: getLocationPosition(ubicacion),
        }))
        .filter((item) => item.position),
    [ubicaciones],
  );

  const filteredLocations = useMemo(() => {
    const search = searchTerm.trim().toLocaleLowerCase('es');
    if (!search) return validLocations;

    return validLocations.filter((item) =>
      String(item.ubicacion.nombre ?? '')
        .toLocaleLowerCase('es')
        .includes(search),
    );
  }, [searchTerm, validLocations]);

  const selectedItem =
    filteredLocations.find(
      (item) => Number(item.ubicacion.id) === Number(selectedId),
    ) ?? null;
  const allPositions = useMemo(
    () => filteredLocations.map((item) => item.position),
    [filteredLocations],
  );
  const focusPositions = useMemo(
    () => (selectedItem?.position ? [selectedItem.position] : []),
    [selectedItem],
  );

  const handleSelect = (item) => {
    setSelectedId(item.ubicacion.id);
    setFocusRequest((current) => current + 1);
  };

  if (!validLocations.length) {
    return (
      <MapErrorState
        description="Registra coordenadas válidas para visualizar los nodos."
        icon="bi-map"
        title="No hay ubicaciones para mostrar"
        tone="neutral"
      />
    );
  }

  return (
    <section className="locations-map-workspace">
      <aside className="locations-map-list">
        <header>
          <div>
            <span>Nodos geográficos</span>
            <h3>Ubicaciones registradas</h3>
          </div>
          <strong>{filteredLocations.length}</strong>
        </header>

        <SearchField
          value={searchTerm}
          placeholder="Buscar ubicación"
          aria-label="Buscar ubicación en el mapa"
          onChange={(event) => setSearchTerm(event.target.value)}
          onClear={() => setSearchTerm('')}
        />

        <div className="locations-map-list__content">
          {filteredLocations.map((item) => {
            const selected =
              Number(item.ubicacion.id) === Number(selectedId);

            return (
              <button
                key={item.ubicacion.id}
                type="button"
                className={`locations-map-list-item ${
                  selected ? 'selected' : ''
                }`}
                onClick={() => handleSelect(item)}
              >
                <div>
                  <strong>{item.ubicacion.nombre}</strong>
                  <span>
                    {item.position[0].toFixed(5)},{' '}
                    {item.position[1].toFixed(5)}
                  </span>
                </div>

                <StatusBadge
                  size="sm"
                  tone={
                    item.ubicacion.estado === false ? 'danger' : 'success'
                  }
                >
                  {item.ubicacion.estado === false ? 'Inactiva' : 'Activa'}
                </StatusBadge>
              </button>
            );
          })}
        </div>
      </aside>

      <MapShell
        ariaLabel="Mapa general de ubicaciones"
        className="locations-general-map"
      >
        <MapContainer
          center={allPositions[0]}
          zoom={10}
          zoomControl={false}
          className="locations-general-leaflet"
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewportController
            focusPositions={focusPositions}
            positions={allPositions}
            requestKey={focusRequest}
            maxZoom={12}
            singleZoom={13}
          />

          <MapControls
            fitLabel="Centrar todas las ubicaciones"
            fitPositions={allPositions}
          />

          {filteredLocations.map((item) => {
            const selected =
              Number(item.ubicacion.id) === Number(selectedId);

            return (
              <Marker
                key={item.ubicacion.id}
                position={item.position}
                icon={createLocationIcon(selected)}
                zIndexOffset={selected ? 1000 : 500}
                eventHandlers={{
                  click: () => handleSelect(item),
                }}
              >
                <Popup>
                  <div className="locations-map-popup">
                    <strong>{item.ubicacion.nombre}</strong>
                    <span>Latitud: {item.position[0].toFixed(6)}</span>
                    <span>Longitud: {item.position[1].toFixed(6)}</span>
                    <Button
                      size="sm"
                      onClick={() => onView?.(item.ubicacion)}
                    >
                      Ver detalle
                    </Button>
                  </div>
                </Popup>

                <Tooltip direction="top">
                  {item.ubicacion.nombre}
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </MapShell>
    </section>
  );
}

export default UbicacionesMapaGeneral;
