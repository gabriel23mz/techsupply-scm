import PedidoStatusBadge from '../PedidoStatusBadge';

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

function PedidoWorkspaceHeader({
  pedido,
}) {
  const cliente =
    getCliente(pedido);

  const usuario =
    getUsuario(pedido);

  const responsable = [
    usuario?.nombre,
    usuario?.apellido,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="pedido-workspace-header">
      <div>
        <div className="pedido-workspace-title">
          <h3>
            PED-
            {String(
              pedido.id,
            ).padStart(5, '0')}
          </h3>

          <PedidoStatusBadge
            status={pedido.estado}
          />
        </div>

        <p>
          Gestión de productos asociados al pedido.
        </p>
      </div>

      <div className="pedido-workspace-meta">
        <div>
          <span>Cliente</span>
          <strong>
            {cliente?.nombre ??
              'No disponible'}
          </strong>
        </div>

        <div>
          <span>Responsable</span>
          <strong>
            {responsable ||
              'No disponible'}
          </strong>
        </div>

        <div>
          <span>Fecha</span>
          <strong>
            {formatDate(
              pedido.fecha,
            )}
          </strong>
        </div>

        <div>
          <span>Entrega</span>
          <strong>
            {formatDate(
              pedido.fecha_entrega,
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default PedidoWorkspaceHeader;
