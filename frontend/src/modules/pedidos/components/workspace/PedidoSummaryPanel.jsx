import PedidoStatusBadge from '../PedidoStatusBadge';

import {
  formatCurrency,
  formatDate,
  formatUser,
  getOrderClient,
  getOrderDetails,
  getOrderUser,
} from '../../pedido.utils';

const FLOW = [
  'PENDIENTE',
  'PREPARANDO',
  'LISTO_PARA_DESPACHO',
  'DESPACHADO',
  'ENTREGADO',
];

const LABELS = {
  PENDIENTE: 'Pedido registrado',
  PREPARANDO: 'Preparación en curso',
  LISTO_PARA_DESPACHO: 'Listo para despacho',
  DESPACHADO: 'En despacho',
  ENTREGADO: 'Entregado',
};

function PedidoSummaryPanel({ pedido }) {
  const detalles = getOrderDetails(pedido);
  const unidades = detalles.reduce(
    (total, detalle) => total + Number(detalle.cantidad ?? 0),
    0,
  );
  const currentIndex = FLOW.indexOf(pedido.estado);
  const cliente = getOrderClient(pedido);
  const usuario = getOrderUser(pedido);

  return (
    <div className="order-workspace-summary">
      <section className="order-workspace-summary__card">
        <header>
          <span>Información comercial</span>
          <PedidoStatusBadge status={pedido.estado} />
        </header>

        <div className="order-workspace-summary__grid">
          <div>
            <span>Cliente</span>
            <strong>{cliente?.nombre ?? 'No disponible'}</strong>
          </div>

          <div>
            <span>Responsable</span>
            <strong>{formatUser(usuario)}</strong>
          </div>

          <div>
            <span>Fecha</span>
            <strong>{formatDate(pedido.fecha)}</strong>
          </div>

          <div>
            <span>Entrega</span>
            <strong>{formatDate(pedido.fecha_entrega)}</strong>
          </div>
        </div>
      </section>

      <section className="order-workspace-summary__card">
        <header>
          <span>Resumen</span>
          <strong>{formatCurrency(pedido.total)}</strong>
        </header>

        <div className="order-workspace-totals">
          <div>
            <span>Productos</span>
            <strong>{detalles.length}</strong>
          </div>
          <div>
            <span>Unidades</span>
            <strong>{unidades}</strong>
          </div>
        </div>
      </section>

      <section className="order-workspace-summary__card">
        <header>
          <span>Progreso del pedido</span>
        </header>

        <div className="order-workspace-flow">
          {FLOW.map((status, index) => {
            const done = currentIndex > index;
            const active = pedido.estado === status;

            return (
              <div
                key={status}
                className={`order-workspace-flow__step ${
                  done ? 'is-done' : ''
                } ${active ? 'is-active' : ''}`}
              >
                <span>
                  {done ? (
                    <i className="bi bi-check" aria-hidden="true" />
                  ) : null}
                </span>
                <strong>{LABELS[status]}</strong>
              </div>
            );
          })}

          {pedido.estado === 'CANCELADO' && (
            <div className="order-workspace-flow__cancelled">
              <i className="bi bi-x-circle" aria-hidden="true" />
              Pedido cancelado
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PedidoSummaryPanel;
