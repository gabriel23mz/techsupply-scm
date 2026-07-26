import {
  forwardRef,
} from 'react';

import {
  classNames,
} from '../internal/classNames';

import './Button.css';

const Button = forwardRef(function Button(
  {
    children,
    className,
    icon,
    iconPosition = 'start',
    loading = false,
    loadingLabel = 'Procesando...',
    size = 'md',
    tone = 'primary',
    type = 'button',
    disabled = false,
    ...props
  },
  ref,
) {
  const hasOnlyIcon = Boolean(icon) && !children;

  return (
    <button
      ref={ref}
      type={type}
      className={classNames(
        'ui-button',
        `ui-button--${tone}`,
        `ui-button--${size}`,
        {
          'ui-button--icon-only': hasOnlyIcon,
          'ui-button--loading': loading,
        },
        className,
      )}
      aria-busy={loading || undefined}
      {...props}
      disabled={loading || disabled}
    >
      {loading ? (
        <span
          className="ui-button__spinner"
          aria-hidden="true"
        />
      ) : (
        icon &&
        iconPosition === 'start' && (
          <i
            className={classNames(
              'ui-button__icon',
              icon,
            )}
            aria-hidden="true"
          />
        )
      )}

      {children && (
        <span className="ui-button__label">
          {loading ? loadingLabel : children}
        </span>
      )}

      {!loading &&
        icon &&
        iconPosition === 'end' && (
          <i
            className={classNames(
              'ui-button__icon',
              icon,
            )}
            aria-hidden="true"
          />
        )}
    </button>
  );
});

export default Button;
