import {
  formatDashboardContextValue,
  getDashboardContextIcon,
  getDashboardContextLabel,
} from '../../../shared/routing/dashboardAccess';

function DashboardContext({ entries }) {
  if (!entries.length) return null;

  return (
    <section className="dashboard-panel dashboard-context">
      <header className="dashboard-panel__header">
        <div>
          <span>Contexto autorizado</span>
          <h3>Alcance operativo actual</h3>
          <p>Información adicional entregada por el dashboard para esta sesión.</p>
        </div>
      </header>

      <div className="dashboard-context__grid">
        {entries.map(([key, value]) => (
          <article key={key} className="dashboard-context__item">
            <i className={`bi ${getDashboardContextIcon(key)}`} aria-hidden="true" />
            <div>
              <span>{getDashboardContextLabel(key)}</span>
              <strong>{formatDashboardContextValue(value)}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DashboardContext;
