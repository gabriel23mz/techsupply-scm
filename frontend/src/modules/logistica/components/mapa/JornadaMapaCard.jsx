import {
  Button,
  StatusBadge,
} from '../../../../shared/ui';

function formatJourneyCode(jornada) {
  if (jornada?.codigo) {
    return jornada.codigo;
  }

  return `JR-${String(jornada?.id ?? 0).padStart(5, '0')}`;
}

function formatStatus(status) {
  return String(status ?? '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function getStatusTone(status) {
  const tones = {
    PLANIFICADA: 'warning',
    EN_RUTA: 'info',
    FINALIZADA: 'success',
    CANCELADA: 'danger',
  };

  return tones[status] ?? 'neutral';
}

function getJourneyMap(jornada) {
  return jornada?.mapa ?? jornada?.mapa_jornada ?? jornada ?? {};
}

function getDispatches(jornada) {
  if (Array.isArray(jornada?.despachos)) {
    return jornada.despachos;
  }

  const mapa = getJourneyMap(jornada);

  return Array.isArray(mapa?.puntos_entrega)
    ? mapa.puntos_entrega
    : [];
}

function getUniqueDeliveryPoints(jornada) {
  const despachos = getDispatches(jornada);

  return new Set(
    despachos
      .map((item) => Number(item.orden ?? item.orden_entrega))
      .filter(Number.isFinite),
  ).size;
}

function getClosedDispatches(jornada) {
  return getDispatches(jornada).filter((item) =>
    ['ENTREGADO', 'NO_ENTREGADO'].includes(item.estado),
  ).length;
}

function JornadaMapaCard({
  jornada,
  selected = false,
  onSelect,
  onView,
}) {
  const mapa = getJourneyMap(jornada);
  const despachos = getDispatches(jornada);

  const totalDespachos =
    Number(jornada?.total_despachos) || despachos.length;

  const totalPuntos =
    Number(jornada?.total_puntos) ||
    getUniqueDeliveryPoints(jornada);

  const totalCerrados = getClosedDispatches(jornada);

  const progreso =
    totalDespachos > 0
      ? Math.round((totalCerrados / totalDespachos) * 100)
      : jornada?.estado === 'FINALIZADA'
        ? 100
        : 0;

  const camion =
    jornada?.camion ??
    mapa?.camion ??
    null;

  return (
    <article
      className={[
        'routes-journey-card',
        selected ? 'selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="routes-journey-card__select"
        onClick={() => onSelect(jornada)}
      >
        <div className="routes-journey-card__header">
          <div>
            <strong>{formatJourneyCode(jornada)}</strong>

            <span>
              {camion?.codigo ??
                `CAM-${String(jornada?.camion_id ?? 0).padStart(3, '0')}`}
              {camion?.placa ? ` · ${camion.placa}` : ''}
            </span>
          </div>

          <StatusBadge tone={getStatusTone(jornada?.estado)}>
            {formatStatus(jornada?.estado)}
          </StatusBadge>
        </div>

        <div className="routes-journey-card__progress">
          <div>
            <span>Progreso de entregas</span>
            <strong>{progreso}%</strong>
          </div>

          <div className="routes-journey-progress-track">
            <span
              style={{
                width: `${progreso}%`,
              }}
            />
          </div>
        </div>

        <div className="routes-journey-card__summary">
          <span>
            <i className="bi bi-box-seam" />
            {totalDespachos} despacho
            {totalDespachos === 1 ? '' : 's'}
          </span>

          <span>
            <i className="bi bi-geo-alt" />
            {totalPuntos} punto
            {totalPuntos === 1 ? '' : 's'}
          </span>

          <span>
            Punto actual:{' '}
            <strong>
              {jornada?.posicion_actual_orden ??
                mapa?.posicion_actual_orden ??
                0}
            </strong>
          </span>
        </div>
      </button>

      <div className="routes-journey-card__actions">
        <span className="routes-journey-card__hint">
          <i className="bi bi-cursor me-1" />
          Selecciona la tarjeta para centrar
        </span>

        <Button
          className="routes-journey-card__view"
          size="sm"
          icon="bi bi-arrow-right"
          iconPosition="end"
          onClick={() => onView(jornada)}
        >
          Ver jornada
        </Button>
      </div>
    </article>
  );
}

export default JornadaMapaCard;
