import {
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
  showError,
} from '../utils/toast';

import {
  useAuth,
} from '../contexts/AuthContext';

import {
  navigation,
} from '../constants/navigation.jsx';

import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';

import api from '../services/api';

function getCurrentRoute(pathname) {
  return (
    navigation.find(
      (route) => {
        if (
          route.path.includes(':')
        ) {
          const pattern =
            new RegExp(
              `^${route.path.replace(
                /:[^/]+/g,
                '[^/]+',
              )}$`,
            );

          return pattern.test(
            pathname,
          );
        }

        return (
          route.path === pathname
        );
      },
    ) ?? navigation[0]
  );
}

function unwrap(
  result,
) {
  return (
    result?.value?.data?.data ??
    result?.value?.data ??
    []
  );
}

function arrayFrom(result) {
  const data = unwrap(result);

  return Array.isArray(data)
    ? data
    : [];
}

function Topbar() {
  const menuRef = useRef(null);
  const notificationRef =
    useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [
    showUserMenu,
    setShowUserMenu,
  ] = useState(false);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [
    showSettings,
    setShowSettings,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] = useState(false);

  const currentRoute = useMemo(
    () =>
      getCurrentRoute(
        location.pathname,
      ),
    [location.pathname],
  );

  const loadNotifications =
    async () => {
      try {
        setLoadingNotifications(true);

        const results =
          await Promise.allSettled([
            api.get('/pedidos'),
            api.get('/despachos'),
            api.get('/productos'),
          ]);

        const pedidos =
          arrayFrom(results[0]);

        const despachos =
          arrayFrom(results[1]);

        const productos =
          arrayFrom(results[2]);

        const items = [];

        const ready =
          pedidos.filter(
            (item) =>
              item.estado ===
              'LISTO_PARA_DESPACHO',
          ).length;

        const failed =
          despachos.filter(
            (item) =>
              item.estado ===
              'NO_ENTREGADO',
          ).length;

        const lowStock =
          productos.filter(
            (item) =>
              Number(
                item.stock_actual,
              ) <=
              Number(
                item.stock_minimo ??
                0,
              ),
          ).length;

        if (ready) {
          items.push({
            id: 'ready',
            title:
              'Pedidos listos para despacho',
            message:
              `${ready} pedidos esperan planificación.`,
            icon:
              'bi-box2-check',
            variant: 'info',
            path:
              '/centro-logistico',
          });
        }

        if (failed) {
          items.push({
            id: 'failed',
            title:
              'Entregas no completadas',
            message:
              `${failed} despachos requieren revisión.`,
            icon:
              'bi-exclamation-triangle',
            variant: 'danger',
            path: '/despachos',
          });
        }

        if (lowStock) {
          items.push({
            id: 'low-stock',
            title:
              'Productos con stock bajo',
            message:
              `${lowStock} productos alcanzaron su mínimo.`,
            icon:
              'bi-box-seam',
            variant: 'warning',
            path: '/pedidos',
          });
        }

        setNotifications(items);
      } catch (error) {
        console.error(
          'Error al cargar alertas:',
          error,
        );

        showError(
          'No fue posible actualizar las notificaciones.',
        );
      } finally {
        setLoadingNotifications(
          false,
        );
      }
    };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleOutside(
      event,
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target,
        )
      ) {
        setShowUserMenu(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target,
        )
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
          <span>
            Módulo Outbound
          </span>

          <h2>
            {currentRoute.label}
          </h2>

          <p>
            {currentRoute.description}
          </p>
        </div>

        <div className="topbar-actions">
          <div
            className="topbar-notification-wrapper"
            ref={
              notificationRef
            }
          >
            <button
              type="button"
              className="topbar-icon-button"
              title="Notificaciones"
              onClick={() => {
                setShowNotifications(
                  (current) =>
                    !current,
                );

                setShowUserMenu(
                  false,
                );
              }}
            >
              <i className="bi bi-bell" />

              {notifications.length >
                0 && (
                <span>
                  {
                    notifications.length
                  }
                </span>
              )}
            </button>

            <NotificationsPanel
              open={
                showNotifications
              }
              notifications={
                notifications
              }
              isLoading={
                loadingNotifications
              }
              onClose={() =>
                setShowNotifications(
                  false,
                )
              }
              onRefresh={
                loadNotifications
              }
            />
          </div>

          <button
            type="button"
            className="topbar-icon-button"
            title="Configuración"
            onClick={() => {
              setShowSettings(true);
              setShowUserMenu(false);
              setShowNotifications(
                false,
              );
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
                  (current) =>
                    !current,
                );

                setShowNotifications(
                  false,
                );
              }}
            >
              <div>
                {String(
                  user?.nombre ??
                  'U',
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                <strong>
                  {user?.nombre ??
                    'Usuario'}
                </strong>

                <small>
                  {user?.rol ??
                    'Sin rol'}
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

                  <span>
                    {user?.correo}
                  </span>
                </header>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(
                      false,
                    );

                    setShowSettings(
                      true,
                    );
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
                    navigate(
                      '/login',
                      {
                        replace: true,
                      },
                    );
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
        onClose={() =>
          setShowSettings(false)
        }
      />
    </>
  );
}

export default Topbar;
