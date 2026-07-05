import '../dashboard.css';

import MetricCard from '../components/MetricCard';
import OperationalStatus from '../components/OperationalStatus';
import QuickAccessCard from '../components/QuickAccessCard';
import { dashboardMockData } from '../dashboardData';

function DashboardPage() {
  const { primaryMetrics, masterRecords, quickAccess } = dashboardMockData;

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <h3>Resumen general de la operación logística</h3>
      </section>

      <section className="metrics-grid">
        {primaryMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <OperationalStatus />

      <section className="dashboard-lower-grid">
        <div className="master-records">
          <h4>Registros maestros</h4>

          {masterRecords.map((item) => (
            <article className="master-card" key={item.label}>
              <div className="master-icon">
                <i className={`bi ${item.icon}`} />
              </div>

              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="quick-access">
          <h4>Accesos rápidos</h4>

          <div className="quick-grid">
            {quickAccess.map((item) => (
              <QuickAccessCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;

