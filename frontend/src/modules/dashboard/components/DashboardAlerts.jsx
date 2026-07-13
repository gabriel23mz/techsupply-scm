import {
  useNavigate,
} from 'react-router-dom';

function DashboardAlerts({
  alerts,
}) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-panel dashboard-alerts">
      <header className="dashboard-section-header">
        <div>
          <span>
            Atención operativa
          </span>

          <h4>
            Alertas relevantes
          </h4>
        </div>

        <strong>
          {alerts.length}
        </strong>
      </header>

      <div className="dashboard-alert-list">
        {!alerts.length ? (
          <div className="dashboard-alert-empty">
            <i className="bi bi-check2-circle" />

            <div>
              <strong>
                Operación estable
              </strong>

              <span>
                No existen alertas críticas en este momento.
              </span>
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              className={`dashboard-alert-item ${alert.variant}`}
              onClick={() =>
                navigate(alert.path)
              }
            >
              <div>
                <i className={`bi ${alert.icon}`} />
              </div>

              <span>
                <strong>
                  {alert.title}
                </strong>

                <small>
                  {alert.message}
                </small>
              </span>

              <i className="bi bi-chevron-right" />
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default DashboardAlerts;
