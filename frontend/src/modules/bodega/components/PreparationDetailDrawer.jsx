import {
  Button,
  Drawer,
  StatusBadge,
} from '../../../shared/ui';

import {
  formatWarehouseClientCode,
  formatWarehouseDate,
  formatWarehouseOrderCode,
  getPreparationProgress,
  getPreparationStatusMeta,
  getWarehouseClient,
  getWarehouseDetails,
  getWarehouseLocation,
} from '../bodega.utils';

import PreparationProgress from './PreparationProgress';

function PreparationDetailDrawer({ onClose, onPrepare, open, pedido }) {
  if (!pedido) return null;

  const client = getWarehouseClient(pedido);
  const location = getWarehouseLocation(pedido);
  const details = getWarehouseDetails(pedido);
  const progress = getPreparationProgress(pedido);
  const statusMeta = getPreparationStatusMeta(progress.status);

  return (
    <Drawer
      open={open}
      size="lg"
      title={formatWarehouseOrderCode(pedido.id)}
      description="Detalle operativo de preparación del pedido."
      onClose={onClose}
      footer={(
        <Button
          icon="bi bi-clipboard2-check"
          onClick={() => onPrepare?.(pedido)}
        >
          Abrir preparación
        </Button>
      )}
    >
      <div className="warehouse-preparation-drawer">
        <section className="warehouse-preparation-drawer__hero">
          <div>
            <span>Estado de preparación</span>
            <StatusBadge tone={statusMeta.tone} size="sm">
              {statusMeta.label}
            </StatusBadge>
          </div>

          <div>
            <span>Avance general</span>
            <strong>{progress.percentage}%</strong>
          </div>
        </section>

        <PreparationProgress pedido={pedido} />

        <section className="warehouse-preparation-drawer__section">
          <h3>Información del pedido</h3>

          <div className="warehouse-preparation-drawer__grid">
            <div className="warehouse-preparation-drawer__item warehouse-preparation-drawer__item--wide">
              <span>Cliente</span>
              <strong>{client?.nombre ?? 'No disponible'}</strong>
            </div>

            <div className="warehouse-preparation-drawer__item">
              <span>Código de cliente</span>
              <strong>{formatWarehouseClientCode(client?.id)}</strong>
            </div>

            <div className="warehouse-preparation-drawer__item">
              <span>Fecha del pedido</span>
              <strong>{formatWarehouseDate(pedido.fecha)}</strong>
            </div>

            <div className="warehouse-preparation-drawer__item warehouse-preparation-drawer__item--wide">
              <span>Ubicación de entrega</span>
              <strong>{location?.nombre ?? 'Sin ubicación'}</strong>
            </div>
          </div>
        </section>

        <section className="warehouse-preparation-drawer__section">
          <h3>Productos requeridos</h3>

          <div className="warehouse-preparation-products">
            {details.map((detail) => {
              const requested = Number(detail?.cantidad ?? 0);
              const prepared = Number(detail?.cantidad_preparada ?? 0);
              const percentage = requested > 0
                ? Math.round((prepared / requested) * 100)
                : 0;

              return (
                <article
                  key={detail.id}
                  className="warehouse-preparation-product"
                >
                  <div className="warehouse-preparation-product__heading">
                    <div>
                      <strong>
                        {detail?.producto?.nombre ?? 'Producto no disponible'}
                      </strong>
                      <small>
                        PROD-{String(detail?.producto?.id ?? 0).padStart(4, '0')}
                      </small>
                    </div>

                    <StatusBadge
                      tone={percentage === 100 ? 'success' : 'warning'}
                      size="sm"
                    >
                      {prepared}/{requested}
                    </StatusBadge>
                  </div>

                  <div className="warehouse-preparation-product__track">
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="warehouse-preparation-drawer__note">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <p>
            Este listado refleja exclusivamente pedidos en estado PREPARANDO.
            Las cantidades solicitadas y preparadas provienen del contrato de
            Bodega vigente.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

export default PreparationDetailDrawer;
