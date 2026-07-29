import {
  Button,
  Drawer,
  LoadingState,
} from '../../../shared/ui';

import CamionStatusBadge from './CamionStatusBadge';

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={`trucks-detail-item${wide ? ' trucks-detail-item--wide' : ''}`}>
      <span>{label}</span>
      <strong>{value ?? 'No disponible'}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'No registrada';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
}

function CamionDetailDrawer({
  camion,
  loading,
  onClose,
  onOpenJourney,
  open,
}) {
  return (
    <Drawer
      open={open}
      title={camion?.codigo ?? 'Detalle del camión'}
      description={camion?.placa ?? 'Información operativa de la flota'}
      size="md"
      onClose={onClose}
      footer={(
        <>
          <Button tone="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {camion?.jornada && (
            <Button
              icon="bi bi-box-arrow-up-right"
              onClick={() => onOpenJourney(camion.jornada)}
            >
              Ver jornada
            </Button>
          )}
        </>
      )}
    >
      {loading ? (
        <LoadingState label="Cargando camión..." />
      ) : camion ? (
        <div className="trucks-detail">
          <section className="trucks-detail-hero">
            <div>
              <span>Estado de la unidad</span>
              <CamionStatusBadge estado={camion.estado} />
            </div>
            <strong>{camion.porcentaje_ocupacion ?? 0}%</strong>
          </section>

          <section className="trucks-detail-grid">
            <DetailItem label="Código" value={camion.codigo} />
            <DetailItem label="Placa" value={camion.placa} />
            <DetailItem label="Capacidad" value={`${camion.capacidad ?? 0} pedidos`} />
            <DetailItem label="Pedidos asignados" value={camion.pedidos_asignados ?? 0} />
            <DetailItem label="Capacidad disponible" value={camion.capacidad_disponible ?? 0} />
            <DetailItem
              label="Jornada vigente"
              value={camion.jornada?.codigo ?? 'Sin jornada activa'}
            />
            <DetailItem
              wide
              label="Última actualización"
              value={formatDate(camion.updated_at)}
            />
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

export default CamionDetailDrawer;
