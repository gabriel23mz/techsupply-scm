import PedidoStatusBadge from './PedidoStatusBadge';

function getCliente(pedido) {
  return (
    pedido?.Cliente ??
    pedido?.cliente ??
    null
  );
}

function getUsuario(pedido) {
  return (
    pedido?.Usuario ??
    pedido?.usuario ??
    null
  );
}

function formatOrderCode(id) {
  return `PED-${String(id ?? 0).padStart(
    5,
    '0',
  )}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'es-EC',
    {
      style: 'currency',
      currency: 'USD',
    },
  ).format(Number(value ?? 0));
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
    {
      dateStyle: 'medium',
    },
  ).format(date);
}

function formatUser(usuario) {
  if (!usuario) {
    return 'No disponible';
  }

  return [
    usuario.nombre,
    usuario.apellido,
  ]
    .filter(Boolean)
    .join(' ');
}

function isCancelable(status) {
  return [
    'PENDIENTE',
    'PREPARANDO',
    'LISTO_PARA_DESPACHO',
  ].includes(status);
}

function isEditable(status) {
  return [
    'PENDIENTE',
    'PREPARANDO',
  ].includes(status);
}

function PedidosTable({
  pedidos,
  hasFilters,
  onOpenWorkspace,
  onEdit,
  onCancel,
  onClearFilters,
  onCreate,
}) {
  if (!pedidos.length) {
    return (
      <div className="pedidos-empty">
        <i
          className={
            hasFilters
              ? 'bi bi-search'
              : 'bi bi-receipt'
          }
        />

        <h4>
          {hasFilters
            ? 'No se encontraron pedidos'
            : 'No existen pedidos registrados'}
        </h4>

        <p>
          {hasFilters
            ? 'Prueba con otros criterios de búsqueda o filtros.'
            : 'Crea el primer pedido para iniciar el flujo comercial y logístico.'}
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
                : 'bi-plus-lg'
            } me-2`}
          />

          {hasFilters
            ? 'Limpiar filtros'
            : 'Crear primer pedido'}
        </button>
      </div>
    );
  }

  return (
    <div className="pedidos-table-wrapper">
      <table className="table pedidos-table mb-0">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Responsable</th>
            <th>Fecha</th>
            <th>Entrega</th>
            <th>Estado</th>
            <th className="text-end">
              Total
            </th>
            <th className="text-center">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => {
            const cliente =
              getCliente(pedido);

            const usuario =
              getUsuario(pedido);

            return (
              <tr key={pedido.id}>
                <td>
                  <button
                    type="button"
                    className="pedido-code"
                    onClick={() =>
                      onOpenWorkspace(
                        pedido,
                      )
                    }
                  >
                    {formatOrderCode(
                      pedido.id,
                    )}
                  </button>
                </td>

                <td>
                  <strong>
                    {cliente?.nombre ??
                      'No disponible'}
                  </strong>
                </td>

                <td>
                  <span className="pedido-muted">
                    {formatUser(
                      usuario,
                    )}
                  </span>
                </td>

                <td>
                  <span className="pedido-muted">
                    {formatDate(
                      pedido.fecha,
                    )}
                  </span>
                </td>

                <td>
                  <span className="pedido-muted">
                    {formatDate(
                      pedido.fecha_entrega,
                    )}
                  </span>
                </td>

                <td>
                  <PedidoStatusBadge
                    status={
                      pedido.estado
                    }
                  />
                </td>

                <td className="text-end fw-bold">
                  {formatCurrency(
                    pedido.total,
                  )}
                </td>

                <td>
                  <div className="pedidos-actions">
                    <button
                      type="button"
                      className="workspace"
                      title="Abrir Workspace"
                      onClick={() =>
                        onOpenWorkspace(
                          pedido,
                        )
                      }
                    >
                      <i className="bi bi-layout-text-window-reverse" />
                    </button>

                    {isEditable(
                      pedido.estado,
                    ) && (
                      <button
                        type="button"
                        title="Editar información"
                        onClick={() =>
                          onEdit(pedido)
                        }
                      >
                        <i className="bi bi-pencil-square" />
                      </button>
                    )}

                    {isCancelable(
                      pedido.estado,
                    ) && (
                      <button
                        type="button"
                        className="danger"
                        title="Cancelar pedido"
                        onClick={() =>
                          onCancel(pedido)
                        }
                      >
                        <i className="bi bi-x-circle" />
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

export default PedidosTable;
