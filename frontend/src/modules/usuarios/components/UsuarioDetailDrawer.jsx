import {
  Button,
  Drawer,
  LoadingState,
  StatusBadge,
} from '../../../shared/ui';

import {
  formatUserDate,
  getUserFullName,
  getUserRoleIcon,
  getUserRoleLabel,
  getUserRoleTone,
} from '../usuario.utils';

function DetailItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="user-detail-item">
      <span className="user-detail-item__icon">
        <i className={icon} aria-hidden="true" />
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function UsuarioDetailDrawer({
  isLoading = false,
  onClose,
  onEdit,
  open,
  usuario,
}) {
  const title = usuario
    ? getUserFullName(usuario)
    : 'Detalle del usuario';

  return (
    <Drawer
      open={open}
      size="md"
      title={title}
      description="Información de la cuenta, rol asignado y trazabilidad del registro."
      onClose={onClose}
      footer={
        usuario && !isLoading ? (
          <Button
            icon="bi bi-pencil-square"
            onClick={() => onEdit(usuario)}
          >
            Editar usuario
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <LoadingState label="Cargando información del usuario..." />
      ) : usuario ? (
        <div className="user-detail-drawer">
          <section className="user-detail-identity">
            <span className="user-detail-avatar" aria-hidden="true">
              {[
                usuario.nombre,
                usuario.apellido,
              ]
                .filter(Boolean)
                .map((value) => value.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'US'}
            </span>

            <div>
              <span>Cuenta activa</span>
              <strong>{getUserFullName(usuario)}</strong>
              <p>{usuario.correo || 'Correo no disponible'}</p>
            </div>
          </section>

          <section className="user-detail-section">
            <h3>Acceso asignado</h3>

            <div className="user-detail-role-card">
              <span>Rol vigente</span>
              <StatusBadge
                tone={getUserRoleTone(usuario.rol)}
                icon={getUserRoleIcon(usuario.rol)}
              >
                {getUserRoleLabel(usuario.rol)}
              </StatusBadge>
            </div>
          </section>

          <section className="user-detail-section">
            <h3>Información de la cuenta</h3>

            <div className="user-detail-grid">
              <DetailItem
                icon="bi bi-envelope"
                label="Correo electrónico"
                value={usuario.correo || 'No disponible'}
              />
              <DetailItem
                icon="bi bi-check-circle"
                label="Estado"
                value={usuario.estado === false ? 'Inactivo' : 'Activo'}
              />
              <DetailItem
                icon="bi bi-calendar-plus"
                label="Fecha de registro"
                value={formatUserDate(
                  usuario.created_at ?? usuario.createdAt,
                )}
              />
              <DetailItem
                icon="bi bi-clock-history"
                label="Última actualización"
                value={formatUserDate(
                  usuario.updated_at ?? usuario.updatedAt,
                )}
              />
            </div>
          </section>

          <div className="user-detail-note">
            <i className="bi bi-shield-lock" aria-hidden="true" />
            <p>
              El rol controla los módulos y acciones disponibles. La
              desactivación impide nuevos inicios de sesión sin borrar el
              historial asociado a esta cuenta.
            </p>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

export default UsuarioDetailDrawer;
