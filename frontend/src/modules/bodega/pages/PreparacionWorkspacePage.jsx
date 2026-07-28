import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';

import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';

import WorkspaceShell from '../../../shared/layouts/WorkspaceShell';

import {
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
} from '../../../shared/ui';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import PreparationWorkspaceSummary from '../components/PreparationWorkspaceSummary';
import PreparationWorkspaceTable from '../components/PreparationWorkspaceTable';

import {
  actualizarPreparacionDetalle,
  finalizarPreparacion,
  obtenerPedidoPreparacion,
} from '../services/bodega.service';

import {
  formatWarehouseOrderCode,
  getPreparationProgress,
  getWarehouseDetails,
  replaceWarehouseDetail,
  validatePreparedQuantity,
} from '../bodega.utils';

import '../bodega.css';

function createDrafts(pedido) {
  return Object.fromEntries(
    getWarehouseDetails(pedido).map((detail) => [
      detail.id,
      String(detail?.cantidad_preparada ?? 0),
    ]),
  );
}

function PreparacionWorkspacePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const returnTo = location.state?.returnTo ?? '/bodega/preparacion';

  const [pedido, setPedido] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingDetailId, setSavingDetailId] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [discardAction, setDiscardAction] = useState(null);

  const loadPedido = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const result = await obtenerPedidoPreparacion(id);
        setPedido(result);
        setDrafts(createDrafts(result));

        if (notify) {
          showSuccess('Preparación actualizada.');
        }
      } catch (error) {
        console.error('Error al cargar el Workspace de preparación:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message ||
              'No fue posible actualizar el pedido en preparación.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [id],
  );

  useInitialLoad(loadPedido);

  const details = getWarehouseDetails(pedido);
  const progress = getPreparationProgress(pedido);

  const hasUnsavedChanges = details.some((detail) => {
    const requested = Number(detail?.cantidad ?? 0);
    const saved = Number(detail?.cantidad_preparada ?? 0);
    const draft = drafts[detail.id] ?? String(saved);

    return (
      !validatePreparedQuantity(draft, requested) &&
      Number(draft) !== saved
    );
  });

  const requestDiscard = useCallback(
    (action) => {
      if (hasUnsavedChanges) {
        setDiscardAction(() => action);
        return;
      }

      action();
    },
    [hasUnsavedChanges],
  );

  const handleBack = useCallback(
    () => requestDiscard(() => navigate(returnTo)),
    [navigate, requestDiscard, returnTo],
  );

  const handleRefresh = useCallback(
    () => requestDiscard(() => loadPedido({ notify: true })),
    [loadPedido, requestDiscard],
  );

  const pageActions = useMemo(
    () => (
      <>
        <Button
          className="topbar-page-action"
          size="sm"
          tone="secondary"
          icon="bi bi-arrow-left"
          onClick={handleBack}
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
          onClick={handleRefresh}
        >
          Actualizar
        </Button>
      </>
    ),
    [handleBack, handleRefresh, isLoading],
  );

  const pageHeader = useMemo(
    () => ({
      title: pedido
        ? formatWarehouseOrderCode(pedido.id)
        : 'Preparación del pedido',
      description:
        'Registra las cantidades físicas antes de liberar el pedido a Logística.',
      actions: pageActions,
    }),
    [pageActions, pedido],
  );

  usePageHeader(pageHeader);

  const handleQuantityChange = (detailId, value) => {
    setDrafts((current) => ({
      ...current,
      [detailId]: value,
    }));
  };

  const handleSaveDetail = async (detail) => {
    const requested = Number(detail?.cantidad ?? 0);
    const draftValue = drafts[detail.id] ?? String(
      detail?.cantidad_preparada ?? 0,
    );
    const error = validatePreparedQuantity(draftValue, requested);

    if (error) {
      showError(error);
      return;
    }

    try {
      setSavingDetailId(detail.id);

      const updated = await actualizarPreparacionDetalle(
        detail.id,
        Number(draftValue),
      );

      setPedido((current) => replaceWarehouseDetail(current, updated));
      setDrafts((current) => ({
        ...current,
        [detail.id]: String(updated?.cantidad_preparada ?? draftValue),
      }));

      showSuccess(
        `${updated?.producto?.nombre ?? 'Producto'} actualizado correctamente.`,
      );
    } catch (error) {
      console.error('Error al actualizar cantidad preparada:', error);
      showError(
        error.message ||
          'No fue posible actualizar la cantidad preparada.',
      );
    } finally {
      setSavingDetailId(null);
    }
  };

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true);
      await finalizarPreparacion(id);
      showSuccess('Preparación finalizada. El pedido está listo para despacho.');
      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error('Error al finalizar preparación:', error);
      showError(
        error.message ||
          'No fue posible finalizar la preparación del pedido.',
      );
    } finally {
      setIsFinalizing(false);
      setConfirmFinalizeOpen(false);
    }
  };

  if (loadError) {
    return (
      <ErrorState
        title="No fue posible abrir la preparación"
        actionLabel="Reintentar"
        onAction={() => loadPedido()}
      >
        {loadError.message ||
          'El pedido no está disponible para preparación.'}
      </ErrorState>
    );
  }

  if (isLoading || !pedido) {
    return <LoadingState label="Cargando Workspace de preparación..." />;
  }

  const canFinalize = can(
    PERMISSIONS.PEDIDOS_FINALIZAR_PREPARACION,
  );
  const finalizeDisabled =
    !progress.complete ||
    hasUnsavedChanges ||
    isFinalizing ||
    savingDetailId !== null;

  return (
    <>
      <WorkspaceShell
        className="warehouse-workspace"
        sidebar={<PreparationWorkspaceSummary pedido={pedido} />}
        footer={
          canFinalize ? (
            <div className="warehouse-workspace-actions">
              <div>
                <strong>
                  {progress.complete
                    ? 'Preparación física completa'
                    : `${progress.pending} unidades pendientes`}
                </strong>
                <small>
                  {hasUnsavedChanges
                    ? 'Guarda los cambios antes de finalizar.'
                    : 'El pedido pasará a LISTO PARA DESPACHO.'}
                </small>
              </div>

              <Button
                tone="primary"
                icon="bi bi-send-check"
                loading={isFinalizing}
                loadingLabel="Finalizando"
                disabled={finalizeDisabled}
                onClick={() => setConfirmFinalizeOpen(true)}
              >
                Finalizar preparación
              </Button>
            </div>
          ) : null
        }
      >
        <section className="warehouse-workspace-panel">
          <header className="warehouse-workspace-panel__header">
            <div>
              <span>Control físico</span>
              <h2>Productos del pedido</h2>
              <p>
                Registra cada cantidad verificada. Los cambios se guardan
                individualmente por producto.
              </p>
            </div>

            <strong>
              {details.length}{' '}
              {details.length === 1 ? 'producto' : 'productos'}
            </strong>
          </header>

          <div className="warehouse-workspace-panel__body">
            <PreparationWorkspaceTable
              pedido={pedido}
              drafts={drafts}
              savingDetailId={savingDetailId}
              onChange={handleQuantityChange}
              onSave={handleSaveDetail}
            />
          </div>
        </section>
      </WorkspaceShell>

      <ConfirmDialog
        open={confirmFinalizeOpen}
        title="Finalizar preparación"
        message="El pedido pasará a LISTO PARA DESPACHO y ya no podrá modificarse desde Bodega."
        variant="info"
        confirmText="Finalizar preparación"
        cancelText="Seguir revisando"
        loading={isFinalizing}
        onCancel={() => setConfirmFinalizeOpen(false)}
        onConfirm={handleFinalize}
      />

      <ConfirmDialog
        open={Boolean(discardAction)}
        title="Descartar cambios sin guardar"
        message="Hay cantidades modificadas que todavía no se han guardado. ¿Deseas descartarlas?"
        variant="warning"
        confirmText="Descartar cambios"
        cancelText="Continuar preparando"
        onCancel={() => setDiscardAction(null)}
        onConfirm={() => {
          const action = discardAction;
          setDiscardAction(null);
          action?.();
        }}
      />
    </>
  );
}

export default PreparacionWorkspacePage;
