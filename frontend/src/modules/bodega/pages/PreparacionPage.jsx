import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';

import {
  Button,
  ErrorState,
  LoadingState,
  Pagination,
  SearchField,
  SelectField,
  StatCard,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import PreparationDetailDrawer from '../components/PreparationDetailDrawer';
import PreparationTable from '../components/PreparationTable';

import {
  obtenerPedidosPreparacion,
} from '../services/bodega.service';

import {
  getPreparationProgress,
  getWarehouseClient,
  getWarehouseDetails,
  matchesPreparationStatus,
  normalizeWarehousePage,
  normalizeWarehouseText,
  PREPARATION_STATUS_OPTIONS,
  WAREHOUSE_PREPARATION_PAGE_SIZE,
} from '../bodega.utils';

import '../bodega.css';

function PreparacionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const currentPage = normalizeWarehousePage(searchParams.get('page'));

  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);

  const updateQuery = useCallback(
    (updates, { replace = true } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const normalizedValue = String(value ?? '').trim();
        const shouldDelete =
          !normalizedValue ||
          (key === 'page' && normalizedValue === '1') ||
          (key === 'estado' && normalizedValue === 'TODOS');

        if (shouldDelete) nextParams.delete(key);
        else nextParams.set(key, normalizedValue);
      });

      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams],
  );

  const cargarDatos = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const result = await obtenerPedidosPreparacion();
        setPedidos(Array.isArray(result) ? result : []);

        if (notify) {
          showSuccess('Pedidos de Bodega actualizados.');
        }
      } catch (error) {
        console.error('Error al cargar preparación de Bodega:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message ||
              'No fue posible actualizar los pedidos en preparación.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarDatos);

  const pageActions = useMemo(
    () => (
      <Button
        className="topbar-page-action topbar-page-action--refresh"
        size="sm"
        tone="secondary"
        icon="bi bi-arrow-clockwise"
        loading={isLoading}
        loadingLabel="Actualizando"
        onClick={() => cargarDatos({ notify: true })}
      >
        Actualizar
      </Button>
    ),
    [cargarDatos, isLoading],
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Preparación',
      description:
        'Control físico de productos antes de liberar pedidos a Logística.',
      actions: pageActions,
    }),
    [pageActions],
  );

  usePageHeader(pageHeader);

  const filteredPedidos = useMemo(() => {
    const search = normalizeWarehouseText(searchTerm);

    return pedidos.filter((pedido) => {
      const client = getWarehouseClient(pedido);
      const details = getWarehouseDetails(pedido);
      const matchesSearch =
        !search ||
        [
          pedido.id,
          client?.nombre,
          client?.identificacion,
          client?.ubicacion?.nombre,
          ...details.map((detail) => detail?.producto?.nombre),
        ].some((value) =>
          normalizeWarehouseText(value).includes(search),
        );

      return (
        matchesSearch &&
        matchesPreparationStatus(pedido, statusFilter)
      );
    });
  }, [pedidos, searchTerm, statusFilter]);

  const totalPages = Math.max(
    Math.ceil(
      filteredPedidos.length / WAREHOUSE_PREPARATION_PAGE_SIZE,
    ),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPedidos = useMemo(() => {
    const start =
      (safeCurrentPage - 1) * WAREHOUSE_PREPARATION_PAGE_SIZE;

    return filteredPedidos.slice(
      start,
      start + WAREHOUSE_PREPARATION_PAGE_SIZE,
    );
  }, [filteredPedidos, safeCurrentPage]);

  const metrics = useMemo(() => {
    const progressList = pedidos.map(getPreparationProgress);
    const requested = progressList.reduce(
      (total, progress) => total + progress.requested,
      0,
    );
    const prepared = progressList.reduce(
      (total, progress) => total + progress.prepared,
      0,
    );
    const percentage = requested > 0
      ? Math.round((prepared / requested) * 100)
      : 0;

    return [
      {
        label: 'Pedidos en preparación',
        value: pedidos.length,
        helper: 'Pedidos recibidos desde Ventas',
        icon: 'bi bi-box-seam',
        tone: 'primary',
      },
      {
        label: 'Preparación completa',
        value: progressList.filter((progress) => progress.complete).length,
        helper: 'Pedidos listos para finalizar',
        icon: 'bi bi-check2-circle',
        tone: 'success',
      },
      {
        label: 'Unidades pendientes',
        value: progressList.reduce(
          (total, progress) => total + progress.pending,
          0,
        ),
        helper: 'Productos todavía por preparar',
        icon: 'bi bi-hourglass-split',
        tone: 'warning',
      },
      {
        label: 'Progreso general',
        value: `${percentage}%`,
        helper: `${prepared} de ${requested} unidades`,
        icon: 'bi bi-bar-chart-line',
        tone: 'info',
      },
    ];
  }, [pedidos]);

  const hasFilters =
    Boolean(searchTerm.trim()) || statusFilter !== 'TODOS';

  const clearFilters = () => {
    updateQuery({ q: '', estado: 'TODOS', page: 1 });
  };

  const openWorkspace = (pedido) => {
    navigate(`/bodega/preparacion/${pedido.id}`, {
      state: {
        returnTo: `${location.pathname}${location.search}`,
      },
    });
  };

  return (
    <div className="warehouse-preparation-page">
      <section className="warehouse-preparation-metrics">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            {...metric}
            loading={isLoading}
          />
        ))}
      </section>

      <section className="warehouse-preparation-directory">
        <div className="warehouse-preparation-toolbar">
          <div className="warehouse-preparation-toolbar__filters">
            <SearchField
              value={searchTerm}
              placeholder="Buscar pedido, cliente, ubicación o producto"
              aria-label="Buscar pedidos en preparación"
              onChange={(event) =>
                updateQuery({ q: event.target.value, page: 1 })
              }
              onClear={() => updateQuery({ q: '', page: 1 })}
            />

            <SelectField
              value={statusFilter}
              options={PREPARATION_STATUS_OPTIONS}
              ariaLabel="Filtrar por avance de preparación"
              onChange={(value) =>
                updateQuery({ estado: value, page: 1 })
              }
            />

            {hasFilters && (
              <Button
                size="sm"
                tone="secondary"
                icon="bi bi-eraser"
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            )}
          </div>

          <p className="warehouse-preparation-toolbar__summary">
            <strong>{filteredPedidos.length}</strong>{' '}
            {filteredPedidos.length === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>

        <div className="warehouse-preparation-directory__content">
          {loadError ? (
            <ErrorState
              actionLabel="Reintentar"
              onAction={() => cargarDatos()}
            >
              {loadError.message ||
                'No fue posible cargar la preparación de Bodega.'}
            </ErrorState>
          ) : isLoading ? (
            <LoadingState label="Cargando pedidos en preparación..." />
          ) : (
            <PreparationTable
              pedidos={paginatedPedidos}
              hasFilters={hasFilters}
              onView={setSelectedPedido}
              onPrepare={openWorkspace}
              onClearFilters={clearFilters}
            />
          )}
        </div>

        {!loadError && !isLoading && filteredPedidos.length > 0 && (
          <Pagination
            page={safeCurrentPage}
            pageSize={WAREHOUSE_PREPARATION_PAGE_SIZE}
            total={filteredPedidos.length}
            onPageChange={(page) => updateQuery({ page })}
          />
        )}
      </section>

      <PreparationDetailDrawer
        open={Boolean(selectedPedido)}
        pedido={selectedPedido}
        onPrepare={openWorkspace}
        onClose={() => setSelectedPedido(null)}
      />
    </div>
  );
}

export default PreparacionPage;
