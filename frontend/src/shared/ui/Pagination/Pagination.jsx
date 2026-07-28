import IconButton from '../IconButton/IconButton';
import {
  classNames,
} from '../internal/classNames';

import './Pagination.css';

const MAX_VISIBLE_ITEMS = 5;

function createPageRange(start, end) {
  return Array.from(
    { length: end - start + 1 },
    (_, index) => start + index,
  );
}

function buildPaginationItems(page, totalPages) {
  if (totalPages <= MAX_VISIBLE_ITEMS) {
    return createPageRange(1, totalPages);
  }

  if (page <= 3) {
    return [
      1,
      2,
      3,
      'ellipsis-end',
      totalPages,
    ];
  }

  if (page >= totalPages - 2) {
    return [
      1,
      'ellipsis-start',
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    'ellipsis-start',
    page,
    'ellipsis-end',
    totalPages,
  ];
}

function padPaginationItems(items) {
  const missingItems = MAX_VISIBLE_ITEMS - items.length;

  if (missingItems <= 0) {
    return items;
  }

  const leadingPlaceholders = Math.floor(missingItems / 2);
  const trailingPlaceholders = missingItems - leadingPlaceholders;

  return [
    ...Array.from(
      { length: leadingPlaceholders },
      (_, index) => `placeholder-start-${index}`,
    ),
    ...items,
    ...Array.from(
      { length: trailingPlaceholders },
      (_, index) => `placeholder-end-${index}`,
    ),
  ];
}

function Pagination({
  className,
  onPageChange,
  page = 1,
  pageSize = 10,
  total = 0,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize),
  );
  const safePage = Math.min(
    Math.max(1, page),
    totalPages,
  );
  const items = padPaginationItems(
    buildPaginationItems(
      safePage,
      totalPages,
    ),
  );
  const from = total === 0
    ? 0
    : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <nav
      className={classNames(
        'ui-pagination',
        className,
      )}
      aria-label="Paginación"
    >
      <p className="ui-pagination__summary">
        Mostrando <strong>{from}</strong>–<strong>{to}</strong>{' '}
        de <strong>{total}</strong>
      </p>

      <div className="ui-pagination__controls">
        <IconButton
          size="sm"
          tone="secondary"
          icon="bi bi-chevron-left"
          label="Página anterior"
          disabled={safePage <= 1}
          onClick={() => onPageChange?.(safePage - 1)}
        />

        <div className="ui-pagination__pages">
          {items.map((item) => {
            if (String(item).startsWith('placeholder-')) {
              return (
                <span
                  key={item}
                  className="ui-pagination__item"
                  aria-hidden="true"
                />
              );
            }

            if (typeof item !== 'number') {
              return (
                <span
                  key={item}
                  className="ui-pagination__item"
                  aria-hidden="true"
                >
                  <span className="ui-pagination__ellipsis">
                    …
                  </span>
                </span>
              );
            }

            return (
              <span
                key={item}
                className="ui-pagination__item"
              >
                <button
                  type="button"
                  className={classNames(
                    'ui-pagination__page',
                    {
                      'ui-pagination__page--active':
                        item === safePage,
                    },
                  )}
                  aria-label={`Ir a la página ${item}`}
                  aria-current={
                    item === safePage
                      ? 'page'
                      : undefined
                  }
                  onClick={() => onPageChange?.(item)}
                >
                  {item}
                </button>
              </span>
            );
          })}
        </div>

        <IconButton
          size="sm"
          tone="secondary"
          icon="bi bi-chevron-right"
          label="Página siguiente"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange?.(safePage + 1)}
        />
      </div>
    </nav>
  );
}

export default Pagination;
