import {
  StatusBadge,
} from '../../../shared/ui';

import {
  formatWarehouseDate,
  formatWarehouseJourneyCode,
  formatWarehouseTruckLabel,
  getLoadProgress,
  getLoadStatusMeta,
} from '../bodega.utils';

import LoadProgress from './LoadProgress';

function LoadWorkspaceSummary({ jornada }) {
  const progress = getLoadProgress(jornada);
  const status = getLoadStatusMeta(progress.status);

  return (
    <div className="warehouse-workspace-summary">
      <section className="warehouse-workspace-card">
        <header className="warehouse-workspace-card__header">
          <div>
            <span>Jornada planificada</span>
            <strong>{formatWarehouseJourneyCode(jornada?.id)}</strong>
          </div>

          <StatusBadge tone={status.tone} size="sm">
            {status.label}
          </StatusBadge>
        </header>

        <dl className="warehouse-workspace-summary__list">
          <div>
            <dt>Fecha</dt>
            <dd>{formatWarehouseDate(jornada?.fecha)}</dd>
          </div>
          <div>
            <dt>Camión</dt>
            <dd>{formatWarehouseTruckLabel(jornada?.camion)}</dd>
          </div>
          <div>
            <dt>Estado de jornada</dt>
            <dd>{jornada?.estado ?? 'PLANIFICADA'}</dd>
          </div>
        </dl>
      </section>

      <section className="warehouse-workspace-card">
        <div className="warehouse-workspace-card__title">
          <span>Resumen de carga</span>
          <strong>{progress.percentage}%</strong>
        </div>

        <LoadProgress jornada={jornada} />

        <div className="warehouse-workspace-totals">
          <div>
            <span>Despachos</span>
            <strong>{progress.total}</strong>
          </div>
          <div>
            <span>Cargados</span>
            <strong>{progress.loaded}</strong>
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{progress.pending}</strong>
          </div>
        </div>
      </section>

      <section className="warehouse-workspace-card warehouse-workspace-guide">
        <h3>Flujo de carga</h3>
        <ol>
          <li className={progress.loaded > 0 ? 'is-complete' : 'is-current'}>
            <span aria-hidden="true" />
            <div>
              <strong>Registrar despachos</strong>
              <small>Marca cada pedido después de verificar su carga física.</small>
            </div>
          </li>
          <li className={progress.complete ? 'is-complete' : 'is-current'}>
            <span aria-hidden="true" />
            <div>
              <strong>Completar jornada</strong>
              <small>Todos los despachos deben quedar cargados.</small>
            </div>
          </li>
          <li className={progress.confirmed ? 'is-complete' : ''}>
            <span aria-hidden="true" />
            <div>
              <strong>Confirmar carga</strong>
              <small>La jornada queda lista para que el chofer pueda iniciarla.</small>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}

export default LoadWorkspaceSummary;
