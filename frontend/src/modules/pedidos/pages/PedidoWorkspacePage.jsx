import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

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
  finalizarPreparacion,
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

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const detalles = useMemo(
    () => getDetails(pedido),
    [pedido],
  );

  const canEdit =
    pedido &&
    [
      'PENDIENTE',
      'PREPARANDO',
    ].includes(pedido.estado);

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
      if (!pendingDelete?.id) {
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
    setConfirmAction(null);

    await execute({
      key: 'estado',
      action: () =>
        iniciarPreparacion(id),
      successMessage:
        'Preparación iniciada correctamente.',
    });
  };

  const handleFinish = async () => {
    setConfirmAction(null);

    await execute({
      key: 'estado',
      action: async () => {
        if (
          pedido.estado ===
          'PENDIENTE'
        ) {
          await iniciarPreparacion(
            id,
          );
        }

        return finalizarPreparacion(
          id,
        );
      },
      successMessage:
        'Pedido listo para despacho.',
    });
  };

  const handleCancel = async () => {
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
        pedido={pedido}
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
        onFinish={() =>
          setConfirmAction(
            'FINISH',
          )
        }
        onCancel={() =>
          setConfirmAction(
            'CANCEL',
          )
        }
      />

      <ConfirmDialog
        open={Boolean(
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
          confirmAction ===
          'START'
        }
        title="Iniciar preparación"
        message="El pedido pasará a PREPARANDO y continuará disponible en este Workspace."
        confirmText="Iniciar"
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleStart}
        onCancel={() =>
          setConfirmAction(null)
        }
      />

      <ConfirmDialog
        open={
          confirmAction ===
          'FINISH'
        }
        title="Finalizar preparación"
        message="El pedido quedará LISTO PARA DESPACHO y ya no podrá modificarse desde este Workspace."
        confirmText="Finalizar"
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleFinish}
        onCancel={() =>
          setConfirmAction(null)
        }
      />

      <ConfirmDialog
        open={
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
