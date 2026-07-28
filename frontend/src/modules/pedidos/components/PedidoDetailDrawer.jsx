import {
  Button,
  Drawer,
} from '../../../shared/ui';

import PedidoStatusBadge from './PedidoStatusBadge';

import {
  formatCurrency,
  formatDate,
  formatOrderCode,
  formatUser,
  getOrderClient,
  getOrderUser,
} from '../pedido.utils';

function OrderDetailItem({ className, label, value }) {
  return (
    <div className={`order-detail-item ${className ?? ''}`.trim()}>
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

function PedidoDetailDrawer({
  canOpenWorkspace = false,
  onClose,
  onOpenWorkspace,
  open,
  pedido,
}) {
  if (!pedido) return null;

  const cliente = getOrderClient(pedido);
  const usuario = getOrderUser(pedido);
  const workspaceAvailable =
    canOpenWorkspace && pedido.estado === 'PENDIENTE';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={formatOrderCode(pedido.id)}
      description="Resumen comercial y estado actual del pedido."
      size="lg"
      footer={
        workspaceAvailable ? (
          <Button
            icon="bi bi-layout-text-window-reverse"
            onClick={() => onOpenWorkspace?.(pedido)}
          >
            Abrir Workspace
          </Button>
        ) : undefined
      }
    >
      <div className="order-detail-drawer">
        <section className="order-detail-drawer__hero">
          <div>
            <span>Estado actual</span>
            <PedidoStatusBadge status={pedido.estado} />
          </div>

          <div>
            <span>Total del pedido</span>
            <strong>{formatCurrency(pedido.total)}</strong>
          </div>
        </section>

        <section className="order-detail-section">
          <h3>Información comercial</h3>

          <div className="order-detail-grid">
            <OrderDetailItem
              className="order-detail-item--wide"
              label="Cliente"
              value={cliente?.nombre}
            />
            <OrderDetailItem
              className="order-detail-item--wide"
              label="Responsable"
              value={formatUser(usuario)}
            />
            <OrderDetailItem
              label="Fecha del pedido"
              value={formatDate(pedido.fecha)}
            />
            <OrderDetailItem
              label="Entrega estimada"
              value={formatDate(pedido.fecha_entrega)}
            />
          </div>
        </section>

        <section className="order-detail-note">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <p>
            Las acciones comerciales dependen del permiso del usuario y
            del estado actual. Los pedidos no pendientes permanecen en
            modo de consulta.
          </p>
        </section>
      </div>
    </Drawer>
  );
}

export default PedidoDetailDrawer;
