import {
  forwardRef,
} from 'react';

import IconButton from '../IconButton/IconButton';
import TextField from '../TextField/TextField';

const SearchField = forwardRef(function SearchField(
  {
    clearLabel = 'Limpiar búsqueda',
    onClear,
    value,
    ...props
  },
  ref,
) {
  return (
    <TextField
      ref={ref}
      type="search"
      value={value}
      startAdornment={(
        <i
          className="bi bi-search"
          aria-hidden="true"
        />
      )}
      endAdornment={
        value ? (
          <IconButton
            size="sm"
            tone="ghost"
            icon="bi bi-x-lg"
            label={clearLabel}
            onClick={onClear}
          />
        ) : null
      }
      {...props}
    />
  );
});

export default SearchField;
