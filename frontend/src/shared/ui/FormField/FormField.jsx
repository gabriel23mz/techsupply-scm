import {
  useId,
} from 'react';

import {
  classNames,
} from '../internal/classNames';

import './FormField.css';

function FormField({
  children,
  className,
  description,
  error,
  htmlFor,
  id,
  label,
  optional = false,
  required = false,
}) {
  const generatedId = useId();
  const fieldId = id ?? htmlFor ?? generatedId;
  const descriptionId = description
    ? `${fieldId}-description`
    : undefined;
  const errorId = error
    ? `${fieldId}-error`
    : undefined;

  const control = typeof children === 'function'
    ? children({
        id: fieldId,
        descriptionId,
        errorId,
        describedBy: [descriptionId, errorId]
          .filter(Boolean)
          .join(' ') || undefined,
        invalid: Boolean(error),
      })
    : children;

  return (
    <div
      className={classNames(
        'ui-form-field',
        {
          'ui-form-field--invalid': Boolean(error),
        },
        className,
      )}
    >
      {label && (
        <label
          className="ui-form-field__label"
          htmlFor={fieldId}
        >
          <span>{label}</span>
          {required && (
            <span
              className="ui-form-field__required"
              aria-hidden="true"
            >
              *
            </span>
          )}
          {optional && (
            <span className="ui-form-field__optional">
              Opcional
            </span>
          )}
        </label>
      )}

      {description && (
        <p
          id={descriptionId}
          className="ui-form-field__description"
        >
          {description}
        </p>
      )}

      {control}

      {error && (
        <p
          id={errorId}
          className="ui-form-field__error"
          role="alert"
        >
          <i
            className="bi bi-exclamation-circle"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default FormField;
