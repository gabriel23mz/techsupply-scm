import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import WorkspaceShell from '../../../shared/layouts/WorkspaceShell';

import {
  PERMISSIONS,
  ROLES,
} from '../../../shared/constants/permissions';

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
  usePermissions,
} from '../../../shared/hooks/usePermissions';

import {
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import PedidoEditModal from '../components/PedidoEditModal';
import PedidoProductForm from '../components/workspace/PedidoProductForm';
import PedidoProductsTable from '../components/workspace/PedidoProductsTable';
import PedidoSummaryPanel from '../components/workspace/PedidoSummaryPanel';
import PedidoWorkspaceActions from '../components/workspace/PedidoWorkspaceActions';

import {
  actualizarDetallePedido,
  actualizarPedido,
  cancelarPedido,
  crearDetallePedido,
  eliminarDetallePedido,
  iniciarPreparacion,
  obtenerClientes,
  obtenerPedido,
  obtenerProductos,
  obtenerUsuarios,
} from '../services/pedido.service';

import {
  formatOrderCode,
  getDetailProduct,
  getOrderDetails,
  getReturnPath,
} from '../pedido.utils';

import '../pedidos.css';

function PedidoWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnPath(searchParams);

  const { user } = useAuth();
  const { can, hasRole } = usePermissions();

  const canEditOrder = can(PERMISSIONS.PEDIDOS_EDITAR);
  const canSendPreparation = can(
    PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
  );
  const canCancelOrder = can(PERMISSIONS.PEDIDOS_CANCELAR);
  const isAdmin = hasRole(ROLES.ADMIN);

  const [pedido, setPedido] = useState(null);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [editingDetail, setEditingDetail] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingOrder, setEditingOrder] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [pedidoData, productosData, clientesData, usuariosData] =
        await Promise.all([
          obtenerPedido(id),
          obtenerProductos(),
          canEditOrder ? obtenerClientes() : Promise.resolve([]),
          isAdmin ? obtenerUsuarios() : Promise.resolve([]),
        ]);

      setPedido(pedidoData);
      setProductos(Array.isArray(productosData) ? productosData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (error) {
      console.error('Error al cargar Workspace:', error);
      setLoadError(error);
      setPedido(null);
    } finally {
      setIsLoading(false);
    }
  }, [canEditOrder, id, isAdmin]);

  useInitialLoad(cargarDatos);

  const detalles = useMemo(() => getOrderDetails(pedido), [pedido]);
  const isPending = pedido?.estado === 'PENDIENTE';
  const canEdit = canEditOrder && isPending;
  const showStartAction = canSendPreparation && isPending;
  const canStart = showStartAction && detalles.length > 0;
  const canCancel =
    canCancelOrder &&
    (isPending ||
      (isAdmin &&
        ['PREPARANDO', 'LISTO_PARA_DESPACHO'].includes(
          pedido?.estado,
        )));

  const pageActions = useMemo(
    () => (
      <>
        <Button
          className="topbar-page-action"
          size="sm"
          tone="secondary"
          icon="bi bi-arrow-left"
          onClick={() => navigate(returnTo)}
        >
          Volver
        </Button>

        <Button
          className="topbar-page-action topbar-page-action--refresh"
          size="sm"
          tone="secondary"
          icon="bi bi-arrow-clockwise"
          loading={isLoading}
          loadingLabel="Actualizando"
          onClick={cargarDatos}
        >
          Actualizar
        </Button>

        {canEdit && (
          <Button
            className="topbar-page-action topbar-page-action--primary"
            size="sm"
            icon="bi bi-pencil-square"
            onClick={() => setEditingOrder(true)}
          >
            Editar información
          </Button>
        )}
      </>
    ),
    [canEdit, cargarDatos, isLoading, navigate, returnTo],
  );

  const pageHeader = useMemo(
    () => ({
      title: pedido ? formatOrderCode(pedido.id) : 'Workspace del pedido',
      description:
        pedido?.estado === 'PENDIENTE'
          ? 'Gestiona la información y los productos antes de enviarlo a preparación.'
          : 'Consulta la información comercial y el progreso del pedido.',
      actions: pageActions,
    }),
    [pageActions, pedido],
  );

  usePageHeader(pageHeader);

  const execute = async ({ key, action, successMessage }) => {
    try {
      setActionLoading(key);
      await action();
      await cargarDatos();
      showSuccess(successMessage);
      return true;
    } catch (error) {
      console.error('Error en Workspace:', error);
      showError(error.message || 'No fue posible completar la operación.');
      return false;
    } finally {
      setActionLoading('');
    }
  };

  const handleEditDetail = useCallback((detalle) => {
    setEditingDetail(detalle);

    window.requestAnimationFrame(() => {
      document
        .getElementById('order-product-editor')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    });
  }, []);

  const handleSaveProduct = async (payload) => {
    if (!canEdit) return;

    if (editingDetail) {
      const updated = await execute({
        key: 'producto',
        action: () =>
          actualizarDetallePedido(editingDetail.id, {
            cantidad: payload.cantidad,
          }),
        successMessage: 'Cantidad actualizada correctamente.',
      });

      if (updated) setEditingDetail(null);
      return;
    }

    await execute({
      key: 'producto',
      action: () =>
        crearDetallePedido({
          pedido_id: Number(id),
          producto_id: payload.producto_id,
          cantidad: payload.cantidad,
        }),
      successMessage: 'Producto agregado correctamente.',
    });
  };

  const handleDeleteProduct = async () => {
    if (!canEdit || !pendingDelete?.id) return;

    const detail = pendingDelete;
    const product = getDetailProduct(detail);
    setPendingDelete(null);

    await execute({
      key: 'eliminar-producto',
      action: () => eliminarDetallePedido(detail.id),
      successMessage: `${product?.nombre ?? 'Producto'} eliminado del pedido.`,
    });
  };

  const handleUpdateOrder = async (payload) => {
    if (!canEdit || !pedido?.id) return;

    const updated = await execute({
      key: 'pedido',
      action: () => actualizarPedido(pedido.id, payload),
      successMessage: 'Información comercial actualizada.',
    });

    if (updated) setEditingOrder(false);
  };

  const handleStart = async () => {
    if (!canStart) return;
    setConfirmAction(null);

    await execute({
      key: 'estado',
      action: () => iniciarPreparacion(id),
      successMessage: 'Pedido enviado a preparación.',
    });
  };

  const handleCancel = async () => {
    if (!canCancel) return;
    setConfirmAction(null);

    await execute({
      key: 'estado',
      action: () => cancelarPedido(id),
      successMessage: 'Pedido cancelado correctamente.',
    });
  };

  if (isLoading) {
    return <LoadingState label="Cargando Workspace..." />;
  }

  if (loadError || !pedido) {
    return (
      <ErrorState
        actionLabel="Volver a pedidos"
        onAction={() => navigate(returnTo)}
      >
        {loadError?.message || 'No se encontró el pedido solicitado.'}
      </ErrorState>
    );
  }

  return (
    <div className="order-workspace-page">
      <WorkspaceShell
        className="order-workspace-shell"
        sidebar={<PedidoSummaryPanel pedido={pedido} />}
        footer={
          <PedidoWorkspaceActions
            canStart={canStart}
            showStart={showStartAction}
            canCancel={canCancel}
            isWorking={Boolean(actionLoading)}
            onStart={() => setConfirmAction('START')}
            onCancel={() => setConfirmAction('CANCEL')}
          />
        }
      >
        <PedidoProductsTable
          detalles={detalles}
          canEdit={canEdit}
          activeDetailId={editingDetail?.id}
          onEdit={handleEditDetail}
          onDelete={setPendingDelete}
        />

        <PedidoProductForm
          key={editingDetail?.id ?? 'new'}
          productos={productos}
          detalles={detalles}
          editingDetail={editingDetail}
          canEdit={canEdit}
          isSaving={actionLoading === 'producto'}
          onSave={handleSaveProduct}
          onCancelEdit={() => setEditingDetail(null)}
        />
      </WorkspaceShell>

      <PedidoEditModal
        key={editingOrder ? pedido.id : 'closed'}
        open={editingOrder}
        pedido={pedido}
        clientes={clientes}
        usuarios={usuarios}
        currentUser={user}
        canAssignUser={isAdmin}
        isSaving={actionLoading === 'pedido'}
        onSave={handleUpdateOrder}
        onClose={() => setEditingOrder(false)}
      />

      <ConfirmDialog
        open={canEdit && Boolean(pendingDelete)}
        title="Eliminar producto"
        message={
          pendingDelete
            ? `¿Deseas retirar ${
              getDetailProduct(pendingDelete)?.nombre ?? 'este producto'
            } del pedido? El stock será restaurado.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteProduct}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={canStart && confirmAction === 'START'}
        title="Enviar a preparación"
        message="El pedido pasará a PREPARANDO y quedará en modo de solo lectura para Ventas."
        confirmText="Enviar"
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleStart}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={canCancel && confirmAction === 'CANCEL'}
        title="Cancelar pedido"
        message="El pedido será cancelado y el stock reservado será restaurado."
        confirmText="Cancelar pedido"
        cancelText="Volver"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

export default PedidoWorkspacePage;
