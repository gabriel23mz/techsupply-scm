import {
  useMemo,
  useState,
} from 'react';

import {
  Combobox,
} from '../../../../shared/ui';


function buildInitialForm(editingDetail) {
  return editingDetail
    ? {
      producto_id: String(editingDetail.producto_id),
      cantidad: Number(editingDetail.cantidad),
    }
    : {
      producto_id: '',
      cantidad: 1,
    };
}

function PedidoProductForm({
  productos,
  detalles,
  editingDetail,
  canEdit,
  isSaving,
  onSave,
  onCancelEdit,
}) {
  const [formData, setFormData] =
    useState(() => buildInitialForm(editingDetail));

  const [error, setError] =
    useState('');

  const selectedProduct =
    useMemo(
      () =>
        productos.find(
          (producto) =>
            Number(producto.id) ===
            Number(
              formData.producto_id,
            ),
        ) ?? null,
      [
        formData.producto_id,
        productos,
      ],
    );

  const availableProducts =
    useMemo(() => {
      const usedIds = new Set(
        detalles.map(
          (detalle) =>
            Number(
              detalle.producto_id,
            ),
        ),
      );

      return productos.filter(
        (producto) =>
          producto.estado !== false &&
          (editingDetail ||
            !usedIds.has(
              Number(producto.id),
            )),
      );
    }, [
      detalles,
      editingDetail,
      productos,
    ]);

  const price = Number(
    selectedProduct?.precio_venta ??
      editingDetail?.precio_unitario ??
      0,
  );

  const subtotal =
    Number(formData.cantidad) *
    price;

  const stock = Number(
    selectedProduct?.stock_actual ??
      0,
  );

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    const cantidad = Number(
      formData.cantidad,
    );

    if (!formData.producto_id) {
      setError(
        'Selecciona un producto.',
      );
      return;
    }

    if (
      !Number.isInteger(
        cantidad,
      ) ||
      cantidad <= 0
    ) {
      setError(
        'La cantidad debe ser un entero mayor a cero.',
      );
      return;
    }

    if (
      !editingDetail &&
      cantidad > stock
    ) {
      setError(
        'La cantidad supera el stock disponible.',
      );
      return;
    }

    onSave({
      producto_id: Number(
        formData.producto_id,
      ),
      cantidad,
    });
  };

  if (!canEdit) {
    return (
      <section className="pedido-product-form-card pedido-product-form-card--locked">
        <i className="bi bi-lock" />

        <div>
          <strong>
            Workspace de solo lectura
          </strong>

          <span>
            El estado actual del pedido ya no permite modificar sus productos.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="pedido-product-form-card">
      <div className="pedido-product-form-title">
        <i
          className={`bi ${
            editingDetail
              ? 'bi-pencil-square'
              : 'bi-plus-circle'
          }`}
        />

        <div>
          <span>
            Gestión inmediata
          </span>

          <h4>
            {editingDetail
              ? 'Editar cantidad'
              : 'Agregar producto'}
          </h4>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="pedido-product-form-grid">
          <Combobox
            label="Producto"
            required
            disabled={Boolean(editingDetail)}
            value={formData.producto_id}
            options={availableProducts.map((producto) => ({
              value: producto.id,
              label: producto.nombre,
              description: `Stock disponible: ${producto.stock_actual}`,
              icon: 'bi bi-box-seam',
            }))}
            placeholder="Selecciona un producto"
            searchPlaceholder="Buscar producto..."
            error={error || undefined}
            onChange={(value) => {
              setFormData((current) => ({
                ...current,
                producto_id: value,
              }));
              setError('');
            }}
          />

          <div>
            <label className="form-label">
              Cantidad
            </label>

            <input
              type="number"
              min="1"
              step="1"
              className="form-control"
              value={
                formData.cantidad
              }
              onChange={(event) => {
                setFormData(
                  (current) => ({
                    ...current,
                    cantidad:
                      event.target
                        .value,
                  }),
                );

                setError('');
              }}
            />
          </div>

          <div>
            <label className="form-label">
              Precio unitario
            </label>

            <div className="readonly-field">
              {new Intl.NumberFormat(
                'es-EC',
                {
                  style: 'currency',
                  currency: 'USD',
                },
              ).format(price)}
            </div>
          </div>

          <div>
            <label className="form-label">
              Subtotal
            </label>

            <div className="readonly-field strong">
              {new Intl.NumberFormat(
                'es-EC',
                {
                  style: 'currency',
                  currency: 'USD',
                },
              ).format(subtotal)}
            </div>
          </div>
        </div>

        {selectedProduct && (
          <div className="pedido-product-stock">
            <i className="bi bi-box-seam" />

            Stock disponible:{' '}
            <strong>{stock}</strong>
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 mt-3 mb-0">
            {error}
          </div>
        )}

        <div className="pedido-product-form-bottom">
          <div className="pedido-save-info">
            <i className="bi bi-info-circle" />

            <span>
              Cada cambio actualiza inmediatamente el stock y el total del pedido.
            </span>
          </div>

          <div className="pedido-product-form-actions">
            {editingDetail && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={isSaving}
                onClick={onCancelEdit}
              >
                Cancelar edición
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i
                  className={`bi ${
                    editingDetail
                      ? 'bi-check-lg'
                      : 'bi-plus-lg'
                  } me-2`}
                />
              )}

              {editingDetail
                ? 'Actualizar cantidad'
                : 'Agregar producto'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default PedidoProductForm;
