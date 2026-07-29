import {
  Button,
  DataTable,
  Modal,
} from '../../../shared/ui';

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${distance.toFixed(2)} km`
    : '0,00 km';
}

function formatDuration(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours ? `${hours} h ${remainder} min` : `${remainder} min`;
}

function ResultadoGeneracionModal({
  onClose,
  onViewJourneys,
  open,
  resultado,
}) {
  const jornadas = Array.isArray(resultado?.jornadas)
    ? resultado.jornadas
    : [];

  return (
    <Modal
      open={open && Boolean(resultado)}
      title="Jornadas generadas correctamente"
      description="La respuesta fue recibida; los listados se actualizan sin bloquear este resultado."
      size="lg"
      onClose={onClose}
      footer={(
        <>
          <Button tone="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button icon="bi bi-calendar2-week" onClick={onViewJourneys}>
            Ver jornadas
          </Button>
        </>
      )}
    >
      <section className="journeys-result-summary">
        <article>
          <span>Jornadas</span>
          <strong>{resultado?.total_jornadas ?? jornadas.length}</strong>
        </article>
        <article>
          <span>Camiones</span>
          <strong>{resultado?.total_camiones_utilizados ?? 0}</strong>
        </article>
        <article>
          <span>Pedidos asignados</span>
          <strong>{resultado?.total_pedidos_asignados ?? 0}</strong>
        </article>
        <article>
          <span>Sin asignar</span>
          <strong>{resultado?.total_pedidos_no_asignados ?? 0}</strong>
        </article>
      </section>

      <DataTable
        className="journeys-result-table"
        caption="Resumen de jornadas generadas"
        rows={jornadas}
        columns={[
          {
            id: 'jornada',
            header: 'Jornada',
            cell: (jornada) => jornada.codigo ?? `JR-${String(jornada.id).padStart(5, '0')}`,
          },
          {
            id: 'pedidos',
            header: 'Pedidos',
            cell: (jornada) => jornada.total_despachos ?? 0,
          },
          {
            id: 'puntos',
            header: 'Puntos',
            cell: (jornada) => jornada.total_puntos ?? 0,
          },
          {
            id: 'distancia',
            header: 'Distancia',
            cell: (jornada) => formatDistance(jornada.distancia_total),
          },
          {
            id: 'tiempo',
            header: 'Tiempo',
            cell: (jornada) => formatDuration(jornada.tiempo_estimado),
          },
        ]}
        emptyTitle="Sin detalle de jornadas"
        emptyMessage="El backend confirmó la generación, pero no devolvió el resumen por jornada."
      />
    </Modal>
  );
}

export default ResultadoGeneracionModal;
