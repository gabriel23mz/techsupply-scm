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
  PERMISSIONS,
  ROLES,
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
  ConfirmDialog,
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

import PedidoDetailDrawer from '../components/PedidoDetailDrawer';
import PedidosTable from '../components/PedidosTable';

import {
  cancelarPedido,
  obtenerPedidos,
} from '../services/pedido.service';

import {
  buildReturnPath,
  getOrderClient,
  getOrderUser,
  matchesOrderDate,
  normalizePage,
  normalizeText,
  ORDER_DATE_OPTIONS,
  ORDER_PAGE_SIZE,
  ORDER_STATUS_OPTIONS,
} from '../pedido.utils';

import '../pedidos.css';

function PedidosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { can, canAny, hasRole } = usePermissions();

  const canCreateOrders = can(PERMISSIONS.PEDIDOS_CREAR);
  const canCancelOrders = can(PERMISSIONS.PEDIDOS_CANCELAR);
  const canOpenWorkspace = canAny(
    PERMISSIONS.PEDIDOS_EDITAR,
    PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
  );
  const isAdmin = hasRole(ROLES.ADMIN);

  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const dateFilter = searchParams.get('fecha') ?? 'TODAS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);

  const updateQuery = useCallback(
    (updates, { replace = true } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const normalizedValue = String(value ?? '').trim();
        const shouldDelete =
          !normalizedValue ||
          (key === 'page' && normalizedValue === '1') ||
          (key === 'estado' && normalizedValue === 'TODOS') ||
          (key === 'fecha' && normalizedValue === 'TODAS');

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

        const pedidosResult = await obtenerPedidos();
        setPedidos(Array.isArray(pedidosResult) ? pedidosResult : []);

        if (notify) {
          showSuccess('Información de pedidos actualizada.');
        }
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message || 'No fue posible actualizar los pedidos.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarDatos);

  const openCreatePage = useCallback(() => {
    if (!canCreateOrders) return;

    const returnTo = encodeURIComponent(buildReturnPath(location));
    navigate(`/pedidos/nuevo?returnTo=${returnTo}`);
  }, [canCreateOrders, location, navigate]);

  const openWorkspace = useCallback(
    (pedido) => {
      if (!canOpenWorkspace || pedido?.estado !== 'PENDIENTE') return;

      const returnTo = encodeURIComponent(buildReturnPath(location));
      navigate(
        `/pedidos/${pedido.id}/workspace?returnTo=${returnTo}`,
      );
    },
    [canOpenWorkspace, location, navigate],
  );

  const pageActions = useMemo(
    () => (
      <>
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

        {canCreateOrders && (
          <Button
            className="topbar-page-action topbar-page-action--primary"
            size="sm"
            icon="bi bi-plus-lg"
            onClick={openCreatePage}
          >
            Nuevo pedido
          </Button>
        )}
      </>
    ),
    [canCreateOrders, cargarDatos, isLoading, openCreatePage],
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Pedidos',
      description: canCreateOrders
        ? 'Gestión comercial y seguimiento del ciclo de pedidos.'
        : 'Consulta de pedidos disponibles para la operación logística.',
      actions: pageActions,
    }),
    [canCreateOrders, pageActions],
  );

  usePageHeader(pageHeader);

  const filteredPedidos = useMemo(() => {
    const search = normalizeText(searchTerm);

    return pedidos.filter((pedido) => {
      const cliente = getOrderClient(pedido);
      const usuario = getOrderUser(pedido);

      const matchesSearch =
        !search ||
        [
          pedido.id,
          `PED-${String(pedido.id).padStart(5, '0')}`,
          cliente?.nombre,
          usuario?.nombre,
          usuario?.apellido,
        ].some((value) => normalizeText(value).includes(search));

      const matchesStatus =
        statusFilter === 'TODOS' || pedido.estado === statusFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesOrderDate(pedido.fecha, dateFilter)
      );
    });
  }, [dateFilter, pedidos, searchTerm, statusFilter]);

  const totalPages = Math.max(
    Math.ceil(filteredPedidos.length / ORDER_PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPedidos = useMemo(() => {
    const start = (safeCurrentPage - 1) * ORDER_PAGE_SIZE;
    return filteredPedidos.slice(start, start + ORDER_PAGE_SIZE);
  }, [filteredPedidos, safeCurrentPage]);

  const metrics = useMemo(
    () => [
      {
        label: 'Pedidos registrados',
        value: pedidos.length,
        helper: 'Dentro de tu alcance actual',
        icon: 'bi bi-receipt',
        tone: 'primary',
      },
      {
        label: 'Pendientes',
        value: pedidos.filter((pedido) => pedido.estado === 'PENDIENTE')
          .length,
        helper: 'Disponibles para edición comercial',
        icon: 'bi bi-clock-history',
        tone: 'warning',
      },
      {
        label: 'En preparación',
        value: pedidos.filter((pedido) => pedido.estado === 'PREPARANDO')
          .length,
        helper: 'Atendidos actualmente por Bodega',
        icon: 'bi bi-box-seam',
        tone: 'info',
      },
      {
        label: 'Listos para despacho',
        value: pedidos.filter(
          (pedido) => pedido.estado === 'LISTO_PARA_DESPACHO',
        ).length,
        helper: 'Disponibles para planificación logística',
        icon: 'bi bi-truck',
        tone: 'success',
      },
    ],
    [pedidos],
  );

  const clearFilters = () => {
    updateQuery({ q: '', estado: 'TODOS', fecha: 'TODAS', page: 1 });
  };

  const handleCancel = async () => {
    if (!canCancelOrders || !pendingCancel?.id) return;

    try {
      await cancelarPedido(pendingCancel.id);
      showSuccess('Pedido cancelado correctamente.');
      setPendingCancel(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      showError(error.message || 'No fue posible cancelar el pedido.');
    }
  };

  const hasFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'TODOS' ||
    dateFilter !== 'TODAS';

  return (
    <div className="orders-page">
      <section className="orders-metrics">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            {...metric}
            loading={isLoading}
          />
        ))}
      </section>

      <section className="orders-directory">
        <div className="orders-toolbar">
          <div className="orders-toolbar__filters">
            <SearchField
              value={searchTerm}
              placeholder="Buscar pedido, cliente o responsable"
              aria-label="Buscar pedidos"
              onChange={(event) =>
                updateQuery({ q: event.target.value, page: 1 })
              }
              onClear={() => updateQuery({ q: '', page: 1 })}
            />

            <SelectField
              value={statusFilter}
              options={ORDER_STATUS_OPTIONS}
              ariaLabel="Filtrar pedidos por estado"
              onChange={(value) =>
                updateQuery({ estado: value, page: 1 })
              }
            />

            <SelectField
              value={dateFilter}
              options={ORDER_DATE_OPTIONS}
              ariaLabel="Filtrar pedidos por fecha"
              onChange={(value) =>
                updateQuery({ fecha: value, page: 1 })
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

          <p className="orders-toolbar__summary">
            <strong>{filteredPedidos.length}</strong>{' '}
            {filteredPedidos.length === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>

        <div className="orders-directory__content">
          {loadError ? (
            <ErrorState
              actionLabel="Reintentar"
              onAction={() => cargarDatos()}
            >
              {loadError.message || 'No fue posible cargar los pedidos.'}
            </ErrorState>
          ) : isLoading ? (
            <LoadingState label="Cargando pedidos..." />
          ) : (
            <PedidosTable
              pedidos={paginatedPedidos}
              hasFilters={hasFilters}
              canCreateOrder={canCreateOrders}
              canOpenWorkspace={canOpenWorkspace}
              canCancelOrder={canCancelOrders}
              isAdmin={isAdmin}
              onView={setSelectedPedido}
              onOpenWorkspace={openWorkspace}
              onCancel={setPendingCancel}
              onClearFilters={clearFilters}
              onCreate={openCreatePage}
            />
          )}
        </div>

        {!loadError && !isLoading && filteredPedidos.length > 0 && (
          <Pagination
            page={safeCurrentPage}
            pageSize={ORDER_PAGE_SIZE}
            total={filteredPedidos.length}
            onPageChange={(page) => updateQuery({ page })}
          />
        )}
      </section>

      <PedidoDetailDrawer
        open={Boolean(selectedPedido)}
        pedido={selectedPedido}
        canOpenWorkspace={canOpenWorkspace}
        onOpenWorkspace={(pedido) => {
          setSelectedPedido(null);
          openWorkspace(pedido);
        }}
        onClose={() => setSelectedPedido(null)}
      />

      <ConfirmDialog
        open={canCancelOrders && Boolean(pendingCancel)}
        title="Cancelar pedido"
        message="El pedido será cancelado y el stock reservado por sus productos será restaurado cuando corresponda."
        confirmText="Cancelar pedido"
        cancelText="Volver"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}

export default PedidosPage;
