import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  useAuth,
} from '../../../shared/hooks/useAuth';

import {
  ROLE_LABELS,
} from '../../../shared/constants/permissions';

import {
  getRouteById,
} from '../../../shared/routing/routeRegistry';

import {
  formatDashboardContextValue,
  getDashboardAccessConfig,
  getDashboardContextLabel,
  getDashboardMetricIcon,
  normalizeDashboardNotification,
  normalizeDashboardVariant,
} from '../../../shared/routing/dashboardAccess';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import {
  obtenerResumenDashboard,
} from '../services/dashboard.service';

import DashboardAlerts from '../components/DashboardAlerts';
import MetricCard from '../components/MetricCard';
import QuickAccessCard from '../components/QuickAccessCard';

import '../dashboard.css';

function DashboardPage() {
  const {
    user,
  } = useAuth();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);

        const result = await obtenerResumenDashboard();

        setSummary(result);

        if (notify) {
          showSuccess(
            'Dashboard actualizado correctamente.',
          );
        }
      } catch (error) {
        console.error(
          'Error al cargar Dashboard:',
          error,
        );

        showError(
          error.message ||
            'No fue posible cargar el Dashboard.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(loadDashboard);

  const role = summary?.rol ?? user?.rol;
  const roleLabel = ROLE_LABELS[role] ?? role ?? 'Usuario';

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
      normalizeDashboardNotification(item, role),
    ),
    [role, summary?.alertas],
  );

  const quickAccess = useMemo(
    () => (summary?.accesos ?? [])
      .map((item) => {
        const config = getDashboardAccessConfig(
          item.id,
          role,
        );

        const route = config
          ? getRouteById(config.routeId)
          : null;

        if (!route) {
          return null;
        }

        const journeyId =
          summary?.contexto?.jornada_actual?.id;

        const path =
          item.id === 'MI_JORNADA' && journeyId
            ? `/centro-logistico/jornadas/${journeyId}`
            : route.path;

        return {
          id: item.id,
          title: item.titulo,
          description: item.descripcion,
          icon: config.icon ?? route.icon,
          path,
        };
      })
      .filter(Boolean),
    [role, summary?.accesos, summary?.contexto?.jornada_actual?.id],
  );

  const contextEntries = useMemo(
    () => Object.entries(summary?.contexto ?? {})
      .filter(([, value]) =>
        value !== null && value !== undefined,
      ),
    [summary?.contexto],
  );

  const updatedAt = summary?.actualizado_en
    ? new Date(summary.actualizado_en)
    : null;

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span>
            Panel de {roleLabel}
          </span>

          <h3>
            Resumen de tu operación
          </h3>

          <p>
            Indicadores y alertas calculados según tu rol y alcance actual.
          </p>
        </div>

        <div className="dashboard-refresh-area">
          {updatedAt && !Number.isNaN(updatedAt.getTime()) && (
            <small>
              Actualizado{' '}
              {updatedAt.toLocaleTimeString(
                'es-EC',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}
            </small>
          )}

          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={isLoading}
            onClick={() =>
              loadDashboard({
                notify: true,
              })
            }
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-arrow-clockwise me-2" />
            )}

            Actualizar
          </button>
        </div>
      </section>

      {isLoading && !summary ? (
        <div className="dashboard-loading">
          <span className="spinner-border text-primary" />

          <h4>
            Preparando tu dashboard...
          </h4>

          <p>
            Consultando únicamente la información autorizada para tu rol.
          </p>
        </div>
      ) : (
        <>
          <section className="dashboard-metrics-grid">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                {...metric}
              />
            ))}
          </section>

          <section className="dashboard-content-grid">
            <DashboardAlerts
              alerts={alerts}
            />

            <section className="dashboard-panel dashboard-quick-access">
              <header className="dashboard-section-header">
                <div>
                  <span>
                    Navegación
                  </span>

                  <h4>
                    Accesos disponibles
                  </h4>
                </div>
              </header>

              {quickAccess.length ? (
                <div className="dashboard-quick-grid">
                  {quickAccess.map((item) => (
                    <QuickAccessCard
                      key={item.id}
                      {...item}
                    />
                  ))}
                </div>
              ) : (
                <div className="dashboard-alert-empty">
                  <i className="bi bi-layout-sidebar-inset" />

                  <div>
                    <strong>
                      Sin accesos adicionales
                    </strong>

                    <span>
                      Tu rol dispone por ahora de un dashboard informativo.
                    </span>
                  </div>
                </div>
              )}
            </section>
          </section>

          {contextEntries.length > 0 && (
            <section className="dashboard-panel dashboard-master">
              <header className="dashboard-section-header">
                <div>
                  <span>
                    Contexto
                  </span>

                  <h4>
                    Alcance operativo actual
                  </h4>
                </div>
              </header>

              <div className="dashboard-master-grid">
                {contextEntries.map(([key, value]) => (
                  <article
                    key={key}
                    className="dashboard-master-item"
                  >
                    <i className="bi bi-info-circle" />

                    <span>
                      {getDashboardContextLabel(key)}
                    </span>

                    <strong>
                      {formatDashboardContextValue(value)}
                    </strong>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;
