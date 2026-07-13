function ClientesPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  if (!totalItems || totalPages <= 1) {
    return null;
  }

  const startItem =
    (currentPage - 1) * pageSize + 1;

  const endItem = Math.min(
    currentPage * pageSize,
    totalItems,
  );

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1,
  );

  return (
    <footer className="clients-pagination">
      <span>
        Mostrando {startItem}–{endItem} de {totalItems}{' '}
        clientes
      </span>

      <div className="clients-pagination__controls">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
        >
          <i className="bi bi-chevron-left" />
        </button>

        {visiblePages.map((page, index) => {
          const previousPage =
            visiblePages[index - 1];

          const showSeparator =
            previousPage &&
            page - previousPage > 1;

          return (
            <div
              key={page}
              className="clients-pagination__item"
            >
              {showSeparator && (
                <span className="clients-pagination__ellipsis">
                  …
                </span>
              )}

              <button
                type="button"
                className={
                  page === currentPage
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  onPageChange(page)
                }
              >
                {page}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          aria-label="Página siguiente"
          disabled={currentPage === totalPages}
          onClick={() =>
            onPageChange(currentPage + 1)
          }
        >
          <i className="bi bi-chevron-right" />
        </button>
      </div>
    </footer>
  );
}

export default ClientesPagination;
