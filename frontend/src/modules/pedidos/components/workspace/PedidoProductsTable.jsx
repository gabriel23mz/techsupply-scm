import {
  DataTable,
} from '../../../../shared/ui';

import {
  formatCurrency,
  getDetailProduct,
} from '../../pedido.utils';

function PedidoProductsTable({
  activeDetailId,
  canEdit,
  detalles,
  onDelete,
  onEdit,
}) {
  const columns = [
    {
      id: 'producto',
      header: 'Producto',
      width: '38%',
      cell: (detalle) => {
        const producto = getDetailProduct(detalle);

        return (
          <div className="order-product-cell">
            <strong>{producto?.nombre ?? 'Producto no disponible'}</strong>
            <small>
              <i className="bi bi-box-seam" aria-hidden="true" />
              PROD-{String(detalle.producto_id).padStart(4, '0')}
            </small>
          </div>
        );
      },
    },
    {
      id: 'cantidad',
      header: 'Cantidad',
      align: 'center',
      width: '12%',
      cell: (detalle) => detalle.cantidad,
    },
    {
      id: 'precio',
      header: 'Precio unitario',
      align: 'right',
      width: '17%',
      cell: (detalle) => formatCurrency(detalle.precio_unitario),
    },
    {
      id: 'subtotal',
      header: 'Subtotal',
      align: 'right',
      width: '17%',
      cell: (detalle) => (
        <strong>{formatCurrency(detalle.subtotal)}</strong>
      ),
    },
  ];

  return (
    <section className="order-products-card">
      <header className="order-section-header order-section-header--compact">
        <div>
          <h3>Detalle del pedido · Productos registrados</h3>
          <p>Revisa cantidades, precios y subtotales antes de continuar.</p>
        </div>
        <strong>
          {detalles.length} {detalles.length === 1 ? 'producto' : 'productos'}
        </strong>
      </header>

      <DataTable
        className="order-products-table"
        caption="Productos asociados al pedido"
        columns={columns}
        rows={detalles}
        rowClassName={(detalle) =>
          Number(detalle.id) === Number(activeDetailId)
            ? 'order-products-table__row--editing'
            : undefined
        }
        emptyTitle="No hay productos agregados"
        emptyMessage="Utiliza el formulario para comenzar a construir el pedido."
        actions={
          canEdit
            ? (detalle) => [
              {
                id: 'view',
                visible: false,
              },
              {
                id: 'edit',
                icon: 'bi bi-pencil-square',
                label: 'Editar cantidad',
                onClick: () => onEdit?.(detalle),
              },
              {
                id: 'delete',
                icon: 'bi bi-trash',
                label: 'Eliminar producto',
                tone: 'danger',
                onClick: () => onDelete?.(detalle),
              },
            ]
            : undefined
        }
      />
    </section>
  );
}

export default PedidoProductsTable;
