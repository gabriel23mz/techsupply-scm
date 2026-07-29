import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';
import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';
import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';
import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';
import {
  Button,
  Combobox,
  ConfirmDialog,
  ErrorState,
  Pagination,
  SearchField,
  Tabs,
} from '../../../shared/ui';
import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import JornadasMapaPanel from '../components/mapa/JornadasMapaPanel';
import MapaGeneralJornadas from '../components/mapa/MapaGeneralJornadas';
import GeneracionLoadingModal from '../components/GeneracionLoadingModal';
import JornadasTable from '../components/JornadasTable';
import LogisticsMetrics from '../components/LogisticsMetrics';
import PedidosDisponiblesTable from '../components/PedidosDisponiblesTable';
import ResultadoGeneracionModal from '../components/ResultadoGeneracionModal';
import {
  generarJornadas,
  obtenerJornadas,
  obtenerMapaGeneral,
  obtenerPedidosDisponibles,
  recalcularJornada,
} from '../services/logistica.service';

import '../jornadas-mapa.css';
import '../logistica.css';

const PAGE_SIZE = 10;
const VALID_TABS = ['planificacion', 'listado', 'mapa'];

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function getGenerationErrorMessage(error) {
  const status = Number(error?.status);

  if (Number.isFinite(status) && status >= 500) {
    return 'No fue posible completar la planificación logística. Revisa el servicio de generación e inténtalo nuevamente.';
  }

  return error?.message || 'No fue posible generar las jornadas.';
}
function normalizeMapJourneys(value) {
  const jornadas = Array.isArray(value)
    ? value
    : Array.isArray(value?.jornadas)
      ? value.jornadas
      : Array.isArray(value?.data)
        ? value.data
        : [];

  const bodega = value?.bodega ?? value?.centro ?? null;

  if (!bodega) return jornadas;

  return jornadas.map((jornada) => ({
    ...jornada,
    bodega: jornada?.bodega ?? bodega,
    mapa: {
      ...(jornada?.mapa ?? {}),
      bodega: jornada?.mapa?.bodega ?? bodega,
    },
  }));
}

function JornadasPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canGenerate = can(PERMISSIONS.JORNADAS_GENERAR);
  const canRecalculate = can(PERMISSIONS.JORNADAS_RECALCULAR);
  const canViewMap = can(PERMISSIONS.JORNADAS_MAPA_GENERAL);
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = canGenerate ? 'planificacion' : 'listado';
  const requestedTab = searchParams.get('tab') ?? defaultTab;
  const activeTab = VALID_TABS.includes(requestedTab) &&
    (requestedTab !== 'mapa' || canViewMap)
    ? requestedTab
    : defaultTab;
  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [pedidos, setPedidos] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [mapJourneys, setMapJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshingAfterGeneration, setIsRefreshingAfterGeneration] = useState(false);
  const [recalculatingId, setRecalculatingId] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [pendingRecalculation, setPendingRecalculation] = useState(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState(null);
  const [mapFocusRequest, setMapFocusRequest] = useState(0);

  const updateQuery = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const normalized = String(value ?? '').trim();
      const shouldDelete = !normalized ||
        (key === 'tab' && normalized === defaultTab) ||
        (key === 'estado' && normalized === 'TODOS') ||
        (key === 'page' && normalized === '1');

      if (shouldDelete) next.delete(key);
      else next.set(key, normalized);
    });

    setSearchParams(next, { replace: true });
  }, [defaultTab, searchParams, setSearchParams]);

  const loadData = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [ordersResult, journeysResult, mapResult] = await Promise.allSettled([
        canGenerate ? obtenerPedidosDisponibles() : Promise.resolve([]),
        obtenerJornadas(),
        canViewMap ? obtenerMapaGeneral() : Promise.resolve([]),
      ]);

      if (ordersResult.status === 'fulfilled') {
        setPedidos(Array.isArray(ordersResult.value) ? ordersResult.value : []);
      }

      if (journeysResult.status === 'fulfilled') {
        setJornadas(Array.isArray(journeysResult.value) ? journeysResult.value : []);
      }

      if (mapResult.status === 'fulfilled') {
        setMapJourneys(normalizeMapJourneys(mapResult.value));
      }

      const rejected = [ordersResult, journeysResult, mapResult]
        .filter((result) => result.status === 'rejected');

      if (rejected.length) {
        throw rejected[0].reason;
      }

      if (notify) showSuccess('Información de jornadas actualizada.');
    } catch (error) {
      console.error('Error al cargar jornadas:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar las jornadas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [canGenerate, canViewMap]);

  useInitialLoad(loadData);

  const refreshAfterGeneration = useCallback(async () => {
    try {
      setIsRefreshingAfterGeneration(true);

      const [ordersData, journeysData, mapData] = await Promise.all([
        obtenerPedidosDisponibles(),
        obtenerJornadas(),
        canViewMap ? obtenerMapaGeneral() : Promise.resolve([]),
      ]);

      setPedidos(Array.isArray(ordersData) ? ordersData : []);
      setJornadas(Array.isArray(journeysData) ? journeysData : []);
      setMapJourneys(normalizeMapJourneys(mapData));
    } catch (error) {
      console.error('Error al refrescar la planificación:', error);
      showError(
        'Las jornadas se generaron, pero no fue posible actualizar todos los listados.',
      );
    } finally {
      setIsRefreshingAfterGeneration(false);
    }
  }, [canViewMap]);

  const requestGenerate = useCallback(() => {
    if (canGenerate && pedidos.length > 0 && !isGenerating) {
      setShowGenerateConfirm(true);
    }
  }, [canGenerate, isGenerating, pedidos.length]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    try {
      setShowGenerateConfirm(false);
      setGenerationResult(null);
      setIsGenerating(true);

      const result = await generarJornadas();

      setIsGenerating(false);
      setGenerationResult(result);
      showSuccess('Jornadas generadas correctamente.');
      void refreshAfterGeneration();
    } catch (error) {
      console.error('Error al generar jornadas:', error);
      setIsGenerating(false);
      showError(getGenerationErrorMessage(error));
    }
  };

  const handleRecalculate = async () => {
    const jornada = pendingRecalculation;

    if (!canRecalculate || !jornada?.id) return;

    try {
      setPendingRecalculation(null);
      setRecalculatingId(jornada.id);
      await recalcularJornada(jornada.id);
      showSuccess(`${jornada.codigo ?? `JR-${jornada.id}`} fue recalculada.`);
      await loadData();
    } catch (error) {
      showError(error.message || 'No fue posible recalcular la jornada.');
    } finally {
      setRecalculatingId(null);
    }
  };

  const pageActions = useMemo(() => (
    <>
      <Button
        className="topbar-page-action topbar-page-action--refresh"
        size="sm"
        tone="secondary"
        icon="bi bi-arrow-clockwise"
        loading={isLoading || isRefreshingAfterGeneration}
        loadingLabel="Actualizando"
        onClick={() => loadData({ notify: true })}
      >
        Actualizar
      </Button>
      {canGenerate && activeTab === 'planificacion' && (
        <Button
          className="topbar-page-action topbar-page-action--primary"
          size="sm"
          icon="bi bi-stars"
          disabled={pedidos.length === 0 || isGenerating}
          onClick={requestGenerate}
        >
          Generar jornadas
        </Button>
      )}
    </>
  ), [
    activeTab,
    canGenerate,
    isGenerating,
    isLoading,
    isRefreshingAfterGeneration,
    loadData,
    pedidos.length,
    requestGenerate,
  ]);

  usePageHeader(useMemo(() => ({
    title: 'Jornadas',
    description: 'Planificación, seguimiento y mapa operativo de reparto.',
    actions: pageActions,
  }), [pageActions]));

  const filteredOrders = useMemo(() => {
    const search = normalizeText(searchTerm);

    if (!search) return pedidos;

    return pedidos.filter((pedido) => [
      pedido.id,
      pedido.cliente?.nombre,
      pedido.cliente?.identificacion,
      pedido.cliente?.direccion,
      pedido.cliente?.ubicacion?.nombre,
    ].some((value) => normalizeText(value).includes(search)));
  }, [pedidos, searchTerm]);

  const filteredJourneys = useMemo(() => {
    const search = normalizeText(searchTerm);

    return jornadas.filter((jornada) => {
      const matchesSearch = !search || [
        jornada.id,
        jornada.codigo,
        jornada.camion?.codigo,
        jornada.camion?.placa,
        jornada.chofer?.usuario?.nombre,
        jornada.chofer?.usuario?.apellido,
        jornada.estado,
      ].some((value) => normalizeText(value).includes(search));
      const matchesStatus =
        statusFilter === 'TODOS' || jornada.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jornadas, searchTerm, statusFilter]);

  const visibleRows = activeTab === 'listado' ? filteredJourneys : filteredOrders;
  const hasDirectoryFilters = Boolean(searchTerm.trim()) ||
    statusFilter !== 'TODOS';
  const totalPages = Math.max(Math.ceil(visibleRows.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return visibleRows.slice(start, start + PAGE_SIZE);
  }, [safeCurrentPage, visibleRows]);

  const mapSelection = useMemo(() => {
    if (!selectedJourneyId || !mapJourneys.length) return null;

    return mapJourneys.find(
      (jornada) => Number(jornada.id) === Number(selectedJourneyId),
    )?.id ?? null;
  }, [mapJourneys, selectedJourneyId]);

  const changeTab = (tab) => {
    updateQuery({ tab, q: '', estado: 'TODOS', page: 1 });
  };

  const openJourney = (jornada) => {
    navigate(`/jornadas/${jornada.id}`, {
      state: { from: `/jornadas?tab=${activeTab}` },
    });
  };

  return (
    <div className="journeys-page">
      <Tabs
        className="journeys-tabs"
        activeId={activeTab}
        ariaLabel="Vistas de jornadas"
        onChange={changeTab}
        tabs={[
          {
            id: 'planificacion',
            label: 'Planificación',
            icon: 'bi bi-stars',
            count: pedidos.length,
          },
          {
            id: 'listado',
            label: 'Jornadas registradas',
            icon: 'bi bi-list-check',
            count: jornadas.length,
          },
          ...(canViewMap ? [{
            id: 'mapa',
            label: 'Mapa operativo',
            icon: 'bi bi-map',
            count: mapJourneys.length,
          }] : []),
        ]}
      />

      <LogisticsMetrics
        jornadas={jornadas}
        pedidosDisponibles={pedidos}
        loading={isLoading && jornadas.length === 0 && pedidos.length === 0}
      />

      {activeTab !== 'mapa' && (
        <section className="journeys-directory">
          <div className="journeys-toolbar">
            <div
              className={`journeys-toolbar__filters journeys-toolbar__filters--${activeTab}`}
            >
              <SearchField
                className="journeys-toolbar__search"
                value={searchTerm}
                placeholder={activeTab === 'listado'
                  ? 'Buscar jornada, camión o chofer'
                  : 'Buscar pedido, cliente o destino'}
                aria-label="Buscar información logística"
                onChange={(event) => updateQuery({ q: event.target.value, page: 1 })}
                onClear={() => updateQuery({ q: '', page: 1 })}
              />
              {activeTab === 'listado' && (
                <Combobox
                  className="journeys-toolbar__status"
                  value={statusFilter}
                  options={[
                    { value: 'TODOS', label: 'Todos los estados' },
                    { value: 'PLANIFICADA', label: 'Planificada' },
                    { value: 'EN_RUTA', label: 'En ruta' },
                    { value: 'FINALIZADA', label: 'Finalizada' },
                    { value: 'CANCELADA', label: 'Cancelada' },
                  ]}
                  searchable={false}
                  ariaLabel="Filtrar jornadas por estado"
                  onChange={(value) => updateQuery({ estado: value, page: 1 })}
                />
              )}
            </div>

            <div className="journeys-toolbar__meta">
              {hasDirectoryFilters && (
                <Button
                  className="journeys-toolbar__clear"
                  size="sm"
                  tone="secondary"
                  icon="bi bi-eraser"
                  onClick={() => updateQuery({ q: '', estado: 'TODOS', page: 1 })}
                >
                  Limpiar
                </Button>
              )}

              <p className="journeys-toolbar__summary">
                <strong>{visibleRows.length}</strong>{' '}
                {activeTab === 'listado'
                  ? visibleRows.length === 1 ? 'jornada' : 'jornadas'
                  : visibleRows.length === 1 ? 'pedido listo' : 'pedidos listos'}
              </p>
            </div>
          </div>

          <div className="journeys-directory__content">
            {activeTab === 'listado' ? (
              <JornadasTable
                jornadas={paginatedRows}
                canRecalculate={canRecalculate}
                loading={isLoading && jornadas.length === 0}
                error={loadError}
                onRetry={loadData}
                onView={openJourney}
                onRecalculate={setPendingRecalculation}
                recalculatingId={recalculatingId}
              />
            ) : (
              <PedidosDisponiblesTable
                pedidos={paginatedRows}
                loading={isLoading && pedidos.length === 0}
                error={loadError}
                onRetry={loadData}
              />
            )}
          </div>

          {!isLoading && visibleRows.length > 0 && (
            <Pagination
              page={safeCurrentPage}
              pageSize={PAGE_SIZE}
              total={visibleRows.length}
              onPageChange={(page) => updateQuery({ page })}
            />
          )}
        </section>
      )}

      {activeTab === 'mapa' && canViewMap && (
        loadError && mapJourneys.length === 0 ? (
          <ErrorState actionLabel="Reintentar" onAction={loadData}>
            {loadError.message || 'No fue posible cargar el mapa operativo.'}
          </ErrorState>
        ) : (
          <section className="journeys-map-workspace">
            <JornadasMapaPanel
              jornadas={mapJourneys}
              selectedJourneyId={mapSelection}
              isRefreshing={isLoading}
              onRefresh={() => loadData({ notify: true })}
              onSelectJourney={(jornada) => {
                setSelectedJourneyId(jornada.id);
                setMapFocusRequest((current) => current + 1);
              }}
              onViewJourney={openJourney}
            />
            <MapaGeneralJornadas
              jornadas={mapJourneys}
              selectedJourneyId={mapSelection}
              focusRequest={mapFocusRequest}
              onShowAll={() => {
                setSelectedJourneyId(null);
                setMapFocusRequest((current) => current + 1);
              }}
              onSelectJourney={(jornada) => {
                setSelectedJourneyId(jornada.id);
                setMapFocusRequest((current) => current + 1);
              }}
            />
          </section>
        )
      )}

      <ConfirmDialog
        open={showGenerateConfirm && canGenerate}
        title="Generar jornadas"
        message={`Se planificarán automáticamente ${pedidos.length} pedido${pedidos.length === 1 ? '' : 's'} según capacidad y rutas disponibles.`}
        confirmText="Generar"
        cancelText="Volver"
        variant="info"
        onConfirm={handleGenerate}
        onCancel={() => setShowGenerateConfirm(false)}
      />

      <ConfirmDialog
        open={Boolean(pendingRecalculation) && canRecalculate}
        title="Recalcular jornada"
        message="La ruta y los tiempos de la jornada planificada se calcularán nuevamente."
        confirmText="Recalcular"
        cancelText="Volver"
        variant="warning"
        onConfirm={handleRecalculate}
        onCancel={() => setPendingRecalculation(null)}
      />

      {isGenerating && (
        <GeneracionLoadingModal key="active-generation" />
      )}

      <ResultadoGeneracionModal
        open={Boolean(generationResult)}
        resultado={generationResult}
        onClose={() => setGenerationResult(null)}
        onViewJourneys={() => {
          setGenerationResult(null);
          updateQuery({ tab: 'listado', q: '', estado: 'TODOS', page: 1 });
        }}
      />
    </div>
  );
}

export default JornadasPage;
