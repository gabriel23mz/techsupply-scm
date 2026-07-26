import EmptyState from '../Feedback/EmptyState';
import ErrorState from '../Feedback/ErrorState';
import LoadingState from '../Feedback/LoadingState';
import TableActions from '../TableActions/TableActions';
import {
  classNames,
} from '../internal/classNames';

import './DataTable.css';

function getValue(row, column) {
  if (column.cell) {
    return column.cell(row);
  }

  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }

  return row[column.accessor ?? column.id];
}

function DataTable({
  actions,
  caption,
  className,
  columns = [],
  emptyActionLabel,
  emptyMessage,
  emptyTitle,
  error,
  loading = false,
  onEmptyAction,
  onRetry,
  onRowClick,
  rowKey = 'id',
  rows = [],
}) {
  if (loading) {
    return <LoadingState label="Cargando registros..." />;
  }

  if (error) {
    return (
      <ErrorState onAction={onRetry}>
        {error.message ?? String(error)}
      </ErrorState>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      >
        {emptyMessage}
      </EmptyState>
    );
  }

  return (
    <div
      className={classNames(
        'ui-data-table',
        className,
      )}
    >
      <div className="ui-data-table__scroll">
        <table>
          {caption && (
            <caption className="visually-hidden">
              {caption}
            </caption>
          )}
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={classNames(
                    column.align &&
                      `ui-data-table__align-${column.align}`,
                    column.className,
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th
                  scope="col"
                  className="ui-data-table__actions-heading"
                >
                  <span className="visually-hidden">
                    Acciones
                  </span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => {
              const key = typeof rowKey === 'function'
                ? rowKey(row)
                : row[rowKey];
              const rowActions = actions?.(row, rowIndex) ?? [];

              return (
                <tr
                  key={key}
                  className={classNames({
                    'ui-data-table__row--interactive':
                      Boolean(onRowClick),
                  })}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(event) => {
                    if (
                      onRowClick &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      data-label={
                        column.mobileLabel ?? column.header
                      }
                      className={classNames(
                        column.align &&
                          `ui-data-table__align-${column.align}`,
                        column.cellClassName,
                      )}
                    >
                      {getValue(row, column)}
                    </td>
                  ))}

                  {actions && (
                    <td
                      data-label="Acciones"
                      className="ui-data-table__actions-cell"
                    >
                      <TableActions actions={rowActions} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
