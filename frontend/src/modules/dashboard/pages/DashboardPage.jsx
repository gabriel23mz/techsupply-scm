import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useAuth,
} from '../../../shared/hooks/useAuth';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';

import {
  ROLES,
} from '../../../shared/constants/permissions';

import {
  getRoleExperience,
} from '../../../shared/constants/roleExperience';

import {
  getRouteById,
} from '../../../shared/routing/routeRegistry';

import {
  getDashboardAccessConfig,
  getDashboardMetricIcon,
  normalizeDashboardNotification,
  normalizeDashboardVariant,
} from '../../../shared/routing/dashboardAccess';

import {
  Button,
  ErrorState,
  LoadingState,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import {
  obtenerResumenDashboard,
} from '../services/dashboard.service';

import DashboardAlerts from '../components/DashboardAlerts';
import DashboardContext from '../components/DashboardContext';
import DashboardWorkflow from '../components/DashboardWorkflow';
import DriverJourneyCard from '../components/DriverJourneyCard';
import MetricCard from '../components/MetricCard';
import QuickAccessCard from '../components/QuickAccessCard';
import RoleOverview from '../components/RoleOverview';
import ScopeNotice from '../components/ScopeNotice';

import '../dashboard.css';

function DashboardPage() {
  const {
    user,
  } = useAuth();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadDashboard = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const result = await obtenerResumenDashboard();
      setSummary(result);

      if (notify) showSuccess('Dashboard actualizado correctamente.');
    } catch (error) {
      console.error('Error al cargar Dashboard:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar el Dashboard.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useInitialLoad(loadDashboard);

  const role = summary?.rol ?? user?.rol;
  const experience = getRoleExperience(role);

  const pageActions = useMemo(() => (
    <Button
      className="topbar-page-action topbar-page-action--refresh"
      size="sm"
      tone="secondary"
      icon="bi bi-arrow-clockwise"
      loading={isLoading}
      loadingLabel="Actualizando"
      onClick={() => loadDashboard({ notify: true })}
    >
      Actualizar
    </Button>
  ), [isLoading, loadDashboard]);

  const pageHeader = useMemo(() => ({
    title: experience.dashboardTitle,
    description: experience.dashboardDescription,
    actions: pageActions,
  }), [experience, pageActions]);

  usePageHeader(pageHeader);

  const metrics = useMemo(
    () => (summary?.metricas ?? []).map((item) => ({
      id: item.id,
      title: item.titulo,
      value: item.valor,
      description: item.descripcion,
      icon: getDashboardMetricIcon(item.id),
      variant: normalizeDashboardVariant(item.nivel),
    })),
    [summary?.metricas],
  );

  const alerts = useMemo(
    () => (summary?.alertas ?? []).map((item) =>
      normalizeDashboardNotification(item, role)),
    [role, summary?.alertas],
  );

  const quickAccess = useMemo(
    () => (summary?.accesos ?? [])
      .map((item) => {
        const config = getDashboardAccessConfig(item.id, role);
        const route = config ? getRouteById(config.routeId) : null;

        if (!route) return null;

        return {
          id: item.id,
          title: item.titulo,
          description: config.informational
            ? `${item.descripcion} Consulta el alcance disponible.`
            : item.descripcion,
          icon: config.icon ?? route.icon,
          path: route.path === '/ayuda'
            ? '/ayuda?tab=rol'
            : route.path,
          informational: Boolean(config.informational),
        };
      })
      .filter(Boolean),
    [role, summary?.accesos],
  );

  const contextEntries = useMemo(
    () => Object.entries(summary?.contexto ?? {})
      .filter(([, value]) => value !== null && value !== undefined),
    [summary?.contexto],
  );

  const balanceMainGrid = quickAccess.length > 4 || alerts.length > 2;

  if (isLoading && !summary) {
    return (
      <LoadingState
        label="Preparando tu dashboard según los permisos de tu rol..."
        rows={4}
      />
    );
  }

  if (loadError && !summary) {
    return (
      <ErrorState
        title="No fue posible cargar el dashboard"
        onAction={() => loadDashboard()}
      >
        {loadError.message || 'Revisa la conexión e inténtalo nuevamente.'}
      </ErrorState>
    );
  }

  return (
    <div className={`dashboard-page dashboard-page--${String(role ?? 'default').toLowerCase()}`}>
      <RoleOverview experience={experience} />

      {role === ROLES.COMPRAS && experience.scopeNotice && (
        <ScopeNotice message={experience.scopeNotice} />
      )}

      {role === ROLES.CHOFER && (
        <DriverJourneyCard journey={summary?.contexto?.jornada_actual ?? null} />
      )}

      <section
        className="dashboard-metrics-grid"
        data-count={metrics.length}
        aria-label="Indicadores del dashboard"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </section>

      <DashboardWorkflow experience={experience} />

      <section className={`dashboard-main-grid${balanceMainGrid ? ' dashboard-main-grid--balanced' : ''}`}>
        <div className="dashboard-main-stack">
          <DashboardAlerts alerts={alerts} />
          <DashboardContext entries={contextEntries} />
        </div>

        <section className="dashboard-panel dashboard-accesses">
          <header className="dashboard-panel__header">
            <div>
              <span>Navegación</span>
              <h3>Accesos disponibles</h3>
              <p>Opciones entregadas por el backend y habilitadas en este frontend.</p>
            </div>
          </header>

          {quickAccess.length ? (
            <div className="dashboard-accesses__grid">
              {quickAccess.map((item) => (
                <QuickAccessCard key={item.id} {...item} />
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-message dashboard-empty-message--panel">
              <i className="bi bi-layout-sidebar-inset" aria-hidden="true" />
              <div>
                <strong>Sin módulos operativos adicionales</strong>
                <span>Tu rol conserva una experiencia informativa y acceso al Centro de ayuda.</span>
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default DashboardPage;
