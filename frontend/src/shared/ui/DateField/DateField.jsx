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
import IconButton from '../IconButton/IconButton';
import {
  classNames,
} from '../internal/classNames';
import {
  useOutsidePointer,
} from '../internal/useOutsidePointer';

import './DateField.css';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function parseDate(value) {
  if (!value) return null;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatValue(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplay(value) {
  const date = parseDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDays(monthDate) {
  const firstDay = getMonthStart(monthDate);
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - mondayIndex,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function isSameDay(first, second) {
  return Boolean(
    first &&
    second &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate(),
  );
}

function DateField({
  className,
  description,
  disabled = false,
  error,
  id,
  label,
  min,
  onChange,
  optional = false,
  placeholder = 'dd/mm/aaaa',
  required = false,
  success,
  value,
}) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState(null);
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const minimumDate = useMemo(() => parseDate(min), [min]);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthStart(selectedDate ?? minimumDate ?? new Date()),
  );

  const calculatePanelPosition = useCallback(() => {
    const trigger = rootRef.current?.querySelector(
      '.ui-date-field__trigger',
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
    const isMobileViewport = viewportWidth <= 576;
    const desktopPanelWidth = 320;
    const panelWidth = Math.min(
      isMobileViewport ? rect.width : desktopPanelWidth,
      availableViewportWidth,
    );
    const left = Math.min(
      Math.max(viewportMargin, rect.left),
      Math.max(
        viewportMargin,
        viewportWidth - panelWidth - viewportMargin,
      ),
    );
    const spaceBelow = viewportHeight - rect.bottom - viewportMargin;
    const spaceAbove = rect.top - viewportMargin;
    const openAbove = spaceBelow < 330 && spaceAbove > spaceBelow;

    return {
      placement: openAbove ? 'top' : 'bottom',
      style: {
        left,
        width: panelWidth,
        ...(openAbove
          ? { bottom: viewportHeight - rect.top + panelGap }
          : { top: rect.bottom + panelGap }),
      },
    };
  }, []);

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

  const openCalendar = () => {
    if (disabled) return;

    setVisibleMonth(
      getMonthStart(selectedDate ?? minimumDate ?? new Date()),
    );
    setPanelPosition(calculatePanelPosition());
    setOpen(true);
  };

  const selectDate = (date) => {
    if (minimumDate && date < minimumDate) return;

    onChange?.(formatValue(date));
    setOpen(false);
  };

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const today = useMemo(() => new Date(), []);
  const monthLabel = new Intl.DateTimeFormat('es-EC', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const panel = open && panelPosition
    ? createPortal(
      <div
        ref={panelRef}
        className="ui-date-field__panel"
        data-placement={panelPosition.placement}
        style={panelPosition.style}
        role="dialog"
        aria-label={`Seleccionar fecha para ${label ?? 'el campo'}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            rootRef.current
              ?.querySelector('.ui-date-field__trigger')
              ?.focus();
          }
        }}
      >
        <header className="ui-date-field__calendar-header">
          <IconButton
            size="sm"
            tone="ghost"
            icon="bi bi-chevron-left"
            label="Mes anterior"
            onClick={() =>
              setVisibleMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          />
          <strong>{monthLabel}</strong>
          <IconButton
            size="sm"
            tone="ghost"
            icon="bi bi-chevron-right"
            label="Mes siguiente"
            onClick={() =>
              setVisibleMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          />
        </header>

        <div className="ui-date-field__weekdays" aria-hidden="true">
          {WEEKDAYS.map((weekday, index) => (
            <span key={`${weekday}-${index}`}>{weekday}</span>
          ))}
        </div>

        <div className="ui-date-field__days" role="grid">
          {calendarDays.map((date) => {
            const dateValue = formatValue(date);
            const disabledDate = Boolean(minimumDate && date < minimumDate);
            const outsideMonth = date.getMonth() !== visibleMonth.getMonth();

            return (
              <button
                key={dateValue}
                type="button"
                className={classNames(
                  'ui-date-field__day',
                  {
                    'ui-date-field__day--outside': outsideMonth,
                    'ui-date-field__day--selected': isSameDay(date, selectedDate),
                    'ui-date-field__day--today': isSameDay(date, today),
                  },
                )}
                disabled={disabledDate}
                aria-selected={isSameDay(date, selectedDate)}
                onClick={() => selectDate(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <footer className="ui-date-field__calendar-footer">
          <button
            type="button"
            className="ui-date-field__text-action"
            disabled={Boolean(minimumDate && today < minimumDate)}
            onClick={() => selectDate(today)}
          >
            Hoy
          </button>

          {optional && value && (
            <button
              type="button"
              className="ui-date-field__text-action ui-date-field__text-action--danger"
              onClick={() => {
                onChange?.('');
                setOpen(false);
              }}
            >
              Limpiar fecha
            </button>
          )}
        </footer>
      </div>,
      document.body,
    )
    : null;

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
            'ui-date-field',
            {
              'ui-date-field--open': open,
              'ui-date-field--invalid': invalid,
              'ui-date-field--valid': valid,
              'ui-date-field--disabled': disabled,
            },
          )}
        >
          <button
            id={controlId}
            type="button"
            className="ui-date-field__trigger"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            disabled={disabled}
            onClick={() => {
              if (open) setOpen(false);
              else openCalendar();
            }}
          >
            <span
              className={classNames(
                'ui-date-field__value',
                { 'ui-date-field__value--placeholder': !value },
              )}
            >
              {formatDisplay(value) || placeholder}
            </span>
            <i className="bi bi-calendar3" aria-hidden="true" />
          </button>
          {panel}
        </div>
      )}
    </FormField>
  );
}

export default DateField;
