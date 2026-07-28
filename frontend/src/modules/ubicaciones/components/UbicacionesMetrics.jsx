import {
  StatCard,
} from '../../../shared/ui';

function UbicacionesMetrics({ loading = false, ubicaciones }) {
  const georeferenced = ubicaciones.filter(
    (ubicacion) =>
      Number.isFinite(Number(ubicacion.latitud)) &&
      Number.isFinite(Number(ubicacion.longitud)),
  ).length;
  const pendingCoordinates = Math.max(
    ubicaciones.length - georeferenced,
    0,
  );

  return (
    <section className="locations-metrics">
      <StatCard
        label="Ubicaciones disponibles"
        value={ubicaciones.length}
        helper="Nodos activos del catálogo operativo"
        icon="bi bi-geo-alt"
        tone="primary"
        loading={loading}
      />
      <StatCard
        label="Con coordenadas"
        value={georeferenced}
        helper="Visibles en el mapa general"
        icon="bi bi-map"
        tone="success"
        loading={loading}
      />
      <StatCard
        label="Pendientes de georreferencia"
        value={pendingCoordinates}
        helper="Nodos sin un punto completo en el mapa"
        icon="bi bi-geo"
        tone={pendingCoordinates > 0 ? 'warning' : 'info'}
        loading={loading}
      />
    </section>
  );
}

export default UbicacionesMetrics;
