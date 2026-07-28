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

import WorkspaceShell from '../../../shared/layouts/WorkspaceShell';

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
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import LoadWorkspaceSummary from '../components/LoadWorkspaceSummary';
import LoadWorkspaceTable from '../components/LoadWorkspaceTable';

import {
  actualizarCargaDespacho,
  confirmarCargaJornada,
  obtenerJornadaCarga,
} from '../services/bodega.service';

import {
  formatWarehouseJourneyCode,
  getLoadProgress,
  getWarehouseDispatches,
  replaceWarehouseDispatch,
} from '../bodega.utils';

import '../bodega.css';

function CargaWorkspacePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const returnTo = location.state?.returnTo ?? '/bodega/cargas';

  const [jornada, setJornada] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [updatingDispatchId, setUpdatingDispatchId] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmLoadOpen, setConfirmLoadOpen] = useState(false);
  const [pendingReopen, setPendingReopen] = useState(null);

  const loadJourney = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const result = await obtenerJornadaCarga(id);
        setJornada(result);

        if (notify) {
          showSuccess('Carga de la jornada actualizada.');
        }
      } catch (error) {
        console.error('Error al cargar el Workspace de carga:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message ||
              'No fue posible actualizar la jornada de carga.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [id],
  );

  useInitialLoad(loadJourney);

  const handleBack = useCallback(
    () => navigate(returnTo),
    [navigate, returnTo],
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
          onClick={() => loadJourney({ notify: true })}
        >
          Actualizar
        </Button>
      </>
    ),
    [handleBack, isLoading, loadJourney],
  );

  const pageHeader = useMemo(
    () => ({
      title: jornada
        ? formatWarehouseJourneyCode(jornada.id)
        : 'Carga de jornada',
      description:
        'Verifica los despachos físicos antes de confirmar la salida del camión.',
      actions: pageActions,
    }),
    [jornada, pageActions],
  );

  usePageHeader(pageHeader);

  const applyToggle = async (dispatch, checked) => {
    try {
      setUpdatingDispatchId(dispatch.id);

      const updated = await actualizarCargaDespacho(
        dispatch.id,
        checked,
      );

      setJornada((current) =>
        replaceWarehouseDispatch(current, updated),
      );
      showSuccess(
        checked
          ? 'Despacho marcado como cargado.'
          : 'Despacho retirado de la carga.',
      );
    } catch (error) {
      console.error('Error al actualizar carga del despacho:', error);
      showError(
        error.message ||
          'No fue posible actualizar el estado de carga.',
      );
    } finally {
      setUpdatingDispatchId(null);
    }
  };

  const handleToggle = (dispatch, checked) => {
    const progress = getLoadProgress(jornada);

    if (progress.confirmed && !checked) {
      setPendingReopen({ dispatch, checked });
      return;
    }

    applyToggle(dispatch, checked);
  };

  const handleConfirmLoad = async () => {
    try {
      setIsConfirming(true);
      const updated = await confirmarCargaJornada(id);
      setJornada(updated);
      showSuccess('Carga confirmada. La jornada está lista para iniciar.');
    } catch (error) {
      console.error('Error al confirmar carga:', error);
      showError(
        error.message ||
          'No fue posible confirmar la carga de la jornada.',
      );
    } finally {
      setIsConfirming(false);
      setConfirmLoadOpen(false);
    }
  };

  if (loadError) {
    return (
      <ErrorState
        title="No fue posible abrir la carga"
        actionLabel="Reintentar"
        onAction={() => loadJourney()}
      >
        {loadError.message ||
          'La jornada no está disponible para carga.'}
      </ErrorState>
    );
  }

  if (isLoading || !jornada) {
    return <LoadingState label="Cargando Workspace de carga..." />;
  }

  const progress = getLoadProgress(jornada);
  const dispatches = getWarehouseDispatches(jornada);
  const canUpdate = can(PERMISSIONS.CARGAS_ACTUALIZAR);
  const canConfirm = can(PERMISSIONS.CARGAS_CONFIRMAR);
  const confirmDisabled =
    !progress.complete ||
    progress.confirmed ||
    isConfirming ||
    updatingDispatchId !== null ||
    dispatches.length === 0;

  return (
    <>
      <WorkspaceShell
        className="warehouse-workspace warehouse-load-workspace"
        sidebar={<LoadWorkspaceSummary jornada={jornada} />}
        footer={
          canConfirm ? (
            <div className="warehouse-workspace-actions">
              <div>
                <strong>
                  {progress.confirmed
                    ? 'Carga confirmada'
                    : progress.complete
                      ? 'Carga física completa'
                      : `${progress.pending} despachos pendientes`}
                </strong>
                <small>
                  {progress.confirmed
                    ? 'La jornada está lista para ser iniciada.'
                    : 'Todos los despachos deben estar cargados.'}
                </small>
              </div>

              <Button
                tone="primary"
                icon={
                  progress.confirmed
                    ? 'bi bi-check2-circle'
                    : 'bi bi-truck-flatbed'
                }
                loading={isConfirming}
                loadingLabel="Confirmando"
                disabled={confirmDisabled}
                onClick={() => setConfirmLoadOpen(true)}
              >
                {progress.confirmed
                  ? 'Carga confirmada'
                  : 'Confirmar carga'}
              </Button>
            </div>
          ) : null
        }
      >
        <section className="warehouse-workspace-panel">
          <header className="warehouse-workspace-panel__header">
            <div>
              <span>Control físico</span>
              <h2>Despachos de la jornada</h2>
              <p>
                Marca cada pedido después de verificar que fue cargado en el camión.
              </p>
            </div>

            <strong>
              {dispatches.length}{' '}
              {dispatches.length === 1 ? 'despacho' : 'despachos'}
            </strong>
          </header>

          <div className="warehouse-workspace-panel__body">
            <LoadWorkspaceTable
              canUpdate={canUpdate}
              jornada={jornada}
              updatingDispatchId={updatingDispatchId}
              onToggle={handleToggle}
            />
          </div>
        </section>
      </WorkspaceShell>

      <ConfirmDialog
        open={confirmLoadOpen}
        title="Confirmar carga de la jornada"
        message="La jornada quedará habilitada para que el chofer pueda iniciar la ruta."
        variant="info"
        confirmText="Confirmar carga"
        cancelText="Seguir revisando"
        loading={isConfirming}
        onCancel={() => setConfirmLoadOpen(false)}
        onConfirm={handleConfirmLoad}
      />

      <ConfirmDialog
        open={Boolean(pendingReopen)}
        title="Reabrir carga confirmada"
        message="Al retirar este despacho se anulará la confirmación de carga de la jornada."
        variant="warning"
        confirmText="Retirar despacho"
        cancelText="Mantener confirmación"
        onCancel={() => setPendingReopen(null)}
        onConfirm={() => {
          const pending = pendingReopen;
          setPendingReopen(null);
          if (pending) {
            applyToggle(pending.dispatch, pending.checked);
          }
        }}
      />
    </>
  );
}

export default CargaWorkspacePage;
