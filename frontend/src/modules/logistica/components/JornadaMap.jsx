import { useEffect, useMemo, useState } from 'react';

import L from 'leaflet';

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

/*
|--------------------------------------------------------------------------
| Utilidades
|--------------------------------------------------------------------------
*/

function isValidCoordinate(point) {
  return (
    Array.isArray(point) &&
    point.length >= 2 &&
    Number.isFinite(Number(point[0])) &&
    Number.isFinite(Number(point[1]))
  );
}

function normalizeGeometry(geometry) {
  if (!Array.isArray(geometry)) {
    return [];
  }

  return geometry
    .filter(isValidCoordinate)
    .map((point) => [
      Number(point[0]),
      Number(point[1]),
    ]);
}

function normalizePosition(position) {
  const latitude = Number(position?.latitud);
  const longitude = Number(position?.longitud);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return [latitude, longitude];
}

/*
|--------------------------------------------------------------------------
| Iconos HTML
|--------------------------------------------------------------------------
|
| Usamos divIcon para evitar problemas con las imágenes predeterminadas
| de los marcadores de Leaflet dentro de Vite.
|--------------------------------------------------------------------------
*/

function createWarehouseIcon() {
  return L.divIcon({
    className: 'journey-map-div-icon',
    html: `
      <div class="journey-map-marker warehouse">
        <i class="bi bi-house-door-fill"></i>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18],
  });
}

function createTruckIcon() {
  return L.divIcon({
    className: 'journey-map-div-icon',
    html: `
      <div class="journey-map-marker truck">
        <i class="bi bi-truck"></i>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -20],
  });
}

function createDeliveryIcon({
  order,
  status,
  isCurrent,
}) {
  let stateClass = 'pending';

  if (status === 'ENTREGADO') {
    stateClass = 'delivered';
  } else if (status === 'NO_ENTREGADO') {
    stateClass = 'not-delivered';
  } else if (isCurrent) {
    stateClass = 'current';
  }

  return L.divIcon({
    className: 'journey-map-div-icon',
    html: `
      <div class="journey-map-marker delivery ${stateClass}">
        ${
          status === 'ENTREGADO'
            ? '<i class="bi bi-check-lg"></i>'
            : order
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -15],
  });
}

/*
|--------------------------------------------------------------------------
| Ajuste automático del mapa
|--------------------------------------------------------------------------
*/
function MapBoundsController({
  positions,
  focusRequest,
}) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) {
      return;
    }

    map.invalidateSize();

    if (positions.length === 1) {
      map.flyTo(positions[0], 14, {
        animate: true,
        duration: 0.7,
      });

      return;
    }

    const bounds = L.latLngBounds(positions);

    map.flyToBounds(bounds, {
      padding: [36, 36],
      maxZoom: 15,
      animate: true,
      duration: 0.7,
    });
  }, [
    focusRequest,
    map,
    positions,
  ]);

  return null;
}

/*
|--------------------------------------------------------------------------
| Componente principal
|--------------------------------------------------------------------------
*/

function JornadaMap({
  mapa,
  estadoJornada,
  posicionActualOrden = 0,
}) {
  const completedRoute = useMemo(
    () =>
      normalizeGeometry(
        mapa?.recorrido_completado,
      ),
    [mapa],
  );

  const pendingRoute = useMemo(
    () =>
      normalizeGeometry(
        mapa?.recorrido_pendiente,
      ),
    [mapa],
  );

  const fullGeometry = useMemo(
    () =>
      normalizeGeometry(
        mapa?.geometria_completa,
      ),
    [mapa],
  );

  const warehousePosition = useMemo(
    () =>
      normalizePosition(
        mapa?.bodega ??
          mapa?.centro,
      ),
    [mapa],
  );

  const truckPosition = useMemo(
    () =>
      normalizePosition(
        mapa?.camion?.posicion_actual,
      ),
    [mapa],
  );

  const deliveryPoints = useMemo(() => {
    const points = Array.isArray(
      mapa?.puntos_entrega,
    )
      ? mapa.puntos_entrega
      : [];

    /*
     * El backend puede devolver varios despachos con
     * el mismo orden y ubicación. Para el mapa dejamos
     * un solo marcador por punto de ruta.
     */
    const uniquePoints = new Map();

    points.forEach((point) => {
      const latitude = Number(point.latitud);
      const longitude = Number(point.longitud);
      const order = Number(point.orden);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(order)
      ) {
        return;
      }

      if (!uniquePoints.has(order)) {
        uniquePoints.set(order, {
          orden: order,
          ubicacion:
            point.ubicacion ??
            'Ubicación no disponible',
          latitud: latitude,
          longitud: longitude,
          estados: [],
          totalDespachos: 0,
        });
      }

      const groupedPoint = uniquePoints.get(order);

      groupedPoint.totalDespachos += 1;
      groupedPoint.estados.push(point.estado);
    });

    return [...uniquePoints.values()]
      .sort((a, b) => a.orden - b.orden)
      .map((point) => {
        const allDelivered =
          point.estados.length > 0 &&
          point.estados.every(
            (status) => status === 'ENTREGADO',
          );

        const allClosed =
          point.estados.length > 0 &&
          point.estados.every((status) =>
            [
              'ENTREGADO',
              'NO_ENTREGADO',
            ].includes(status),
          );

        let status = 'PENDIENTE';

        if (allDelivered) {
          status = 'ENTREGADO';
        } else if (allClosed) {
          status = 'NO_ENTREGADO';
        }

        return {
          ...point,
          estado: status,
        };
      });
  }, [mapa]);

  const allPositions = useMemo(() => {
    const positions = [
      ...fullGeometry,
      ...completedRoute,
      ...pendingRoute,
    ];

    if (warehousePosition) {
      positions.push(warehousePosition);
    }

    if (truckPosition) {
      positions.push(truckPosition);
    }

    deliveryPoints.forEach((point) => {
      positions.push([
        point.latitud,
        point.longitud,
      ]);
    });

    return positions;
  }, [
    completedRoute,
    deliveryPoints,
    fullGeometry,
    pendingRoute,
    truckPosition,
    warehousePosition,
  ]);

  const [
    focusRequest,
    setFocusRequest,
  ] = useState(0);

  const firstDeliveryPosition =
    deliveryPoints.length > 0
      ? [
          deliveryPoints[0].latitud,
          deliveryPoints[0].longitud,
        ]
      : null;

  const defaultCenter =
    warehousePosition ??
    truckPosition ??
    firstDeliveryPosition ??
    [-0.84582, -80.16389];

  if (
    !warehousePosition &&
    fullGeometry.length === 0 &&
    deliveryPoints.length === 0
  ) {
    return (
      <div className="journey-map-empty">
        <i className="bi bi-map" />

        <h4>Mapa no disponible</h4>

        <p>
          La jornada no contiene coordenadas válidas
          para representar su recorrido.
        </p>
      </div>
    );
  }

  return (
    <section className="journey-map-card">
      <header className="journey-map-header">
        <div>
          <span>Seguimiento geográfico</span>
          <h4>Mapa de la jornada</h4>
        </div>

        <span className="journey-map-route-count">
          {deliveryPoints.length} punto
          {deliveryPoints.length === 1 ? '' : 's'}
        </span>
      </header>

      <div className="journey-map-container">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom
          className="journey-leaflet-map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsController
            positions={allPositions}
            focusRequest={focusRequest}
          />

          {completedRoute.length > 1 && (
            <Polyline
              positions={completedRoute}
              pathOptions={{
                color: '#2563eb',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}

          {pendingRoute.length > 1 && (
            <Polyline
              positions={pendingRoute}
              pathOptions={{
                color: '#2563eb',
                weight: 4,
                opacity: 0.72,
                dashArray: '10 10',
              }}
            />
          )}

          {warehousePosition && (
            <Marker
              position={warehousePosition}
              icon={createWarehouseIcon()}
              zIndexOffset={900}
            >
              <Popup>
                <strong>
                  {mapa?.bodega?.nombre ??
                    'Bodega central'}
                </strong>

                <br />

                Inicio y fin de la jornada
              </Popup>

              <Tooltip direction="top">
                Bodega central
              </Tooltip>
            </Marker>
          )}

          {deliveryPoints.map((point) => {
            const isCurrent =
              estadoJornada === 'EN_RUTA' &&
              Number(posicionActualOrden) ===
                Number(point.orden);

            return (
              <Marker
                key={point.orden}
                position={[
                  point.latitud,
                  point.longitud,
                ]}
                icon={createDeliveryIcon({
                  order: point.orden,
                  status: point.estado,
                  isCurrent,
                })}
                zIndexOffset={
                  isCurrent ? 800 : 400
                }
              >
                <Popup>
                  <strong>
                    Punto {point.orden}:{' '}
                    {point.ubicacion}
                  </strong>

                  <br />

                  {point.totalDespachos}{' '}
                  despacho
                  {point.totalDespachos === 1
                    ? ''
                    : 's'}
                </Popup>

                <Tooltip direction="top">
                  {point.orden}. {point.ubicacion}
                </Tooltip>
              </Marker>
            );
          })}

          {truckPosition && (
            <Marker
              position={truckPosition}
              icon={createTruckIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <strong>Camión actual</strong>

                <br />

                Estado:{' '}
                {String(estadoJornada ?? '')
                  .replaceAll('_', ' ')
                  .toLowerCase()}
              </Popup>

              <Tooltip direction="top">
                Posición actual del camión
              </Tooltip>
            </Marker>
          )}
        </MapContainer>
        
        <button
          type="button"
          className="routes-map-recenter-button"
          title="Centrar ruta completa"
          aria-label="Centrar ruta completa"
          onClick={() =>
              setFocusRequest(
                (current) => current + 1,
              )
            }
        >
          <i className="bi bi-crosshair" />
        </button>
      </div>

      <footer className="journey-map-legend">
        <span>
          <i className="legend-line completed" />
          Recorrido completado
        </span>

        <span>
          <i className="legend-line pending" />
          Recorrido pendiente
        </span>

        <span>
          <i className="legend-dot warehouse" />
          Bodega
        </span>

        <span>
          <i className="legend-dot truck" />
          Camión
        </span>

        <span>
          <i className="legend-dot delivery" />
          Punto de entrega
        </span>
      </footer>
    </section>
  );
}

export default JornadaMap;

