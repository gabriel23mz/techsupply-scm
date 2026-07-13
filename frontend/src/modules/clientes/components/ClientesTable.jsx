function getLocation(cliente) {
  return cliente?.Ubicacion ?? cliente?.ubicacion ?? null;
}

function formatClientCode(id) {
  return `CLI-${String(id ?? 0).padStart(4, '0')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC').format(date);
}

function ClientesTable({
  clientes,
  hasFilters,
  onView,
  onEdit,
  onDeactivate,
  onClearFilters,
  onCreate,
}) {
  if (!clientes.length) {
    return (
      <div className="clients-empty">
        <i
          className={
            hasFilters
              ? 'bi bi-search'
              : 'bi bi-people'
          }
        />

        <h4>
          {hasFilters
            ? 'No se encontraron clientes'
            : 'No existen clientes registrados'}
        </h4>

        <p>
          {hasFilters
            ? 'Prueba con otro nombre, identificación, correo o ubicación.'
            : 'Registra el primer cliente para comenzar a gestionar pedidos y entregas.'}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={
            hasFilters
              ? onClearFilters
              : onCreate
          }
        >
          <i
            className={`bi ${
              hasFilters
                ? 'bi-eraser'
                : 'bi-person-plus'
            } me-2`}
          />

          {hasFilters
            ? 'Limpiar filtros'
            : 'Registrar primer cliente'}
        </button>
      </div>
    );
  }

  return (
    <div className="clients-table-wrapper">
      <table className="table clients-table mb-0">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Identificación</th>
            <th>Contacto</th>
            <th>Ubicación</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th>Registro</th>
            <th className="text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {clientes.map((cliente) => {
            const ubicacion =
              getLocation(cliente);

            return (
              <tr key={cliente.id}>
                <td>
                  <div className="clients-name-cell">
                    <span className="clients-name-cell__icon">
                      <i className="bi bi-person" />
                    </span>

                    <div>
                      <strong>
                        {cliente.nombre}
                      </strong>

                      <small>
                        {formatClientCode(
                          cliente.id,
                        )}
                      </small>
                    </div>
                  </div>
                </td>

                <td className="clients-identification">
                  {cliente.identificacion}
                </td>

                <td>
                  <div className="clients-contact-cell">
                    <span>
                      <i className="bi bi-telephone" />
                      {cliente.telefono}
                    </span>

                    <span title={cliente.correo}>
                      <i className="bi bi-envelope" />
                      {cliente.correo}
                    </span>
                  </div>
                </td>

                <td>
                  <div className="clients-location-cell">
                    <i className="bi bi-geo-alt-fill" />

                    <span>
                      {ubicacion?.nombre ??
                        'No disponible'}
                    </span>
                  </div>
                </td>

                <td>
                  <span
                    className="clients-address-cell"
                    title={cliente.direccion}
                  >
                    {cliente.direccion}
                  </span>
                </td>

                <td>
                  <span
                    className={`clients-status ${
                      cliente.estado === false
                        ? 'inactive'
                        : 'active'
                    }`}
                  >
                    {cliente.estado === false
                      ? 'Inactivo'
                      : 'Activo'}
                  </span>
                </td>

                <td>
                  {formatDate(
                    cliente.created_at ??
                      cliente.createdAt,
                  )}
                </td>

                <td>
                  <div className="clients-table-actions">
                    <button
                      type="button"
                      title="Ver detalle"
                      onClick={() => onView(cliente)}
                    >
                      <i className="bi bi-eye" />
                    </button>

                    <button
                      type="button"
                      title="Editar cliente"
                      onClick={() => onEdit(cliente)}
                    >
                      <i className="bi bi-pencil-square" />
                    </button>

                    {cliente.estado !== false && (
                      <button
                        type="button"
                        className="danger"
                        title="Desactivar cliente"
                        onClick={() =>
                          onDeactivate(cliente)
                        }
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

export default ClientesTable;
