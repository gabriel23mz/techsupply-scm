const FLOW = [
  {
    key: 'PENDIENTE',
    label: 'Pendientes',
    icon: 'bi-receipt',
  },
  {
    key: 'PREPARANDO',
    label: 'Preparando',
    icon: 'bi-box-seam',
  },
  {
    key: 'LISTO_PARA_DESPACHO',
    label: 'Listos',
    icon: 'bi-box2-check',
  },
  {
    key: 'EN_TRANSITO',
    label: 'En tránsito',
    icon: 'bi-truck',
  },
  {
    key: 'ENTREGADO',
    label: 'Entregados',
    icon: 'bi-check-circle',
  },
];

function OperationalStatus({
  counts,
}) {
  const total = FLOW.reduce(
    (sum, step) =>
      sum +
      Number(
        counts[step.key] ?? 0,
      ),
    0,
  );

  return (
    <section className="dashboard-panel dashboard-operational">
      <header className="dashboard-section-header">
        <div>
          <span>
            Flujo operativo
          </span>

          <h4>
            Estado actual de la operación
          </h4>
        </div>

        <strong>
          {total} registros
        </strong>
      </header>

      <div className="dashboard-operation-grid">
        {FLOW.map(
          (step, index) => (
            <article
              key={step.key}
              className="dashboard-operation-step"
            >
              <div
                className={`dashboard-operation-icon step-${index + 1}`}
              >
                <i className={`bi ${step.icon}`} />
              </div>

              <div>
                <strong>
                  {counts[step.key] ?? 0}
                </strong>

                <span>
                  {step.label}
                </span>
              </div>

              {index <
                FLOW.length - 1 && (
                <i className="bi bi-chevron-right dashboard-operation-arrow" />
              )}
            </article>
          ),
        )}
      </div>
    </section>
  );
}

export default OperationalStatus;
