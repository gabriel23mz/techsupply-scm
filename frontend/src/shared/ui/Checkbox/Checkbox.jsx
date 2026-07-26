import {
  forwardRef,
  useId,
} from 'react';

import {
  classNames,
} from '../internal/classNames';

import './Checkbox.css';

const Checkbox = forwardRef(function Checkbox(
  {
    className,
    description,
    id,
    label,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = description
    ? `${controlId}-description`
    : undefined;

  return (
    <label
      className={classNames(
        'ui-checkbox',
        {
          'ui-checkbox--disabled': props.disabled,
        },
        className,
      )}
      htmlFor={controlId}
    >
      <input
        ref={ref}
        id={controlId}
        type="checkbox"
        className="ui-checkbox__control"
        aria-describedby={descriptionId}
        {...props}
      />

      <span
        className="ui-checkbox__indicator"
        aria-hidden="true"
      >
        <i className="bi bi-check-lg" />
      </span>

      <span className="ui-checkbox__content">
        <span className="ui-checkbox__label">
          {label}
        </span>
        {description && (
          <span
            id={descriptionId}
            className="ui-checkbox__description"
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
});

export default Checkbox;
