import IconButton from '../IconButton/IconButton';
import {
  classNames,
} from '../internal/classNames';

import './TableActions.css';

const DEFAULT_SLOTS = ['view', 'edit', 'delete'];

function TableActions({
  actions = [],
  className,
  slots = DEFAULT_SLOTS,
}) {
  const actionMap = new Map(
    actions
      .filter((action) => action.visible !== false)
      .map((action) => [action.id, action]),
  );

  return (
    <div
      className={classNames(
        'ui-table-actions',
        className,
      )}
      aria-label="Acciones del registro"
    >
      {slots.map((slot) => {
        const action = actionMap.get(slot);

        if (!action) {
          return (
            <span
              key={slot}
              className="ui-table-actions__slot"
              aria-hidden="true"
            />
          );
        }

        return (
          <span
            key={slot}
            className="ui-table-actions__slot"
          >
            <IconButton
              size="sm"
              tone={action.tone ?? 'ghost'}
              icon={action.icon}
              label={action.label}
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick?.(event);
              }}
            />
          </span>
        );
      })}

      {actions
        .filter(
          (action) =>
            action.visible !== false &&
            !slots.includes(action.id),
        )
        .map((action) => (
          <span
            key={action.id}
            className="ui-table-actions__slot"
          >
            <IconButton
              size="sm"
              tone={action.tone ?? 'ghost'}
              icon={action.icon}
              label={action.label}
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick?.(event);
              }}
            />
          </span>
        ))}
    </div>
  );
}

export default TableActions;
