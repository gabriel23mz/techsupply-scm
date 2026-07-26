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
  useParams,
} from 'react-router-dom';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import PedidoProductForm from '../components/workspace/PedidoProductForm';
import PedidoProductsTable from '../components/workspace/PedidoProductsTable';
import PedidoSummaryPanel from '../components/workspace/PedidoSummaryPanel';
import PedidoWorkspaceActions from '../components/workspace/PedidoWorkspaceActions';
import PedidoWorkspaceHeader from '../components/workspace/PedidoWorkspaceHeader';

import {
  actualizarDetallePedido,
  cancelarPedido,
  crearDetallePedido,
  eliminarDetallePedido,
  iniciarPreparacion,
  obtenerPedido,
  obtenerProductos,
} from '../services/pedido.service';

import '../pedidos.css';

function getDetails(pedido) {
  const details =
    pedido?.DetallePedidos ??
    pedido?.DetallesPedido ??
    pedido?.detalles ??
    pedido?.detalle_pedidos ??
    [];

  return Array.isArray(details)
    ? details
    : [];
}

function getProduct(detalle) {
  return (
    detalle?.producto ??
    null
  );
}

function PedidoWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    can,
  } = usePermissions();

  const canEditOrder = can(
    PERMISSIONS.PEDIDOS_EDITAR,
  );

  const canSendPreparation = can(
    PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
  );

  const canCancelOrder = can(
    PERMISSIONS.PEDIDOS_CANCELAR,
  );

  const [pedido, setPedido] =
    useState(null);

  const [productos, setProductos] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState('');

  const [
    editingDetail,
    setEditingDetail,
  ] = useState(null);

  const [
    pendingDelete,
    setPendingDelete,
  ] = useState(null);

  const [
    confirmAction,
    setConfirmAction,
  ] = useState(null);

  const cargarDatos = useCallback(
    async () => {
      try {
        setIsLoading(true);

        const [
          pedidoData,
          productosData,
        ] = await Promise.all([
          obtenerPedido(id),
          obtenerProductos(),
        ]);

        setPedido(pedidoData);

        setProductos(
          Array.isArray(productosData)
            ? productosData
            : [],
        );
      } catch (error) {
        console.error(
          'Error al cargar Workspace:',
          error,
        );

        showError(
          error.message ||
            'No fue posible cargar el Workspace.',
        );

        setPedido(null);
      } finally {
        setIsLoading(false);
      }
    },
    [id],
  );

  useInitialLoad(cargarDatos);

  const detalles = useMemo(
    () => getDetails(pedido),
    [pedido],
  );

  const canEdit =
    canEditOrder &&
    pedido &&
    pedido.estado === 'PENDIENTE';

  const canStart =
    canSendPreparation &&
    pedido?.estado === 'PENDIENTE';

  const canCancel =
    canCancelOrder &&
    pedido?.estado === 'PENDIENTE';

  const execute = async ({
    key,
    action,
    successMessage,
  }) => {
    try {
      setActionLoading(key);

      await action();

      await cargarDatos();

      showSuccess(successMessage);
    } catch (error) {
      console.error(
        'Error en Workspace:',
        error,
      );

      showError(
        error.message ||
          'No fue posible completar la operación.',
      );
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveProduct = async (
    payload,
  ) => {
    if (!canEdit) {
      return;
    }

    if (editingDetail) {
      await execute({
        key: 'producto',
        action: () =>
          actualizarDetallePedido(
            editingDetail.id,
            {
              cantidad:
                payload.cantidad,
            },
          ),
        successMessage:
          'Cantidad actualizada correctamente.',
      });

      setEditingDetail(null);
      return;
    }

    await execute({
      key: 'producto',
      action: () =>
        crearDetallePedido({
          pedido_id: Number(id),
          producto_id:
            payload.producto_id,
          cantidad:
            payload.cantidad,
        }),
      successMessage:
        'Producto agregado correctamente.',
    });
  };

  const handleDeleteProduct =
    async () => {
      if (!canEdit || !pendingDelete?.id) {
        return;
      }

      const producto =
        getProduct(
          pendingDelete,
        );

      setPendingDelete(null);

      await execute({
        key: 'eliminar-producto',
        action: () =>
          eliminarDetallePedido(
            pendingDelete.id,
          ),
        successMessage:
          `${producto?.nombre ?? 'Producto'} eliminado del pedido.`,
      });
    };

  const handleStart = async () => {
    if (!canStart) {
      return;
    }

    setConfirmAction(null);

    await execute({
      key: 'estado',
      action: () =>
        iniciarPreparacion(id),
      successMessage:
        'Preparación iniciada correctamente.',
    });
  };

  const handleCancel = async () => {
    if (!canCancel) {
      return;
    }

    setConfirmAction(null);

    await execute({
      key: 'estado',
      action: () =>
        cancelarPedido(id),
      successMessage:
        'Pedido cancelado correctamente.',
    });
  };

  if (isLoading) {
    return (
      <div className="pedido-workspace-page">
        <div className="pedidos-loading">
          <span className="spinner-border text-primary" />
          <h4>
            Cargando Workspace...
          </h4>
          <p>
            Consultando productos y estado del pedido.
          </p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="pedido-workspace-page">
        <div className="pedidos-empty">
          <i className="bi bi-exclamation-circle" />
          <h4>
            Pedido no disponible
          </h4>
          <p>
            No se encontró el pedido solicitado.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate('/pedidos')
            }
          >
            Volver a pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pedido-workspace-page">
      <PedidoWorkspaceHeader
        pedido={pedido}
      />

      <div className="pedido-workspace-layout">
        <PedidoSummaryPanel
          pedido={pedido}
        />

        <section className="pedido-workspace-main">
          <PedidoProductsTable
            detalles={detalles}
            canEdit={canEdit}
            onEdit={
              setEditingDetail
            }
            onDelete={
              setPendingDelete
            }
          />

          <PedidoProductForm
            key={editingDetail?.id ?? 'new'}
            productos={productos}
            detalles={detalles}
            editingDetail={
              editingDetail
            }
            canEdit={canEdit}
            isSaving={
              actionLoading ===
              'producto'
            }
            onSave={
              handleSaveProduct
            }
            onCancelEdit={() =>
              setEditingDetail(null)
            }
          />
        </section>
      </div>

      <PedidoWorkspaceActions
        canStart={canStart}
        canCancel={canCancel}
        isWorking={Boolean(
          actionLoading,
        )}
        onBack={() =>
          navigate('/pedidos')
        }
        onStart={() =>
          setConfirmAction(
            'START',
          )
        }
        onCancel={() =>
          setConfirmAction(
            'CANCEL',
          )
        }
      />

      <ConfirmDialog
        open={canEdit && Boolean(
          pendingDelete,
        )}
        title="Eliminar producto"
        message={
          pendingDelete
            ? `¿Deseas retirar ${
              getProduct(
                pendingDelete,
              )?.nombre ??
              'este producto'
            } del pedido? El stock será restaurado.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={
          handleDeleteProduct
        }
        onCancel={() =>
          setPendingDelete(null)
        }
      />

      <ConfirmDialog
        open={
          canStart &&
          confirmAction ===
          'START'
        }
        title="Enviar a preparación"
        message="El pedido pasará a PREPARANDO y quedará en modo solo lectura para Ventas."
        confirmText="Enviar"
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleStart}
        onCancel={() =>
          setConfirmAction(null)
        }
      />

      <ConfirmDialog
        open={
          canCancel &&
          confirmAction ===
          'CANCEL'
        }
        title="Cancelar pedido"
        message="El pedido será cancelado y el stock reservado por sus productos será restaurado."
        confirmText="Cancelar pedido"
        cancelText="Volver"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() =>
          setConfirmAction(null)
        }
      />
    </div>
  );
}

export default PedidoWorkspacePage;
