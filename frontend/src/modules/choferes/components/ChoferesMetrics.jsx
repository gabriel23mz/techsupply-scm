import {
  StatCard,
} from '../../../shared/ui';

import {
  getDriverStatus,
} from '../choferStatus.utils';

function ChoferesMetrics({ choferes, loading }) {
  const counts = choferes.reduce((summary, chofer) => {
    const status = getDriverStatus(chofer);

    summary[status] = (summary[status] ?? 0) + 1;
    return summary;
  }, {});

  return (
    <section className="drivers-metrics" aria-label="Resumen de choferes">
      <StatCard
        label="Choferes registrados"
        value={choferes.length}
        helper="Directorio operativo"
        icon="bi bi-person-vcard"
        loading={loading}
      />
      <StatCard
        label="Disponibles"
        value={counts.DISPONIBLE ?? 0}
        helper="Asignables a jornadas"
        icon="bi bi-person-check"
        tone="success"
        loading={loading}
      />
      <StatCard
        label="Con jornada"
        value={counts.EN_JORNADA ?? 0}
        helper="Operación asignada"
        icon="bi bi-truck"
        tone="info"
        loading={loading}
      />
      <StatCard
        label="No asignables"
        value={(counts.LICENCIA_VENCIDA ?? 0) + (counts.INACTIVO ?? 0)}
        helper="Inactivos o licencia vencida"
        icon="bi bi-exclamation-triangle"
        tone="warning"
        loading={loading}
      />
    </section>
  );
}

export default ChoferesMetrics;
