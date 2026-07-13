const STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  LISTO_PARA_DESPACHO:
    'Listo para despacho',
  DESPACHADO: 'Despachado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  REPROGRAMADO: 'Reprogramado',
};

function PedidoStatusBadge({
  status,
}) {
  const normalizedStatus =
    String(status || 'PENDIENTE');

  return (
    <span
      className={`pedido-status pedido-status--${normalizedStatus.toLowerCase()}`}
    >
      {STATUS_LABELS[
        normalizedStatus
      ] ?? normalizedStatus}
    </span>
  );
}

export default PedidoStatusBadge;
