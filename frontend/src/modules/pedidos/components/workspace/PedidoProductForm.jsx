import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  ConfirmDialog,
  FormField,
  TextField,
} from '../../../../shared/ui';

import {
  formatCurrency,
} from '../../pedido.utils';

function buildInitialForm(editingDetail) {
  return editingDetail
    ? {
      producto_id: String(editingDetail.producto_id),
      cantidad: String(editingDetail.cantidad),
    }
    : {
      producto_id: '',
      cantidad: '1',
    };
}

function PedidoProductForm({
  canEdit,
  detalles,
  editingDetail,
  isSaving,
  onCancelEdit,
  onSave,
  productos,
}) {
  const [formData, setFormData] = useState(() =>
    buildInitialForm(editingDetail),
  );
  const [touched, setTouched] = useState({});
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const selectedProduct = useMemo(
    () =>
      productos.find(
        (producto) => Number(producto.id) === Number(formData.producto_id),
      ) ?? null,
    [formData.producto_id, productos],
  );

  const availableProducts = useMemo(() => {
    const usedIds = new Set(
      detalles.map((detalle) => Number(detalle.producto_id)),
    );

    return productos.filter(
      (producto) =>
        producto.estado !== false &&
        (editingDetail || !usedIds.has(Number(producto.id))),
    );
  }, [detalles, editingDetail, productos]);

  const quantity = Number(formData.cantidad);
  const price = Number(
    selectedProduct?.precio_venta ?? editingDetail?.precio_unitario ?? 0,
  );
  const stock = Number(selectedProduct?.stock_actual ?? 0);
  const previousQuantity = Number(editingDetail?.cantidad ?? 0);
  const availableStock = editingDetail ? stock + previousQuantity : stock;

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!formData.producto_id) {
      nextErrors.producto_id = 'Selecciona un producto.';
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      nextErrors.cantidad = 'La cantidad debe ser un entero mayor a cero.';
    } else if (selectedProduct && quantity > availableStock) {
      nextErrors.cantidad = 'La cantidad supera el stock disponible.';
    }

    return nextErrors;
  }, [availableStock, formData.producto_id, quantity, selectedProduct]);

  const isValid = Object.keys(errors).length === 0;
  const hasQuantityChanges = Boolean(
    editingDetail &&
    String(formData.cantidad) !== String(editingDetail.cantidad),
  );

  const handleCancelEdit = () => {
    if (hasQuantityChanges) {
      setConfirmCancelOpen(true);
      return;
    }

    onCancelEdit?.();
  };

  const confirmCancelEdit = () => {
    setConfirmCancelOpen(false);
    onCancelEdit?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({ producto_id: true, cantidad: true });

    if (!isValid) return;

    onSave({
      producto_id: Number(formData.producto_id),
      cantidad: quantity,
    });
  };

  if (!canEdit) {
    return (
      <section className="order-product-form order-product-form--locked">
        <i className="bi bi-lock" aria-hidden="true" />
        <div>
          <strong>Workspace de solo lectura</strong>
          <span>
            El estado actual ya no permite modificar los productos.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      id="order-product-editor"
      className={`order-product-form ${editingDetail ? 'order-product-form--editing' : ''}`}
    >
      <header className="order-section-header order-section-header--compact">
        <div>
          <h3>
            {editingDetail
              ? `Editando ${selectedProduct?.nombre ?? 'producto'}`
              : 'Gestionar productos'}
          </h3>
          <p>
            {editingDetail
              ? 'Actualiza la cantidad y guarda para aplicar el cambio.'
              : 'Selecciona un producto, define la cantidad y agrégalo al pedido.'}
          </p>
        </div>
        {editingDetail && (
          <span className="order-product-form__editing-badge">
            <i className="bi bi-pencil-square" aria-hidden="true" />
            Edición activa
          </span>
        )}
      </header>

      <form noValidate onSubmit={handleSubmit}>
        <div className="order-product-form__grid">
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
            error={
              touched.producto_id ? errors.producto_id : undefined
            }
            success={
              touched.producto_id && !errors.producto_id
                ? 'Producto seleccionado.'
                : undefined
            }
            onChange={(value) => {
              setFormData((current) => ({
                ...current,
                producto_id: value,
              }));
              setTouched((current) => ({
                ...current,
                producto_id: true,
              }));
            }}
          />

          <div className="order-product-form__commerce-grid">
            <TextField
              className="order-product-form__quantity-field"
              type="number"
              label="Cantidad"
              required
              min="1"
              step="1"
              value={formData.cantidad}
              error={touched.cantidad ? errors.cantidad : undefined}
              success={
                touched.cantidad && !errors.cantidad
                  ? 'Cantidad disponible.'
                  : undefined
              }
              onBlur={() =>
                setTouched((current) => ({
                  ...current,
                  cantidad: true,
                }))
              }
              onChange={(event) => {
                setFormData((current) => ({
                  ...current,
                  cantidad: event.target.value,
                }));
                setTouched((current) => ({
                  ...current,
                  cantidad: true,
                }));
              }}
            />

            <FormField
              className="order-product-form__price-field"
              label="Precio unitario"
            >
              <div className="order-readonly-field">
                <strong>{formatCurrency(price)}</strong>
              </div>
            </FormField>

            <FormField
              className="order-product-form__subtotal-field"
              label="Subtotal"
            >
              <div className="order-readonly-field">
                <strong>{formatCurrency(quantity * price)}</strong>
              </div>
            </FormField>
          </div>
        </div>

        <div className="order-product-form__footer">
          <p>
            <i className="bi bi-box-seam" aria-hidden="true" />
            Stock disponible: <strong>{availableStock}</strong>
          </p>

          <div>
            {editingDetail && (
              <Button
                tone="secondary"
                disabled={isSaving}
                onClick={handleCancelEdit}
              >
                Cancelar edición
              </Button>
            )}

            <Button
              type="submit"
              icon={
                editingDetail
                  ? 'bi bi-check-lg'
                  : 'bi bi-plus-lg'
              }
              loading={isSaving}
              loadingLabel="Guardando"
              disabled={!isValid}
            >
              {editingDetail ? 'Actualizar cantidad' : 'Agregar producto'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Descartar cambio de cantidad"
        message="La cantidad fue modificada. Si continúas, se descartará el valor escrito y se conservará la cantidad registrada."
        confirmText="Descartar cambio"
        cancelText="Continuar editando"
        variant="warning"
        onConfirm={confirmCancelEdit}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </section>
  );
}

export default PedidoProductForm;
