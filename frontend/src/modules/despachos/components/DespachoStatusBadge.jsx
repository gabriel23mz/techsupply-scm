const LABELS = {
  PENDIENTE: 'Pendiente',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
  NO_ENTREGADO: 'No entregado',
  CANCELADO: 'Cancelado',
};

function DespachoStatusBadge({ estado }) {
  const normalized = String(
    estado ?? 'PENDIENTE',
  );

  return (
    <span
      className={`dispatch-status dispatch-status--${normalized.toLowerCase()}`}
    >
      {LABELS[normalized] ?? normalized}
    </span>
  );
}

export default DespachoStatusBadge;
