import {
  StatusBadge,
} from '../../../shared/ui';

const STATUS_CONFIG = Object.freeze({
  EN_BODEGA: {
    label: 'En bodega',
    tone: 'success',
    icon: 'bi bi-building-check',
  },
  EN_RUTA: {
    label: 'En ruta',
    tone: 'info',
    icon: 'bi bi-truck',
  },
  INACTIVO: {
    label: 'Inactivo',
    tone: 'neutral',
    icon: 'bi bi-slash-circle',
  },
});

function CamionStatusBadge({ estado }) {
  const config = STATUS_CONFIG[estado] ?? {
    label: String(estado ?? 'Sin estado').replaceAll('_', ' '),
    tone: 'neutral',
    icon: 'bi bi-circle',
  };

  return (
    <StatusBadge
      tone={config.tone}
      icon={config.icon}
      dot={false}
    >
      {config.label}
    </StatusBadge>
  );
}

export default CamionStatusBadge;
