import {
  useNavigate,
} from 'react-router-dom';

function QuickAccessCard({
  title,
  description,
  icon,
  path,
  featured = false,
  badge,
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`dashboard-quick-card ${
        featured
          ? 'featured'
          : ''
      }`}
      onClick={() =>
        navigate(path)
      }
    >
      <div className="dashboard-quick-icon">
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      {badge !== undefined && (
        <b>{badge}</b>
      )}

      <i className="bi bi-arrow-right dashboard-quick-arrow" />
    </button>
  );
}

export default QuickAccessCard;
