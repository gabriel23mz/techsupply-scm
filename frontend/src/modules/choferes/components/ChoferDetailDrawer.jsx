import {
  Button,
  Drawer,
  LoadingState,
} from '../../../shared/ui';

import ChoferStatusBadge from './ChoferStatusBadge';

function formatDate(value) {
  if (!value) return 'No registrada';

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'long',
    }).format(date);
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={`drivers-detail-item${wide ? ' drivers-detail-item--wide' : ''}`}>
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

function ChoferDetailDrawer({
  chofer,
  loading,
  onClose,
  onOpenJourney,
  open,
}) {
  const user = chofer?.usuario ?? null;
  const driverName = [user?.nombre, user?.apellido].filter(Boolean).join(' ');
  const activeJourneys = Array.isArray(chofer?.jornadas) ? chofer.jornadas : [];

  return (
    <Drawer
      open={open}
      title={driverName || 'Detalle del chofer'}
      description={user?.correo ?? 'Perfil operativo de conducción'}
      size="md"
      onClose={onClose}
      footer={(
        <>
          <Button tone="secondary" onClick={onClose}>
            Cerrar
          </Button>
          {activeJourneys[0]?.id && (
            <Button
              icon="bi bi-box-arrow-up-right"
              onClick={() => onOpenJourney(activeJourneys[0])}
            >
              Ver jornada activa
            </Button>
          )}
        </>
      )}
    >
      {loading ? (
        <LoadingState label="Cargando perfil del chofer..." />
      ) : chofer ? (
        <div className="drivers-detail">
          <section className="drivers-detail-hero">
            <div>
              <span>Disponibilidad operativa</span>
              <ChoferStatusBadge chofer={chofer} />
            </div>
            <strong>CHF-{String(chofer.id).padStart(4, '0')}</strong>
          </section>

          <section className="drivers-detail-grid">
            <DetailItem label="Nombre" value={driverName} />
            <DetailItem label="Correo" value={user?.correo} />
            <DetailItem label="Número de licencia" value={chofer.numero_licencia} />
            <DetailItem label="Categoría" value={chofer.categoria_licencia} />
            <DetailItem
              label="Vencimiento"
              value={formatDate(chofer.fecha_vencimiento_licencia)}
            />
            <DetailItem
              label="Jornada activa"
              value={activeJourneys[0]?.id
                ? `JR-${String(activeJourneys[0].id).padStart(5, '0')}`
                : 'Sin jornada activa'}
            />
            <DetailItem
              wide
              label="Estado del usuario"
              value={user?.estado === false ? 'Usuario inactivo' : 'Usuario activo'}
            />
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

export default ChoferDetailDrawer;
