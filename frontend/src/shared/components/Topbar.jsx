import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  useInitialLoad,
} from '../hooks/useInitialLoad';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  usePreferences,
} from '../hooks/usePreferences';

import {
  getRouteByPathname,
} from '../routing/routeRegistry';

import {
  normalizeDashboardNotification,
} from '../routing/dashboardAccess';

import {
  obtenerNotificacionesDashboard,
} from '../../modules/dashboard/services/dashboard.service';

import {
  showError,
} from '../utils/toast';

import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';

function Topbar({ onOpenNavigation }) {
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const {
    resolvedTheme,
    setTheme,
  } = usePreferences();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const currentRoute = useMemo(
    () => getRouteByPathname(location.pathname),
    [location.pathname],
  );

  const loadNotifications = useCallback(
    async () => {
      try {
        setLoadingNotifications(true);

        const result = await obtenerNotificacionesDashboard(8);

        const items = Array.isArray(result?.items)
          ? result.items.map((item) =>
            normalizeDashboardNotification(item, user?.rol),
          )
          : [];

        setNotifications(items);
      } catch (error) {
        console.error('Error al cargar alertas:', error);

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

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return (
    <>
      <header className="app-topbar">
        <div className="topbar-leading">
          <button
            type="button"
            className="topbar-icon-button topbar-menu-button"
            aria-label="Abrir navegación"
            onClick={onOpenNavigation}
          >
            <i className="bi bi-list" />
          </button>

          <div className="topbar-route">
            <h2>{currentRoute.label}</h2>
            <p>{currentRoute.description}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="topbar-icon-button topbar-theme-button"
            title={
              resolvedTheme === 'dark'
                ? 'Cambiar a tema claro'
                : 'Cambiar a tema oscuro'
            }
            aria-label={
              resolvedTheme === 'dark'
                ? 'Cambiar a tema claro'
                : 'Cambiar a tema oscuro'
            }
            onClick={toggleTheme}
          >
            <i
              className={`bi ${
                resolvedTheme === 'dark'
                  ? 'bi-sun'
                  : 'bi-moon-stars'
              }`}
            />
          </button>

          <div
            className="topbar-notification-wrapper"
            ref={notificationRef}
          >
            <button
              type="button"
              className="topbar-icon-button"
              title="Notificaciones"
              aria-label="Abrir notificaciones"
              aria-expanded={showNotifications}
              onClick={() => {
                setShowNotifications((current) => !current);
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
              onClose={() => setShowNotifications(false)}
              onRefresh={loadNotifications}
            />
          </div>

          <button
            type="button"
            className="topbar-icon-button topbar-settings-button"
            title="Configuración"
            aria-label="Abrir configuración"
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
              aria-expanded={showUserMenu}
              onClick={() => {
                setShowUserMenu((current) => !current);
                setShowNotifications(false);
              }}
            >
              <div>
                {String(user?.nombre ?? 'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                <strong>{user?.nombre ?? 'Usuario'}</strong>
                <small>{user?.rol ?? 'Sin rol'}</small>
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
        onClose={closeSettings}
      />
    </>
  );
}

export default Topbar;
