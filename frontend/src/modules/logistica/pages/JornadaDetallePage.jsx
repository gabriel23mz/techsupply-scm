import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  useLocation,
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

import {
  avanzarJornada,
  entregarDespacho,
  finalizarJornada,
  iniciarJornada,
  marcarDespachoNoEntregado,
  obtenerJornada,
} from '../services/logistica.service';

import JornadaMap from '../components/JornadaMap';

import '../logistica.css';

/* ==========================================================================
   Formateadores
   ========================================================================== */

function formatJourneyCode(id) {
  return `JR-${String(id).padStart(5, '0')}`;
}

function formatOrderCode(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return '0,00 km';
  }

  return `${new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(distance)} km`;
}

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);

  if (
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return '0 min';
  }

  const hours = Math.floor(
    totalMinutes / 60,
  );

  const remainingMinutes =
    totalMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function formatStatus(status) {
  return String(status || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /^\w/,
      (character) =>
        character.toUpperCase(),
    );
}

/* ==========================================================================
   Adaptadores de relaciones Sequelize
   ========================================================================== */

function getPedido(despacho) {
  return (
    despacho?.pedido ??
    null
  );
}

function getCliente(pedido) {
  return (
    pedido?.cliente ??
    null
  );
}

function getUbicacion(cliente) {
  return (
    cliente?.ubicacion ??
    null
  );
}

/* ==========================================================================
   Página
   ========================================================================== */

function JornadaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    can,
  } = usePermissions();

  const canStartJourney = can(
    PERMISSIONS.JORNADAS_INICIAR,
  );

  const canFinishJourney = can(
    PERMISSIONS.JORNADAS_FINALIZAR,
  );

  const canDeliverDispatch = can(
    PERMISSIONS.DESPACHOS_ENTREGAR,
  );

  const canRejectDispatch = can(
    PERMISSIONS.DESPACHOS_NO_ENTREGAR,
  );

  /* --------------------------------------------------------------------------
     Estado principal
     -------------------------------------------------------------------------- */

  const [jornada, setJornada] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  /*
   * Una sola configuración controla todas las
   * confirmaciones de esta página.
   */
  const [
    confirmConfig,
    setConfirmConfig,
  ] = useState(null);

  /* --------------------------------------------------------------------------
     Barra sticky
     -------------------------------------------------------------------------- */

  const stickySentinelRef =
    useRef(null);

  const [
    isStickyBarStuck,
    setIsStickyBarStuck,
  ] = useState(false);

  /* --------------------------------------------------------------------------
     Carga de jornada
     -------------------------------------------------------------------------- */

  const cargarJornada =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const data =
          await obtenerJornada(id);

        setJornada(data);
      } catch (error) {
        console.error(
          'Error al cargar la jornada:',
          error,
        );

        setErrorMessage(
          error.message ||
            'No fue posible cargar la jornada seleccionada.',
        );

        setJornada(null);
      } finally {
        setIsLoading(false);
      }
    }, [id]);

  useInitialLoad(cargarJornada);

  /* --------------------------------------------------------------------------
     Navegación de retorno
     -------------------------------------------------------------------------- */

  const returnPath =
    location.state?.from ??
    '/centro-logistico';

  const cameFromRoutes =
    returnPath === '/rutas';

  const backLabel = cameFromRoutes
    ? 'Volver a Rutas'
    : 'Volver al Centro Logístico';

  const handleBack = () => {
    if (cameFromRoutes) {
      navigate('/rutas', {
        state: {
          activeTab:
            location.state?.returnTab ??
            'mapa',

          selectedJourneyId:
            location.state
              ?.selectedJourneyId ??
            Number(id),
        },
      });

      return;
    }

    navigate('/centro-logistico');
  };

  /* --------------------------------------------------------------------------
     Datos derivados
     -------------------------------------------------------------------------- */

  const despachos = useMemo(() => {
    return Array.isArray(
      jornada?.despachos,
    )
      ? jornada.despachos
      : [];
  }, [jornada]);

  const totalCerrados =
    useMemo(() => {
      return despachos.filter(
        (despacho) =>
          [
            'ENTREGADO',
            'NO_ENTREGADO',
          ].includes(
            despacho.estado,
          ),
      ).length;
    }, [despachos]);

  const progreso =
    despachos.length > 0
      ? Math.round(
          (totalCerrados /
            despachos.length) *
            100,
        )
      : 0;

  const despachosPorPunto =
    useMemo(() => {
      const grupos = new Map();

      despachos.forEach(
        (despacho) => {
          const orden = Number(
            despacho.orden_entrega,
          );

          const pedido =
            getPedido(despacho);

          const cliente =
            getCliente(pedido);

          const ubicacion =
            getUbicacion(cliente);

          if (!grupos.has(orden)) {
            grupos.set(orden, {
              orden,
              ubicacion:
                ubicacion?.nombre ||
                'Ubicación no disponible',
              latitud:
                ubicacion?.latitud ??
                null,
              longitud:
                ubicacion?.longitud ??
                null,
              despachos: [],
            });
          }

          grupos
            .get(orden)
            .despachos.push({
              ...despacho,
              pedido,
              cliente,
              ubicacion,
            });
        },
      );

      return [
        ...grupos.values(),
      ].sort(
        (a, b) =>
          a.orden - b.orden,
      );
    }, [despachos]);

  const proximoPunto =
    useMemo(() => {
      if (
        !despachosPorPunto.length
      ) {
        return null;
      }

      if (
        jornada?.estado ===
        'PLANIFICADA'
      ) {
        return despachosPorPunto[0];
      }

      const posicionActual = Number(
        jornada
          ?.posicion_actual_orden ??
          0,
      );

      return (
        despachosPorPunto.find(
          (punto) =>
            Number(punto.orden) ===
            posicionActual,
        ) ?? null
      );
    }, [
      despachosPorPunto,
      jornada,
    ]);

  /* --------------------------------------------------------------------------
     Detección del estado sticky
     -------------------------------------------------------------------------- */

  useEffect(() => {
    if (
      isLoading ||
      !jornada
    ) {
      return undefined;
    }

    const sentinel =
      stickySentinelRef.current;

    if (!sentinel) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setIsStickyBarStuck(
            !entry.isIntersecting,
          );
        },
        {
          threshold: 0,
          rootMargin:
            '-74px 0px 0px 0px',
        },
      );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [
    isLoading,
    jornada,
  ]);

  /* --------------------------------------------------------------------------
     Ejecutor común de acciones
     -------------------------------------------------------------------------- */

  const ejecutarAccion = async ({
    key,
    action,
    successMessage,
  }) => {
    try {
      setActionLoading(key);
      setErrorMessage('');

      await action();
      await cargarJornada();

      showSuccess(successMessage);
    } catch (error) {
      console.error(
        'Error en operación logística:',
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

  /* --------------------------------------------------------------------------
     Solicitudes de confirmación
     -------------------------------------------------------------------------- */

  const requestIniciar = () => {
    if (!canStartJourney) {
      return;
    }

    setConfirmConfig({
      type: 'INICIAR',
      title: 'Iniciar jornada',
      message: `¿Deseas iniciar la jornada ${formatJourneyCode(
        jornada.id,
      )}? El camión pasará a EN RUTA, los despachos cambiarán a EN TRÁNSITO y se notificará a los clientes asociados.`,
      confirmText: 'Iniciar jornada',
      cancelText: 'Cancelar',
      variant: 'info',
    });
  };

  const requestFinalizar = () => {
    if (!canFinishJourney) {
      return;
    }

    setConfirmConfig({
      type: 'FINALIZAR',
      title: 'Finalizar jornada',
      message:
        'La jornada se marcará como FINALIZADA, el camión regresará a bodega y los pedidos no entregados volverán a estar disponibles para una futura planificación.',
      confirmText: 'Finalizar jornada',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
  };

  const requestNoEntregado = (
    despacho,
  ) => {
    if (!canRejectDispatch) {
      return;
    }

    setConfirmConfig({
      type: 'NO_ENTREGADO',
      despachoId: despacho.id,
      pedidoId:
        despacho.pedido_id,
      title:
        'Marcar como no entregado',
      message: `¿Deseas marcar el pedido ${formatOrderCode(
        despacho.pedido_id,
      )} como no entregado? El pedido regresará al flujo logístico para una futura reasignación.`,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
  };

  /* --------------------------------------------------------------------------
     Acciones ejecutadas
     -------------------------------------------------------------------------- */

  const handleIniciar = async () => {
    if (!canStartJourney) {
      return;
    }

    setConfirmConfig(null);

    await ejecutarAccion({
      key: 'iniciar',
      action: () =>
        iniciarJornada(id),
      successMessage:
        'Jornada iniciada correctamente.',
    });
  };

  const handleAvanzar = async () => {
    if (!canStartJourney) {
      return;
    }

    await ejecutarAccion({
      key: 'avanzar',
      action: () =>
        avanzarJornada(id),
      successMessage:
        'La jornada avanzó al siguiente punto de entrega.',
    });
  };

  const handleFinalizar =
    async () => {
      if (!canFinishJourney) {
        return;
      }

      setConfirmConfig(null);

      await ejecutarAccion({
        key: 'finalizar',
        action: () =>
          finalizarJornada(id),
        successMessage:
          'Jornada finalizada correctamente.',
      });
    };

  const handleEntregar = async (
    despachoId,
  ) => {
    if (!canDeliverDispatch) {
      return;
    }

    await ejecutarAccion({
      key: `entregar-${despachoId}`,
      action: () =>
        entregarDespacho(
          despachoId,
        ),
      successMessage:
        'Despacho entregado correctamente.',
    });
  };

  const handleNoEntregado =
    async () => {
      const despachoId =
        confirmConfig?.despachoId;

      if (!canRejectDispatch || !despachoId) {
        setConfirmConfig(null);
        return;
      }

      setConfirmConfig(null);

      await ejecutarAccion({
        key: `no-entregado-${despachoId}`,
        action: () =>
          marcarDespachoNoEntregado(
            despachoId,
          ),
        successMessage:
          'El despacho fue marcado como no entregado.',
      });
    };

  /* --------------------------------------------------------------------------
     Confirmación dinámica
     -------------------------------------------------------------------------- */

  const handleConfirmAction =
    async () => {
      switch (
        confirmConfig?.type
      ) {
        case 'INICIAR':
          await handleIniciar();
          break;

        case 'FINALIZAR':
          await handleFinalizar();
          break;

        case 'NO_ENTREGADO':
          await handleNoEntregado();
          break;

        default:
          setConfirmConfig(null);
      }
    };

  const closeConfirmDialog = () => {
    setConfirmConfig(null);
  };

  /* --------------------------------------------------------------------------
     Estados iniciales
     -------------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="logistics-page">
        <div className="logistics-empty-state">
          <span className="spinner-border text-primary" />

          <h4>
            Cargando jornada...
          </h4>

          <p>
            Consultando información
            operativa y despachos.
          </p>
        </div>
      </div>
    );
  }

  if (!jornada) {
    return (
      <div className="logistics-page">
        <div className="logistics-empty-state">
          <i className="bi bi-exclamation-circle" />

          <h4>
            Jornada no disponible
          </h4>

          <p>
            {errorMessage ||
              'No se encontró la jornada solicitada.'}
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleBack}
          >
            {backLabel}
          </button>
        </div>
      </div>
    );
  }

  const showStickyState =
    !isLoading &&
    Boolean(jornada) &&
    isStickyBarStuck;

  const camion =
    jornada.camion ?? null;

  const mapa =
    jornada.mapa ?? null;

  return (
    <div className="logistics-page">
      {/* Detector de barra sticky */}

      <div
        ref={stickySentinelRef}
        className="journey-sticky-sentinel"
        aria-hidden="true"
      />

      {/* Barra superior fija */}

      <section
        className={[
          'journey-sticky-bar',
          showStickyState
            ? 'is-stuck'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className="journey-sticky-back"
          onClick={handleBack}
        >
          <i className="bi bi-arrow-left" />

          <span>{backLabel}</span>
        </button>

        <div className="journey-sticky-meta">
          <strong>
            {formatJourneyCode(
              jornada.id,
            )}
          </strong>

          <span
            className={`journey-status-chip ${String(
              jornada.estado || '',
            ).toLowerCase()}`}
          >
            <span className="journey-status-dot" />

            {formatStatus(
              jornada.estado,
            )}
          </span>
        </div>
      </section>

      {/* Error estructural */}

      {errorMessage && (
        <div
          className="alert alert-danger logistics-error-alert"
          role="alert"
        >
          <div>
            <i className="bi bi-exclamation-triangle me-2" />

            <span>
              {errorMessage}
            </span>
          </div>

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar mensaje"
            onClick={() =>
              setErrorMessage('')
            }
          />
        </div>
      )}

      {/* Resumen */}

      <section className="journey-summary-grid">
        <article className="journey-summary-card">
          <div className="journey-summary-icon truck">
            <i className="bi bi-truck" />
          </div>

          <div className="journey-summary-content">
            <span>Camión</span>

            <strong>
              {camion?.codigo ||
                `CAM-${jornada.camion_id}`}
            </strong>

            <small>
              {camion?.placa ||
                'Sin placa'}
            </small>
          </div>
        </article>

        <article className="journey-summary-card">
          <div className="journey-summary-icon dispatches">
            <i className="bi bi-box-seam" />
          </div>

          <div className="journey-summary-content">
            <span>Despachos</span>

            <strong>
              {despachos.length}
            </strong>

            <small>
              {
                despachosPorPunto.length
              }{' '}
              punto
              {despachosPorPunto.length ===
              1
                ? ''
                : 's'}
            </small>
          </div>
        </article>

        <article className="journey-summary-card">
          <div className="journey-summary-icon distance">
            <i className="bi bi-signpost-split" />
          </div>

          <div className="journey-summary-content">
            <span>
              Distancia
            </span>

            <strong>
              {formatDistance(
                jornada.distancia_total,
              )}
            </strong>

            <small>
              Ruta estimada
            </small>
          </div>
        </article>

        <article className="journey-summary-card">
          <div className="journey-summary-icon time">
            <i className="bi bi-clock" />
          </div>

          <div className="journey-summary-content">
            <span>Tiempo</span>

            <strong>
              {formatDuration(
                jornada.tiempo_estimado,
              )}
            </strong>

            <small>
              Duración estimada
            </small>
          </div>
        </article>
      </section>

      {/* Acciones de jornada */}

      <section className="journey-actions-card">
        <div>
          <h4>
            Acciones de jornada
          </h4>

          <p>
            Las acciones disponibles
            dependen del estado actual.
          </p>
        </div>

        <div className="journey-actions">
          {canStartJourney &&
          jornada.estado ===
            'PLANIFICADA' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={Boolean(
                actionLoading,
              )}
              onClick={requestIniciar}
            >
              {actionLoading ===
              'iniciar' ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-play-fill me-2" />
              )}

              Iniciar jornada
            </button>
          )}

          {jornada.estado ===
            'EN_RUTA' &&
          (canStartJourney ||
            canFinishJourney) && (
            <>
              {canStartJourney && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={Boolean(
                    actionLoading,
                  )}
                  onClick={handleAvanzar}
                >
                  {actionLoading ===
                  'avanzar' ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    <i className="bi bi-arrow-right me-2" />
                  )}

                  Avanzar
                </button>
              )}

              {canFinishJourney && (
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={Boolean(
                    actionLoading,
                  )}
                  onClick={
                    requestFinalizar
                  }
                >
                  {actionLoading ===
                  'finalizar' ? (
                    <span className="spinner-border spinner-border-sm me-2" />
                  ) : (
                    <i className="bi bi-check-circle me-2" />
                  )}

                  Finalizar
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Progreso */}

      <section className="journey-delivery-progress">
        <div className="journey-delivery-progress__header">
          <div>
            <span>
              Progreso de entregas
            </span>

            <strong>
              {totalCerrados} de{' '}
              {despachos.length}
            </strong>
          </div>

          <b>{progreso}%</b>
        </div>

        <div className="journey-delivery-progress__track">
          <span
            style={{
              width: `${progreso}%`,
            }}
          />
        </div>
      </section>

      {/* Primera parada o punto actual */}

      {proximoPunto && (
        <section className="journey-next-stop">
          <div className="journey-next-stop__icon">
            <i className="bi bi-geo-alt-fill" />
          </div>

          <div>
            <span>
              {jornada.estado ===
              'PLANIFICADA'
                ? 'Primera parada'
                : 'Punto actual'}
            </span>

            <strong>
              {proximoPunto.ubicacion}
            </strong>

            <small>
              {
                proximoPunto
                  .despachos.length
              }{' '}
              despacho
              {proximoPunto
                .despachos.length === 1
                ? ''
                : 's'}
            </small>
          </div>
        </section>
      )}

      {/* Ruta y mapa */}

      <section className="journey-layout">
        <div className="journey-points-panel">
          <div className="journey-section-header">
            <div>
              <span>
                Ruta de entrega
              </span>

              <h4>
                Despachos por punto
              </h4>
            </div>

            <strong>
              Punto actual:{' '}
              {jornada
                .posicion_actual_orden ??
                0}
            </strong>
          </div>

          {despachosPorPunto.map(
            (punto) => {
              const posicionActual =
                Number(
                  jornada
                    .posicion_actual_orden ??
                    0,
                );

              const todosCerrados =
                punto.despachos.every(
                  (despacho) =>
                    [
                      'ENTREGADO',
                      'NO_ENTREGADO',
                    ].includes(
                      despacho.estado,
                    ),
                );

              const esActual =
                jornada.estado ===
                  'EN_RUTA' &&
                Number(
                  punto.orden,
                ) === posicionActual;

              const esCompletado =
                todosCerrados ||
                Number(
                  punto.orden,
                ) < posicionActual;

              const esPendiente =
                !esActual &&
                !esCompletado;

              return (
                <article
                  key={punto.orden}
                  className={[
                    'journey-point-card',
                    esActual
                      ? 'current'
                      : '',
                    esCompletado
                      ? 'completed'
                      : '',
                    esPendiente
                      ? 'pending'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <header>
                    <div className="journey-point-marker">
                      {esCompletado ? (
                        <i className="bi bi-check-lg" />
                      ) : esActual ? (
                        <i className="bi bi-arrow-right" />
                      ) : (
                        <span>
                          {punto.orden}
                        </span>
                      )}
                    </div>

                    <div>
                      <h5>
                        {punto.ubicacion}
                      </h5>

                      <small>
                        {
                          punto
                            .despachos
                            .length
                        }{' '}
                        despacho
                        {punto
                          .despachos
                          .length === 1
                          ? ''
                          : 's'}
                      </small>
                    </div>

                    <span className="journey-point-state">
                      {esCompletado
                        ? 'Completado'
                        : esActual
                          ? 'Punto actual'
                          : 'Pendiente'}
                    </span>
                  </header>

                  <div className="journey-dispatch-list">
                    {punto.despachos.map(
                      (despacho) => {
                        const isCurrentPoint =
                          Number(
                            jornada
                              .posicion_actual_orden,
                          ) ===
                          Number(
                            despacho
                              .orden_entrega,
                          );

                        const canCloseDispatch =
                          jornada.estado ===
                            'EN_RUTA' &&
                          despacho.estado ===
                            'EN_TRANSITO' &&
                          isCurrentPoint;

                        const isDelivering =
                          actionLoading ===
                          `entregar-${despacho.id}`;

                        const isMarkingNotDelivered =
                          actionLoading ===
                          `no-entregado-${despacho.id}`;

                        return (
                          <div
                            key={
                              despacho.id
                            }
                            className="journey-dispatch-item"
                          >
                            <div>
                              <strong>
                                {formatOrderCode(
                                  despacho.pedido_id,
                                )}
                              </strong>

                              <span>
                                {despacho
                                  .cliente
                                  ?.nombre ||
                                  'Cliente no disponible'}
                              </span>

                              <small>
                                {despacho
                                  .cliente
                                  ?.direccion ||
                                  'Sin dirección registrada'}
                              </small>
                            </div>

                            <div className="journey-dispatch-actions">
                              <span className="logistics-status neutral">
                                {formatStatus(
                                  despacho.estado,
                                )}
                              </span>

                              {canCloseDispatch &&
                                (canDeliverDispatch ||
                                  canRejectDispatch) && (
                                  <>
                                    {canDeliverDispatch && (
                                      <button
                                        type="button"
                                        className="btn btn-success btn-sm"
                                        disabled={Boolean(
                                          actionLoading,
                                        )}
                                        onClick={() =>
                                          handleEntregar(
                                            despacho.id,
                                          )
                                        }
                                      >
                                        {isDelivering ? (
                                          <span className="spinner-border spinner-border-sm" />
                                        ) : (
                                          <>
                                            <i className="bi bi-check-lg me-1" />
                                            Entregar
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {canRejectDispatch && (
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        disabled={Boolean(
                                          actionLoading,
                                        )}
                                        onClick={() =>
                                          requestNoEntregado(
                                            despacho,
                                          )
                                        }
                                      >
                                        {isMarkingNotDelivered ? (
                                          <span className="spinner-border spinner-border-sm" />
                                        ) : (
                                          <>
                                            <i className="bi bi-x-lg me-1" />
                                            No entregado
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </>
                                )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>

        <JornadaMap
          mapa={mapa}
          estadoJornada={
            jornada.estado
          }
          posicionActualOrden={
            jornada
              .posicion_actual_orden ??
            0
          }
        />
      </section>

      {/* Confirmación reutilizable */}

      <ConfirmDialog
        open={Boolean(confirmConfig) && (
          confirmConfig?.type === 'INICIAR'
            ? canStartJourney
            : confirmConfig?.type === 'FINALIZAR'
              ? canFinishJourney
              : confirmConfig?.type === 'NO_ENTREGADO'
                ? canRejectDispatch
                : false
        )}
        title={
          confirmConfig?.title ?? ''
        }
        message={
          confirmConfig?.message ?? ''
        }
        confirmText={
          confirmConfig?.confirmText ??
          'Confirmar'
        }
        cancelText={
          confirmConfig?.cancelText ??
          'Cancelar'
        }
        variant={
          confirmConfig?.variant ??
          'warning'
        }
        onConfirm={
          handleConfirmAction
        }
        onCancel={
          closeConfirmDialog
        }
      />
    </div>
  );
}

export default JornadaDetallePage;
