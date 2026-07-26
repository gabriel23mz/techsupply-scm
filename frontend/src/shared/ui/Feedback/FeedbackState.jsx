import Button from '../Button/Button';
import {
  classNames,
} from '../internal/classNames';

import './FeedbackState.css';

function FeedbackState({
  actionLabel,
  children,
  className,
  compact = false,
  icon,
  onAction,
  title,
  tone = 'neutral',
}) {
  return (
    <section
      className={classNames(
        'ui-feedback-state',
        `ui-feedback-state--${tone}`,
        {
          'ui-feedback-state--compact': compact,
        },
        className,
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className="ui-feedback-state__icon">
        <i
          className={icon}
          aria-hidden="true"
        />
      </span>

      <div className="ui-feedback-state__content">
        <h3>{title}</h3>
        {children && <p>{children}</p>}
      </div>

      {actionLabel && onAction && (
        <Button
          tone={tone === 'danger' ? 'danger' : 'outline'}
          size="sm"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </section>
  );
}

export default FeedbackState;
