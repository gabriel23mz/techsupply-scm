import {
  useNavigate,
} from 'react-router-dom';

function DashboardAlerts({ alerts }) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-panel dashboard-alerts">
      <header className="dashboard-panel__header">
        <div>
          <span>Atención operativa</span>
          <h3>Alertas relevantes</h3>
          <p>Eventos recientes calculados según tu rol y alcance.</p>
        </div>
        <strong className="dashboard-panel__count">{alerts.length}</strong>
      </header>

      <div className="dashboard-alerts__list">
        {!alerts.length ? (
          <div className="dashboard-empty-message">
            <i className="bi bi-check2-circle" aria-hidden="true" />
            <div>
              <strong>Operación estable</strong>
              <span>No existen alertas críticas en este momento.</span>
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              className={`dashboard-alert dashboard-alert--${alert.variant}`}
              onClick={() => navigate(alert.path)}
            >
              <span className="dashboard-alert__icon">
                <i className={`bi ${alert.icon}`} aria-hidden="true" />
              </span>
              <span className="dashboard-alert__copy">
                <strong>{alert.title}</strong>
                <small>{alert.message}</small>
              </span>
              <i className="bi bi-chevron-right dashboard-alert__arrow" aria-hidden="true" />
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default DashboardAlerts;
