import {
  forwardRef,
} from 'react';

import FormField from '../FormField/FormField';
import {
  classNames,
} from '../internal/classNames';

import './TextField.css';

const TextField = forwardRef(function TextField(
  {
    className,
    controlClassName,
    description,
    endAdornment,
    error,
    id,
    label,
    optional,
    required,
    startAdornment,
    success,
    type = 'text',
    ...props
  },
  ref,
) {
  return (
    <FormField
      className={className}
      description={description}
      error={error}
      id={id}
      label={label}
      optional={optional}
      required={required}
      success={success}
    >
      {({
        id: controlId,
        describedBy,
        invalid,
        valid,
      }) => (
        <div
          className={classNames(
            'ui-text-field',
            {
              'ui-text-field--invalid': invalid,
              'ui-text-field--valid': valid,
              'ui-text-field--disabled': props.disabled,
            },
          )}
        >
          {startAdornment && (
            <span className="ui-text-field__adornment">
              {startAdornment}
            </span>
          )}

          <input
            ref={ref}
            id={controlId}
            type={type}
            className={classNames(
              'ui-text-field__control',
              controlClassName,
            )}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            {...props}
          />

          {endAdornment && (
            <span className="ui-text-field__adornment ui-text-field__adornment--end">
              {endAdornment}
            </span>
          )}
        </div>
      )}
    </FormField>
  );
});

export default TextField;
