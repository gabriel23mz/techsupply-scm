import StatusBadge from '../../../shared/ui/StatusBadge/StatusBadge';

const STATUS_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    tone: 'warning',
  },
  PREPARANDO: {
    label: 'Preparando',
    tone: 'info',
  },
  LISTO_PARA_DESPACHO: {
    label: 'Listo para despacho',
    tone: 'primary',
  },
  DESPACHADO: {
    label: 'Despachado',
    tone: 'info',
  },
  ENTREGADO: {
    label: 'Entregado',
    tone: 'success',
  },
  CANCELADO: {
    label: 'Cancelado',
    tone: 'danger',
  },
  REPROGRAMADO: {
    label: 'Reprogramado',
    tone: 'warning',
  },
};

function PedidoStatusBadge({ status }) {
  const normalizedStatus = String(
    status || 'PENDIENTE',
  );
  const config = STATUS_CONFIG[normalizedStatus] ?? {
    label: normalizedStatus,
    tone: 'neutral',
  };

  return (
    <StatusBadge tone={config.tone}>
      {config.label}
    </StatusBadge>
  );
}

export default PedidoStatusBadge;
