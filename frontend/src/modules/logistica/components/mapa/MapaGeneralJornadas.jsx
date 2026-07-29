import {
  useMemo,
  useState,
} from 'react';

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
} from '../../../../shared/maps';

const ROUTE_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#7c3aed',
  '#0891b2',
  '#4f46e5',
  '#0284c7',
];

function normalizeGeometry(geometry) {
  if (!Array.isArray(geometry)) {
    return [];
  }

  return geometry
    .filter(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1])),
    )
    .map((point) => [
      Number(point[0]),
      Number(point[1]),
    ]);
}

function normalizePosition(position) {
  const latitud = Number(
    position?.latitud ?? position?.latitude,
  );

  const longitud = Number(
    position?.longitud ?? position?.longitude,
  );

  if (
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud)
  ) {
    return null;
  }

  return [latitud, longitud];
}

// funcion auxiliar 2
function areSamePositions(first, second) {
  if (!first || !second) {
    return false;
  }

  const tolerance = 0.000001;

  return (
    Math.abs(Number(first[0]) - Number(second[0])) <
      tolerance &&
    Math.abs(Number(first[1]) - Number(second[1])) <
      tolerance
  );
}

function offsetOverlappingPosition(
  position,
  index = 0,
) {
  if (!position) {
    return null;
  }

  /*
   * Desplazamiento exclusivamente visual.
   * Mantiene los camiones cerca de la bodega sin
   * ocultar todos los marcadores en el mismo punto.
   */
  const angle =
    (index * 55 * Math.PI) / 180;

  const distance = 0.00028;

  return [
    Number(position[0]) +
      Math.cos(angle) * distance,

    Number(position[1]) +
      Math.sin(angle) * distance,
  ];
}


function getJourneyMap(jornada) {
  return jornada?.mapa ?? jornada?.mapa_jornada ?? jornada ?? {};
}

//Funcion auxiliar
function getWarehouseData(jornada) {
  const mapa = getJourneyMap(jornada);

  return (
    mapa?.bodega ??
    mapa?.centro ??
    jornada?.bodega ??
    jornada?.ruta_general?.bodega ??
    null
  );
}

function getTruckData(jornada) {
  const mapa = getJourneyMap(jornada);

  return (
    mapa?.camion ??
    jornada?.camion ??
    null
  );
}

function getTruckPosition(jornada) {
  const mapa = getJourneyMap(jornada);
  const camion = getTruckData(jornada);

  return normalizePosition(
    mapa?.camion?.posicion_actual ??
      camion?.posicion_actual ??
      mapa?.posicion_camion ??
      jornada?.posicion_camion ??
      null,
  );
}

function getJourneyCode(jornada) {
  return (
    jornada?.codigo ??
    `JR-${String(jornada?.id ?? 0).padStart(5, '0')}`
  );
}

function createWarehouseIcon() {
  return L.divIcon({
    className: 'routes-map-div-icon',
    html: `
      <div class="routes-map-marker warehouse">
        <i class="bi bi-building-fill"></i>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -19],
  });
}

function createTruckIcon({
  code,
  selected,
  color,
}) {
  return L.divIcon({
    className: 'routes-map-div-icon',
    html: `
      <div
        class="routes-map-truck ${selected ? 'selected' : ''}"
        style="--route-color: ${color}"
      >
        <i class="bi bi-truck"></i>
        <span>${code}</span>
      </div>
    `,
    iconSize: [94, 36],
    iconAnchor: [47, 18],
    popupAnchor: [0, -18],
  });
}

function createDeliveryIcon({
  order,
  state,
  selected,
}) {
  let stateClass = 'pending';

  if (state === 'ENTREGADO') {
    stateClass = 'delivered';
  } else if (state === 'NO_ENTREGADO') {
    stateClass = 'not-delivered';
  } else if (state === 'CURRENT') {
    stateClass = 'current';
  }

  return L.divIcon({
    className: 'routes-map-div-icon',
    html: `
      <div class="routes-map-marker delivery ${stateClass} ${
        selected ? 'selected' : ''
      }">
        ${
          state === 'ENTREGADO'
            ? '<i class="bi bi-check-lg"></i>'
            : order
        }
      </div>
    `,
    iconSize: [31, 31],
    iconAnchor: [15.5, 15.5],
    popupAnchor: [0, -15],
  });
}

function buildDeliveryPoints(jornada) {
  const mapa = getJourneyMap(jornada);

  const points = Array.isArray(mapa?.puntos_entrega)
    ? mapa.puntos_entrega
    : [];

  const grouped = new Map();

  points.forEach((point) => {
    const order = Number(
      point.orden ?? point.orden_entrega,
    );

    const latitud = Number(point.latitud);
    const longitud = Number(point.longitud);

    if (
      !Number.isFinite(order) ||
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud)
    ) {
      return;
    }

    if (!grouped.has(order)) {
      grouped.set(order, {
        orden: order,
        ubicacion:
          point.ubicacion ??
          point.nombre ??
          'Ubicación no disponible',
        latitud,
        longitud,
        estados: [],
        totalDespachos: 0,
      });
    }

    const group = grouped.get(order);

    group.estados.push(point.estado);
    group.totalDespachos += 1;
  });

  return [...grouped.values()]
    .sort((a, b) => a.orden - b.orden)
    .map((point) => {
      const position = Number(
        jornada?.posicion_actual_orden ??
          mapa?.posicion_actual_orden ??
          0,
      );

      const allDelivered =
        point.estados.length > 0 &&
        point.estados.every(
          (estado) => estado === 'ENTREGADO',
        );

      const allClosed =
        point.estados.length > 0 &&
        point.estados.every((estado) =>
          ['ENTREGADO', 'NO_ENTREGADO'].includes(estado),
        );

      let estado = 'PENDIENTE';

      if (allDelivered) {
        estado = 'ENTREGADO';
      } else if (allClosed) {
        estado = 'NO_ENTREGADO';
      } else if (
        jornada?.estado === 'EN_RUTA' &&
        point.orden === position
      ) {
        estado = 'CURRENT';
      }

      return {
        ...point,
        estado,
      };
    });
}

function MapaGeneralJornadas({
  jornadas,
  selectedJourneyId,
  focusRequest,
  onSelectJourney,
}) {
  const [tileError, setTileError] = useState(false);

  const normalizedJourneys = useMemo(() => {
    return jornadas.map((jornada, index) => {
      const mapa = getJourneyMap(jornada);
      const color = ROUTE_COLORS[index % ROUTE_COLORS.length];

      const completedRoute = normalizeGeometry(
        mapa?.recorrido_completado,
      );

      const pendingRoute = normalizeGeometry(
        mapa?.recorrido_pendiente,
      );

      const fullGeometry = normalizeGeometry(
        mapa?.geometria_completa ??
          mapa?.geometria,
      );

     const warehouseData =
      getWarehouseData(jornada);

    /*
    * Primera opción: información explícita del backend.
    *
    * Segunda opción: primer punto de la geometría,
    * porque todas las rutas comienzan en la bodega.
    */
    const warehousePosition =
      normalizePosition(warehouseData) ??
      fullGeometry[0] ??
      pendingRoute[0] ??
      completedRoute[0] ??
      null;

    /*
    * Primera opción: posición explícita del camión.
    *
    * Segunda opción: último punto del recorrido
    * completado.
    *
    * Tercera opción: bodega para jornadas todavía
    * planificadas.
    */
    let truckPosition =
      getTruckPosition(jornada) ??
      completedRoute[
        completedRoute.length - 1
      ] ??
      null;

    if (
      !truckPosition &&
      jornada?.estado === 'PLANIFICADA'
    ) {
      truckPosition = warehousePosition;
    }

    /*
    * Cuando el camión todavía está en la bodega,
    * ambos marcadores tienen exactamente la misma
    * coordenada. Lo desplazamos ligeramente solo
    * para su representación visual.
    */
    const displayedTruckPosition =
      areSamePositions(
        truckPosition,
        warehousePosition,
      )
        ? offsetOverlappingPosition(
            truckPosition,
            index,
          )
        : truckPosition;

      const deliveryPoints = buildDeliveryPoints(jornada);

      const positions = [
        ...fullGeometry,
        ...completedRoute,
        ...pendingRoute,
      ];

      if (displayedTruckPosition) {
        positions.push(
          displayedTruckPosition,
        );
      }

      if (warehousePosition) {
        positions.push(warehousePosition);
      }

      deliveryPoints.forEach((point) => {
        positions.push([
          point.latitud,
          point.longitud,
        ]);
      });

      return {
        jornada,
        mapa,
        color,

        completedRoute,
        pendingRoute,
        fullGeometry,

        truckPosition: displayedTruckPosition,

        warehousePosition,
        warehouseData,

        deliveryPoints,
        positions,
      };
    });
  }, [jornadas]);


  const selectedJourney = useMemo(
    () =>
      normalizedJourneys.find(
        (item) =>
          Number(item.jornada.id) ===
          Number(selectedJourneyId),
      ) ?? null,
    [normalizedJourneys, selectedJourneyId],
  );

  const allPositions = useMemo(
    () =>
      normalizedJourneys.flatMap(
        (item) => item.positions,
      ),
    [normalizedJourneys],
  );

  const selectedPositions =
    selectedJourney?.positions ?? [];

  const warehouseItem =
    normalizedJourneys.find(
      (item) => item.warehousePosition,
    ) ?? null;

  const warehousePosition =
    warehouseItem?.warehousePosition ??
    null;

  const defaultCenter =
    warehousePosition ??
    allPositions[0] ??
    [-0.84582, -80.16389];

  if (!normalizedJourneys.length) {
    return (
      <MapErrorState
        description="Las jornadas planificadas o en ruta aparecerán automáticamente en este mapa."
        icon="bi-map"
        title="No existen jornadas para mostrar"
        tone="neutral"
      />
    );
  }

  if (!allPositions.length) {
    return (
      <MapErrorState
        description="Las jornadas existen, pero no contienen coordenadas o geometrías válidas."
        icon="bi-map-fill"
        title="Mapa no disponible"
        tone="neutral"
      />
    );
  }

  return (
    <section className="routes-general-map-card">
      <header className="routes-general-map-header">
        <div>
          <span>Monitoreo geográfico</span>
          <h4>Mapa general de jornadas</h4>
        </div>

        <div className="routes-general-map-header__status">
          <span />
          {normalizedJourneys.length} jornada
          {normalizedJourneys.length === 1 ? '' : 's'}
        </div>
      </header>

      <MapShell
        ariaLabel="Mapa general de jornadas"
        className="routes-general-map-container"
      >
        <MapContainer
          center={defaultCenter}
          zoom={11}
          zoomControl={false}
          scrollWheelZoom
          className="routes-general-leaflet-map"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileError(true),
              load: () => setTileError(false),
            }}
          />

          <MapViewportController
            focusPositions={selectedPositions}
            positions={allPositions}
            requestKey={focusRequest}
            maxZoom={14}
            padding={42}
            singleZoom={14}
          />

          <MapControls
            fitLabel={
              selectedPositions.length
                ? 'Centrar jornada seleccionada'
                : 'Ajustar todas las jornadas'
            }
            fitPositions={
              selectedPositions.length
                ? selectedPositions
                : allPositions
            }
          />

          {normalizedJourneys.map((item) => {
            const isSelected =
              Number(item.jornada.id) ===
              Number(selectedJourneyId);

            const routeOpacity =
              selectedJourneyId && !isSelected
                ? 0.18
                : 0.9;

            return (
              <div key={item.jornada.id}>
                {item.completedRoute.length > 1 && (
                  <Polyline
                    positions={item.completedRoute}
                    pathOptions={{
                      color: item.color,
                      weight: isSelected ? 6 : 4,
                      opacity: routeOpacity,
                    }}
                    eventHandlers={{
                      click: () => onSelectJourney(item.jornada),
                    }}
                  />
                )}

                {item.pendingRoute.length > 1 && (
                  <Polyline
                    positions={item.pendingRoute}
                    pathOptions={{
                      color: item.color,
                      weight: isSelected ? 5 : 3,
                      opacity: routeOpacity,
                      dashArray: '10 10',
                    }}
                    eventHandlers={{
                      click: () => onSelectJourney(item.jornada),
                    }}
                  />
                )}

                {item.truckPosition && (
                  <Marker
                    position={item.truckPosition}
                    icon={createTruckIcon({
                      code:
                        item.jornada?.camion?.codigo ??
                        item.mapa?.camion?.codigo ??
                        `CAM-${String(
                          item.jornada?.camion_id ?? 0,
                        ).padStart(3, '0')}`,
                      selected: isSelected,
                      color: item.color,
                    })}
                    zIndexOffset={
                      isSelected ? 3000 : 2500
                    }
                    eventHandlers={{
                      click: () =>
                        onSelectJourney(
                          item.jornada,
                        ),
                    }}
                  >
                    <Popup>
                      <div className="routes-map-popup">
                        <strong>
                          {getJourneyCode(
                            item.jornada,
                          )}
                        </strong>

                        <span>
                          Camión:{' '}
                          {item.jornada?.camion?.codigo ??
                            item.mapa?.camion?.codigo ??
                            item.jornada?.camion_id}
                        </span>

                        <span>
                          Estado:{' '}
                          {String(
                            item.jornada?.estado ?? '',
                          ).replaceAll('_', ' ')}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {isSelected &&
                  item.deliveryPoints.map((point) => (
                    <Marker
                      key={`${item.jornada.id}-${point.orden}`}
                      position={[
                        point.latitud,
                        point.longitud,
                      ]}
                      icon={createDeliveryIcon({
                        order: point.orden,
                        state: point.estado,
                        selected: true,
                      })}
                      zIndexOffset={800}
                    >
                      <Popup>
                        <strong>
                          Punto {point.orden}: {point.ubicacion}
                        </strong>

                        <br />

                        {point.totalDespachos} despacho
                        {point.totalDespachos === 1 ? '' : 's'}
                      </Popup>

                      <Tooltip direction="top">
                        {point.orden}. {point.ubicacion}
                      </Tooltip>
                    </Marker>
                  ))}
              </div>
            );
          })}

          {warehousePosition && (
            <Marker
              position={warehousePosition}
              icon={createWarehouseIcon()}
              zIndexOffset={2200}
            >
              <Popup>
                <strong>
                  {warehouseItem?.warehouseData?.nombre ??
                    'Bodega central'}
                </strong>

                <br />

                Inicio y fin de las jornadas
              </Popup>

              <Tooltip direction="top">
                Bodega central
              </Tooltip>
            </Marker>
          )}
        </MapContainer>

        {tileError && (
          <div className="routes-map-tile-warning">
            <i className="bi bi-wifi-off" />

            <span>
              El mapa base no pudo cargarse completamente.
              Las rutas y marcadores continúan disponibles.
            </span>
          </div>
        )}
      </MapShell>

      <MapLegend
        className="routes-general-map-legend"
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

export default MapaGeneralJornadas;