function RoleOverview({ experience }) {
  return (
    <section className={`dashboard-role-overview dashboard-role-overview--${experience.tone}`}>
      <div className="dashboard-role-overview__icon" aria-hidden="true">
        <i className={`bi ${experience.icon}`} />
      </div>

      <div className="dashboard-role-overview__heading">
        <span>{experience.eyebrow}</span>
        <h2>{experience.focusTitle}</h2>
      </div>

      <p className="dashboard-role-overview__description">
        {experience.focusDescription}
      </p>
    </section>
  );
}

export default RoleOverview;
