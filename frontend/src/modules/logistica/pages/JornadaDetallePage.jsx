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

import WorkspaceShell from '../../../shared/layouts/WorkspaceShell';

import {
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  StatCard,
  StatusBadge,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import AsignarChoferModal from '../components/AsignarChoferModal';
import JornadaMap from '../components/JornadaMap';

import {
  asignarChoferJornada,
  entregarDespacho,
  finalizarJornada,
  iniciarJornada,
  marcarDespachoNoEntregado,
  obtenerChoferesDisponibles,
  obtenerJornada,
} from '../services/logistica.service';

import '../logistica.css';

function formatJourneyCode(id) {
  return `JR-${String(id).padStart(5, '0')}`;
}

function formatOrderCode(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(distance)} km`
    : '0,00 km';
}

function formatDuration(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours
    ? `${hours} h${remainder ? ` ${remainder} min` : ''}`
    : `${remainder} min`;
}

function formatStatus(status) {
  return String(status || 'Sin estado')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase());
}

function getStatusTone(status) {
  return {
    PLANIFICADA: 'info',
    EN_RUTA: 'warning',
    FINALIZADA: 'success',
    CANCELADA: 'danger',
    PENDIENTE: 'neutral',
    EN_TRANSITO: 'warning',
    ENTREGADO: 'success',
    NO_ENTREGADO: 'danger',
  }[status] ?? 'neutral';
}

function getPedido(despacho) {
  return despacho?.pedido ?? null;
}

function getCliente(pedido) {
  return pedido?.cliente ?? null;
}

function getUbicacion(cliente) {
  return cliente?.ubicacion ?? null;
}

function JornadaDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const returnTo = location.state?.from ?? '/jornadas?tab=listado';

  const canAssignDriver = can(PERMISSIONS.JORNADAS_ASIGNAR_CHOFER);
  const canStartJourney = can(PERMISSIONS.JORNADAS_INICIAR);
  const canFinishJourney = can(PERMISSIONS.JORNADAS_FINALIZAR);
  const canDeliverDispatch = can(PERMISSIONS.DESPACHOS_ENTREGAR);
  const canRejectDispatch = can(PERMISSIONS.DESPACHOS_NO_ENTREGAR);

  const [jornada, setJornada] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(false);

  const loadJourney = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const data = await obtenerJornada(id);
      setJornada(data);

      if (notify) showSuccess('Información de la jornada actualizada.');
    } catch (error) {
      console.error('Error al cargar la jornada:', error);
      setLoadError(error);
      setJornada(null);

      if (notify) {
        showError(error.message || 'No fue posible actualizar la jornada.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useInitialLoad(loadJourney);

  const pageActions = useMemo(() => (
    <>
      <Button
        className="topbar-page-action topbar-page-action--back"
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
        onClick={() => loadJourney({ notify: true })}
      >
        Actualizar
      </Button>
    </>
  ), [isLoading, loadJourney, navigate, returnTo]);

  const pageHeader = useMemo(() => ({
    title: jornada?.id ? formatJourneyCode(jornada.id) : 'Detalle de jornada',
    description: 'Seguimiento del recorrido, los puntos de entrega y el estado operativo.',
    actions: pageActions,
  }), [jornada, pageActions]);

  usePageHeader(pageHeader);

  const despachos = useMemo(
    () => Array.isArray(jornada?.despachos) ? jornada.despachos : [],
    [jornada],
  );

  const despachosPorPunto = useMemo(() => {
    const groups = new Map();

    despachos.forEach((despacho) => {
      const order = Number(despacho.orden_entrega);
      const pedido = getPedido(despacho);
      const cliente = getCliente(pedido);
      const ubicacion = getUbicacion(cliente);

      if (!Number.isFinite(order)) return;

      if (!groups.has(order)) {
        groups.set(order, {
          orden: order,
          ubicacion: ubicacion?.nombre || 'Ubicación no disponible',
          despachos: [],
        });
      }

      groups.get(order).despachos.push({
        ...despacho,
        pedido,
        cliente,
        ubicacion,
      });
    });

    return [...groups.values()].sort((first, second) => first.orden - second.orden);
  }, [despachos]);

  const totalClosed = useMemo(
    () => despachos.filter((despacho) => [
      'ENTREGADO',
      'NO_ENTREGADO',
    ].includes(despacho.estado)).length,
    [despachos],
  );

  const progress = despachos.length
    ? Math.round((totalClosed / despachos.length) * 100)
    : 0;

  const currentOrder = Number(jornada?.posicion_actual_orden ?? 0);

  const currentPoint = useMemo(() => {
    if (!despachosPorPunto.length) return null;

    if (jornada?.estado === 'PLANIFICADA') return despachosPorPunto[0];

    return despachosPorPunto.find(
      (point) => Number(point.orden) === currentOrder,
    ) ?? null;
  }, [currentOrder, despachosPorPunto, jornada?.estado]);

  const currentPointClosed = useMemo(
    () => Boolean(currentPoint) && currentPoint.despachos.every((despacho) => [
      'ENTREGADO',
      'NO_ENTREGADO',
    ].includes(despacho.estado)),
    [currentPoint],
  );

  const hasNextPoint = useMemo(
    () => despachosPorPunto.some(
      (point) => Number(point.orden) > currentOrder,
    ),
    [currentOrder, despachosPorPunto],
  );

  const lastPointOrder = useMemo(
    () => despachosPorPunto.reduce(
      (maximum, point) => Math.max(maximum, Number(point.orden) || 0),
      0,
    ),
    [despachosPorPunto],
  );

  const allDispatchesClosed =
    despachos.length > 0 && totalClosed === despachos.length;
  const hasReachedLastPoint =
    lastPointOrder > 0 && currentOrder >= lastPointOrder;
  const canRenderFinishAction =
    jornada?.estado === 'EN_RUTA' &&
    canFinishJourney &&
    hasReachedLastPoint &&
    !hasNextPoint &&
    currentPointClosed &&
    allDispatchesClosed;

  const executeAction = async ({
    action,
    key,
    successMessage,
  }) => {
    try {
      setActionLoading(key);
      await action();
      await loadJourney();
      showSuccess(successMessage);
    } catch (error) {
      console.error('Error en operación logística:', error);
      showError(error.message || 'No fue posible completar la operación.');
    } finally {
      setActionLoading('');
    }
  };

  const openDriverAssignment = async () => {
    if (!canAssignDriver || jornada?.estado !== 'PLANIFICADA') return;

    setDriverModalOpen(true);
    setDriversLoading(true);

    try {
      const disponibles = await obtenerChoferesDisponibles(jornada.fecha);
      const currentDriver = jornada.chofer ?? null;
      const uniqueDrivers = new Map();

      if (currentDriver?.id) uniqueDrivers.set(Number(currentDriver.id), currentDriver);
      disponibles.forEach((chofer) => uniqueDrivers.set(Number(chofer.id), chofer));

      setAvailableDrivers([...uniqueDrivers.values()]);
    } catch (error) {
      console.error('Error al consultar choferes disponibles:', error);
      showError(error.message || 'No fue posible consultar los choferes disponibles.');
      setAvailableDrivers(jornada.chofer ? [jornada.chofer] : []);
    } finally {
      setDriversLoading(false);
    }
  };

  const saveDriverAssignment = async (choferId) => {
    if (!canAssignDriver || !jornada?.id) return;

    try {
      setActionLoading('assign-driver');
      await asignarChoferJornada(jornada.id, choferId);
      setDriverModalOpen(false);
      await loadJourney();
      showSuccess('Chofer asignado correctamente.');
    } catch (error) {
      console.error('Error al asignar chofer:', error);
      showError(error.message || 'No fue posible asignar el chofer.');
    } finally {
      setActionLoading('');
    }
  };

  const requestStart = () => {
    if (!canStartJourney || !jornada?.id) return;

    setConfirmConfig({
      type: 'START',
      title: 'Iniciar jornada',
      message: `La jornada ${formatJourneyCode(jornada.id)} pasará a EN RUTA y sus despachos cambiarán a EN TRÁNSITO.`,
      confirmText: 'Iniciar jornada',
      variant: 'info',
    });
  };

  const requestFinish = () => {
    if (!canRenderFinishAction) return;

    setConfirmConfig({
      type: 'FINISH',
      title: 'Finalizar jornada',
      message: 'La jornada se marcará como FINALIZADA y los pedidos no entregados volverán al flujo logístico.',
      confirmText: 'Finalizar jornada',
      variant: 'warning',
    });
  };

  const requestNotDelivered = (despacho) => {
    if (!canRejectDispatch) return;

    setConfirmConfig({
      type: 'NOT_DELIVERED',
      despachoId: despacho.id,
      title: 'Marcar como no entregado',
      message: `El pedido ${formatOrderCode(despacho.pedido_id)} volverá al flujo logístico para una futura reasignación.`,
      confirmText: 'Marcar no entregado',
      variant: 'warning',
    });
  };

  const handleConfirm = async () => {
    const config = confirmConfig;
    setConfirmConfig(null);

    if (config?.type === 'START' && canStartJourney) {
      await executeAction({
        key: 'start',
        action: () => iniciarJornada(id),
        successMessage: 'Jornada iniciada correctamente.',
      });
      return;
    }

    if (config?.type === 'FINISH' && canRenderFinishAction) {
      await executeAction({
        key: 'finish',
        action: () => finalizarJornada(id),
        successMessage: 'Jornada finalizada correctamente.',
      });
      return;
    }

    if (config?.type === 'NOT_DELIVERED' && canRejectDispatch) {
      await executeAction({
        key: `not-delivered-${config.despachoId}`,
        action: () => marcarDespachoNoEntregado(config.despachoId),
        successMessage: 'El despacho fue marcado como no entregado.',
      });
    }
  };

  if (loadError && !jornada) {
    return (
      <ErrorState
        title="No fue posible abrir la jornada"
        actionLabel="Reintentar"
        onAction={() => loadJourney()}
      >
        {loadError.message || 'La jornada solicitada no está disponible.'}
      </ErrorState>
    );
  }

  if (isLoading || !jornada) {
    return <LoadingState label="Cargando jornada de reparto..." />;
  }

  const camion = jornada.camion ?? null;
  const chofer = jornada.chofer?.usuario ?? jornada.chofer ?? null;
  const driverName = [chofer?.nombre, chofer?.apellido].filter(Boolean).join(' ');
  const loadConfirmed = Boolean(
    jornada.carga_confirmada_en ?? jornada.carga_confirmada,
  );

  const operationalActions = jornada.estado === 'PLANIFICADA' && canStartJourney ? (
    loadConfirmed ? (
      <div className="journey-sidebar-actions">
        <Button
          icon="bi bi-play-fill"
          loading={actionLoading === 'start'}
          loadingLabel="Iniciando"
          disabled={Boolean(actionLoading)}
          onClick={requestStart}
        >
          Iniciar jornada
        </Button>
      </div>
    ) : (
      <div className="journey-load-pending" role="status">
        <i className="bi bi-box-seam" aria-hidden="true" />
        <div>
          <strong>Carga pendiente de confirmación</strong>
          <span>
            Bodega debe confirmar la carga completa antes de iniciar. Mientras tanto,
            la jornada permanece en modo de consulta.
          </span>
        </div>
      </div>
    )
  ) : canRenderFinishAction ? (
    <div className="journey-sidebar-actions">
      <Button
        tone="success"
        icon="bi bi-check2-circle"
        loading={actionLoading === 'finish'}
        loadingLabel="Finalizando"
        disabled={Boolean(actionLoading)}
        onClick={requestFinish}
      >
        Finalizar
      </Button>
    </div>
  ) : null;

  const sidebar = (
    <div className="journey-workspace-summary">
      <div className="journey-workspace-summary__heading">
        <span>Estado operativo</span>
        <StatusBadge tone={getStatusTone(jornada.estado)}>
          {formatStatus(jornada.estado)}
        </StatusBadge>
      </div>

      <dl className="journey-workspace-summary__details">
        <div>
          <dt>Camión</dt>
          <dd>{camion?.codigo || `CAM-${jornada.camion_id}`}</dd>
          <small>{camion?.placa || 'Sin placa registrada'}</small>
        </div>
        <div>
          <dt>Chofer</dt>
          <dd>{driverName || 'No asignado'}</dd>
        </div>
        <div>
          <dt>Punto actual</dt>
          <dd>{currentOrder}</dd>
          <small>{currentPoint?.ubicacion || 'Sin punto activo'}</small>
        </div>
      </dl>

      {canAssignDriver && jornada.estado === 'PLANIFICADA' && (
        <Button
          className="journey-workspace-summary__driver-action"
          tone="secondary"
          size="sm"
          icon="bi bi-person-check"
          disabled={Boolean(actionLoading)}
          onClick={openDriverAssignment}
        >
          {jornada.chofer_id ? 'Reasignar chofer' : 'Asignar chofer'}
        </Button>
      )}

      <div className="journey-progress-card">
        <div>
          <span>Entregas cerradas</span>
          <strong>{totalClosed} de {despachos.length}</strong>
        </div>
        <b>{progress}%</b>
        <div className="journey-progress-card__track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {operationalActions}
    </div>
  );


  return (
    <div className="journey-detail-page">
      <section className="journey-detail-metrics" aria-label="Resumen de la jornada">
        <StatCard
          label="Despachos"
          value={despachos.length}
          helper={`${despachosPorPunto.length} puntos de entrega`}
          icon="bi bi-box-seam"
        />
        <StatCard
          label="Distancia"
          value={formatDistance(jornada.distancia_total)}
          helper="Recorrido total estimado"
          icon="bi bi-signpost-split"
          tone="info"
        />
        <StatCard
          label="Tiempo"
          value={formatDuration(jornada.tiempo_estimado)}
          helper="Duración estimada"
          icon="bi bi-clock"
          tone="warning"
        />
      </section>

      <WorkspaceShell
        className="journey-workspace"
        sidebar={sidebar}
      >
        <section className="journey-workspace-panel">
          <header className="journey-workspace-panel__header">
            <div>
              <span>Secuencia de reparto</span>
              <h2>Despachos por punto</h2>
              <p>Consulta el orden de entrega y opera únicamente el punto activo.</p>
            </div>
            <strong>{despachosPorPunto.length} puntos</strong>
          </header>

          <div
            className={[
              'journey-points-list',
              despachosPorPunto.length > 4
                ? 'journey-points-list--scrollable'
                : '',
            ].filter(Boolean).join(' ')}
          >
            {despachosPorPunto.map((point) => {
              const allClosed = point.despachos.every((despacho) => [
                'ENTREGADO',
                'NO_ENTREGADO',
              ].includes(despacho.estado));
              const isCurrent = jornada.estado === 'EN_RUTA' && point.orden === currentOrder;
              const isCompleted = allClosed || point.orden < currentOrder;

              return (
                <article
                  key={point.orden}
                  className={[
                    'journey-point-card',
                    isCurrent ? 'journey-point-card--current' : '',
                    isCompleted ? 'journey-point-card--completed' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <header className="journey-point-card__header">
                    <span className="journey-point-card__number">
                      {isCompleted ? <i className="bi bi-check-lg" /> : point.orden}
                    </span>
                    <div>
                      <h3>{point.ubicacion}</h3>
                      <p>{point.despachos.length} {point.despachos.length === 1 ? 'despacho' : 'despachos'}</p>
                    </div>
                    <StatusBadge
                      tone={isCompleted ? 'success' : isCurrent ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {isCompleted ? 'Completado' : isCurrent ? 'Punto actual' : 'Pendiente'}
                    </StatusBadge>
                  </header>

                  <div className="journey-dispatch-list">
                    {point.despachos.map((despacho) => {
                      const canCloseDispatch =
                        jornada.estado === 'EN_RUTA' &&
                        despacho.estado === 'EN_TRANSITO' &&
                        Number(despacho.orden_entrega) === currentOrder;

                      return (
                        <div key={despacho.id} className="journey-dispatch-item">
                          <div className="journey-dispatch-item__content">
                            <strong>{formatOrderCode(despacho.pedido_id)}</strong>
                            <span>{despacho.cliente?.nombre || 'Cliente no disponible'}</span>
                            <small>{despacho.cliente?.direccion || 'Sin dirección registrada'}</small>
                          </div>

                          <div className="journey-dispatch-item__actions">
                            <StatusBadge tone={getStatusTone(despacho.estado)} size="sm">
                              {formatStatus(despacho.estado)}
                            </StatusBadge>

                            {canCloseDispatch && (canDeliverDispatch || canRejectDispatch) && (
                              <div className="journey-dispatch-item__buttons">
                                {canDeliverDispatch && (
                                  <Button
                                    size="sm"
                                    tone="success"
                                    icon="bi bi-check-lg"
                                    loading={actionLoading === `deliver-${despacho.id}`}
                                    loadingLabel="Entregando"
                                    disabled={Boolean(actionLoading)}
                                    onClick={() => executeAction({
                                      key: `deliver-${despacho.id}`,
                                      action: () => entregarDespacho(despacho.id),
                                      successMessage: 'Despacho entregado correctamente.',
                                    })}
                                  >
                                    Entregar
                                  </Button>
                                )}
                                {canRejectDispatch && (
                                  <Button
                                    size="sm"
                                    tone="danger"
                                    icon="bi bi-x-lg"
                                    disabled={Boolean(actionLoading)}
                                    onClick={() => requestNotDelivered(despacho)}
                                  >
                                    No entregado
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <JornadaMap
          mapa={jornada.mapa ?? null}
          estadoJornada={jornada.estado}
          posicionActualOrden={currentOrder}
        />
      </WorkspaceShell>

      <AsignarChoferModal
        key={`${jornada.id}-${jornada.chofer_id ?? 'unassigned'}-${driverModalOpen}`}
        open={driverModalOpen}
        jornada={jornada}
        choferActual={jornada.chofer ?? null}
        choferes={availableDrivers}
        isLoading={driversLoading}
        isSaving={actionLoading === 'assign-driver'}
        onSave={saveDriverAssignment}
        onClose={() => {
          if (actionLoading !== 'assign-driver') setDriverModalOpen(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmConfig)}
        title={confirmConfig?.title ?? ''}
        message={confirmConfig?.message ?? ''}
        confirmText={confirmConfig?.confirmText ?? 'Confirmar'}
        cancelText="Cancelar"
        variant={confirmConfig?.variant ?? 'warning'}
        loading={Boolean(actionLoading)}
        onCancel={() => setConfirmConfig(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export default JornadaDetallePage;
