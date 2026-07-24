function getProduct(detalle) {
  return (
    detalle?.producto ??
    null
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'es-EC',
    {
      style: 'currency',
      currency: 'USD',
    },
  ).format(Number(value ?? 0));
}

function PedidoProductsTable({
  detalles,
  canEdit,
  onEdit,
  onDelete,
}) {
  return (
    <section className="pedido-products-card">
      <header className="pedido-products-card__header">
        <div>
          <span>
            Detalle del pedido
          </span>

          <h4>
            Productos registrados
          </h4>
        </div>

        <strong>
          {detalles.length}{' '}
          {detalles.length === 1
            ? 'producto'
            : 'productos'}
        </strong>
      </header>

      {!detalles.length ? (
        <div className="pedido-products-empty">
          <i className="bi bi-box-seam" />
          <h5>
            No hay productos agregados
          </h5>
          <p>
            Utiliza el formulario inferior para comenzar a construir el pedido.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table pedido-products-table mb-0">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-center">
                  Cantidad
                </th>
                <th className="text-end">
                  Precio unitario
                </th>
                <th className="text-end">
                  Subtotal
                </th>
                <th className="text-center">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {detalles.map(
                (detalle) => {
                  const producto =
                    getProduct(
                      detalle,
                    );

                  return (
                    <tr
                      key={detalle.id}
                    >
                      <td>
                        <strong>
                          {producto?.nombre ??
                            'Producto no disponible'}
                        </strong>

                        <span>
                          PROD-
                          {String(
                            detalle.producto_id,
                          ).padStart(
                            4,
                            '0',
                          )}
                        </span>
                      </td>

                      <td className="text-center">
                        {detalle.cantidad}
                      </td>

                      <td className="text-end">
                        {formatCurrency(
                          detalle.precio_unitario,
                        )}
                      </td>

                      <td className="text-end fw-bold">
                        {formatCurrency(
                          detalle.subtotal,
                        )}
                      </td>

                      <td>
                        <div className="pedido-product-actions">
                          <button
                            type="button"
                            disabled={
                              !canEdit
                            }
                            title="Editar cantidad"
                            onClick={() =>
                              onEdit(
                                detalle,
                              )
                            }
                          >
                            <i className="bi bi-pencil-square" />
                          </button>

                          <button
                            type="button"
                            className="danger"
                            disabled={
                              !canEdit
                            }
                            title="Eliminar producto"
                            onClick={() =>
                              onDelete(
                                detalle,
                              )
                            }
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default PedidoProductsTable;
