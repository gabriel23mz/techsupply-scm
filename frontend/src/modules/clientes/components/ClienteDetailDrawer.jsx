import {
  Button,
  Drawer,
  StatusBadge,
} from '../../../shared/ui';

function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function formatClientCode(id) {
  return `CLI-${String(id ?? 0).padStart(4, '0')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
  }).format(date);
}

function DetailItem({ className = '', label, value }) {
  return (
    <div
      className={[
        'client-detail-item',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span>{label}</span>
      <strong>{value || 'No disponible'}</strong>
    </div>
  );
}

function ClienteDetailDrawer({
  canManage = false,
  cliente,
  onClose,
  onEdit,
  open,
}) {
  if (!cliente) {
    return null;
  }

  const ubicacion = getLocation(cliente);
  const active = cliente.estado !== false;

  return (
    <Drawer
      open={open}
      size="lg"
      title={cliente.nombre}
      description={formatClientCode(cliente.id)}
      onClose={onClose}
      footer={
        canManage ? (
          <Button
            icon="bi bi-pencil-square"
            onClick={() => onEdit(cliente)}
          >
            Editar cliente
          </Button>
        ) : null
      }
    >
      <div className="client-detail-drawer">
        <section className="client-detail-heading">
          <div>
            <span>Estado comercial</span>
            <StatusBadge
              tone={active ? 'success' : 'neutral'}
              size="sm"
            >
              {active ? 'Activo' : 'Inactivo'}
            </StatusBadge>
          </div>

          <div>
            <span>Código del cliente</span>
            <strong>{formatClientCode(cliente.id)}</strong>
          </div>
        </section>

        <section className="client-detail-section">
          <h3>Información general</h3>

          <div className="client-detail-grid">
            <DetailItem
              label="Identificación"
              value={cliente.identificacion}
            />
            <DetailItem
              label="Teléfono"
              value={cliente.telefono}
            />
            <DetailItem
              className="client-detail-item--wide"
              label="Correo electrónico"
              value={cliente.correo}
            />
            <DetailItem
              label="Fecha de registro"
              value={formatDate(
                cliente.created_at ?? cliente.createdAt,
              )}
            />
            <DetailItem
              label="Última actualización"
              value={formatDate(
                cliente.updated_at ?? cliente.updatedAt,
              )}
            />
          </div>
        </section>

        <section className="client-detail-section">
          <h3>Ubicación de entrega</h3>

          <div className="client-location-summary">
            <span className="client-location-summary__icon">
              <i className="bi bi-geo-alt" aria-hidden="true" />
            </span>

            <div>
              <span>Ubicación base</span>
              <strong>{ubicacion?.nombre ?? 'No disponible'}</strong>
              <p>{cliente.direccion || 'Sin dirección registrada'}</p>
            </div>
          </div>
        </section>

        <div className="client-detail-note">
          <i className="bi bi-info-circle" aria-hidden="true" />
          <p>
            Los clientes activos pueden utilizarse en nuevos pedidos.
            Los registros inactivos permanecen disponibles para consulta
            histórica.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

export default ClienteDetailDrawer;
