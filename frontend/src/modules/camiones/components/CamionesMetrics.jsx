import {
  StatCard,
} from '../../../shared/ui';

function CamionesMetrics({ camiones, loading = false }) {
  const enBodega = camiones.filter(
    (camion) => camion.estado === 'EN_BODEGA',
  ).length;
  const enRuta = camiones.filter(
    (camion) => camion.estado === 'EN_RUTA',
  ).length;
  const conJornada = camiones.filter(
    (camion) => camion.tiene_jornada,
  ).length;

  return (
    <section className="trucks-metrics" aria-label="Resumen de camiones">
      <StatCard
        label="Camiones registrados"
        value={camiones.length}
        helper="Flota consultada"
        icon="bi bi-truck-front"
        loading={loading}
      />
      <StatCard
        label="En bodega"
        value={enBodega}
        helper="Disponibles para planificación"
        icon="bi bi-building-check"
        tone="success"
        loading={loading}
      />
      <StatCard
        label="En ruta"
        value={enRuta}
        helper="Operación activa"
        icon="bi bi-signpost-2"
        tone="info"
        loading={loading}
      />
      <StatCard
        label="Con jornada"
        value={conJornada}
        helper="Planificados o en reparto"
        icon="bi bi-calendar2-check"
        tone="warning"
        loading={loading}
      />
    </section>
  );
}

export default CamionesMetrics;
