import IconButton from '../IconButton/IconButton';
import {
  classNames,
} from '../internal/classNames';

import './Pagination.css';

function buildPages(page, totalPages) {
  const pages = new Set([
    1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);

  return [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
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
  const pages = buildPages(safePage, totalPages);
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
          {pages.map((pageNumber, index) => {
            const previous = pages[index - 1];
            const hasGap = previous && pageNumber - previous > 1;

            return (
              <span key={pageNumber} className="ui-pagination__item">
                {hasGap && (
                  <span
                    className="ui-pagination__ellipsis"
                    aria-hidden="true"
                  >
                    …
                  </span>
                )}

                <button
                  type="button"
                  className={classNames(
                    'ui-pagination__page',
                    {
                      'ui-pagination__page--active':
                        pageNumber === safePage,
                    },
                  )}
                  aria-label={`Ir a la página ${pageNumber}`}
                  aria-current={
                    pageNumber === safePage
                      ? 'page'
                      : undefined
                  }
                  onClick={() => onPageChange?.(pageNumber)}
                >
                  {pageNumber}
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
