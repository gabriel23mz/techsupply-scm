import { useMemo } from 'react';

import L from 'leaflet';

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
} from 'react-leaflet';

import {
  MapControls,
  MapErrorState,
  MapLegend,
  MapShell,
  MapViewportController,
} from '../../../shared/maps';

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

function areSamePositions(first, second) {
  if (!first || !second) return false;

  const tolerance = 0.000001;

  return (
    Math.abs(Number(first[0]) - Number(second[0])) < tolerance &&
    Math.abs(Number(first[1]) - Number(second[1])) < tolerance
  );
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

  const currentDeliveryPosition = useMemo(() => {
    const currentOrder = Number(posicionActualOrden);

    if (!Number.isFinite(currentOrder) || currentOrder <= 0) {
      return null;
    }

    const currentPoint = deliveryPoints.find(
      (point) => Number(point.orden) === currentOrder,
    );

    return currentPoint
      ? [currentPoint.latitud, currentPoint.longitud]
      : null;
  }, [deliveryPoints, posicionActualOrden]);

  const truckPosition = useMemo(() => {
    const explicitPosition = normalizePosition(
      mapa?.camion?.posicion_actual ?? mapa?.posicion_actual,
    );

    if (estadoJornada === 'PLANIFICADA') {
      return warehousePosition ?? explicitPosition;
    }

    if (estadoJornada === 'EN_RUTA' && currentDeliveryPosition) {
      return currentDeliveryPosition;
    }

    return (
      explicitPosition ??
      currentDeliveryPosition ??
      warehousePosition
    );
  }, [
    currentDeliveryPosition,
    estadoJornada,
    mapa,
    warehousePosition,
  ]);

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
      <MapErrorState
        description="La jornada no contiene coordenadas válidas para representar su recorrido."
        icon="bi-map"
        title="Mapa no disponible"
        tone="neutral"
      />
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

      <MapShell
        ariaLabel="Mapa de seguimiento de la jornada"
        className="journey-map-container"
      >
        <MapContainer
          center={defaultCenter}
          zoom={13}
          zoomControl={false}
          scrollWheelZoom
          className="journey-leaflet-map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewportController
            positions={allPositions}
            maxZoom={15}
            singleZoom={14}
          />

          <MapControls
            fitLabel="Centrar ruta completa"
            fitPositions={allPositions}
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
            const pointPosition = [
              point.latitud,
              point.longitud,
            ];

            if (
              isCurrent &&
              areSamePositions(pointPosition, truckPosition)
            ) {
              return null;
            }

            return (
              <Marker
                key={point.orden}
                position={pointPosition}
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
      </MapShell>

      <MapLegend
        className="journey-map-legend"
        items={[
          {
            id: 'completed',
            label: 'Recorrido completado',
            type: 'line',
            tone: 'primary',
          },
          {
            id: 'pending',
            label: 'Recorrido pendiente',
            type: 'dashed',
            tone: 'primary',
          },
          {
            id: 'warehouse',
            label: 'Bodega',
            type: 'dot',
            tone: 'neutral',
          },
          {
            id: 'truck',
            label: 'Camión',
            type: 'dot',
            tone: 'info',
          },
          {
            id: 'delivery',
            label: 'Punto de entrega',
            type: 'dot',
            tone: 'success',
          },
        ]}
      />
    </section>
  );
}

export default JornadaMap;

