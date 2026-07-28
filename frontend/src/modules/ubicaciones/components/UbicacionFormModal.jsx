import {
  useMemo,
  useState,
} from 'react';

import L from 'leaflet';

import {
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

import {
  MapControls,
  MapShell,
  MapViewportController,
} from '../../../shared/maps';

import {
  Button,
  Modal,
  TextField,
} from '../../../shared/ui';

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
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function haversineDistanceMeters(firstPosition, secondPosition) {
  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const lat1 = toRadians(firstPosition[0]);
  const lat2 = toRadians(secondPosition[0]);
  const deltaLat = toRadians(secondPosition[0] - firstPosition[0]);
  const deltaLon = toRadians(secondPosition[1] - firstPosition[1]);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

function getInitialLocation(mode, ubicacion) {
  if (mode !== 'edit' || !ubicacion) {
    return { nombre: '', position: null };
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
  isSaving,
  mode = 'create',
  onClose,
  onSave,
  open,
  ubicacion,
  ubicaciones,
}) {
  const initialLocation = getInitialLocation(mode, ubicacion);
  const [nombre, setNombre] = useState(initialLocation.nombre);
  const [position, setPosition] = useState(initialLocation.position);
  const [touched, setTouched] = useState({});

  const duplicateByName = useMemo(() => {
    const normalized = nombre.trim().toLocaleLowerCase('es');
    if (!normalized) return null;

    return (
      ubicaciones.find(
        (item) =>
          Number(item.id) !== Number(ubicacion?.id) &&
          String(item.nombre ?? '')
            .trim()
            .toLocaleLowerCase('es') === normalized,
      ) ?? null
    );
  }, [nombre, ubicacion?.id, ubicaciones]);

  const duplicateByDistance = useMemo(() => {
    if (!position) return null;

    return (
      ubicaciones.find((item) => {
        if (Number(item.id) === Number(ubicacion?.id)) return false;

        const latitud = Number(item.latitud);
        const longitud = Number(item.longitud);

        if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
          return false;
        }

        return (
          haversineDistanceMeters(position, [latitud, longitud]) < 500
        );
      }) ?? null
    );
  }, [position, ubicacion?.id, ubicaciones]);

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!nombre.trim()) {
      nextErrors.nombre = 'El nombre del cantón o ciudad es obligatorio.';
    } else if (duplicateByName) {
      nextErrors.nombre = `Ya existe la ubicación ${duplicateByName.nombre}.`;
    }

    if (!position) {
      nextErrors.position = 'Selecciona el punto central en el mapa.';
    } else if (duplicateByDistance) {
      nextErrors.position =
        `El punto está demasiado cerca de ${duplicateByDistance.nombre}.`;
    }

    return nextErrors;
  }, [duplicateByDistance, duplicateByName, nombre, position]);

  const isValid = Object.keys(errors).length === 0;
  const viewportPositions = useMemo(
    () => [position ?? MANABI_CENTER],
    [position],
  );
  const focusPositions = useMemo(
    () => (position ? [position] : []),
    [position],
  );

  const handlePick = (newPosition) => {
    setPosition(newPosition);
    setTouched((current) => ({ ...current, position: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ nombre: true, position: true });

    if (!isValid) return;

    onSave({
      nombre: nombre.trim(),
      latitud: Number(position[0].toFixed(6)),
      longitud: Number(position[1].toFixed(6)),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Editar ubicación' : 'Nueva ubicación'}
      description="Registra el nombre y selecciona el punto central del nodo geográfico."
      size="xl"
      className="location-form-modal"
      footer={
        <>
          <Button
            tone="secondary"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="location-form"
            icon="bi bi-check-lg"
            loading={isSaving}
            loadingLabel="Guardando"
            disabled={!isValid}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Registrar ubicación'}
          </Button>
        </>
      }
    >
      <form
        id="location-form"
        className="location-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <section className="location-form__fields">
          <header className="location-form__section-heading">
            <div>
              <i className="bi bi-geo-alt" aria-hidden="true" />
            </div>
            <span>
              <strong>Datos del nodo</strong>
              <small>
                Utiliza el centro del cantón o ciudad, no una dirección
                específica.
              </small>
            </span>
          </header>

          <TextField
            label="Nombre del cantón o ciudad"
            required
            value={nombre}
            placeholder="Ej. Tosagua"
            error={touched.nombre ? errors.nombre : undefined}
            success={
              touched.nombre && !errors.nombre
                ? 'Nombre disponible.'
                : undefined
            }
            onBlur={() =>
              setTouched((current) => ({ ...current, nombre: true }))
            }
            onChange={(event) => setNombre(event.target.value)}
          />

          <div className="location-coordinate-grid">
            <TextField
              label="Latitud"
              value={position ? position[0].toFixed(6) : ''}
              placeholder="Selecciona en el mapa"
              readOnly
            />
            <TextField
              label="Longitud"
              value={position ? position[1].toFixed(6) : ''}
              placeholder="Selecciona en el mapa"
              readOnly
            />
          </div>

          <div
            className={`location-position-feedback ${
              touched.position && errors.position
                ? 'is-invalid'
                : position
                  ? 'is-valid'
                  : ''
            }`}
          >
            <i
              className={`bi ${
                touched.position && errors.position
                  ? 'bi-exclamation-circle'
                  : position
                    ? 'bi-check-circle'
                    : 'bi-info-circle'
              }`}
              aria-hidden="true"
            />
            <span>
              {touched.position && errors.position
                ? errors.position
                : position
                  ? 'Punto geográfico seleccionado.'
                  : 'Haz clic en el mapa para colocar el marcador.'}
            </span>
          </div>
        </section>

        <MapShell
          ariaLabel="Selector geográfico de ubicación"
          className="location-form__map"
        >
          <MapContainer
            center={position ?? MANABI_CENTER}
            zoom={position ? 13 : MANABI_ZOOM}
            className="location-form__leaflet"
            scrollWheelZoom
            zoomControl={false}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onPick={handlePick} />

            <MapViewportController
              focusPositions={focusPositions}
              positions={viewportPositions}
              singleZoom={position ? 13 : MANABI_ZOOM}
            />

            <MapControls
              defaultCenter={position ?? MANABI_CENTER}
              defaultZoom={position ? 13 : MANABI_ZOOM}
              resetLabel={position ? 'Centrar marcador' : 'Centrar en Manabí'}
              showFit={false}
              showReset
            />

            {position && (
              <Marker
                position={position}
                draggable
                icon={createLocationIcon()}
                eventHandlers={{
                  dragend(event) {
                    const marker = event.target.getLatLng();
                    handlePick([marker.lat, marker.lng]);
                  },
                }}
              />
            )}
          </MapContainer>

          {!position && (
            <div className="location-map-instruction">
              <i className="bi bi-cursor" aria-hidden="true" />
              <strong>Selecciona el centro del cantón</strong>
              <span>Haz clic en el mapa para colocar el marcador.</span>
            </div>
          )}
        </MapShell>
      </form>
    </Modal>
  );
}

export default UbicacionFormModal;
