import {
  useEffect,
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
  useMap,
} from 'react-leaflet';

function normalizePosition(
  ubicacion,
) {
  const latitud = Number(
    ubicacion?.latitud,
  );

  const longitud = Number(
    ubicacion?.longitud,
  );

  if (
    !Number.isFinite(
      latitud,
    ) ||
    !Number.isFinite(
      longitud,
    )
  ) {
    return null;
  }

  return [
    latitud,
    longitud,
  ];
}

function createLocationIcon(
  selected,
) {
  return L.divIcon({
    className:
      'locations-map-div-icon',
    html: `
      <div class="locations-general-marker ${
        selected
          ? 'selected'
          : ''
      }">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -28],
  });
}

function MapViewport({
  positions,
  selectedPosition,
  focusRequest,
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    if (
      selectedPosition
    ) {
      map.flyTo(
        selectedPosition,
        13,
        {
          animate: true,
          duration: 0.6,
        },
      );

      return;
    }

    if (!positions.length) {
      return;
    }

    if (
      positions.length === 1
    ) {
      map.flyTo(
        positions[0],
        13,
        {
          animate: true,
          duration: 0.6,
        },
      );

      return;
    }

    map.flyToBounds(
      L.latLngBounds(
        positions,
      ),
      {
        padding: [36, 36],
        maxZoom: 12,
        animate: true,
        duration: 0.6,
      },
    );
  }, [
    focusRequest,
    map,
    positions,
    selectedPosition,
  ]);

  return null;
}

function UbicacionesMapaGeneral({
  ubicaciones,
  onView,
  onRefresh,
}) {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    selectedId,
    setSelectedId,
  ] = useState(null);

  const [
    focusRequest,
    setFocusRequest,
  ] = useState(0);

  const validLocations =
    useMemo(
      () =>
        ubicaciones
          .map(
            (ubicacion) => ({
              ubicacion,
              position:
                normalizePosition(
                  ubicacion,
                ),
            }),
          )
          .filter(
            (item) =>
              item.position,
          ),
      [ubicaciones],
    );

  const filteredLocations =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return validLocations;
      }

      return validLocations.filter(
        (item) =>
          String(
            item.ubicacion
              .nombre ?? '',
          )
            .toLowerCase()
            .includes(search),
      );
    }, [
      searchTerm,
      validLocations,
    ]);

  const selectedItem =
    filteredLocations.find(
      (item) =>
        Number(
          item.ubicacion.id,
        ) ===
        Number(selectedId),
    ) ?? null;

  const allPositions =
    filteredLocations.map(
      (item) =>
        item.position,
    );

  const handleSelect = (
    item,
  ) => {
    setSelectedId(
      item.ubicacion.id,
    );

    setFocusRequest(
      (current) =>
        current + 1,
    );
  };

  const handleCenterAll = () => {
    setSelectedId(null);

    setFocusRequest(
      (current) =>
        current + 1,
    );
  };

  if (
    !validLocations.length
  ) {
    return (
      <div className="locations-map-empty">
        <i className="bi bi-map" />

        <h4>
          No hay ubicaciones para mostrar
        </h4>

        <p>
          Registra coordenadas válidas para visualizar
          los nodos en el mapa.
        </p>
      </div>
    );
  }

  return (
    <section className="locations-map-workspace">
      <aside className="locations-map-list">
        <header>
          <div>
            <span>
              Nodos geográficos
            </span>

            <h4>
              Ubicaciones registradas
            </h4>
          </div>

          <button
            type="button"
            className="locations-map-refresh-button"
            onClick={onRefresh}
            title="Actualizar ubicaciones"
            aria-label="Actualizar ubicaciones"
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </header>

        <div className="locations-map-search">
          <i className="bi bi-search" />

          <input
            type="search"
            className="form-control form-control-sm"
            value={searchTerm}
            placeholder="Buscar ubicación..."
            onChange={(
              event,
            ) =>
              setSearchTerm(
                event.target
                  .value,
              )
            }
          />
        </div>

        <div className="locations-map-list__content">
          {filteredLocations.map(
            (item) => (
              <button
                key={
                  item.ubicacion.id
                }
                type="button"
                className={`locations-map-list-item ${
                  Number(
                    item.ubicacion
                      .id,
                  ) ===
                  Number(
                    selectedId,
                  )
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  handleSelect(
                    item,
                  )
                }
              >
                <div>
                  <strong>
                    {
                      item.ubicacion
                        .nombre
                    }
                  </strong>

                  <span>
                    {item.position[0]
                      .toFixed(5)}
                    ,{' '}
                    {item.position[1]
                      .toFixed(5)}
                  </span>
                </div>

                <span
                  className={`locations-status ${
                    item.ubicacion
                      .estado ===
                    false
                      ? 'inactive'
                      : 'active'
                  }`}
                >
                  {item.ubicacion
                    .estado ===
                  false
                    ? 'Inactiva'
                    : 'Activa'}
                </span>
              </button>
            ),
          )}
        </div>
      </aside>

      <section className="locations-general-map-card">
        <div className="locations-general-map-container">
          <MapContainer
            center={
              allPositions[0]
            }
            zoom={10}
            className="locations-general-leaflet"
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewport
              positions={
                allPositions
              }
              selectedPosition={
                selectedItem
                  ?.position ??
                null
              }
              focusRequest={
                focusRequest
              }
            />

            {filteredLocations.map(
              (item) => {
                const selected =
                  Number(
                    item
                      .ubicacion
                      .id,
                  ) ===
                  Number(
                    selectedId,
                  );

                return (
                  <Marker
                    key={
                      item
                        .ubicacion
                        .id
                    }
                    position={
                      item.position
                    }
                    icon={createLocationIcon(
                      selected,
                    )}
                    zIndexOffset={
                      selected
                        ? 1000
                        : 500
                    }
                    eventHandlers={{
                      click: () =>
                        handleSelect(
                          item,
                        ),
                    }}
                  >
                    <Popup>
                      <div className="locations-map-popup">
                        <strong>
                          {
                            item
                              .ubicacion
                              .nombre
                          }
                        </strong>

                        <span>
                          Latitud:{' '}
                          {item.position[0]
                            .toFixed(
                              6,
                            )}
                        </span>

                        <span>
                          Longitud:{' '}
                          {item.position[1]
                            .toFixed(
                              6,
                            )}
                        </span>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm mt-2"
                          onClick={() =>
                            onView(
                              item
                                .ubicacion,
                            )
                          }
                        >
                          Ver detalle
                        </button>
                      </div>
                    </Popup>

                    <Tooltip direction="top">
                      {
                        item
                          .ubicacion
                          .nombre
                      }
                    </Tooltip>
                  </Marker>
                );
              },
            )}
          </MapContainer>

          <div className="locations-general-map-actions">
            <button
              type="button"
              title="Centrar todas"
              onClick={
                handleCenterAll
              }
            >
              <i className="bi bi-arrows-fullscreen" />
            </button>

            <button
              type="button"
              title="Actualizar"
              onClick={onRefresh}
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

export default UbicacionesMapaGeneral;
