function formatRouteCode(id) {
  return `RUT-${String(id).padStart(4, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return '0,00 km';
  }

  return `${new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(distance)} km`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-EC',
  ).format(date);
}

function RutasTable({
  rutas,
  onView,
  onEdit,
  onDeactivate,
}) {
  if (!rutas.length) {
    return (
      <div className="routes-catalog-empty">
        <i className="bi bi-signpost-split" />

        <h4>No existen rutas registradas</h4>

        <p>
          Las conexiones entre ubicaciones aparecerán
          aquí cuando sean creadas.
        </p>
      </div>
    );
  }

  return (
    <div className="routes-catalog-table-wrapper">
      <table className="table routes-catalog-table mb-0">
        <thead>
          <tr>
            <th>Ruta</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Distancia</th>
            <th>Estado</th>
            <th>Fecha de registro</th>
            <th className="text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {rutas.map((ruta) => (
            <tr key={ruta.id}>
              <td>
                <strong>
                  {formatRouteCode(ruta.id)}
                </strong>
              </td>

              <td>
                <div className="routes-location-cell">
                  <i className="bi bi-geo-alt-fill" />

                  <span>
                    {ruta.origen?.nombre ??
                      'Origen no disponible'}
                  </span>
                </div>
              </td>

              <td>
                <div className="routes-location-cell">
                  <i className="bi bi-flag-fill" />

                  <span>
                    {ruta.destino?.nombre ??
                      'Destino no disponible'}
                  </span>
                </div>
              </td>

              <td>
                {formatDistance(
                  ruta.distancia_km,
                )}
              </td>

              <td>
                <span className="routes-route-status active">
                  Activa
                </span>
              </td>

              <td>
                {formatDate(
                  ruta.created_at ??
                    ruta.createdAt,
                )}
              </td>

              <td>
                <div className="routes-table-actions">
                  <button
                    type="button"
                    title="Ver detalle"
                    onClick={() => onView(ruta)}
                  >
                    <i className="bi bi-eye" />
                  </button>

                  <button
                    type="button"
                    title="Editar ruta"
                    onClick={() => onEdit(ruta)}
                  >
                    <i className="bi bi-pencil-square" />
                  </button>

                  <button
                    type="button"
                    className="danger"
                    title="Desactivar ruta"
                    onClick={() =>
                      onDeactivate(ruta)
                    }
                  >
                    <i className="bi bi-slash-circle" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RutasTable;

