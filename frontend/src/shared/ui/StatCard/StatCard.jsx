import {
  classNames,
} from '../internal/classNames';

import './StatCard.css';

function StatCard({
  action,
  className,
  helper,
  icon = 'bi bi-graph-up',
  label,
  loading = false,
  onClick,
  tone = 'primary',
  value,
}) {
  const Component = onClick ? 'button' : 'article';

  return (
    <Component
      className={classNames(
        'ui-stat-card',
        `ui-stat-card--${tone}`,
        { 'ui-stat-card--interactive': Boolean(onClick) },
        className,
      )}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-busy={loading || undefined}
    >
      <div className="ui-stat-card__icon">
        <i
          className={icon}
          aria-hidden="true"
        />
      </div>

      <div className="ui-stat-card__content">
        <span className="ui-stat-card__label">
          {label}
        </span>

        {loading ? (
          <span
            className="ui-stat-card__skeleton"
            aria-label="Cargando métrica"
          />
        ) : (
          <strong className="ui-stat-card__value">
            {value}
          </strong>
        )}

        {helper && (
          <span className="ui-stat-card__helper">
            {helper}
          </span>
        )}
      </div>

      {action && (
        <div className="ui-stat-card__action">
          {action}
        </div>
      )}
    </Component>
  );
}

export default StatCard;
