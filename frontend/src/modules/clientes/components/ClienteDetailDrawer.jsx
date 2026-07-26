import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

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

function ClienteDetailDrawer({
  open,
  cliente,
  onClose,
  onEdit,
}) {
  if (!open || !cliente) {
    return null;
  }

  const ubicacion =
    getLocation(cliente);

  return (
    <div
      className="client-drawer-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        className="client-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de cliente"
      >
        <header className="client-detail-drawer__header">
          <div>
            <div className="client-detail-drawer__title">
              <h4>{cliente.nombre}</h4>

              <span
                className={`clients-status ${
                  cliente.estado === false
                    ? 'inactive'
                    : 'active'
                }`}
              >
                {cliente.estado === false
                  ? 'Inactivo'
                  : 'Activo'}
              </span>
            </div>

            <span>
              {formatClientCode(
                cliente.id,
              )}
            </span>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="client-detail-drawer__body">
          <section className="client-detail-section">
            <h5>
              Información general
            </h5>

            <div className="client-detail-grid">
              <div>
                <span>Identificación</span>
                <strong>
                  {cliente.identificacion}
                </strong>
              </div>

              <div>
                <span>Teléfono</span>
                <strong>
                  {cliente.telefono}
                </strong>
              </div>

              <div className="wide">
                <span>Correo electrónico</span>

                <strong>
                  <i className="bi bi-envelope me-2" />
                  {cliente.correo}
                </strong>
              </div>

              <div>
                <span>Fecha de registro</span>

                <strong>
                  {formatDate(
                    cliente.created_at ??
                      cliente.createdAt,
                  )}
                </strong>
              </div>

              <div>
                <span>Última actualización</span>

                <strong>
                  {formatDate(
                    cliente.updated_at ??
                      cliente.updatedAt,
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="client-detail-section">
            <h5>
              Ubicación y entrega
            </h5>

            <div className="client-location-summary">
              <div className="client-location-summary__icon">
                <i className="bi bi-geo-alt-fill" />
              </div>

              <div>
                <span>Ubicación base</span>

                <strong>
                  {ubicacion?.nombre ??
                    'No disponible'}
                </strong>

                <p>
                  {cliente.direccion}
                </p>
              </div>
            </div>
          </section>

          <div className="client-detail-note">
            <i className="bi bi-info-circle" />

            <p>
              Este cliente puede ser utilizado en nuevos
              pedidos mientras permanezca activo y su
              ubicación esté disponible.
            </p>
          </div>
        </div>

        <footer className="client-detail-drawer__footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          <Can permission={PERMISSIONS.CLIENTES_GESTIONAR}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                onEdit(cliente)
              }
            >
              <i className="bi bi-pencil-square me-2" />
              Editar cliente
            </button>
          </Can>
        </footer>
      </aside>
    </div>
  );
}

export default ClienteDetailDrawer;
