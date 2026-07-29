function DashboardWorkflow({ experience }) {
  return (
    <section className="dashboard-panel dashboard-workflow">
      <header className="dashboard-panel__header">
        <div>
          <span>Enfoque del rol</span>
          <h3>{experience.workflowTitle}</h3>
          <p>{experience.workflowDescription}</p>
        </div>
      </header>

      <div className="dashboard-workflow__steps">
        {experience.workflow.map((step, index) => (
          <article key={step.label} className="dashboard-workflow__step">
            <div className="dashboard-workflow__icon" aria-hidden="true">
              <i className={`bi ${step.icon}`} />
            </div>
            <div>
              <span>Paso {index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </div>
            {index < experience.workflow.length - 1 && (
              <i className="bi bi-chevron-right dashboard-workflow__arrow" aria-hidden="true" />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default DashboardWorkflow;
