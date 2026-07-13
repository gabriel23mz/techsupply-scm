import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  showError,
  showSuccess,
  showWarning,
} from '../../../shared/utils/toast';

import {
  obtenerResumenDashboard,
} from '../services/dashboard.service';

import DashboardAlerts from '../components/DashboardAlerts';
import MetricCard from '../components/MetricCard';
import OperationalStatus from '../components/OperationalStatus';
import QuickAccessCard from '../components/QuickAccessCard';
import RecentActivity from '../components/RecentActivity';

import '../dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    pedidos: [],
    clientes: [],
    ubicaciones: [],
    rutas: [],
    despachos: [],
    jornadas: [],
    camiones: [],
    productos: [],
    failedSources: [],
  });

  const [isLoading, setIsLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const loadDashboard = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);

        const summary =
          await obtenerResumenDashboard();

        setData(summary);
        setLastUpdated(new Date());

        if (
          summary.failedSources.length
        ) {
          showWarning(
            `El Dashboard se cargó parcialmente. Sin respuesta: ${summary.failedSources.join(', ')}.`,
          );
        } else if (notify) {
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

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const counts = useMemo(() => {
    const pedidoCount = (
      status,
    ) =>
      data.pedidos.filter(
        (item) =>
          item.estado === status,
      ).length;

    const dispatchCount = (
      status,
    ) =>
      data.despachos.filter(
        (item) =>
          item.estado === status,
      ).length;

    return {
      PENDIENTE:
        pedidoCount('PENDIENTE'),
      PREPARANDO:
        pedidoCount('PREPARANDO'),
      LISTO_PARA_DESPACHO:
        pedidoCount(
          'LISTO_PARA_DESPACHO',
        ),
      EN_TRANSITO:
        dispatchCount(
          'EN_TRANSITO',
        ),
      ENTREGADO:
        dispatchCount(
          'ENTREGADO',
        ),
    };
  }, [data]);

  const metrics = useMemo(
    () => [
      {
        title: 'Pedidos pendientes',
        value: counts.PENDIENTE,
        description:
          'Esperan preparación',
        icon: 'bi-receipt',
        variant: 'warning',
        path: '/pedidos',
      },
      {
        title: 'Listos para despacho',
        value:
          counts.LISTO_PARA_DESPACHO,
        description:
          'Disponibles en logística',
        icon: 'bi-box2-check',
        variant: 'info',
        path: '/centro-logistico',
      },
      {
        title: 'Jornadas activas',
        value:
          data.jornadas.filter(
            (item) =>
              [
                'PLANIFICADA',
                'EN_RUTA',
              ].includes(
                item.estado,
              ),
          ).length,
        description:
          'Planificadas o en ruta',
        icon: 'bi-map',
        variant: 'primary',
        path: '/rutas',
      },
      {
        title: 'Despachos en tránsito',
        value: counts.EN_TRANSITO,
        description:
          'Seguimiento operativo',
        icon: 'bi-truck',
        variant: 'success',
        path: '/despachos',
      },
    ],
    [
      counts,
      data.jornadas,
    ],
  );

  const alerts = useMemo(() => {
    const result = [];

    const noEntregados =
      data.despachos.filter(
        (item) =>
          item.estado ===
          'NO_ENTREGADO',
      ).length;

    const stockBajo =
      data.productos.filter(
        (item) =>
          Number(item.stock_actual) <=
          Number(
            item.stock_minimo ?? 0,
          ),
      ).length;

    const pedidosListos =
      counts.LISTO_PARA_DESPACHO;

    const camionesDisponibles =
      data.camiones.filter(
        (item) =>
          item.estado ===
          'EN_BODEGA',
      ).length;

    if (noEntregados) {
      result.push({
        id: 'no-entregados',
        title:
          'Despachos no entregados',
        message:
          `${noEntregados} requieren revisión o reprogramación.`,
        icon:
          'bi-exclamation-triangle',
        variant: 'danger',
        path: '/despachos',
      });
    }

    if (stockBajo) {
      result.push({
        id: 'stock-bajo',
        title: 'Stock bajo',
        message:
          `${stockBajo} productos alcanzaron su mínimo.`,
        icon: 'bi-box-seam',
        variant: 'warning',
        path: '/pedidos',
      });
    }

    if (
      pedidosListos &&
      !data.jornadas.some(
        (item) =>
          item.estado ===
          'PLANIFICADA',
      )
    ) {
      result.push({
        id: 'sin-jornada',
        title:
          'Pedidos listos sin jornada planificada',
        message:
          `${pedidosListos} pedidos esperan planificación logística.`,
        icon: 'bi-calendar-plus',
        variant: 'info',
        path:
          '/centro-logistico',
      });
    }

    if (
      !camionesDisponibles &&
      pedidosListos
    ) {
      result.push({
        id:
          'sin-camiones',
        title:
          'Sin camiones disponibles',
        message:
          'Existen pedidos listos, pero ningún camión está en bodega.',
        icon: 'bi-truck-front',
        variant: 'danger',
        path: '/rutas',
      });
    }

    return result;
  }, [
    counts.LISTO_PARA_DESPACHO,
    data,
  ]);

  const quickAccess = [
    {
      title: 'Nuevo pedido',
      description:
        'Registrar y abrir Workspace',
      icon: 'bi-plus-circle',
      path: '/pedidos/nuevo',
    },
    {
      title: 'Centro Logístico',
      description:
        'Planificar jornadas',
      icon: 'bi-diagram-3',
      path: '/centro-logistico',
      featured: true,
      badge:
        counts.LISTO_PARA_DESPACHO,
    },
    {
      title: 'Mapa de rutas',
      description:
        'Supervisar jornadas',
      icon: 'bi-map',
      path: '/rutas',
    },
    {
      title: 'Clientes',
      description:
        'Directorio comercial',
      icon:
        'bi-person-lines-fill',
      path: '/clientes',
    },
  ];

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span>
            Centro de control Outbound
          </span>

          <h3>
            Resumen general de la operación
          </h3>

          <p>
            Indicadores consolidados de pedidos,
            logística y entregas.
          </p>
        </div>

        <div className="dashboard-refresh-area">
          {lastUpdated && (
            <small>
              Actualizado{' '}
              {lastUpdated.toLocaleTimeString(
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

      {isLoading &&
      !lastUpdated ? (
        <div className="dashboard-loading">
          <span className="spinner-border text-primary" />

          <h4>
            Preparando el centro de control...
          </h4>

          <p>
            Consolidando la información operativa.
          </p>
        </div>
      ) : (
        <>
          <section className="dashboard-metrics-grid">
            {metrics.map(
              (metric) => (
                <MetricCard
                  key={metric.title}
                  {...metric}
                  onClick={() =>
                    navigate(
                      metric.path,
                    )
                  }
                />
              ),
            )}
          </section>

          <OperationalStatus
            counts={counts}
          />

          <section className="dashboard-content-grid">
            <DashboardAlerts
              alerts={alerts}
            />

            <RecentActivity
              pedidos={data.pedidos}
              despachos={data.despachos}
            />
          </section>

          <section className="dashboard-bottom-grid">
            <section className="dashboard-panel dashboard-master">
              <header className="dashboard-section-header">
                <div>
                  <span>
                    Datos maestros
                  </span>

                  <h4>
                    Cobertura del sistema
                  </h4>
                </div>
              </header>

              <div className="dashboard-master-grid">
                {[
                  {
                    label:
                      'Clientes',
                    value:
                      data.clientes
                        .length,
                    icon:
                      'bi-people',
                  },
                  {
                    label:
                      'Ubicaciones',
                    value:
                      data.ubicaciones
                        .length,
                    icon:
                      'bi-geo-alt',
                  },
                  {
                    label:
                      'Rutas',
                    value:
                      data.rutas
                        .length,
                    icon:
                      'bi-signpost-split',
                  },
                  {
                    label:
                      'Camiones',
                    value:
                      data.camiones
                        .length,
                    icon:
                      'bi-truck-front',
                  },
                ].map((item) => (
                  <article
                    key={item.label}
                    className="dashboard-master-item"
                  >
                    <i className={`bi ${item.icon}`} />

                    <span>
                      {item.label}
                    </span>

                    <strong>
                      {item.value}
                    </strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-panel dashboard-quick-access">
              <header className="dashboard-section-header">
                <div>
                  <span>
                    Navegación
                  </span>

                  <h4>
                    Accesos rápidos
                  </h4>
                </div>
              </header>

              <div className="dashboard-quick-grid">
                {quickAccess.map(
                  (item) => (
                    <QuickAccessCard
                      key={item.title}
                      {...item}
                    />
                  ),
                )}
              </div>
            </section>
          </section>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
