import {
  Checkbox,
  DataTable,
  StatusBadge,
} from '../../../shared/ui';

import {
  formatWarehouseDispatchCode,
  formatWarehouseOrderCode,
  getWarehouseDispatchClient,
  getWarehouseDispatches,
  getWarehouseDispatchLocation,
} from '../bodega.utils';

function LoadWorkspaceTable({
  canUpdate,
  jornada,
  onToggle,
  updatingDispatchId,
}) {
  const dispatches = getWarehouseDispatches(jornada);

  const columns = [
    {
      id: 'orden',
      header: 'Orden',
      width: '9%',
      align: 'center',
      cell: (dispatch) => (
        <strong className="warehouse-workspace-number">
          {Number(dispatch?.orden_entrega ?? 0)}
        </strong>
      ),
    },
    {
      id: 'pedido',
      header: 'Pedido',
      width: '18%',
      cell: (dispatch) => (
        <div className="warehouse-workspace-product">
          <strong>{formatWarehouseOrderCode(dispatch?.pedido?.id)}</strong>
          <small>
            <i className="bi bi-box-seam" aria-hidden="true" />
            {formatWarehouseDispatchCode(dispatch.id)}
          </small>
        </div>
      ),
    },
    {
      id: 'cliente',
      header: 'Cliente y destino',
      width: '37%',
      cell: (dispatch) => {
        const client = getWarehouseDispatchClient(dispatch);
        const location = getWarehouseDispatchLocation(dispatch);

        return (
          <div className="warehouse-load-client-cell">
            <strong>{client?.nombre ?? 'Cliente no disponible'}</strong>
            <small>
              <i className="bi bi-geo-alt" aria-hidden="true" />
              {location?.nombre ?? 'Destino no disponible'}
            </small>
          </div>
        );
      },
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '14%',
      cell: (dispatch) => (
        <StatusBadge
          tone={dispatch?.cargado ? 'success' : 'warning'}
          size="sm"
        >
          {dispatch?.cargado ? 'Cargado' : 'Pendiente'}
        </StatusBadge>
      ),
    },
    {
      id: 'carga',
      header: 'Control de carga',
      width: '22%',
      cell: (dispatch) => {
        const updating =
          Number(updatingDispatchId) === Number(dispatch.id);

        return (
          <Checkbox
            className="warehouse-load-checkbox"
            label={dispatch?.cargado ? 'Despacho cargado' : 'Marcar cargado'}
            checked={Boolean(dispatch?.cargado)}
            disabled={!canUpdate || updating}
            onChange={(event) =>
              onToggle?.(dispatch, event.target.checked)
            }
          />
        );
      },
    },
  ];

  return (
    <DataTable
      className="warehouse-load-workspace-table"
      caption="Despachos asignados a la jornada para control de carga"
      columns={columns}
      rows={dispatches}
      emptyTitle="La jornada no tiene despachos"
      emptyMessage="No es posible confirmar una jornada sin despachos asignados."
    />
  );
}

export default LoadWorkspaceTable;
