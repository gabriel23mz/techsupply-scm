import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';


import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import RutasBanner from '../components/RutasBanner';
import RutasMetrics from '../components/RutasMetrics';
import RutasTabs from '../components/RutasTabs';

import JornadasMapaPanel from '../components/mapa/JornadasMapaPanel';
import MapaGeneralJornadas from '../components/mapa/MapaGeneralJornadas';
import RutasCatalogo from '../components/catalogo/RutasCatalogo';
import CamionesTab from '../components/camiones/CamionesTab';

import {
  obtenerCamiones,
  obtenerMapaGeneral,
  obtenerRutas,
  obtenerUbicaciones,
} from '../services/rutas.service';

import '../rutas.css';

/* ==========================================================================
   Normalización de contratos
   ========================================================================== */

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
}

function getMapJourneys(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.jornadas)) {
    return data.jornadas;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

/* ==========================================================================
   Contenido temporal de cada pestaña
   ========================================================================== */

function TabLoadingState({ label }) {
  return (
    <div className="routes-empty-state">
      <span className="spinner-border text-primary" />

      <h4>Cargando {label}...</h4>

      <p>
        Consultando la información logística
        disponible.
      </p>
    </div>
  );
}


/* ==========================================================================
   Página principal
   ========================================================================== */

function RutasPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab ?? 'mapa',
  );

  const [
    ubicaciones,
    setUbicaciones,
  ] = useState([]);

  const [
    selectedJourneyId,
    setSelectedJourneyId,
  ] = useState(
    location.state?.selectedJourneyId ?? null,
  );

  const [
    mapFocusRequest,
    setMapFocusRequest,
  ] = useState(0);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    if (
      location.state?.selectedJourneyId !== undefined &&
      location.state?.selectedJourneyId !== null
    ) {
      setSelectedJourneyId(
        location.state.selectedJourneyId,
      );

      setMapFocusRequest(
        (current) => current + 1,
      );
    }
  }, [location.state]);

  const [mapaGeneral, setMapaGeneral] =
    useState(null);

  const [rutas, setRutas] =
    useState([]);

  const [camiones, setCamiones] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [hasInitialError, setHasInitialError] =
    useState(false);

  /* --------------------------------------------------------------------------
     Carga integral
     -------------------------------------------------------------------------- */

  const cargarDatos = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setHasInitialError(false);

        const results =
          await Promise.allSettled([
            obtenerMapaGeneral(),
            obtenerRutas(),
            obtenerCamiones(),
            obtenerUbicaciones(),
          ]);

        const [
          mapaResult,
          rutasResult,
          camionesResult,
          ubicacionesResult,
        ] = results;

        if (
          mapaResult.status === 'fulfilled'
        ) {
          setMapaGeneral(
            mapaResult.value,
          );
        } else {
          setMapaGeneral(null);

          console.error(
            'Error al cargar el mapa general:',
            mapaResult.reason,
          );
        }

        if (
          rutasResult.status === 'fulfilled'
        ) {
          setRutas(
            normalizeList(
              rutasResult.value,
            ),
          );
        } else {
          setRutas([]);

          console.error(
            'Error al cargar rutas:',
            rutasResult.reason,
          );
        }

        if (
          camionesResult.status ===
          'fulfilled'
        ) {
          setCamiones(
            normalizeList(
              camionesResult.value,
            ),
          );
        } else {
          setCamiones([]);

          console.error(
            'Error al cargar camiones:',
            camionesResult.reason,
          );
        }

        // Funcion de Ubicasiones entre rutas
        if (
          ubicacionesResult.status ===
          'fulfilled'
        ) {
          setUbicaciones(
            normalizeList(
              ubicacionesResult.value,
            ),
          );
        } else {
          setUbicaciones([]);

          console.error(
            'Error al cargar ubicaciones:',
            ubicacionesResult.reason,
          );
        }


        const failedRequests =
          results.filter(
            (result) =>
              result.status === 'rejected',
          );

        if (
          failedRequests.length ===
          results.length
        ) {
          setHasInitialError(true);

          showError(
            'No fue posible cargar la información del módulo de rutas.',
          );

          return;
        }

        if (
          failedRequests.length > 0
        ) {
          showError(
            'Algunos datos del módulo no pudieron cargarse.',
          );
        } else if (notify) {
          showSuccess(
            'Información logística actualizada.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /* --------------------------------------------------------------------------
     Datos derivados
     -------------------------------------------------------------------------- */

  const jornadas = useMemo(
    () => getMapJourneys(mapaGeneral),
    [mapaGeneral],
  );


  useEffect(() => {
    if (!jornadas.length) {
      setSelectedJourneyId(null);
      return;
    }

    const stillExists = jornadas.some(
      (jornada) =>
        Number(jornada.id) === Number(selectedJourneyId),
    );

    if (!stillExists) {
      setSelectedJourneyId(jornadas[0].id);
      setMapFocusRequest((current) => current + 1);
    }
  }, [jornadas, selectedJourneyId]);

  const handleSelectJourney = (jornada) => {
    if (!jornada?.id) {
      return;
    }

    setSelectedJourneyId(jornada.id);

    /*
    * El contador cambia incluso cuando se selecciona
    * nuevamente la misma jornada.
    */
    setMapFocusRequest((current) => current + 1);
  };

  const handleViewJourney = (jornada) => {
    if (!jornada?.id) {
      return;
    }

    navigate(
      `/centro-logistico/jornadas/${jornada.id}`,
      {
        state: {
          from: '/rutas',
          returnTab: 'mapa',
          selectedJourneyId: jornada.id,
        },
      },
    );
  };

  const handleViewTruckJourney = (
    camion,
  ) => {
    const journeyId =
      camion?.jornada?.id;

    if (!journeyId) {
      showError(
        'El camión no tiene una jornada asociada.',
      );

      return;
    }

    navigate(
      `/centro-logistico/jornadas/${journeyId}`,
      {
        state: {
          from: '/rutas',
          returnTab: 'camiones',
          selectedJourneyId:
            journeyId,
        },
      },
    );
  };

  const handleCenterTruckOnMap = (
    camion,
  ) => {
    const journeyId =
      camion?.jornada?.id;

    if (!journeyId) {
      showError(
        'El camión no tiene una jornada activa para mostrar en el mapa.',
      );

      return;
    }

    setActiveTab('mapa');
    setSelectedJourneyId(journeyId);

    setMapFocusRequest(
      (current) => current + 1,
    );

    showSuccess(
      `${
        camion.codigo ??
        `CAM-${String(
          camion.id,
        ).padStart(3, '0')}`
      } fue centrado en el mapa.`,
    );
  };

  const camionesEnRuta = useMemo(
    () =>
      camiones.filter(
        (camion) =>
          camion.estado === 'EN_RUTA',
      ).length,
    [camiones],
  );

  const camionesEnBodega = useMemo(
    () =>
      camiones.filter(
        (camion) =>
          camion.estado === 'EN_BODEGA',
      ).length,
    [camiones],
  );

  const metrics = useMemo(
    () => [
      {
        title: 'Jornadas visibles',
        value: jornadas.length,
        helper: 'Planificadas y en ruta',
        icon: 'bi-calendar3',
        variant: 'primary',
      },
      {
        title: 'Camiones en ruta',
        value: camionesEnRuta,
        helper: 'Monitoreo activo',
        icon: 'bi-truck',
        variant: 'success',
      },
      {
        title: 'Camiones en bodega',
        value: camionesEnBodega,
        helper: 'Disponibles o asignados',
        icon: 'bi-building',
        variant: 'warning',
      },
      {
        title: 'Rutas registradas',
        value: rutas.length,
        helper: 'Conexiones activas',
        icon: 'bi-signpost-split',
        variant: 'info',
      },
    ],
    [
      jornadas.length,
      camionesEnRuta,
      camionesEnBodega,
      rutas.length,
    ],
  );

  const counts = {
    jornadas: jornadas.length,
    rutas: rutas.length,
    camiones: camiones.length,
  };

  /* --------------------------------------------------------------------------
     Render de pestaña
     -------------------------------------------------------------------------- */

  const renderTabContent = () => {
    if (isLoading) {
      const labels = {
        mapa: 'el mapa general',
        catalogo: 'el catálogo de rutas',
        camiones: 'los camiones',
      };

      return (
        <TabLoadingState
          label={labels[activeTab]}
        />
      );
    }

    if (activeTab === 'mapa') {
      return (
        <section className="routes-map-workspace">
          <MapaGeneralJornadas
            jornadas={jornadas}
            selectedJourneyId={selectedJourneyId}
            focusRequest={mapFocusRequest}
            onSelectJourney={handleSelectJourney}
            onViewJourney={handleViewJourney}
          />

          <JornadasMapaPanel
            jornadas={jornadas}
            selectedJourneyId={selectedJourneyId}
            onSelectJourney={handleSelectJourney}
            onViewJourney={handleViewJourney}
          />
        </section>
      );
    }

    if (activeTab === 'catalogo') {
      return (
        <RutasCatalogo
          rutas={rutas}
          ubicaciones={ubicaciones}
          isLoading={isLoading}
          onRefresh={() =>
            cargarDatos({
              notify: false,
            })
          }
        />
      );
    }

    return (
      <CamionesTab
        camiones={camiones}
        isLoading={isLoading}
        onViewJourney={
          handleViewTruckJourney
        }
        onCenterMap={
          handleCenterTruckOnMap
        }
      />
    );
  };

  return (
    <div className="routes-page">
      <RutasBanner
        isLoading={isLoading}
        onRefresh={() =>
          cargarDatos({
            notify: true,
          })
        }
      />

      <RutasMetrics metrics={metrics} />

      {hasInitialError && (
        <section
          className="alert alert-danger routes-error-alert"
          role="alert"
        >
          <div>
            <i className="bi bi-exclamation-triangle" />

            <div>
              <strong>
                Información no disponible
              </strong>

              <span>
                Revisa la conexión con el backend e
                intenta actualizar nuevamente.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() =>
              cargarDatos({
                notify: true,
              })
            }
          >
            Reintentar
          </button>
        </section>
      )}

      <section className="routes-workspace">
        <RutasTabs
          activeTab={activeTab}
          counts={counts}
          onChange={setActiveTab}
        />

        <div className="routes-tab-content">
          {renderTabContent()}
        </div>
      </section>
    </div>
  );
}

export default RutasPage;

