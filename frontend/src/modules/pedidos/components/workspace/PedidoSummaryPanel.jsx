function getDetails(pedido) {
  return (
    pedido?.DetallePedidos ??
    pedido?.DetallesPedido ??
    pedido?.detalles ??
    pedido?.detalle_pedidos ??
    []
  );
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

const FLOW = [
  'PENDIENTE',
  'PREPARANDO',
  'LISTO_PARA_DESPACHO',
  'DESPACHADO',
  'ENTREGADO',
];

const LABELS = {
  PENDIENTE: 'Pedido registrado',
  PREPARANDO: 'Preparando productos',
  LISTO_PARA_DESPACHO:
    'Listo para despacho',
  DESPACHADO: 'En despacho',
  ENTREGADO: 'Entregado',
};

function PedidoSummaryPanel({
  pedido,
}) {
  const detalles =
    getDetails(pedido);

  const unidades = detalles.reduce(
    (total, detalle) =>
      total +
      Number(detalle.cantidad ?? 0),
    0,
  );

  const currentIndex =
    FLOW.indexOf(pedido.estado);

  return (
    <aside className="pedido-summary-panel">
      <section className="pedido-summary-card">
        <div className="pedido-summary-card-header">
          <h4>
            Resumen del pedido
          </h4>
        </div>

        <div className="pedido-summary-content">
          <div>
            <span>Unidades totales</span>
            <strong>
              {unidades} u.
            </strong>
          </div>

          <div>
            <span>Productos</span>
            <strong>
              {detalles.length}{' '}
              {detalles.length === 1
                ? 'ítem'
                : 'ítems'}
            </strong>
          </div>

          <div className="pedido-summary-total">
            <span>Total</span>
            <strong>
              {formatCurrency(
                pedido.total,
              )}
            </strong>
          </div>
        </div>
      </section>

      <section className="pedido-summary-card">
        <div className="pedido-flow-panel">
          <h4>
            Estado del flujo
          </h4>

          {FLOW.map(
            (status, index) => {
              const done =
                currentIndex > index;

              const active =
                pedido.estado ===
                status;

              return (
                <div
                  className={`pedido-flow-step ${
                    done
                      ? 'done'
                      : ''
                  } ${
                    active
                      ? 'active'
                      : ''
                  }`}
                  key={status}
                >
                  <div className="pedido-flow-dot">
                    {done ? (
                      <i className="bi bi-check" />
                    ) : active ? (
                      <span className="active-dot" />
                    ) : null}
                  </div>

                  <span>
                    {LABELS[status]}
                  </span>
                </div>
              );
            },
          )}

          {pedido.estado ===
            'CANCELADO' && (
            <div className="pedido-flow-cancelled">
              <i className="bi bi-x-circle" />
              Pedido cancelado
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

export default PedidoSummaryPanel;
