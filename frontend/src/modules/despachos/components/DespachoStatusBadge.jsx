import StatusBadge from '../../../shared/ui/StatusBadge/StatusBadge';

const STATUS_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    tone: 'warning',
  },
  EN_TRANSITO: {
    label: 'En tránsito',
    tone: 'info',
  },
  ENTREGADO: {
    label: 'Entregado',
    tone: 'success',
  },
  NO_ENTREGADO: {
    label: 'No entregado',
    tone: 'danger',
  },
  CANCELADO: {
    label: 'Cancelado',
    tone: 'neutral',
  },
};

function DespachoStatusBadge({ estado }) {
  const normalized = String(
    estado ?? 'PENDIENTE',
  );
  const config = STATUS_CONFIG[normalized] ?? {
    label: normalized,
    tone: 'neutral',
  };

  return (
    <StatusBadge tone={config.tone}>
      {config.label}
    </StatusBadge>
  );
}

export default DespachoStatusBadge;
