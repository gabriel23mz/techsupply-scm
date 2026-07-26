import {
  useMemo,
  useState,
} from 'react';

import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/useAuth';

import {
  usePreferences,
} from '../hooks/usePreferences';

import {
  usePermissions,
} from '../hooks/usePermissions';

import ConfirmDialog from './ConfirmDialog/ConfirmDialog';

import {
  navigationSections,
} from '../constants/navigation.jsx';

import {
  getRouteById,
} from '../routing/routeRegistry';

function getInitials(user) {
  const values = [
    user?.nombre,
    user?.apellido,
  ].filter(Boolean);

  return values.length
    ? values
      .map((value) =>
        value.charAt(0),
      )
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'TS';
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const {
    canAccess,
    role,
  } = usePermissions();

  const {
    preferences,
    updatePreference,
  } = usePreferences();

  const [pendingPath, setPendingPath] =
    useState(null);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const visibleSections = useMemo(
    () =>
      navigationSections
        .map((section) => ({
          ...section,
          items: section.items
            .map(getRouteById)
            .filter(Boolean)
            .filter((route) => {
              if (
                route.hidden ||
                !canAccess(route.access)
              ) {
                return false;
              }

              return (
                !Array.isArray(
                  route.navigationRoles,
                ) ||
                route.navigationRoles.includes(role)
              );
            }),
        }))
        .filter((section) =>
          section.items.length > 0,
        ),
    [canAccess, role],
  );

  const protectedPaths = [
    '/pedidos/nuevo',
  ];

  const isProtectedPage =
    protectedPaths.some((path) =>
      location.pathname.startsWith(path),
    );

  const handleNavigation = (
    event,
    path,
  ) => {
    if (!isProtectedPage) {
      return;
    }

    event.preventDefault();

    setPendingPath(path);
    setShowConfirm(true);
  };

  const confirmNavigation = () => {
    setShowConfirm(false);

    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
    }
  };

  return (
    <aside
      className={`app-sidebar ${
        preferences.sidebarCollapsed
          ? 'collapsed'
          : ''
      }`}
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <i className="bi bi-boxes" />
        </div>

        <div className="sidebar-brand-copy">
          <strong>TechSupply</strong>
          <span>Supply Chain Management</span>
        </div>

        <button
          type="button"
          className="sidebar-collapse-button"
          title={
            preferences.sidebarCollapsed
              ? 'Expandir navegación'
              : 'Contraer navegación'
          }
          onClick={() =>
            updatePreference(
              'sidebarCollapsed',
              !preferences.sidebarCollapsed,
            )
          }
        >
          <i
            className={`bi ${
              preferences.sidebarCollapsed
                ? 'bi-chevron-right'
                : 'bi-chevron-left'
            }`}
          />
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleSections.map((section) => (
          <div
            key={section.id}
            className="sidebar-nav-section"
          >
            <span className="sidebar-section-label">
              {section.label}
            </span>

            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                title={item.label}
                className={({ isActive }) =>
                  isActive
                    ? 'sidebar-link active'
                    : 'sidebar-link'
                }
                onClick={(event) =>
                  handleNavigation(
                    event,
                    item.path,
                  )
                }
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer-card">
        <div className="sidebar-user-avatar">
          {getInitials(user)}
        </div>

        <div className="sidebar-user-copy">
          <strong>
            {[
              user?.nombre,
              user?.apellido,
            ]
              .filter(Boolean)
              .join(' ') || 'Usuario'}
          </strong>

          <span>{user?.rol ?? 'Sin rol'}</span>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Salir sin guardar"
        message="Existe información en edición. ¿Deseas abandonar esta pantalla?"
        confirmText="Salir"
        cancelText="Permanecer"
        variant="warning"
        onConfirm={confirmNavigation}
        onCancel={() => {
          setShowConfirm(false);
          setPendingPath(null);
        }}
      />
    </aside>
  );
}

export default Sidebar;
