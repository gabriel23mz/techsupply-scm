import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';
import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '../../../shared/ui';
import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import JornadaMap from '../../logistica/components/JornadaMap';
import {
  avanzarMiJornada,
  entregarMiDespacho,
  finalizarMiJornada,
  iniciarMiJornada,
  marcarMiDespachoNoEntregado,
  obtenerMiJornada,
  obtenerMisJornadas,
  obtenerPerfilChofer,
} from '../services/miJornada.service';

import '../mi-jornada.css';

function formatCode(prefix, id, length = 5) {
  return `${prefix}-${String(id ?? '').padStart(length, '0')}`;
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

function formatDate(value) {
  if (!value) return 'Fecha no disponible';

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'long',
    }).format(date);
}

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${new Intl.NumberFormat('es-EC', {
      maximumFractionDigits: 2,
    }).format(distance)} km`
    : '0 km';
}

function choosePrimaryJourney(jornadas) {
  const priority = {
    EN_RUTA: 0,
    PLANIFICADA: 1,
    FINALIZADA: 2,
    CANCELADA: 3,
  };

  return [...jornadas].sort((first, second) => {
    const stateDifference = (priority[first.estado] ?? 9) -
      (priority[second.estado] ?? 9);

    if (stateDifference !== 0) return stateDifference;

    return Number(second.id) - Number(first.id);
  })[0] ?? null;
}

function buildDeliveryPoints(despachos) {
  const groups = new Map();

  despachos.forEach((despacho) => {
    const order = Number(despacho.orden_entrega);
    const pedido = despacho.pedido ?? null;
    const cliente = pedido?.cliente ?? null;
    const ubicacion = cliente?.ubicacion ?? null;

    if (!Number.isFinite(order)) return;

    if (!groups.has(order)) {
      groups.set(order, {
        orden: order,
        ubicacion: ubicacion?.nombre || cliente?.direccion || 'Ubicación no disponible',
        despachos: [],
      });
    }

    groups.get(order).despachos.push({
      ...despacho,
      cliente,
      pedido,
      ubicacion,
    });
  });

  return [...groups.values()].sort((first, second) => first.orden - second.orden);
}

function MiJornadaPage() {
  const [perfil, setPerfil] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [jornada, setJornada] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  const loadOperation = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [profileData, journeyList] = await Promise.all([
        obtenerPerfilChofer(),
        obtenerMisJornadas(),
      ]);
      const selected = choosePrimaryJourney(journeyList);
      const detail = selected?.id
        ? await obtenerMiJornada(selected.id)
        : null;

      setPerfil(profileData);
      setJornadas(journeyList);
      setJornada(detail);

      if (notify) showSuccess('Tu operación fue actualizada.');
    } catch (error) {
      console.error('Error al cargar Mi Jornada:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar tu jornada.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useInitialLoad(loadOperation);

  const pageActions = useMemo(() => (
    <Button
      className="topbar-page-action topbar-page-action--refresh"
      size="sm"
      tone="secondary"
      icon="bi bi-arrow-clockwise"
      loading={isLoading}
      loadingLabel="Actualizando"
      onClick={() => loadOperation({ notify: true })}
    >
      Actualizar
    </Button>
  ), [isLoading, loadOperation]);

  usePageHeader(useMemo(() => ({
    title: 'Mi jornada',
    description: 'Recorrido asignado, entregas del punto actual y progreso operativo.',
    actions: pageActions,
  }), [pageActions]));

  const despachos = useMemo(
    () => Array.isArray(jornada?.despachos) ? jornada.despachos : [],
    [jornada],
  );
  const puntos = useMemo(() => buildDeliveryPoints(despachos), [despachos]);
  const currentOrder = Number(jornada?.posicion_actual_orden ?? 0);
  const currentPoint = useMemo(() => {
    if (!puntos.length) return null;
    if (jornada?.estado === 'PLANIFICADA') return puntos[0];

    return puntos.find((point) => point.orden === currentOrder) ?? null;
  }, [currentOrder, jornada?.estado, puntos]);
  const closedDispatches = useMemo(
    () => despachos.filter((despacho) => [
      'ENTREGADO',
      'NO_ENTREGADO',
    ].includes(despacho.estado)).length,
    [despachos],
  );
  const progress = despachos.length
    ? Math.round((closedDispatches / despachos.length) * 100)
    : 0;
  const currentPointClosed = Boolean(currentPoint) &&
    currentPoint.despachos.every((despacho) => [
      'ENTREGADO',
      'NO_ENTREGADO',
    ].includes(despacho.estado));
  const hasNextPoint = puntos.some((point) => point.orden > currentOrder);
  const allClosed = despachos.length > 0 && closedDispatches === despachos.length;

  const refreshAfterAction = async (message) => {
    await loadOperation();
    showSuccess(message);
  };

  const executeAction = async ({ key, action, message }) => {
    try {
      setActionLoading(key);
      await action();
      await refreshAfterAction(message);
    } catch (error) {
      console.error('Error durante la jornada:', error);
      showError(error.message || 'No fue posible completar la operación.');
    } finally {
      setActionLoading('');
    }
  };

  const requestAction = (config) => setConfirmConfig(config);

  const handleConfirm = async () => {
    const config = confirmConfig;
    setConfirmConfig(null);

    if (!config) return;

    await executeAction(config);
  };

  if (loadError && !perfil && !jornada) {
    return (
      <ErrorState
        title="No fue posible cargar tu operación"
        actionLabel="Reintentar"
        onAction={() => loadOperation()}
      >
        {loadError.message || 'Verifica tu conexión y vuelve a intentarlo.'}
      </ErrorState>
    );
  }

  if (isLoading && !perfil && !jornada) {
    return <LoadingState label="Preparando tu jornada..." />;
  }

  const usuario = perfil?.usuario ?? null;
  const driverName = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(' ');
  const camion = jornada?.camion ?? null;
  const history = jornadas.filter((item) => Number(item.id) !== Number(jornada?.id));

  if (!jornada) {
    return (
      <div className="my-journey-page">
        <section className="my-journey-driver-card">
          <span className="my-journey-driver-card__icon">
            <i className="bi bi-person-badge" aria-hidden="true" />
          </span>
          <div>
            <span>Chofer autenticado</span>
            <strong>{driverName || 'Perfil operativo'}</strong>
            <small>Licencia {perfil?.numero_licencia || 'no disponible'}</small>
          </div>
        </section>

        <EmptyState
          icon="bi bi-calendar2-check"
          title="No tienes una jornada asignada"
          actionLabel="Actualizar"
          onAction={() => loadOperation({ notify: true })}
        >
          Cuando Logística asigne una jornada, aparecerá aquí con su recorrido y entregas.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="my-journey-page">
      <section className="my-journey-hero">
        <div className="my-journey-hero__top">
          <div>
            <span>Operación asignada</span>
            <h2>{jornada.codigo ?? formatCode('JR', jornada.id)}</h2>
            <p>{formatDate(jornada.fecha)}</p>
          </div>
          <StatusBadge tone={getStatusTone(jornada.estado)}>
            {formatStatus(jornada.estado)}
          </StatusBadge>
        </div>

        <div className="my-journey-progress">
          <div>
            <span>Progreso de entregas</span>
            <strong>{closedDispatches} de {despachos.length}</strong>
          </div>
          <b>{progress}%</b>
          <div className="my-journey-progress__track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <dl className="my-journey-summary">
          <div>
            <dt>Camión</dt>
            <dd>{camion?.codigo || 'No disponible'}</dd>
            <small>{camion?.placa || 'Sin placa'}</small>
          </div>
          <div>
            <dt>Punto actual</dt>
            <dd>{jornada.estado === 'PLANIFICADA' ? 'Salida' : currentOrder}</dd>
            <small>{currentPoint?.ubicacion || 'Bodega central'}</small>
          </div>
          <div>
            <dt>Recorrido</dt>
            <dd>{formatDistance(jornada.distancia_total)}</dd>
            <small>{puntos.length} puntos</small>
          </div>
        </dl>
      </section>

      {jornada.estado === 'EN_RUTA' && currentPoint && (
        <section className="my-journey-current-point">
          <header>
            <div>
              <span>Punto actual · {currentPoint.orden}</span>
              <h3>{currentPoint.ubicacion}</h3>
            </div>
            <StatusBadge tone={currentPointClosed ? 'success' : 'warning'} size="sm">
              {currentPointClosed ? 'Completado' : 'En atención'}
            </StatusBadge>
          </header>

          <div className="my-journey-dispatches">
            {currentPoint.despachos.map((despacho) => {
              const cliente = despacho.cliente ?? null;
              const canOperate = despacho.estado === 'EN_TRANSITO';

              return (
                <article key={despacho.id} className="my-journey-dispatch-card">
                  <div className="my-journey-dispatch-card__heading">
                    <div>
                      <span>{formatCode('DSP', despacho.id)}</span>
                      <strong>{cliente?.nombre || 'Cliente no disponible'}</strong>
                    </div>
                    <StatusBadge tone={getStatusTone(despacho.estado)} size="sm">
                      {formatStatus(despacho.estado)}
                    </StatusBadge>
                  </div>

                  <p>
                    <i className="bi bi-geo-alt" aria-hidden="true" />
                    {cliente?.direccion || despacho.ubicacion?.nombre || 'Dirección no disponible'}
                  </p>

                  {canOperate && (
                    <div className="my-journey-dispatch-card__actions">
                      <Button
                        size="sm"
                        tone="success"
                        icon="bi bi-check-lg"
                        loading={actionLoading === `deliver-${despacho.id}`}
                        loadingLabel="Entregando"
                        disabled={Boolean(actionLoading)}
                        onClick={() => executeAction({
                          key: `deliver-${despacho.id}`,
                          action: () => entregarMiDespacho(despacho.id),
                          message: 'Entrega registrada correctamente.',
                        })}
                      >
                        Entregar
                      </Button>
                      <Button
                        size="sm"
                        tone="danger"
                        icon="bi bi-x-lg"
                        disabled={Boolean(actionLoading)}
                        onClick={() => requestAction({
                          key: `not-delivered-${despacho.id}`,
                          action: () => marcarMiDespachoNoEntregado(despacho.id),
                          message: 'El despacho fue marcado como no entregado.',
                          title: 'Marcar como no entregado',
                          dialogMessage: 'El pedido volverá al flujo logístico para una futura reasignación.',
                          confirmText: 'No entregado',
                          variant: 'warning',
                        })}
                      >
                        No entregado
                      </Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="my-journey-content-grid">
        <div className="my-journey-route-column">
          <section className="my-journey-route-card">
            <header>
              <span>Secuencia de reparto</span>
              <h3>{puntos.length} puntos planificados</h3>
            </header>
            <ol className="my-journey-route-list">
              {puntos.map((point) => {
                const completed = point.despachos.every((despacho) => [
                  'ENTREGADO',
                  'NO_ENTREGADO',
                ].includes(despacho.estado));
                const current = jornada.estado === 'EN_RUTA' && point.orden === currentOrder;

                return (
                  <li
                    key={point.orden}
                    className={[
                      completed ? 'is-completed' : '',
                      current ? 'is-current' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span>{completed ? <i className="bi bi-check-lg" /> : point.orden}</span>
                    <div>
                      <strong>{point.ubicacion}</strong>
                      <small>{point.despachos.length} despachos</small>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {['PLANIFICADA', 'EN_RUTA'].includes(jornada.estado) && (
            <div className="my-journey-actions">
              {jornada.estado === 'PLANIFICADA' ? (
                <Button
                  icon="bi bi-play-fill"
                  loading={actionLoading === 'start'}
                  loadingLabel="Iniciando"
                  disabled={Boolean(actionLoading)}
                  onClick={() => requestAction({
                    key: 'start',
                    action: () => iniciarMiJornada(jornada.id),
                    message: 'Jornada iniciada correctamente.',
                    title: 'Iniciar jornada',
                    dialogMessage: 'Confirma que el camión y la carga están listos para comenzar el recorrido.',
                    confirmText: 'Iniciar jornada',
                    variant: 'info',
                  })}
                >
                  Iniciar jornada
                </Button>
              ) : (
                <>
                  {hasNextPoint && (
                    <Button
                      tone="secondary"
                      icon="bi bi-arrow-right"
                      loading={actionLoading === 'advance'}
                      loadingLabel="Avanzando"
                      disabled={Boolean(actionLoading) || !currentPointClosed}
                      title={!currentPointClosed
                        ? 'Cierra todos los despachos del punto actual para avanzar.'
                        : undefined}
                      onClick={() => executeAction({
                        key: 'advance',
                        action: () => avanzarMiJornada(jornada.id),
                        message: 'Avanzaste al siguiente punto de entrega.',
                      })}
                    >
                      Siguiente punto
                    </Button>
                  )}
                  {!hasNextPoint && (
                    <Button
                      tone="success"
                      icon="bi bi-flag-fill"
                      loading={actionLoading === 'finish'}
                      loadingLabel="Finalizando"
                      disabled={Boolean(actionLoading) || !allClosed}
                      title={!allClosed
                        ? 'Cierra todos los despachos antes de finalizar.'
                        : undefined}
                      onClick={() => requestAction({
                        key: 'finish',
                        action: () => finalizarMiJornada(jornada.id),
                        message: 'Jornada finalizada correctamente.',
                        title: 'Finalizar jornada',
                        dialogMessage: 'La operación se cerrará y el camión volverá a quedar disponible.',
                        confirmText: 'Finalizar jornada',
                        variant: 'warning',
                      })}
                    >
                      Finalizar jornada
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="my-journey-map-wrap">
          <JornadaMap
            mapa={jornada.mapa ?? null}
            estadoJornada={jornada.estado}
            posicionActualOrden={currentOrder}
          />
        </div>
      </div>

      {history.length > 0 && (
        <section className="my-journey-history">
          <header>
            <span>Historial reciente</span>
            <h3>Jornadas anteriores</h3>
          </header>
          <div className="my-journey-history__list">
            {history.slice(0, 4).map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.codigo ?? formatCode('JR', item.id)}</strong>
                  <small>{formatDate(item.fecha)}</small>
                </div>
                <StatusBadge tone={getStatusTone(item.estado)} size="sm">
                  {formatStatus(item.estado)}
                </StatusBadge>
              </article>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(confirmConfig)}
        title={confirmConfig?.title ?? ''}
        message={confirmConfig?.dialogMessage ?? ''}
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

export default MiJornadaPage;
