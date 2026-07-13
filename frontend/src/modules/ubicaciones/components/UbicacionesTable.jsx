function formatCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate)
    ? coordinate.toFixed(6)
    : 'Sin definir';
}

function UbicacionesTable({
  ubicaciones,
  onView,
  onEdit,
  onDeactivate,
}) {
  if (!ubicaciones.length) {
    return (
      <div className="locations-empty">
        <i className="bi bi-geo-alt" />
        <h4>No existen ubicaciones registradas</h4>
        <p>
          Agrega el primer nodo geográfico para construir
          la red logística.
        </p>
      </div>
    );
  }

  return (
    <div className="locations-table-wrapper">
      <table className="table locations-table mb-0">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Latitud</th>
            <th>Longitud</th>
            <th>Coordenadas</th>
            <th>Estado</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {ubicaciones.map((ubicacion) => {
            const hasCoordinates =
              Number.isFinite(Number(ubicacion.latitud)) &&
              Number.isFinite(Number(ubicacion.longitud));

            return (
              <tr key={ubicacion.id}>
                <td>
                  <div className="locations-name-cell">
                    <span>
                      <i className="bi bi-geo-alt-fill" />
                    </span>
                    <div>
                      <strong>{ubicacion.nombre}</strong>
                      <small>
                        UBI-{String(ubicacion.id).padStart(4, '0')}
                      </small>
                    </div>
                  </div>
                </td>

                <td>{formatCoordinate(ubicacion.latitud)}</td>
                <td>{formatCoordinate(ubicacion.longitud)}</td>

                <td>
                  <span
                    className={`locations-coordinate-status ${
                      hasCoordinates ? 'ready' : 'missing'
                    }`}
                  >
                    {hasCoordinates ? 'Configuradas' : 'Pendientes'}
                  </span>
                </td>

                <td>
                  <span
                    className={`locations-status ${
                      ubicacion.estado === false
                        ? 'inactive'
                        : 'active'
                    }`}
                  >
                    {ubicacion.estado === false ? 'Inactiva' : 'Activa'}
                  </span>
                </td>

                <td>
                  <div className="locations-table-actions">
                    <button
                      type="button"
                      title="Ver detalle"
                      onClick={() => onView(ubicacion)}
                    >
                      <i className="bi bi-eye" />
                    </button>

                    <button
                      type="button"
                      title="Editar"
                      onClick={() => onEdit(ubicacion)}
                    >
                      <i className="bi bi-pencil-square" />
                    </button>

                    {ubicacion.estado !== false && (
                      <button
                        type="button"
                        className="danger"
                        title="Desactivar"
                        onClick={() => onDeactivate(ubicacion)}
                      >
                        <i className="bi bi-slash-circle" />
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

export default UbicacionesTable;
