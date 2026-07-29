import {
  useCallback,
  useMemo,
  useState,
} from 'react';

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
import {
  Button,
} from '../../../shared/ui';
import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import RutasMetrics from '../components/RutasMetrics';
import RutasCatalogo from '../components/catalogo/RutasCatalogo';
import {
  obtenerRutas,
  obtenerUbicaciones,
} from '../services/rutas.service';

import '../rutas.css';

function RutasPage() {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.RUTAS_GESTIONAR);
  const [rutas, setRutas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [routesData, locationsData] = await Promise.all([
        obtenerRutas(),
        obtenerUbicaciones(),
      ]);

      setRutas(Array.isArray(routesData) ? routesData : []);
      setUbicaciones(Array.isArray(locationsData) ? locationsData : []);

      if (notify) showSuccess('Rutas actualizadas correctamente.');
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar las rutas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useInitialLoad(loadData);

  const pageActions = useMemo(() => (
    <>
      <Button
        className="topbar-page-action topbar-page-action--refresh"
        size="sm"
        tone="secondary"
        icon="bi bi-arrow-clockwise"
        loading={isLoading}
        loadingLabel="Actualizando"
        onClick={() => loadData({ notify: true })}
      >
        Actualizar
      </Button>
      {canManage && (
        <Button
          className="topbar-page-action topbar-page-action--primary"
          size="sm"
          icon="bi bi-plus-lg"
          onClick={() => setIsCreateOpen(true)}
        >
          Nueva ruta
        </Button>
      )}
    </>
  ), [canManage, isLoading, loadData]);

  usePageHeader(useMemo(() => ({
    title: 'Rutas',
    description: 'Configuración de conexiones viales entre ubicaciones logísticas.',
    actions: pageActions,
  }), [pageActions]));

  return (
    <div className="routes-page routes-page--catalog-only">
      <RutasMetrics
        rutas={rutas}
        ubicaciones={ubicaciones}
        loading={isLoading && rutas.length === 0}
      />
      <RutasCatalogo
        rutas={rutas}
        ubicaciones={ubicaciones}
        isLoading={isLoading}
        error={loadError}
        createOpen={isCreateOpen}
        onCreateClose={() => setIsCreateOpen(false)}
        onRefresh={loadData}
      />
    </div>
  );
}

export default RutasPage;
