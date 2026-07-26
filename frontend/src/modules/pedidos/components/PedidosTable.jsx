import PedidoStatusBadge from './PedidoStatusBadge';

import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
  ROLES,
} from '../../../shared/constants/permissions';

import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';

function getCliente(pedido) {
  return (
    pedido?.cliente ??
    null
  );
}

function getUsuario(pedido) {
  return (
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

function PedidosTable({
  pedidos,
  hasFilters,
  onOpenWorkspace,
  onEdit,
  onCancel,
  onClearFilters,
  onCreate,
}) {
  const {
    can,
    canAny,
    hasRole,
  } = usePermissions();

  const canOpenWorkspace = canAny(
    PERMISSIONS.PEDIDOS_EDITAR,
    PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
  );

  const canCreate = can(
    PERMISSIONS.PEDIDOS_CREAR,
  );

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

        {hasFilters ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClearFilters}
          >
            <i className="bi bi-eraser me-2" />
            Limpiar filtros
          </button>
        ) : canCreate ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreate}
          >
            <i className="bi bi-plus-lg me-2" />
            Crear primer pedido
          </button>
        ) : null}
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
                  {canOpenWorkspace ? (
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
                  ) : (
                    <span className="pedido-code pedido-code--static">
                      {formatOrderCode(pedido.id)}
                    </span>
                  )}
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
                    {canOpenWorkspace && (
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
                    )}

                    {pedido.estado === 'PENDIENTE' && (
                      <Can permission={PERMISSIONS.PEDIDOS_EDITAR}>
                        <button
                          type="button"
                          title="Editar información"
                          onClick={() =>
                            onEdit(pedido)
                          }
                        >
                          <i className="bi bi-pencil-square" />
                        </button>
                      </Can>
                    )}

                    {can(PERMISSIONS.PEDIDOS_CANCELAR) &&
                    (pedido.estado === 'PENDIENTE' ||
                      (hasRole(ROLES.ADMIN) &&
                        ![
                          'DESPACHADO',
                          'ENTREGADO',
                          'CANCELADO',
                        ].includes(pedido.estado))) && (
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
