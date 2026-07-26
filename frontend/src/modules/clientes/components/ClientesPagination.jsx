import Pagination from '../../../shared/ui/Pagination/Pagination';

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

  return (
    <Pagination
      page={currentPage}
      pageSize={pageSize}
      total={totalItems}
      onPageChange={onPageChange}
    />
  );
}

export default ClientesPagination;
