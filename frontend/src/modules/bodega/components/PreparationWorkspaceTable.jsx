import {
  Button,
  DataTable,
  StatusBadge,
  TextField,
} from '../../../shared/ui';

import {
  getWarehouseDetails,
  validatePreparedQuantity,
} from '../bodega.utils';

function getDraftValue(drafts, detail) {
  return drafts[detail.id] ?? String(detail?.cantidad_preparada ?? 0);
}

function PreparationWorkspaceTable({
  drafts,
  onChange,
  onSave,
  pedido,
  savingDetailId,
}) {
  const details = getWarehouseDetails(pedido);

  const columns = [
    {
      id: 'producto',
      header: 'Producto',
      width: '27%',
      cell: (detail) => (
        <div className="warehouse-workspace-product">
          <strong>{detail?.producto?.nombre ?? 'Producto no disponible'}</strong>
          <small>
            <i className="bi bi-box-seam" aria-hidden="true" />
            PROD-{String(detail?.producto?.id ?? 0).padStart(4, '0')}
          </small>
        </div>
      ),
    },
    {
      id: 'solicitado',
      header: 'Solicitado',
      width: '12%',
      align: 'center',
      className: 'warehouse-workspace-heading',
      cell: (detail) => (
        <strong className="warehouse-workspace-number">
          {Number(detail?.cantidad ?? 0)}
        </strong>
      ),
    },
    {
      id: 'preparado',
      header: 'Preparado',
      width: '19%',
      align: 'center',
      className: 'warehouse-workspace-heading',
      cell: (detail) => {
        const requested = Number(detail?.cantidad ?? 0);
        const draftValue = getDraftValue(drafts, detail);
        const error = validatePreparedQuantity(draftValue, requested);

        return (
          <TextField
            className="warehouse-quantity-field"
            controlClassName="warehouse-quantity-field__control"
            type="number"
            inputMode="numeric"
            min="0"
            max={requested}
            step="1"
            value={draftValue}
            error={error || undefined}
            aria-label={`Cantidad preparada de ${detail?.producto?.nombre ?? 'producto'}`}
            onChange={(event) => onChange(detail.id, event.target.value)}
          />
        );
      },
    },
    {
      id: 'pendiente',
      header: 'Pendiente',
      width: '11%',
      align: 'center',
      className: 'warehouse-workspace-heading',
      cell: (detail) => {
        const requested = Number(detail?.cantidad ?? 0);
        const draftValue = getDraftValue(drafts, detail);
        const error = validatePreparedQuantity(draftValue, requested);
        const pending = error
          ? Math.max(requested - Number(detail?.cantidad_preparada ?? 0), 0)
          : Math.max(requested - Number(draftValue), 0);

        return (
          <strong className="warehouse-workspace-number">
            {pending}
          </strong>
        );
      },
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '14%',
      align: 'center',
      className: 'warehouse-workspace-heading',
      cell: (detail) => {
        const requested = Number(detail?.cantidad ?? 0);
        const draftValue = getDraftValue(drafts, detail);
        const error = validatePreparedQuantity(draftValue, requested);
        const prepared = error
          ? Number(detail?.cantidad_preparada ?? 0)
          : Number(draftValue);
        const complete = requested > 0 && prepared === requested;

        return (
          <StatusBadge tone={complete ? 'success' : 'warning'} size="sm">
            {complete ? 'Completo' : 'Pendiente'}
          </StatusBadge>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      width: '17%',
      align: 'center',
      className: 'warehouse-workspace-heading',
      cell: (detail) => {
        const requested = Number(detail?.cantidad ?? 0);
        const savedValue = Number(detail?.cantidad_preparada ?? 0);
        const draftValue = getDraftValue(drafts, detail);
        const error = validatePreparedQuantity(draftValue, requested);
        const changed = !error && Number(draftValue) !== savedValue;
        const saving = Number(savingDetailId) === Number(detail.id);

        return (
          <Button
            size="sm"
            tone="primary"
            icon="bi bi-check2"
            loading={saving}
            loadingLabel="Guardando"
            disabled={!changed || Boolean(error)}
            onClick={() => onSave(detail)}
          >
            Guardar
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      className="warehouse-workspace-table"
      caption="Productos y cantidades de preparación del pedido"
      columns={columns}
      rows={details}
      emptyTitle="El pedido no tiene productos"
      emptyMessage="No es posible preparar un pedido sin detalles registrados."
    />
  );
}

export default PreparationWorkspaceTable;
