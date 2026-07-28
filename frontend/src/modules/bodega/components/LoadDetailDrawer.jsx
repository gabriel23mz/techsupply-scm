import {
  Button,
  Drawer,
  StatusBadge,
} from '../../../shared/ui';

import {
  formatWarehouseDate,
  formatWarehouseDispatchCode,
  formatWarehouseJourneyCode,
  formatWarehouseOrderCode,
  formatWarehouseTruckLabel,
  getLoadProgress,
  getWarehouseDispatchClient,
  getWarehouseDispatches,
  getWarehouseDispatchLocation,
} from '../bodega.utils';

import LoadProgress from './LoadProgress';
import LoadStatusBadge from './LoadStatusBadge';

function LoadDetailDrawer({ jornada, onClose, onLoad, open }) {
  if (!jornada) return null;

  const progress = getLoadProgress(jornada);
  const dispatches = getWarehouseDispatches(jornada);

  return (
    <Drawer
      open={open}
      size="lg"
      title={formatWarehouseJourneyCode(jornada.id)}
      description="Detalle operativo de la carga planificada."
      onClose={onClose}
      footer={
        <Button
          icon="bi bi-truck-flatbed"
          onClick={() => onLoad?.(jornada)}
        >
          Abrir carga
        </Button>
      }
    >
      <div className="warehouse-load-drawer">
        <section className="warehouse-load-drawer__hero">
          <div>
            <span>Estado de carga</span>
            <LoadStatusBadge jornada={jornada} />
          </div>
          <div>
            <span>Avance general</span>
            <strong>{progress.percentage}%</strong>
          </div>
        </section>

        <LoadProgress jornada={jornada} />

        <section className="warehouse-load-drawer__section">
          <h3>Información de la jornada</h3>
          <div className="warehouse-load-drawer__grid">
            <div>
              <span>Fecha</span>
              <strong>{formatWarehouseDate(jornada.fecha)}</strong>
            </div>
            <div>
              <span>Camión</span>
              <strong>{formatWarehouseTruckLabel(jornada.camion)}</strong>
            </div>
          </div>
        </section>

        <section className="warehouse-load-drawer__section">
          <h3>Despachos asignados</h3>
          <div className="warehouse-load-dispatches">
            {dispatches.map((dispatch) => {
              const client = getWarehouseDispatchClient(dispatch);
              const location = getWarehouseDispatchLocation(dispatch);

              return (
                <article key={dispatch.id} className="warehouse-load-dispatch-card">
                  <div>
                    <strong>{formatWarehouseOrderCode(dispatch?.pedido?.id)}</strong>
                    <small>{formatWarehouseDispatchCode(dispatch.id)}</small>
                  </div>
                  <div>
                    <span>{client?.nombre ?? 'Cliente no disponible'}</span>
                    <small>{location?.nombre ?? 'Destino no disponible'}</small>
                  </div>
                  <StatusBadge
                    tone={dispatch.cargado ? 'success' : 'warning'}
                    size="sm"
                  >
                    {dispatch.cargado ? 'Cargado' : 'Pendiente'}
                  </StatusBadge>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </Drawer>
  );
}

export default LoadDetailDrawer;
