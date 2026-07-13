function formatTruckCode(camion) {
  if (camion?.codigo) {
    return camion.codigo;
  }

  return `CAM-${String(
    camion?.id ?? 0,
  ).padStart(3, '0')}`;
}

function formatJourneyCode(jornada) {
  if (!jornada) {
    return 'Sin jornada';
  }

  if (jornada.codigo) {
    return jornada.codigo;
  }

  return `JR-${String(
    jornada.id ?? 0,
  ).padStart(5, '0')}`;
}

function formatStatus(status) {
  return String(status ?? '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /^\w/,
      (character) =>
        character.toUpperCase(),
    );
}

function getStatusClass(status) {
  const statusClasses = {
    EN_BODEGA: 'available',
    EN_RUTA: 'in-route',
    INACTIVO: 'inactive',
  };

  return (
    statusClasses[status] ??
    'neutral'
  );
}

function CamionesTable({
  camiones,
  onView,
  onViewJourney,
  onCenterMap,
}) {
  if (!camiones.length) {
    return (
      <div className="routes-trucks-empty">
        <i className="bi bi-truck" />

        <h4>
          No existen camiones registrados
        </h4>

        <p>
          Los camiones configurados en el sistema
          aparecerán aquí para consulta.
        </p>
      </div>
    );
  }

  return (
    <div className="routes-trucks-table-wrapper">
      <table className="table routes-trucks-table mb-0">
        <thead>
          <tr>
            <th>Camión</th>
            <th>Placa</th>
            <th>Capacidad máxima</th>
            <th>Pedidos asignados</th>
            <th>Capacidad disponible</th>
            <th>Ocupación</th>
            <th>Estado</th>
            <th>Jornada asociada</th>
            <th className="text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {camiones.map((camion) => {
            const capacidad = Number(
              camion.capacidad ?? 0,
            );

            const asignados = Number(
              camion.pedidos_asignados ?? 0,
            );

            const disponibles = Number(
              camion.capacidad_disponible ?? 0,
            );

            const porcentaje = Number(
              camion.porcentaje_ocupacion ?? 0,
            );

            return (
              <tr key={camion.id}>
                <td>
                  <div className="routes-truck-cell">
                    <span className="routes-truck-cell__icon">
                      <i className="bi bi-truck" />
                    </span>

                    <div>
                      <strong>
                        {formatTruckCode(camion)}
                      </strong>

                      <small>
                        ID {camion.id}
                      </small>
                    </div>
                  </div>
                </td>

                <td>
                  <strong>
                    {camion.placa ??
                      'Sin placa'}
                  </strong>
                </td>

                <td>
                  {capacidad} pedido
                  {capacidad === 1
                    ? ''
                    : 's'}
                </td>

                <td>
                  {asignados} pedido
                  {asignados === 1
                    ? ''
                    : 's'}
                </td>

                <td>
                  {disponibles} espacio
                  {disponibles === 1
                    ? ''
                    : 's'}
                </td>

                <td>
                  <div className="routes-truck-capacity">
                    <div className="routes-truck-capacity__header">
                      <span>
                        {asignados} de{' '}
                        {capacidad}
                      </span>

                      <strong>
                        {porcentaje}%
                      </strong>
                    </div>

                    <div className="routes-truck-capacity__track">
                      <span
                        className={
                          camion.capacidad_completa
                            ? 'full'
                            : ''
                        }
                        style={{
                          width: `${Math.min(
                            porcentaje,
                            100,
                          )}%`,
                        }}
                      />
                    </div>

                    <small>
                      {camion.capacidad_completa
                        ? 'Capacidad completa'
                        : `${disponibles} disponible${
                            disponibles === 1
                              ? ''
                              : 's'
                          }`}
                    </small>
                  </div>
                </td>

                <td>
                  <span
                    className={`routes-truck-status ${getStatusClass(
                      camion.estado,
                    )}`}
                  >
                    {formatStatus(
                      camion.estado,
                    )}
                  </span>
                </td>

                <td>
                  {camion.jornada ? (
                    <div className="routes-truck-journey">
                      <strong>
                        {formatJourneyCode(
                          camion.jornada,
                        )}
                      </strong>

                      <span>
                        {formatStatus(
                          camion.jornada
                            .estado,
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="routes-truck-no-journey">
                      Sin jornada
                    </span>
                  )}
                </td>

                <td>
                  <div className="routes-table-actions">
                    <button
                      type="button"
                      title="Ver resumen"
                      onClick={() =>
                        onView(camion)
                      }
                    >
                      <i className="bi bi-eye" />
                    </button>

                    {camion.jornada && (
                      <button
                        type="button"
                        title="Ver jornada asociada"
                        onClick={() =>
                          onViewJourney(
                            camion,
                          )
                        }
                      >
                        <i className="bi bi-box-arrow-up-right" />
                      </button>
                    )}

                    {camion.jornada && (
                      <button
                        type="button"
                        title="Centrar en el mapa"
                        onClick={() =>
                          onCenterMap(
                            camion,
                          )
                        }
                      >
                        <i className="bi bi-crosshair" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CamionesTable;

