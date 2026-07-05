import { useNavigate } from 'react-router-dom';

function QuickAccessCard({ title, description, icon, path, featured = false }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={featured ? 'quick-card featured' : 'quick-card'}
      onClick={() => navigate(path)}
    >
      <div className="quick-icon">
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </button>
  );
}

export default QuickAccessCard;