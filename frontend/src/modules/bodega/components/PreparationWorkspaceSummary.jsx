import {
  StatusBadge,
} from '../../../shared/ui';

import {
  formatWarehouseClientCode,
  formatWarehouseDate,
  formatWarehouseOrderCode,
  getPreparationProgress,
  getPreparationStatusMeta,
  getWarehouseClient,
  getWarehouseLocation,
} from '../bodega.utils';

import PreparationProgress from './PreparationProgress';

function PreparationWorkspaceSummary({ pedido }) {
  const client = getWarehouseClient(pedido);
  const location = getWarehouseLocation(pedido);
  const progress = getPreparationProgress(pedido);
  const status = getPreparationStatusMeta(progress.status);

  return (
    <div className="warehouse-workspace-summary">
      <section className="warehouse-workspace-card">
        <header className="warehouse-workspace-card__header">
          <div>
            <span>Pedido en preparación</span>
            <strong>{formatWarehouseOrderCode(pedido?.id)}</strong>
          </div>

          <StatusBadge tone={status.tone} size="sm">
            {status.label}
          </StatusBadge>
        </header>

        <dl className="warehouse-workspace-summary__list">
          <div>
            <dt>Cliente</dt>
            <dd>{client?.nombre ?? 'No disponible'}</dd>
          </div>
          <div>
            <dt>Código</dt>
            <dd>{formatWarehouseClientCode(client?.id)}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatWarehouseDate(pedido?.fecha)}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{location?.nombre ?? 'Sin ubicación'}</dd>
          </div>
        </dl>
      </section>

      <section className="warehouse-workspace-card">
        <header className="warehouse-workspace-card__title">
          <span>Progreso del pedido</span>
          <strong>{progress.percentage}%</strong>
        </header>

        <PreparationProgress pedido={pedido} />

        <div className="warehouse-workspace-totals">
          <div>
            <span>Solicitadas</span>
            <strong>{progress.requested}</strong>
          </div>
          <div>
            <span>Preparadas</span>
            <strong>{progress.prepared}</strong>
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{progress.pending}</strong>
          </div>
        </div>
      </section>

      <section className="warehouse-workspace-card warehouse-workspace-guide">
        <h3>Flujo de preparación</h3>
        <ol>
          <li className="is-current">
            <span />
            <div>
              <strong>Preparar productos</strong>
              <small>Registra las cantidades físicas verificadas.</small>
            </div>
          </li>
          <li className={progress.complete ? 'is-complete' : ''}>
            <span />
            <div>
              <strong>Completar pedido</strong>
              <small>Todas las unidades deben coincidir con lo solicitado.</small>
            </div>
          </li>
          <li>
            <span />
            <div>
              <strong>Liberar a Logística</strong>
              <small>El pedido pasará a LISTO PARA DESPACHO.</small>
            </div>
          </li>
        </ol>
      </section>
    </div>
  );
}

export default PreparationWorkspaceSummary;
