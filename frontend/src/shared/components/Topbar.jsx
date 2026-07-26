import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../hooks/useInitialLoad';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  showError,
} from '../utils/toast';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  getRouteByPathname,
} from '../routing/routeRegistry';

import {
  normalizeDashboardNotification,
} from '../routing/dashboardAccess';

import {
  obtenerNotificacionesDashboard,
} from '../../modules/dashboard/services/dashboard.service';

import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';


function Topbar() {
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showSettings, setShowSettings] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const currentRoute = useMemo(
    () => getRouteByPathname(location.pathname),
    [location.pathname],
  );

  const loadNotifications = useCallback(
    async () => {
      try {
        setLoadingNotifications(true);

        const result =
          await obtenerNotificacionesDashboard(8);

        const items = Array.isArray(result?.items)
          ? result.items.map((item) =>
            normalizeDashboardNotification(
              item,
              user?.rol,
            ),
          )
          : [];

        setNotifications(items);
      } catch (error) {
        console.error(
          'Error al cargar alertas:',
          error,
        );

        showError(
          error.message ||
            'No fue posible actualizar las notificaciones.',
        );
      } finally {
        setLoadingNotifications(false);
      }
    },
    [user?.rol],
  );

  useInitialLoad(loadNotifications);

  useEffect(() => {
    function handleOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutside,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutside,
      );
    };
  }, []);

  return (
    <>
      <header className="app-topbar">
        <div className="topbar-route">
          <span>Módulo Outbound</span>

          <h2>{currentRoute.label}</h2>
          <p>{currentRoute.description}</p>
        </div>

        <div className="topbar-actions">
          <div
            className="topbar-notification-wrapper"
            ref={notificationRef}
          >
            <button
              type="button"
              className="topbar-icon-button"
              title="Notificaciones"
              onClick={() => {
                setShowNotifications(
                  (current) => !current,
                );
                setShowUserMenu(false);
              }}
            >
              <i className="bi bi-bell" />

              {notifications.length > 0 && (
                <span>{notifications.length}</span>
              )}
            </button>

            <NotificationsPanel
              open={showNotifications}
              notifications={notifications}
              isLoading={loadingNotifications}
              onClose={() =>
                setShowNotifications(false)
              }
              onRefresh={loadNotifications}
            />
          </div>

          <button
            type="button"
            className="topbar-icon-button"
            title="Configuración"
            onClick={() => {
              setShowSettings(true);
              setShowUserMenu(false);
              setShowNotifications(false);
            }}
          >
            <i className="bi bi-sliders" />
          </button>

          <div
            className="topbar-user-menu"
            ref={menuRef}
          >
            <button
              type="button"
              className="topbar-user-button"
              onClick={() => {
                setShowUserMenu(
                  (current) => !current,
                );
                setShowNotifications(false);
              }}
            >
              <div>
                {String(user?.nombre ?? 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                <strong>
                  {user?.nombre ?? 'Usuario'}
                </strong>

                <small>
                  {user?.rol ?? 'Sin rol'}
                </small>
              </span>

              <i className="bi bi-chevron-down" />
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <header>
                  <strong>
                    {[
                      user?.nombre,
                      user?.apellido,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </strong>

                  <span>{user?.correo}</span>
                </header>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettings(true);
                  }}
                >
                  <i className="bi bi-gear me-2" />
                  Configuración
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    logout();
                    navigate('/login', {
                      replace: true,
                    });
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

export default Topbar;
