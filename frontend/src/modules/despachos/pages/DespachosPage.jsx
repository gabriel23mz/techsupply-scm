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
  Pagination,
} from '../../../shared/ui';
import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import DespachoDetailDrawer from '../components/DespachoDetailDrawer';
import DespachoMetrics from '../components/DespachoMetrics';
import DespachosTable from '../components/DespachosTable';
import DespachoToolbar from '../components/DespachoToolbar';
import {
  obtenerDespachoPorId,
  obtenerDespachos,
} from '../services/despacho.service';

import '../despachos.css';

const PAGE_SIZE = 10;

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function matchesDate(value, filter) {
  if (filter === 'TODAS') return true;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (filter === 'HOY') {
    return date >= startToday &&
      date < new Date(startToday.getTime() + 86400000);
  }

  if (filter === 'SEMANA') {
    const startWeek = new Date(startToday);
    startWeek.setDate(startToday.getDate() - startToday.getDay());

    return date >= startWeek;
  }

  if (filter === 'MES') {
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth();
  }

  return true;
}

function DespachosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const dateFilter = searchParams.get('fecha') ?? 'TODAS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [despachos, setDespachos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [drawerType, setDrawerType] = useState('summary');
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const updateQuery = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const normalized = String(value ?? '').trim();
      const shouldDelete = !normalized ||
        (key === 'page' && normalized === '1') ||
        (key === 'estado' && normalized === 'TODOS') ||
        (key === 'fecha' && normalized === 'TODAS');

      if (shouldDelete) next.delete(key);
      else next.set(key, normalized);
    });

    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadDispatches = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setDespachos(await obtenerDespachos());

      if (notify) showSuccess('Despachos actualizados correctamente.');
    } catch (error) {
      console.error('Error al cargar despachos:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar los despachos.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useInitialLoad(loadDispatches);

  const pageActions = useMemo(() => (
    <Button
      className="topbar-page-action topbar-page-action--refresh"
      size="sm"
      tone="secondary"
      icon="bi bi-arrow-clockwise"
      loading={isLoading}
      loadingLabel="Actualizando"
      onClick={() => loadDispatches({ notify: true })}
    >
      Actualizar
    </Button>
  ), [isLoading, loadDispatches]);

  usePageHeader(useMemo(() => ({
    title: 'Despachos',
    description: 'Seguimiento administrativo de entregas, recorridos y novedades.',
    actions: pageActions,
  }), [pageActions]));

  const filteredDispatches = useMemo(() => {
    const search = normalizeText(searchTerm);

    return despachos.filter((despacho) => {
      const pedido = despacho?.pedido ?? null;
      const cliente = pedido?.cliente ?? null;
      const jornada = despacho?.jornada ?? null;
      const matchesSearch = !search || [
        despacho.id,
        despacho.pedido_id,
        `DSP-${String(despacho.id).padStart(5, '0')}`,
        `PED-${String(despacho.pedido_id).padStart(5, '0')}`,
        cliente?.nombre,
        cliente?.identificacion,
        jornada?.id,
        jornada?.codigo,
        despacho?.ruta_resumen?.destino,
      ].some((value) => normalizeText(value).includes(search));
      const matchesStatus =
        statusFilter === 'TODOS' || despacho.estado === statusFilter;
      const matchesDateFilter = matchesDate(
        despacho.created_at ?? despacho.createdAt,
        dateFilter,
      );

      return matchesSearch && matchesStatus && matchesDateFilter;
    });
  }, [dateFilter, despachos, searchTerm, statusFilter]);

  const totalPages = Math.max(
    Math.ceil(filteredDispatches.length / PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDispatches = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredDispatches.slice(start, start + PAGE_SIZE);
  }, [filteredDispatches, safeCurrentPage]);

  const hasFilters = Boolean(searchTerm.trim()) ||
    statusFilter !== 'TODOS' ||
    dateFilter !== 'TODAS';

  const openDrawer = async (despacho, type) => {
    setDrawerType(type);
    setSelectedDespacho(despacho);
    setIsDetailLoading(true);

    try {
      setSelectedDespacho(await obtenerDespachoPorId(despacho.id) ?? despacho);
    } catch (error) {
      showError(error.message || 'No fue posible cargar el detalle completo.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openJourney = (jornada) => {
    if (!jornada?.id) return;

    navigate(`/jornadas/${jornada.id}`, {
      state: {
        from: `${location.pathname}${location.search}`,
      },
    });
  };

  return (
    <div className="dispatch-page">
      <DespachoMetrics
        despachos={despachos}
        loading={isLoading && despachos.length === 0}
      />

      <section className="dispatch-directory" aria-label="Directorio de despachos">
        <div className="dispatch-directory__toolbar">
          <DespachoToolbar
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            dateFilter={dateFilter}
            hasFilters={hasFilters}
            onSearchChange={(value) => updateQuery({ q: value, page: 1 })}
            onStatusChange={(value) => updateQuery({ estado: value, page: 1 })}
            onDateChange={(value) => updateQuery({ fecha: value, page: 1 })}
            onClear={() => updateQuery({
              q: '',
              estado: 'TODOS',
              fecha: 'TODAS',
              page: 1,
            })}
            resultCount={filteredDispatches.length}
          />
        </div>

        <div className="dispatch-directory__content">
          <DespachosTable
            despachos={paginatedDispatches}
            error={loadError}
            hasFilters={hasFilters}
            loading={isLoading && despachos.length === 0}
            onRetry={loadDispatches}
            onOpenSummary={(despacho) => openDrawer(despacho, 'summary')}
            onOpenRoute={(despacho) => openDrawer(despacho, 'route')}
            onOpenJourney={openJourney}
          />
        </div>

        {!isLoading && filteredDispatches.length > 0 && (
          <Pagination
            page={safeCurrentPage}
            pageSize={PAGE_SIZE}
            total={filteredDispatches.length}
            onPageChange={(page) => updateQuery({ page })}
          />
        )}
      </section>

      <DespachoDetailDrawer
        open={Boolean(selectedDespacho)}
        despacho={selectedDespacho}
        type={drawerType}
        isLoading={isDetailLoading}
        onClose={() => setSelectedDespacho(null)}
        onOpenJourney={openJourney}
      />
    </div>
  );
}

export default DespachosPage;
