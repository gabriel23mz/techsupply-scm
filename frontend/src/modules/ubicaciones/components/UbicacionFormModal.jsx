import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import L from 'leaflet';

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

const MANABI_CENTER = [-1.05458, -80.45445];
const MANABI_ZOOM = 9;

function createLocationIcon() {
  return L.divIcon({
    className: 'locations-map-div-icon',
    html: `
      <div class="locations-form-marker">
        <i class="bi bi-geo-alt-fill"></i>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
  });
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  return null;
}

function MapCenterController({
  position,
  focusRequest,
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();

    if (position) {
      map.flyTo(position, 13, {
        animate: true,
        duration: 0.6,
      });

      return;
    }

    map.flyTo(
      MANABI_CENTER,
      MANABI_ZOOM,
      {
        animate: true,
        duration: 0.6,
      },
    );
  }, [
    focusRequest,
    map,
    position,
  ]);

  return null;
}

function MapControls({
  position,
  onCenterRequest,
}) {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleCenter = () => {
    onCenterRequest();

    if (position) {
      map.flyTo(position, 13, {
        animate: true,
        duration: 0.6,
      });

      return;
    }

    map.flyTo(
      MANABI_CENTER,
      MANABI_ZOOM,
      {
        animate: true,
        duration: 0.6,
      },
    );
  };

  return (
    <div className="locations-form-map-controls">
      <button
        type="button"
        title="Acercar"
        aria-label="Acercar"
        onClick={handleZoomIn}
      >
        <i className="bi bi-plus-lg" />
      </button>

      <button
        type="button"
        title="Alejar"
        aria-label="Alejar"
        onClick={handleZoomOut}
      >
        <i className="bi bi-dash-lg" />
      </button>

      <button
        type="button"
        title={
          position
            ? 'Centrar marcador'
            : 'Centrar en Manabí'
        }
        aria-label={
          position
            ? 'Centrar marcador'
            : 'Centrar en Manabí'
        }
        onClick={handleCenter}
      >
        <i className="bi bi-crosshair" />
      </button>
    </div>
  );
}

function haversineDistanceMeters(
  firstPosition,
  secondPosition,
) {
  const earthRadius = 6371000;

  const toRadians = (value) =>
    (value * Math.PI) / 180;

  const lat1 = toRadians(
    firstPosition[0],
  );

  const lat2 = toRadians(
    secondPosition[0],
  );

  const deltaLat = toRadians(
    secondPosition[0] -
      firstPosition[0],
  );

  const deltaLon = toRadians(
    secondPosition[1] -
      firstPosition[1],
  );

  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value),
    )
  );
}


function getInitialLocation(mode, ubicacion) {
  if (mode !== 'edit' || !ubicacion) {
    return {
      nombre: '',
      position: null,
    };
  }

  const latitud = Number(ubicacion.latitud);
  const longitud = Number(ubicacion.longitud);

  return {
    nombre: String(ubicacion.nombre ?? ''),
    position:
      Number.isFinite(latitud) && Number.isFinite(longitud)
        ? [latitud, longitud]
        : null,
  };
}

function UbicacionFormModal({
  open,
  mode = 'create',
  ubicacion,
  ubicaciones,
  isSaving,
  onSave,
  onClose,
}) {
  const initialLocation = getInitialLocation(
    mode,
    ubicacion,
  );

  const [nombre, setNombre] =
    useState(initialLocation.nombre);

  const [position, setPosition] =
    useState(initialLocation.position);

  const [errors, setErrors] =
    useState({});

  const [
    focusRequest,
    setFocusRequest,
  ] = useState(0);

  const duplicateByName =
    useMemo(() => {
      const normalized = nombre
        .trim()
        .toLowerCase();

      if (!normalized) {
        return null;
      }

      return (
        ubicaciones.find(
          (item) =>
            Number(item.id) !==
              Number(
                ubicacion?.id,
              ) &&
            String(
              item.nombre ?? '',
            )
              .trim()
              .toLowerCase() ===
              normalized,
        ) ?? null
      );
    }, [
      nombre,
      ubicacion?.id,
      ubicaciones,
    ]);

  const duplicateByDistance =
    useMemo(() => {
      if (!position) {
        return null;
      }

      return (
        ubicaciones.find(
          (item) => {
            if (
              Number(item.id) ===
              Number(
                ubicacion?.id,
              )
            ) {
              return false;
            }

            const latitud = Number(
              item.latitud,
            );

            const longitud = Number(
              item.longitud,
            );

            if (
              !Number.isFinite(
                latitud,
              ) ||
              !Number.isFinite(
                longitud,
              )
            ) {
              return false;
            }

            return (
              haversineDistanceMeters(
                position,
                [
                  latitud,
                  longitud,
                ],
              ) < 500
            );
          },
        ) ?? null
      );
    }, [
      position,
      ubicacion?.id,
      ubicaciones,
    ]);

  const validate = () => {
    const nextErrors = {};

    if (!nombre.trim()) {
      nextErrors.nombre =
        'El nombre del cantón es obligatorio.';
    } else if (
      duplicateByName
    ) {
      nextErrors.nombre =
        `Ya existe la ubicación ${duplicateByName.nombre}.`;
    }

    if (!position) {
      nextErrors.position =
        'Selecciona el punto central del cantón en el mapa.';
    } else if (
      duplicateByDistance
    ) {
      nextErrors.position =
        `El punto está demasiado cerca de ${duplicateByDistance.nombre}.`;
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  };

  const handlePick = (
    newPosition,
  ) => {
    setPosition(newPosition);

    setFocusRequest(
      (current) => current + 1,
    );

    setErrors(
      (current) => ({
        ...current,
        position: null,
      }),
    );
  };

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSave({
      nombre: nombre.trim(),
      latitud: Number(
        position[0].toFixed(6),
      ),
      longitud: Number(
        position[1].toFixed(6),
      ),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="locations-modal-overlay">
      <section className="locations-form-modal">
        <header className="locations-modal-header">
          <div>
            <span>
              Catálogo geográfico
            </span>

            <h4>
              {mode === 'edit'
                ? 'Editar ubicación'
                : 'Nueva ubicación'}
            </h4>

            <p>
              Selecciona el punto central del cantón
              para registrar el nodo logístico.
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            disabled={isSaving}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <form
          className="locations-form-modal__form"
          onSubmit={handleSubmit}
        >
          <div className="locations-form-layout">
            <section className="locations-form-fields">
              <div className="locations-form-section">
                <div className="locations-form-section__heading">
                  <span>Datos básicos</span>

                  <strong>
                    Identificación del nodo
                  </strong>
                </div>

                <div>
                  <label
                    htmlFor="location-name"
                    className="form-label"
                  >
                    Nombre del cantón o ciudad
                  </label>

                  <input
                    id="location-name"
                    type="text"
                    className={`form-control ${
                      errors.nombre
                        ? 'is-invalid'
                        : ''
                    }`}
                    value={nombre}
                    placeholder="Ej. Tosagua"
                    onChange={(
                      event,
                    ) =>
                      setNombre(
                        event.target
                          .value,
                      )
                    }
                  />

                  {errors.nombre && (
                    <div className="invalid-feedback">
                      {errors.nombre}
                    </div>
                  )}
                </div>
              </div>

              <div className="locations-form-section">
                <div className="locations-form-section__heading">
                  <span>Coordenadas</span>

                  <strong>
                    Lectura del marcador
                  </strong>
                </div>

                <div className="locations-coordinate-grid">
                  <div>
                    <label className="form-label">
                      Latitud
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={
                        position
                          ? position[0]
                            .toFixed(6)
                          : ''
                      }
                      placeholder="Selecciona en el mapa"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Longitud
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={
                        position
                          ? position[1]
                            .toFixed(6)
                          : ''
                      }
                      placeholder="Selecciona en el mapa"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="locations-form-note">
                <i className="bi bi-info-circle" />

                <p>
                  <strong>
                    Registra únicamente el centro del cantón.
                  </strong>{' '}
                  No selecciones parques, barrios, calles
                  ni direcciones específicas.
                </p>
              </div>

              {errors.position && (
                <div className="alert alert-danger py-2 mb-0">
                  {errors.position}
                </div>
              )}
            </section>

            <section className="locations-form-map">
              <MapContainer
                center={
                  position ??
                  MANABI_CENTER
                }
                zoom={
                  position
                    ? 13
                    : MANABI_ZOOM
                }
                className="locations-form-leaflet"
                scrollWheelZoom
                zoomControl={false}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler
                  onPick={handlePick}
                />

                <MapCenterController
                  position={position}
                  focusRequest={
                    focusRequest
                  }
                />

                <MapControls
                  position={position}
                  onCenterRequest={() =>
                    setFocusRequest(
                      (current) =>
                        current + 1,
                    )
                  }
                />

                {position && (
                  <Marker
                    position={position}
                    draggable
                    icon={createLocationIcon()}
                    eventHandlers={{
                      dragend(
                        event,
                      ) {
                        const marker =
                          event.target
                            .getLatLng();

                        handlePick([
                          marker.lat,
                          marker.lng,
                        ]);
                      },
                    }}
                  />
                )}
              </MapContainer>

              {!position && (
                <div className="locations-map-instruction">
                  <div>
                    <i className="bi bi-geo-alt" />
                  </div>

                  <strong>
                    Selecciona el centro del cantón
                  </strong>

                  <span>
                    Haz clic en el mapa para colocar
                    el marcador.
                  </span>
                </div>
              )}

              <div className="locations-map-help">
                <i className="bi bi-cursor" />

                Haz clic en el mapa o arrastra el marcador.
              </div>
            </section>
          </div>

          <footer className="locations-modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-check-lg me-2" />
              )}

              {mode === 'edit'
                ? 'Guardar cambios'
                : 'Registrar ubicación'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default UbicacionFormModal;
