import {
  classNames,
} from '../internal/classNames';

import './StatusBadge.css';

function StatusBadge({
  children,
  className,
  dot = true,
  icon,
  size = 'md',
  tone = 'neutral',
}) {
  return (
    <span
      className={classNames(
        'ui-status-badge',
        `ui-status-badge--${tone}`,
        `ui-status-badge--${size}`,
        className,
      )}
    >
      {icon ? (
        <i
          className={classNames(
            'ui-status-badge__icon',
            icon,
          )}
          aria-hidden="true"
        />
      ) : (
        dot && (
          <span
            className="ui-status-badge__dot"
            aria-hidden="true"
          />
        )
      )}
      <span>{children}</span>
    </span>
  );
}

export default StatusBadge;
