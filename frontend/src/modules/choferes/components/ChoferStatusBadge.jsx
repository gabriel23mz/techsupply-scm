import {
  StatusBadge,
} from '../../../shared/ui';

import {
  getDriverStatus,
} from '../choferStatus.utils';

const STATUS_CONFIG = {
  DISPONIBLE: {
    label: 'Disponible',
    tone: 'success',
    icon: 'bi bi-check-circle',
  },
  EN_JORNADA: {
    label: 'Con jornada',
    tone: 'info',
    icon: 'bi bi-truck',
  },
  LICENCIA_VENCIDA: {
    label: 'Licencia vencida',
    tone: 'warning',
    icon: 'bi bi-exclamation-triangle',
  },
  INACTIVO: {
    label: 'Inactivo',
    tone: 'neutral',
    icon: 'bi bi-slash-circle',
  },
};

function ChoferStatusBadge({ chofer, size }) {
  const status = getDriverStatus(chofer);
  const config = STATUS_CONFIG[status];

  return (
    <StatusBadge
      tone={config.tone}
      icon={config.icon}
      size={size}
      dot={false}
    >
      {config.label}
    </StatusBadge>
  );
}

export default ChoferStatusBadge;
