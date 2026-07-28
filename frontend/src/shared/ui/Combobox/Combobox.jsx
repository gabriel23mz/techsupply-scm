import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createPortal,
} from 'react-dom';

import FormField from '../FormField/FormField';
import {
  classNames,
} from '../internal/classNames';
import {
  useOutsidePointer,
} from '../internal/useOutsidePointer';

import './Combobox.css';

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function Combobox({
  allowClear = false,
  ariaLabel,
  className,
  description,
  disabled = false,
  emptyMessage = 'No hay opciones disponibles.',
  error,
  id,
  label,
  name,
  onChange,
  options = [],
  optional = false,
  placeholder = 'Selecciona una opción',
  required = false,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  success,
  value,
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const listboxId = `${controlId}-listbox`;
  const searchId = `${controlId}-search`;
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelPosition, setPanelPosition] = useState(null);


  const calculatePanelPosition = useCallback(() => {
    const trigger = rootRef.current?.querySelector(
      '.ui-combobox__trigger',
    );

    if (!trigger) return null;

    const viewportMargin = 8;
    const panelGap = 5;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const availableViewportWidth = Math.max(
      0,
      viewportWidth - viewportMargin * 2,
    );
    const panelWidth = Math.min(
      rect.width,
      availableViewportWidth,
    );
    const left = Math.min(
      Math.max(viewportMargin, rect.left),
      Math.max(
        viewportMargin,
        viewportWidth - panelWidth - viewportMargin,
      ),
    );
    const spaceBelow =
      viewportHeight - rect.bottom - viewportMargin;
    const spaceAbove = rect.top - viewportMargin;
    const openAbove =
      spaceBelow < 280 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      96,
      (openAbove ? spaceAbove : spaceBelow) - panelGap,
    );
    const maxHeight = Math.min(360, availableHeight);

    return {
      placement: openAbove ? 'top' : 'bottom',
      style: {
        left,
        width: panelWidth,
        maxHeight,
        ...(openAbove
          ? {
            bottom:
              viewportHeight - rect.top + panelGap,
          }
          : {
            top: rect.bottom + panelGap,
          }),
      },
    };
  }, []);

  const normalizedOptions = useMemo(
    () => options.map((option) => ({
      ...option,
      normalizedValue: normalizeValue(option.value),
      searchableText: [
        option.label,
        option.description,
        option.keywords,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es'),
    })),
    [options],
  );

  const normalizedValue = normalizeValue(value);
  const selectedOption = normalizedOptions.find(
    (option) =>
      option.normalizedValue === normalizedValue,
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase('es');

    if (!normalizedQuery) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      option.searchableText.includes(normalizedQuery),
    );
  }, [normalizedOptions, query]);

  const outsideRefs = useMemo(
    () => [rootRef, panelRef],
    [],
  );

  useOutsidePointer({
    enabled: open,
    refs: outsideRefs,
    onOutside: () => setOpen(false),
  });

  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      setPanelPosition(calculatePanelPosition());
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [calculatePanelPosition, open]);

  useEffect(() => {
    if (!open || !searchable) return undefined;

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, searchable]);

  const firstEnabledIndex = (items = filteredOptions) =>
    items.findIndex((option) => !option.disabled);

  const lastEnabledIndex = () => {
    for (
      let index = filteredOptions.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (!filteredOptions[index].disabled) {
        return index;
      }
    }

    return -1;
  };

  const moveActive = (direction) => {
    if (filteredOptions.length === 0) return;

    let nextIndex = activeIndex;

    for (
      let attempts = 0;
      attempts < filteredOptions.length;
      attempts += 1
    ) {
      nextIndex =
        (nextIndex + direction + filteredOptions.length) %
        filteredOptions.length;

      if (!filteredOptions[nextIndex].disabled) {
        setActiveIndex(nextIndex);
        break;
      }
    }
  };

  const openList = () => {
    if (disabled) return;

    const selectedIndex = filteredOptions.findIndex(
      (option) =>
        option.normalizedValue === normalizedValue &&
        !option.disabled,
    );

    setPanelPosition(calculatePanelPosition());
    setActiveIndex(
      selectedIndex >= 0
        ? selectedIndex
        : firstEnabledIndex(),
    );
    setQuery('');
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setQuery('');
  };

  const selectOption = (option) => {
    if (!option || option.disabled) return;

    onChange?.(option.value, option);
    closeList();
    window.requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector('.ui-combobox__trigger')
        ?.focus();
    });
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange?.('', null);
    closeList();
  };

  const handleTriggerKeyDown = (event) => {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();

      if (!open) {
        openList();
      } else if (event.key === 'ArrowDown') {
        moveActive(1);
      } else if (event.key === 'ArrowUp') {
        moveActive(-1);
      } else {
        selectOption(filteredOptions[activeIndex]);
      }
    }
  };

  const handlePanelKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(firstEnabledIndex());
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(lastEnabledIndex());
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeList();
      window.requestAnimationFrame(() => {
        rootRef.current
          ?.querySelector('.ui-combobox__trigger')
          ?.focus();
      });
    }
  };

  return (
    <FormField
      className={className}
      description={description}
      error={error}
      id={controlId}
      label={label}
      optional={optional}
      required={required}
      success={success}
    >
      {({ describedBy, invalid, valid }) => (
        <div
          ref={rootRef}
          className={classNames(
            'ui-combobox',
            {
              'ui-combobox--open': open,
              'ui-combobox--invalid': invalid,
              'ui-combobox--valid': valid,
              'ui-combobox--disabled': disabled,
            },
          )}
        >
          {name && (
            <input
              type="hidden"
              name={name}
              value={normalizedValue}
            />
          )}

          <button
            id={controlId}
            type="button"
            className="ui-combobox__trigger"
            role="combobox"
            aria-autocomplete="list"
            aria-label={ariaLabel ?? label ?? placeholder}
            aria-controls={listboxId}
            aria-describedby={describedBy}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-activedescendant={
              open && activeIndex >= 0
                ? `${controlId}-option-${activeIndex}`
                : undefined
            }
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            disabled={disabled}
            onClick={() => {
              if (open) closeList();
              else openList();
            }}
            onKeyDown={handleTriggerKeyDown}
          >
            <span
              className={classNames(
                'ui-combobox__value',
                {
                  'ui-combobox__value--placeholder':
                    !selectedOption,
                },
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>

            <span className="ui-combobox__actions">
              <i
                className={classNames(
                  'bi',
                  open
                    ? 'bi-chevron-up'
                    : 'bi-chevron-down',
                  'ui-combobox__chevron',
                )}
                aria-hidden="true"
              />
            </span>
          </button>

          {allowClear &&
            selectedOption &&
            !disabled && (
              <button
                type="button"
                className="ui-combobox__clear"
                aria-label="Limpiar selección"
                onClick={clearSelection}
              >
                <i
                  className="bi bi-x-lg"
                  aria-hidden="true"
                />
              </button>
            )}

          {open && panelPosition && createPortal(
            <div
              ref={panelRef}
              className="ui-combobox__panel"
              data-placement={panelPosition.placement}
              style={panelPosition.style}
              onKeyDown={handlePanelKeyDown}
            >
              {searchable && (
                <div className="ui-combobox__search">
                  <i
                    className="bi bi-search"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchRef}
                    id={searchId}
                    type="search"
                    value={query}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    aria-controls={listboxId}
                    aria-activedescendant={
                      activeIndex >= 0
                        ? `${controlId}-option-${activeIndex}`
                        : undefined
                    }
                    onChange={(event) => {
                      const nextQuery = event.target.value;
                      setQuery(nextQuery);

                      const normalizedQuery = nextQuery
                        .trim()
                        .toLocaleLowerCase('es');
                      const nextOptions = normalizedOptions.filter(
                        (option) =>
                          !normalizedQuery ||
                          option.searchableText.includes(
                            normalizedQuery,
                          ),
                      );

                      setActiveIndex(
                        firstEnabledIndex(nextOptions),
                      );
                    }}
                  />
                </div>
              )}

              <div
                id={listboxId}
                className="ui-combobox__list"
                role="listbox"
                aria-label={ariaLabel ?? label ?? placeholder}
                aria-activedescendant={
                  activeIndex >= 0
                    ? `${controlId}-option-${activeIndex}`
                    : undefined
                }
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => {
                    const selected =
                      option.normalizedValue ===
                      normalizedValue;
                    const active = index === activeIndex;

                    return (
                      <button
                        key={
                          option.key ??
                          option.normalizedValue
                        }
                        id={`${controlId}-option-${index}`}
                        type="button"
                        className={classNames(
                          'ui-combobox__option',
                          {
                            'ui-combobox__option--active': active,
                            'ui-combobox__option--selected': selected,
                          },
                        )}
                        role="option"
                        aria-selected={selected}
                        disabled={option.disabled}
                        onMouseEnter={() => {
                          if (!option.disabled) {
                            setActiveIndex(index);
                          }
                        }}
                        onClick={() => selectOption(option)}
                      >
                        {option.icon && (
                          <i
                            className={classNames(
                              'ui-combobox__option-icon',
                              option.icon,
                            )}
                            aria-hidden="true"
                          />
                        )}

                        <span className="ui-combobox__option-content">
                          <span className="ui-combobox__option-label">
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="ui-combobox__option-description">
                              {option.description}
                            </span>
                          )}
                        </span>

                        {selected && (
                          <i
                            className="bi bi-check-lg ui-combobox__check"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="ui-combobox__empty">
                    {emptyMessage}
                  </p>
                )}
              </div>
            </div>,
            document.body,
          )}
        </div>
      )}
    </FormField>
  );
}

export default Combobox;
