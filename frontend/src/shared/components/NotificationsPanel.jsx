import {
  useNavigate,
} from 'react-router-dom';

function NotificationsPanel({
  open,
  notifications,
  isLoading,
  onClose,
  onRefresh,
}) {
  const navigate = useNavigate();

  if (!open) {
    return null;
  }

  return (
    <section className="notifications-panel">
      <header>
        <div>
          <span>
            Centro de alertas
          </span>

          <h4>
            Notificaciones
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificaciones"
        >
          <i className="bi bi-x-lg" />
        </button>
      </header>

      <div className="notifications-actions">
        <span>
          {notifications.length}{' '}
          alertas activas
        </span>

        <button
          type="button"
          disabled={isLoading}
          onClick={onRefresh}
        >
          <i
            className={`bi bi-arrow-clockwise ${
              isLoading
                ? 'spin'
                : ''
            }`}
          />
          Actualizar
        </button>
      </div>

      <div className="notifications-list">
        {!notifications.length ? (
          <div className="notifications-empty">
            <i className="bi bi-bell-slash" />

            <strong>
              Sin alertas pendientes
            </strong>

            <span>
              La operación no requiere atención inmediata.
            </span>
          </div>
        ) : (
          notifications.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                className={`notification-item ${item.variant}`}
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
              >
                <div>
                  <i className={`bi ${item.icon}`} />
                </div>

                <span>
                  <strong>
                    {item.title}
                  </strong>

                  <small>
                    {item.message}
                  </small>
                </span>

                <i className="bi bi-chevron-right" />
              </button>
            ),
          )
        )}
      </div>
    </section>
  );
}

export default NotificationsPanel;
