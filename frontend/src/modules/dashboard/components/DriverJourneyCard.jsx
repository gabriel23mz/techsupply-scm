import {
  useNavigate,
} from 'react-router-dom';

import {
  Button,
  StatusBadge,
} from '../../../shared/ui';

function formatJourneyDate(value) {
  if (!value) return 'Sin fecha definida';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'long',
  }).format(date);
}

function DriverJourneyCard({ journey }) {
  const navigate = useNavigate();

  if (!journey) {
    return (
      <section className="dashboard-driver-card dashboard-driver-card--empty">
        <div className="dashboard-driver-card__icon" aria-hidden="true">
          <i className="bi bi-calendar2-x" />
        </div>
        <div>
          <span>Jornada actual</span>
          <h3>No tienes una jornada asignada</h3>
          <p>Cuando Logística asigne una jornada activa, aparecerá aquí con acceso directo al recorrido.</p>
        </div>
      </section>
    );
  }

  const summary = journey.resumen ?? {};
  const total = Number(summary.total_despachos ?? 0);
  const delivered = Number(summary.entregados ?? 0);
  const progress = total > 0
    ? Math.round((delivered / total) * 100)
    : 0;

  return (
    <section className="dashboard-driver-card">
      <header className="dashboard-driver-card__header">
        <div>
          <span>Jornada actual</span>
          <h3>{journey.codigo ?? `JR-${journey.id}`}</h3>
          <p>{formatJourneyDate(journey.fecha)}</p>
        </div>
        <StatusBadge tone={journey.estado === 'EN_RUTA' ? 'warning' : 'info'}>
          {String(journey.estado ?? 'PLANIFICADA').replaceAll('_', ' ')}
        </StatusBadge>
      </header>

      <div className="dashboard-driver-card__details">
        <article>
          <span>Camión</span>
          <strong>{journey.camion?.codigo ?? 'Sin camión'}</strong>
          <small>{journey.camion?.placa ?? 'Sin placa'}</small>
        </article>
        <article>
          <span>Punto actual</span>
          <strong>{Number(journey.posicion_actual_orden ?? 0)}</strong>
          <small>{total} despachos</small>
        </article>
        <article>
          <span>Entregas</span>
          <strong>{delivered} de {total}</strong>
          <small>{Number(summary.no_entregados ?? 0)} con novedad</small>
        </article>
      </div>

      <div className="dashboard-driver-card__progress">
        <div>
          <span>Progreso registrado</span>
          <strong>{progress}%</strong>
        </div>
        <div className="dashboard-driver-card__track" aria-label={`Progreso ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Button
        icon="bi bi-geo-alt-fill"
        iconPosition="end"
        onClick={() => navigate('/mi-jornada')}
      >
        Abrir mi jornada
      </Button>
    </section>
  );
}

export default DriverJourneyCard;
