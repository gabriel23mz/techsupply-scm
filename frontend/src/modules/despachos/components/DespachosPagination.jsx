function DespachosPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) {
  if (!totalItems || totalPages <= 1) {
    return null;
  }

  const start =
    (currentPage - 1) * pageSize + 1;

  const end = Math.min(
    currentPage * pageSize,
    totalItems,
  );

  return (
    <footer className="dispatch-pagination">
      <span>
        Mostrando {start}–{end} de {totalItems}{' '}
        despachos
      </span>

      <div>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() =>
            onPageChange(currentPage - 1)
          }
        >
          <i className="bi bi-chevron-left" />
        </button>

        {Array.from(
          { length: totalPages },
          (_, index) => index + 1,
        ).map((page) => (
          <button
            key={page}
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
        ))}

        <button
          type="button"
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

export default DespachosPagination;
