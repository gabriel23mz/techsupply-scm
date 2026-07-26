import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  useNavigate,
} from 'react-router-dom';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  useAuth,
} from '../../../shared/hooks/useAuth';

import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import PedidoEditModal from '../components/PedidoEditModal';
import PedidoFlowCard from '../components/PedidoFlowCard';
import PedidoMetricCard from '../components/PedidoMetricCard';
import PedidosPagination from '../components/PedidosPagination';
import PedidosTable from '../components/PedidosTable';
import PedidosToolbar from '../components/PedidosToolbar';

import {
  actualizarPedido,
  cancelarPedido,
  obtenerClientes,
  obtenerPedidos,
  obtenerUsuarios,
} from '../services/pedido.service';

import '../pedidos.css';

const PAGE_SIZE = 10;

function getCliente(pedido) {
  return (
    pedido?.cliente ??
    null
  );
}

function getUsuario(pedido) {
  return (
    pedido?.usuario ??
    null
  );
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isDateMatch(
  value,
  filter,
) {
  if (
    filter === 'TODAS'
  ) {
    return true;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false;
  }

  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (filter === 'HOY') {
    return (
      date >= startToday &&
      date <
        new Date(
          startToday.getTime() +
            86400000,
        )
    );
  }

  if (filter === 'SEMANA') {
    const startWeek =
      new Date(startToday);

    startWeek.setDate(
      startToday.getDate() -
        startToday.getDay(),
    );

    return date >= startWeek;
  }

  if (filter === 'MES') {
    return (
      date.getFullYear() ===
        today.getFullYear() &&
      date.getMonth() ===
        today.getMonth()
    );
  }

  return true;
}

function PedidosPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();

  const {
    can,
    canAny,
  } = usePermissions();

  const canCreateOrders = can(
    PERMISSIONS.PEDIDOS_CREAR,
  );

  const canEditOrders = can(
    PERMISSIONS.PEDIDOS_EDITAR,
  );

  const canCancelOrders = can(
    PERMISSIONS.PEDIDOS_CANCELAR,
  );

  const canOpenWorkspace = canAny(
    PERMISSIONS.PEDIDOS_EDITAR,
    PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
  );

  const [pedidos, setPedidos] =
    useState([]);

  const [clientes, setClientes] =
    useState([]);

  const [usuarios, setUsuarios] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('TODOS');

  const [
    dateFilter,
    setDateFilter,
  ] = useState('TODAS');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [editingPedido, setEditingPedido] =
    useState(null);

  const [
    pendingCancel,
    setPendingCancel,
  ] = useState(null);

  const cargarDatos = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);

        const shouldLoadClients =
          canCreateOrders || canEditOrders;

        const shouldLoadUsers = can(
          PERMISSIONS.USUARIOS_GESTIONAR,
        );

        const results =
          await Promise.allSettled([
            obtenerPedidos(),
            shouldLoadClients
              ? obtenerClientes()
              : Promise.resolve([]),
            shouldLoadUsers
              ? obtenerUsuarios()
              : Promise.resolve(
                user ? [user] : [],
              ),
          ]);

        const [
          pedidosResult,
          clientesResult,
          usuariosResult,
        ] = results;

        if (
          pedidosResult.status ===
          'fulfilled'
        ) {
          setPedidos(
            Array.isArray(
              pedidosResult.value,
            )
              ? pedidosResult.value
              : [],
          );
        } else {
          throw pedidosResult.reason;
        }

        setClientes(
          clientesResult.status ===
            'fulfilled' &&
            Array.isArray(
              clientesResult.value,
            )
            ? clientesResult.value
            : [],
        );

        setUsuarios(
          usuariosResult.status ===
            'fulfilled' &&
            Array.isArray(
              usuariosResult.value,
            )
            ? usuariosResult.value
            : [],
        );

        if (notify) {
          showSuccess(
            'Pedidos actualizados correctamente.',
          );
        }
      } catch (error) {
        console.error(
          'Error al cargar pedidos:',
          error,
        );

        showError(
          error.message ||
            'No fue posible cargar los pedidos.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      can,
      canCreateOrders,
      canEditOrders,
      user,
    ],
  );

  useInitialLoad(cargarDatos);

  const filteredPedidos = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    return pedidos.filter((pedido) => {
      const cliente =
        getCliente(pedido);

      const usuario =
        getUsuario(pedido);

      const matchesSearch =
        !search ||
        [
          pedido.id,
          `PED-${String(
            pedido.id,
          ).padStart(5, '0')}`,
          cliente?.nombre,
          usuario?.nombre,
          usuario?.apellido,
        ].some((value) =>
          normalizeText(value).includes(
            search,
          ),
        );

      const matchesStatus =
        statusFilter === 'TODOS' ||
        pedido.estado ===
          statusFilter;

      const matchesDate =
        isDateMatch(
          pedido.fecha,
          dateFilter,
        );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    dateFilter,
    pedidos,
    searchTerm,
    statusFilter,
  ]);

  const totalPages = Math.max(
    Math.ceil(
      filteredPedidos.length /
        PAGE_SIZE,
    ),
    1,
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedPedidos =
    useMemo(() => {
      const start =
        (safeCurrentPage - 1) *
        PAGE_SIZE;

      return filteredPedidos.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      safeCurrentPage,
      filteredPedidos,
    ]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const metrics = useMemo(
    () => [
      {
        title: 'Pedidos registrados',
        value: pedidos.length,
        helper: 'Total histórico',
        icon: 'bi-receipt',
        variant: 'primary',
      },
      {
        title: 'Pendientes',
        value: pedidos.filter(
          (pedido) =>
            pedido.estado ===
            'PENDIENTE',
        ).length,
        helper: 'Esperan preparación',
        icon: 'bi-clock-history',
        variant: 'warning',
      },
      {
        title: 'En preparación',
        value: pedidos.filter(
          (pedido) =>
            pedido.estado ===
            'PREPARANDO',
        ).length,
        helper: 'Workspace activo',
        icon: 'bi-box-seam',
        variant: 'info',
      },
      {
        title: 'Listos para despacho',
        value: pedidos.filter(
          (pedido) =>
            pedido.estado ===
            'LISTO_PARA_DESPACHO',
        ).length,
        helper: 'Disponibles en logística',
        icon: 'bi-truck',
        variant: 'success',
      },
    ],
    [pedidos],
  );

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('TODOS');
    setDateFilter('TODAS');
    setCurrentPage(1);
  };

  const handleUpdate = async (
    payload,
  ) => {
    if (!canEditOrders || !editingPedido?.id) {
      return;
    }

    try {
      setIsSaving(true);

      await actualizarPedido(
        editingPedido.id,
        payload,
      );

      showSuccess(
        'Pedido actualizado correctamente.',
      );

      setEditingPedido(null);

      await cargarDatos();
    } catch (error) {
      console.error(
        'Error al actualizar pedido:',
        error,
      );

      showError(
        error.message ||
          'No fue posible actualizar el pedido.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (
      !canCancelOrders ||
      !pendingCancel?.id
    ) {
      return;
    }

    try {
      await cancelarPedido(
        pendingCancel.id,
      );

      showSuccess(
        `Pedido PED-${String(
          pendingCancel.id,
        ).padStart(5, '0')} cancelado correctamente.`,
      );

      setPendingCancel(null);

      await cargarDatos();
    } catch (error) {
      console.error(
        'Error al cancelar pedido:',
        error,
      );

      showError(
        error.message ||
          'No fue posible cancelar el pedido.',
      );
    }
  };

  const hasFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'TODOS' ||
    dateFilter !== 'TODAS';

  return (
    <div className="pedidos-page">
      <section className="pedidos-banner">
        <div className="pedidos-banner__icon">
          <i className="bi bi-receipt-cutoff" />
        </div>

        <div>
          <strong>
            Gestión comercial de pedidos
          </strong>

          <span>
            Crea, prepara y consulta pedidos antes de su incorporación al flujo logístico.
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          disabled={isLoading}
          onClick={() =>
            cargarDatos({
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
      </section>

      <div className="pedidos-top-section">
        <section className="pedidos-metrics-grid">
          {metrics.map(
            (metric) => (
              <PedidoMetricCard
                key={metric.title}
                {...metric}
              />
            ),
          )}
        </section>

        <PedidoFlowCard />
      </div>

      <section className="pedidos-workspace-card">
        <PedidosToolbar
          searchTerm={searchTerm}
          statusFilter={
            statusFilter
          }
          dateFilter={dateFilter}
          onSearchChange={
            handleSearchChange
          }
          onStatusChange={
            handleStatusChange
          }
          onDateChange={
            handleDateChange
          }
          onClear={clearFilters}
          onCreate={() =>
            navigate(
              '/pedidos/nuevo',
            )
          }
        />

        {isLoading ? (
          <div className="pedidos-loading">
            <span className="spinner-border text-primary" />
            <h4>
              Cargando pedidos...
            </h4>
            <p>
              Consultando la información comercial.
            </p>
          </div>
        ) : (
          <>
            <PedidosTable
              pedidos={
                paginatedPedidos
              }
              hasFilters={
                hasFilters
              }
              onOpenWorkspace={(
                pedido,
              ) => {
                if (!canOpenWorkspace) {
                  return;
                }

                navigate(
                  `/pedidos/${pedido.id}/workspace`,
                );
              }}
              onEdit={(pedido) => {
                if (canEditOrders) {
                  setEditingPedido(pedido);
                }
              }}
              onCancel={(pedido) => {
                if (canCancelOrders) {
                  setPendingCancel(pedido);
                }
              }}
              onClearFilters={
                clearFilters
              }
              onCreate={() => {
                if (canCreateOrders) {
                  navigate('/pedidos/nuevo');
                }
              }}
            />

            <PedidosPagination
              currentPage={
                safeCurrentPage
              }
              totalPages={
                totalPages
              }
              totalItems={
                filteredPedidos.length
              }
              pageSize={PAGE_SIZE}
              onPageChange={
                setCurrentPage
              }
            />
          </>
        )}
      </section>

      <PedidoEditModal
        key={editingPedido?.id ?? 'closed'}
        open={canEditOrders && Boolean(
          editingPedido,
        )}
        pedido={editingPedido}
        clientes={clientes}
        usuarios={usuarios}
        isSaving={isSaving}
        onSave={handleUpdate}
        onClose={() => {
          if (!isSaving) {
            setEditingPedido(null);
          }
        }}
      />

      <ConfirmDialog
        open={canCancelOrders && Boolean(
          pendingCancel,
        )}
        title="Cancelar pedido"
        message={
          pendingCancel
            ? `El pedido PED-${String(
              pendingCancel.id,
            ).padStart(5, '0')} será cancelado y el stock de sus productos será restaurado.`
            : ''
        }
        confirmText="Cancelar pedido"
        cancelText="Volver"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() =>
          setPendingCancel(null)
        }
      />
    </div>
  );
}

export default PedidosPage;
