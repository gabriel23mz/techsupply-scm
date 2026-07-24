import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

import GeneracionLoadingModal from '../components/GeneracionLoadingModal';
import JornadasTable from '../components/JornadasTable';
import LogisticsMetrics from '../components/LogisticsMetrics';
import LogisticsTabs from '../components/LogisticsTabs';
import LogisticsToolbar from '../components/LogisticsToolbar';
import PedidosDisponiblesTable from '../components/PedidosDisponiblesTable';
import ResultadoGeneracionModal from '../components/ResultadoGeneracionModal';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import {
  generarJornadas,
  obtenerJornadas,
  obtenerPedidosDisponibles,
  recalcularJornada,
} from '../services/logistica.service';

import '../logistica.css';

function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatJourneyCode(jornada) {
  if (jornada?.codigo) {
    return jornada.codigo;
  }

  return `JR-${String(jornada?.id ?? 0).padStart(
    5,
    '0',
  )}`;
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

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function CentroLogisticoPage() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | Datos principales
  |--------------------------------------------------------------------------
  */

  const [activeTab, setActiveTab] =
    useState('pedidos');

  const [
    pedidosDisponibles,
    setPedidosDisponibles,
  ] = useState([]);

  const [jornadas, setJornadas] =
    useState([]);

  /*
  |--------------------------------------------------------------------------
  | Estados de carga
  |--------------------------------------------------------------------------
  */

  const [isLoading, setIsLoading] =
    useState(true);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [
    recalculatingId,
    setRecalculatingId,
  ] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Filtros
  |--------------------------------------------------------------------------
  */

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('todos');

  /*
  |--------------------------------------------------------------------------
  | Modales y confirmaciones
  |--------------------------------------------------------------------------
  */

  const [
    resultadoGeneracion,
    setResultadoGeneracion,
  ] = useState(null);

  const [
    showGenerateConfirm,
    setShowGenerateConfirm,
  ] = useState(false);

  const [
    journeyPendingRecalculation,
    setJourneyPendingRecalculation,
  ] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Error estructural de carga
  |--------------------------------------------------------------------------
  |
  | Esta alerta se mantiene únicamente para errores que impiden cargar
  | completamente el Centro Logístico.
  |--------------------------------------------------------------------------
  */

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Carga inicial
  |--------------------------------------------------------------------------
  */

  const cargarDatos = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const [
        pedidosData,
        jornadasData,
      ] = await Promise.all([
        obtenerPedidosDisponibles(),
        obtenerJornadas(),
      ]);

      setPedidosDisponibles(
        Array.isArray(pedidosData)
          ? pedidosData
          : [],
      );

      setJornadas(
        Array.isArray(jornadasData)
          ? jornadasData
          : [],
      );
    } catch (error) {
      console.error(
        'Error al cargar el centro logístico:',
        error,
      );

      setErrorMessage(
        error.message ||
          'No fue posible cargar la información logística.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /*
  |--------------------------------------------------------------------------
  | Métricas
  |--------------------------------------------------------------------------
  */

  const metrics = useMemo(() => {
    const jornadasPlanificadas =
      jornadas.filter(
        (jornada) =>
          jornada.estado === 'PLANIFICADA',
      ).length;

    const jornadasEnRuta =
      jornadas.filter(
        (jornada) =>
          jornada.estado === 'EN_RUTA',
      ).length;

    const jornadasFinalizadas =
      jornadas.filter(
        (jornada) =>
          jornada.estado === 'FINALIZADA',
      ).length;

    return [
      {
        title: 'Pedidos listos',
        value: pedidosDisponibles.length,
        icon: 'bi-box-seam',
        variant: 'primary',
      },
      {
        title: 'Jornadas planificadas',
        value: jornadasPlanificadas,
        icon: 'bi-calendar-check',
        variant: 'info',
      },
      {
        title: 'Jornadas en ruta',
        value: jornadasEnRuta,
        icon: 'bi-truck',
        variant: 'warning',
      },
      {
        title: 'Jornadas finalizadas',
        value: jornadasFinalizadas,
        icon: 'bi-check-circle',
        variant: 'success',
      },
    ];
  }, [
    jornadas,
    pedidosDisponibles.length,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Filtro de pedidos
  |--------------------------------------------------------------------------
  */

  const filteredPedidos = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    if (!search) {
      return pedidosDisponibles;
    }

    return pedidosDisponibles.filter(
      (pedido) => {
        const cliente =
          getCliente(pedido);

        const ubicacion =
          getUbicacion(cliente);

        const searchableValues = [
          formatPedidoId(pedido.id),
          pedido.id,
          cliente?.nombre,
          cliente?.identificacion,
          cliente?.direccion,
          ubicacion?.nombre,
          pedido.fecha_entrega,
        ];

        return searchableValues.some(
          (value) =>
            normalizeText(value).includes(
              search,
            ),
        );
      },
    );
  }, [
    pedidosDisponibles,
    searchTerm,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Filtro de jornadas
  |--------------------------------------------------------------------------
  */

  const filteredJornadas = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    return jornadas.filter((jornada) => {
      const camion =
        jornada.camion ?? null;

      const searchableValues = [
        jornada.codigo,
        jornada.id,
        camion?.codigo,
        camion?.placa,
        camion?.descripcion,
        jornada.fecha,
        jornada.estado,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          normalizeText(value).includes(
            search,
          ),
        );

      const matchesStatus =
        statusFilter === 'todos' ||
        jornada.estado === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    jornadas,
    searchTerm,
    statusFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Cambio de pestaña
  |--------------------------------------------------------------------------
  */

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('todos');
    setErrorMessage('');
  };

  /*
  |--------------------------------------------------------------------------
  | Generar jornadas
  |--------------------------------------------------------------------------
  |
  | Primero se abre ConfirmDialog.
  | Después de confirmar comienza la operación larga.
  |--------------------------------------------------------------------------
  */

  const requestGenerateJourneys = () => {
    if (
      isGenerating ||
      pedidosDisponibles.length === 0
    ) {
      return;
    }

    setShowGenerateConfirm(true);
  };

  const handleGenerateJourneys =
    async () => {
      try {
        setShowGenerateConfirm(false);
        setIsGenerating(true);
        setResultadoGeneracion(null);

        const resultado =
          await generarJornadas();

        setResultadoGeneracion(
          resultado,
        );

        await cargarDatos();
      } catch (error) {
        console.error(
          'Error al generar jornadas:',
          error,
        );

        showError(
          error.message ||
            'No fue posible generar las jornadas de reparto.',
        );
      } finally {
        setIsGenerating(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Recalcular jornada
  |--------------------------------------------------------------------------
  |
  | La tabla solicita la acción y se almacena temporalmente la jornada.
  | El backend se llama únicamente después de confirmar.
  |--------------------------------------------------------------------------
  */

  const requestRecalculateJourney = (
    jornada,
  ) => {
    if (
      !jornada?.id ||
      recalculatingId !== null
    ) {
      return;
    }

    setJourneyPendingRecalculation(
      jornada,
    );
  };

  const handleRecalculateJourney =
    async () => {
      const jornada =
        journeyPendingRecalculation;

      if (
        !jornada?.id ||
        recalculatingId !== null
      ) {
        return;
      }

      try {
        setJourneyPendingRecalculation(
          null,
        );

        setRecalculatingId(
          jornada.id,
        );

        await recalcularJornada(
          jornada.id,
        );

        await cargarDatos();

        showSuccess(
          `${formatJourneyCode(
            jornada,
          )} fue recalculada correctamente.`,
        );
      } catch (error) {
        console.error(
          `Error al recalcular la jornada ${jornada.id}:`,
          error,
        );

        showError(
          error.message ||
            'No fue posible recalcular la jornada seleccionada.',
        );
      } finally {
        setRecalculatingId(null);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Navegación
  |--------------------------------------------------------------------------
  */

  const handleViewJourney = (
    jornada,
  ) => {
    if (!jornada?.id) {
      return;
    }

    navigate(
      `/centro-logistico/jornadas/${jornada.id}`,
    );
  };

  const handleViewGeneratedJourneys =
    () => {
      setActiveTab('jornadas');
      setSearchTerm('');
      setStatusFilter('todos');
    };

  const closeResultModal = () => {
    setResultadoGeneracion(null);
  };

  return (
    <div className="logistics-page">
      {/* Banner IA */}

      <section className="logistics-ai-banner">
        <div className="logistics-ai-icon">
          <i className="bi bi-stars" />
        </div>

        <div className="logistics-ai-content">
          <strong>
            Planificación logística inteligente
          </strong>

          <span>
            TechSupply distribuye los
            pedidos considerando capacidad,
            ubicación y optimización
            automática de rutas.
          </span>
        </div>

        <div className="logistics-ai-actions">
          <span className="logistics-ai-badge">
            IA logística
          </span>

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            disabled={isLoading || isGenerating}
            onClick={cargarDatos}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-arrow-clockwise me-2" />
            )}
            Actualizar
          </button>
        </div>
      </section>

      {/* Métricas */}

      <LogisticsMetrics
        metrics={metrics}
      />

      {/* Error estructural de carga */}

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

      {/* Panel principal */}

      <section className="logistics-panel">
        <LogisticsTabs
          activeTab={activeTab}
          pedidosCount={
            pedidosDisponibles.length
          }
          jornadasCount={
            jornadas.length
          }
          onChange={handleTabChange}
        />

        <LogisticsToolbar
          activeTab={activeTab}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          availableOrdersCount={
            pedidosDisponibles.length
          }
          isLoading={isLoading}
          isGenerating={isGenerating}
          onSearchChange={setSearchTerm}
          onStatusChange={
            setStatusFilter
          }
          onClear={() => {
            setSearchTerm('');
            setStatusFilter('todos');
          }}
          onGenerate={
            requestGenerateJourneys
          }
        />

        {isLoading ? (
          <div className="logistics-empty-state">
            <span
              className="spinner-border text-primary"
              role="status"
              aria-hidden="true"
            />

            <h4>
              Cargando información
              logística...
            </h4>

            <p>
              Consultando pedidos
              disponibles y jornadas de
              reparto registradas.
            </p>
          </div>
        ) : activeTab === 'pedidos' ? (
          <PedidosDisponiblesTable
            pedidos={filteredPedidos}
          />
        ) : (
          <JornadasTable
            jornadas={filteredJornadas}
            onView={
              handleViewJourney
            }
            onRecalculate={
              requestRecalculateJourney
            }
            recalculatingId={
              recalculatingId
            }
          />
        )}
      </section>

      {/* Modal de carga de generación */}

      <GeneracionLoadingModal
        open={isGenerating}
      />

      {/* Modal amplio con resultado */}

      <ResultadoGeneracionModal
        open={Boolean(
          resultadoGeneracion,
        )}
        resultado={
          resultadoGeneracion
        }
        onClose={
          closeResultModal
        }
        onViewJourneys={
          handleViewGeneratedJourneys
        }
      />

      {/* Confirmación para generar jornadas */}

      <ConfirmDialog
        open={showGenerateConfirm}
        title="Generar jornadas de reparto"
        message={`Se planificarán automáticamente ${pedidosDisponibles.length} pedido${
          pedidosDisponibles.length === 1
            ? ''
            : 's'
        } entre los camiones disponibles, considerando capacidad, ubicación y optimización de rutas.`}
        confirmText="Generar jornadas"
        cancelText="Cancelar"
        variant="info"
        onConfirm={
          handleGenerateJourneys
        }
        onCancel={() =>
          setShowGenerateConfirm(false)
        }
      />

      {/* Confirmación para recalcular */}

      <ConfirmDialog
        open={Boolean(
          journeyPendingRecalculation,
        )}
        title="Recalcular jornada"
        message={
          journeyPendingRecalculation
            ? `Se volverá a evaluar la planificación de ${formatJourneyCode(
                journeyPendingRecalculation,
              )}. Solo se incorporarán nuevos pedidos si existe capacidad disponible y se cumplen las reglas de desvío permitido.`
            : ''
        }
        confirmText="Recalcular"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={
          handleRecalculateJourney
        }
        onCancel={() =>
          setJourneyPendingRecalculation(
            null,
          )
        }
      />
    </div>
  );
}

export default CentroLogisticoPage;

