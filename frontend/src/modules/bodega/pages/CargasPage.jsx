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

import LoadDetailDrawer from '../components/LoadDetailDrawer';
import LoadTable from '../components/LoadTable';

import {
  obtenerJornadasCarga,
} from '../services/bodega.service';

import {
  getLoadProgress,
  getWarehouseDispatchClient,
  getWarehouseDispatches,
  getWarehouseDispatchLocation,
  LOAD_STATUS_OPTIONS,
  matchesLoadStatus,
  normalizeWarehousePage,
  normalizeWarehouseText,
  WAREHOUSE_LOAD_PAGE_SIZE,
} from '../bodega.utils';

import '../bodega.css';

function CargasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const currentPage = normalizeWarehousePage(searchParams.get('page'));

  const [jornadas, setJornadas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);

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

        const result = await obtenerJornadasCarga();
        setJornadas(Array.isArray(result) ? result : []);

        if (notify) {
          showSuccess('Jornadas de carga actualizadas.');
        }
      } catch (error) {
        console.error('Error al cargar jornadas de Bodega:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message ||
              'No fue posible actualizar las jornadas para carga.',
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
      title: 'Carga de camiones',
      description:
        'Registro y confirmación de despachos asignados a jornadas planificadas.',
      actions: pageActions,
    }),
    [pageActions],
  );

  usePageHeader(pageHeader);

  const filteredJourneys = useMemo(() => {
    const search = normalizeWarehouseText(searchTerm);

    return jornadas.filter((journey) => {
      const dispatches = getWarehouseDispatches(journey);
      const matchesSearch =
        !search ||
        [
          journey.id,
          journey?.camion?.codigo,
          journey?.camion?.placa,
          journey?.camion?.descripcion,
          ...dispatches.flatMap((dispatch) => {
            const client = getWarehouseDispatchClient(dispatch);
            const destination = getWarehouseDispatchLocation(dispatch);

            return [
              dispatch.id,
              dispatch?.pedido?.id,
              client?.nombre,
              client?.identificacion,
              destination?.nombre,
            ];
          }),
        ].some((value) =>
          normalizeWarehouseText(value).includes(search),
        );

      return matchesSearch && matchesLoadStatus(journey, statusFilter);
    });
  }, [jornadas, searchTerm, statusFilter]);

  const totalPages = Math.max(
    Math.ceil(filteredJourneys.length / WAREHOUSE_LOAD_PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedJourneys = useMemo(() => {
    const start = (safeCurrentPage - 1) * WAREHOUSE_LOAD_PAGE_SIZE;

    return filteredJourneys.slice(
      start,
      start + WAREHOUSE_LOAD_PAGE_SIZE,
    );
  }, [filteredJourneys, safeCurrentPage]);

  const metrics = useMemo(() => {
    const progressList = jornadas.map(getLoadProgress);
    const totalDispatches = progressList.reduce(
      (total, progress) => total + progress.total,
      0,
    );
    const loadedDispatches = progressList.reduce(
      (total, progress) => total + progress.loaded,
      0,
    );
    const percentage = totalDispatches > 0
      ? Math.round((loadedDispatches / totalDispatches) * 100)
      : 0;

    return [
      {
        label: 'Jornadas para carga',
        value: jornadas.length,
        helper: 'Jornadas planificadas por Logística',
        icon: 'bi bi-truck-flatbed',
        tone: 'primary',
      },
      {
        label: 'Carga confirmada',
        value: progressList.filter((progress) => progress.confirmed).length,
        helper: 'Jornadas listas para iniciar',
        icon: 'bi bi-check2-circle',
        tone: 'success',
      },
      {
        label: 'Despachos pendientes',
        value: progressList.reduce(
          (total, progress) => total + progress.pending,
          0,
        ),
        helper: 'Pedidos todavía por cargar',
        icon: 'bi bi-hourglass-split',
        tone: 'warning',
      },
      {
        label: 'Progreso general',
        value: `${percentage}%`,
        helper: `${loadedDispatches} de ${totalDispatches} despachos`,
        icon: 'bi bi-bar-chart-line',
        tone: 'info',
      },
    ];
  }, [jornadas]);

  const hasFilters =
    Boolean(searchTerm.trim()) || statusFilter !== 'TODOS';

  const clearFilters = () => {
    updateQuery({ q: '', estado: 'TODOS', page: 1 });
  };

  const openWorkspace = (journey) => {
    navigate(`/bodega/cargas/${journey.id}`, {
      state: {
        returnTo: `${location.pathname}${location.search}`,
      },
    });
  };

  return (
    <div className="warehouse-load-page">
      <section className="warehouse-load-metrics">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            {...metric}
            loading={isLoading}
          />
        ))}
      </section>

      <section className="warehouse-load-directory">
        <div className="warehouse-load-toolbar">
          <div className="warehouse-load-toolbar__filters">
            <SearchField
              value={searchTerm}
              placeholder="Buscar jornada, camión, cliente o destino"
              aria-label="Buscar jornadas para carga"
              onChange={(event) =>
                updateQuery({ q: event.target.value, page: 1 })
              }
              onClear={() => updateQuery({ q: '', page: 1 })}
            />

            <SelectField
              value={statusFilter}
              options={LOAD_STATUS_OPTIONS}
              ariaLabel="Filtrar por avance de carga"
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

          <p className="warehouse-load-toolbar__summary">
            <strong>{filteredJourneys.length}</strong>{' '}
            {filteredJourneys.length === 1 ? 'jornada' : 'jornadas'}
          </p>
        </div>

        <div className="warehouse-load-directory__content">
          {loadError ? (
            <ErrorState
              actionLabel="Reintentar"
              onAction={() => cargarDatos()}
            >
              {loadError.message ||
                'No fue posible cargar las jornadas de Bodega.'}
            </ErrorState>
          ) : isLoading ? (
            <LoadingState label="Cargando jornadas para carga..." />
          ) : (
            <LoadTable
              jornadas={paginatedJourneys}
              hasFilters={hasFilters}
              onView={setSelectedJourney}
              onLoad={openWorkspace}
              onClearFilters={clearFilters}
            />
          )}
        </div>

        {!loadError && !isLoading && filteredJourneys.length > 0 && (
          <Pagination
            page={safeCurrentPage}
            pageSize={WAREHOUSE_LOAD_PAGE_SIZE}
            total={filteredJourneys.length}
            onPageChange={(page) => updateQuery({ page })}
          />
        )}
      </section>

      <LoadDetailDrawer
        open={Boolean(selectedJourney)}
        jornada={selectedJourney}
        onLoad={openWorkspace}
        onClose={() => setSelectedJourney(null)}
      />
    </div>
  );
}

export default CargasPage;
