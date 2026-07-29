import {
  useNavigate,
} from 'react-router-dom';

function QuickAccessCard({
  description,
  icon,
  informational = false,
  path,
  title,
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`dashboard-access-card${informational ? ' dashboard-access-card--informational' : ''}`}
      onClick={() => navigate(path)}
    >
      <span className="dashboard-access-card__icon">
        <i className={`bi ${icon}`} aria-hidden="true" />
      </span>
      <span className="dashboard-access-card__copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      {informational && <span className="dashboard-access-card__badge">Informativo</span>}
      <i className="bi bi-arrow-right dashboard-access-card__arrow" aria-hidden="true" />
    </button>
  );
}

export default QuickAccessCard;
