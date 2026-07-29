import {
  StatCard,
} from '../../../shared/ui';

function RutasMetrics({ loading = false, rutas = [], ubicaciones = [] }) {
  const origins = new Set(rutas.map((ruta) => Number(ruta.origen_id))).size;
  const destinations = new Set(rutas.map((ruta) => Number(ruta.destino_id))).size;

  return (
    <section className="routes-metrics" aria-label="Resumen del catálogo de rutas">
      <StatCard
        label="Rutas registradas"
        value={rutas.length}
        helper="Conexiones viales activas"
        icon="bi bi-signpost-split"
        loading={loading}
      />
      <StatCard
        label="Ubicaciones disponibles"
        value={ubicaciones.length}
        helper="Nodos utilizables"
        icon="bi bi-geo-alt"
        tone="info"
        loading={loading}
      />
      <StatCard
        label="Orígenes conectados"
        value={origins}
        helper="Puntos de salida registrados"
        icon="bi bi-box-arrow-right"
        tone="warning"
        loading={loading}
      />
      <StatCard
        label="Destinos conectados"
        value={destinations}
        helper="Puntos de llegada registrados"
        icon="bi bi-flag"
        tone="success"
        loading={loading}
      />
    </section>
  );
}

export default RutasMetrics;
