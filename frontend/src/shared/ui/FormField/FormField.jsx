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
  success,
}) {
  const generatedId = useId();
  const fieldId = id ?? htmlFor ?? generatedId;
  const feedbackType = error
    ? 'error'
    : success
      ? 'success'
      : description
        ? 'description'
        : null;
  const feedbackId = feedbackType
    ? `${fieldId}-${feedbackType}`
    : undefined;
  const valid = Boolean(success) && !error;

  const control = typeof children === 'function'
    ? children({
        id: fieldId,
        descriptionId:
          feedbackType === 'description'
            ? feedbackId
            : undefined,
        errorId:
          feedbackType === 'error'
            ? feedbackId
            : undefined,
        successId:
          feedbackType === 'success'
            ? feedbackId
            : undefined,
        describedBy: feedbackId,
        invalid: Boolean(error),
        valid,
      })
    : children;

  return (
    <div
      className={classNames(
        'ui-form-field',
        {
          'ui-form-field--invalid': Boolean(error),
          'ui-form-field--valid': valid,
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

      {control}

      {error ? (
        <p
          id={feedbackId}
          className="ui-form-field__error"
          role="alert"
        >
          <i
            className="bi bi-exclamation-circle"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      ) : success ? (
        <p
          id={feedbackId}
          className="ui-form-field__success"
          aria-live="polite"
        >
          <i
            className="bi bi-check-circle"
            aria-hidden="true"
          />
          <span>{success}</span>
        </p>
      ) : description ? (
        <p
          id={feedbackId}
          className="ui-form-field__description"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
