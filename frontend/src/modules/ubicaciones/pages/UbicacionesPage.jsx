import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
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

import {
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  Pagination,
  SearchField,
  Tabs,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import UbicacionDetailModal from '../components/UbicacionDetailModal';
import UbicacionFormModal from '../components/UbicacionFormModal';
import UbicacionesMapaGeneral from '../components/UbicacionesMapaGeneral';
import UbicacionesMetrics from '../components/UbicacionesMetrics';
import UbicacionesTable from '../components/UbicacionesTable';

import {
  actualizarUbicacion,
  crearUbicacion,
  desactivarUbicacion,
  obtenerUbicaciones,
} from '../services/ubicaciones.service';

import {
  LOCATION_PAGE_SIZE,
  normalizeLocationPage,
  normalizeLocationText,
} from '../ubicacion.utils';

import '../ubicaciones.css';

const VIEW_TABS = [
  {
    id: 'lista',
    label: 'Lista',
    icon: 'bi bi-list-ul',
    panelId: 'locations-list-panel',
  },
  {
    id: 'mapa',
    label: 'Mapa',
    icon: 'bi bi-map',
    panelId: 'locations-map-panel',
  },
];

function UbicacionesPage() {
  const { can } = usePermissions();
  const canManageLocations = can(PERMISSIONS.UBICACIONES_GESTIONAR);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeView =
    searchParams.get('view') === 'mapa' ? 'mapa' : 'lista';
  const searchTerm = searchParams.get('q') ?? '';
  const currentPage = normalizeLocationPage(searchParams.get('page'));

  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formModal, setFormModal] = useState(null);
  const [detailLocation, setDetailLocation] = useState(null);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const updateQuery = useCallback(
    (updates, { replace = true } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const normalizedValue = String(value ?? '').trim();
        const shouldDelete =
          !normalizedValue ||
          (key === 'view' && normalizedValue === 'lista') ||
          (key === 'page' && normalizedValue === '1');

        if (shouldDelete) nextParams.delete(key);
        else nextParams.set(key, normalizedValue);
      });

      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams],
  );

  const cargarUbicaciones = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await obtenerUbicaciones();
        setUbicaciones(Array.isArray(data) ? data : []);

        if (notify) {
          showSuccess('Ubicaciones actualizadas correctamente.');
        }
      } catch (error) {
        console.error('Error al cargar ubicaciones:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message || 'No fue posible actualizar las ubicaciones.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarUbicaciones);

  const openCreateModal = useCallback(() => {
    if (!canManageLocations) return;

    setFormModal({
      mode: 'create',
      ubicacion: null,
    });
  }, [canManageLocations]);

  const pageActions = useMemo(
    () => (
      <>
        <Button
          className="topbar-page-action topbar-page-action--refresh"
          size="sm"
          tone="secondary"
          icon="bi bi-arrow-clockwise"
          loading={isLoading}
          loadingLabel="Actualizando"
          onClick={() => cargarUbicaciones({ notify: true })}
        >
          Actualizar
        </Button>

        {canManageLocations && (
          <Button
            className="topbar-page-action topbar-page-action--primary"
            size="sm"
            icon="bi bi-geo-alt-fill"
            onClick={openCreateModal}
          >
            Nueva ubicación
          </Button>
        )}
      </>
    ),
    [
      canManageLocations,
      cargarUbicaciones,
      isLoading,
      openCreateModal,
    ],
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Ubicaciones',
      description: canManageLocations
        ? 'Gestión de nodos geográficos utilizados por la operación.'
        : 'Consulta de ubicaciones y puntos de entrega disponibles.',
      actions: pageActions,
    }),
    [canManageLocations, pageActions],
  );

  usePageHeader(pageHeader);

  const filteredLocations = useMemo(() => {
    const search = normalizeLocationText(searchTerm);

    return ubicaciones.filter((ubicacion) => {
      const matchesSearch =
        !search ||
        [
          ubicacion.nombre,
          ubicacion.latitud,
          ubicacion.longitud,
        ].some((value) =>
          normalizeLocationText(value).includes(search),
        );

      return matchesSearch;
    });
  }, [searchTerm, ubicaciones]);

  const totalPages = Math.max(
    Math.ceil(filteredLocations.length / LOCATION_PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLocations = useMemo(() => {
    const start = (safeCurrentPage - 1) * LOCATION_PAGE_SIZE;
    return filteredLocations.slice(start, start + LOCATION_PAGE_SIZE);
  }, [filteredLocations, safeCurrentPage]);

  const clearFilters = () => {
    updateQuery({ q: '', page: 1 });
  };

  const handleSave = async (payload) => {
    if (!canManageLocations) return;

    try {
      setIsSaving(true);

      if (formModal?.mode === 'edit') {
        await actualizarUbicacion(formModal.ubicacion.id, payload);
        showSuccess('Ubicación actualizada correctamente.');
      } else {
        await crearUbicacion(payload);
        showSuccess('Ubicación creada correctamente.');
      }

      setFormModal(null);
      await cargarUbicaciones();
    } catch (error) {
      console.error('Error al guardar ubicación:', error);
      showError(error.message || 'No fue posible guardar la ubicación.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canManageLocations || !pendingDeactivate?.id) return;

    try {
      await desactivarUbicacion(pendingDeactivate.id);
      showSuccess(`${pendingDeactivate.nombre} fue desactivada.`);
      setPendingDeactivate(null);
      await cargarUbicaciones();
    } catch (error) {
      console.error('Error al desactivar ubicación:', error);
      showError(error.message || 'No fue posible desactivar la ubicación.');
    }
  };

  const hasFilters = Boolean(searchTerm.trim());

  return (
    <div className="locations-page">
      <Tabs
        className="locations-view-tabs"
        activeId={activeView}
        tabs={VIEW_TABS.map((tab) => ({
          ...tab,
          count: tab.id === 'lista' ? ubicaciones.length : undefined,
        }))}
        ariaLabel="Vistas de ubicaciones"
        onChange={(view) => updateQuery({ view, page: 1 })}
      />

      <UbicacionesMetrics
        ubicaciones={ubicaciones}
        loading={isLoading}
      />

      {loadError ? (
        <ErrorState
          actionLabel="Reintentar"
          onAction={cargarUbicaciones}
        >
          {loadError.message || 'No fue posible cargar las ubicaciones.'}
        </ErrorState>
      ) : activeView === 'mapa' ? (
        isLoading ? (
          <LoadingState label="Cargando mapa de ubicaciones..." />
        ) : (
          <section
            id="locations-map-panel"
            role="tabpanel"
            aria-labelledby="mapa-tab"
          >
            <UbicacionesMapaGeneral
              ubicaciones={ubicaciones}
              onView={setDetailLocation}
            />
          </section>
        )
      ) : (
        <section
          id="locations-list-panel"
          className="locations-directory"
          role="tabpanel"
          aria-labelledby="lista-tab"
        >
          <div className="locations-toolbar">
            <div className="locations-toolbar__filters">
              <SearchField
                value={searchTerm}
                placeholder="Buscar ubicación o coordenada"
                aria-label="Buscar ubicaciones"
                onChange={(event) =>
                  updateQuery({ q: event.target.value, page: 1 })
                }
                onClear={() => updateQuery({ q: '', page: 1 })}
              />

              {hasFilters && (
                <Button
                  size="sm"
                  tone="secondary"
                  icon="bi bi-eraser"
                  onClick={clearFilters}
                >
                  Limpiar
                </Button>
              )}
            </div>

            <p className="locations-toolbar__summary">
              <strong>{filteredLocations.length}</strong>{' '}
              {filteredLocations.length === 1
                ? 'ubicación'
                : 'ubicaciones'}
            </p>
          </div>

          <div className="locations-directory__content">
            {isLoading ? (
              <LoadingState label="Cargando ubicaciones..." />
            ) : (
              <UbicacionesTable
                ubicaciones={paginatedLocations}
                canManage={canManageLocations}
                onView={setDetailLocation}
                onEdit={(ubicacion) =>
                  setFormModal({ mode: 'edit', ubicacion })
                }
                onDeactivate={setPendingDeactivate}
              />
            )}
          </div>

          {!isLoading && filteredLocations.length > 0 && (
            <Pagination
              page={safeCurrentPage}
              pageSize={LOCATION_PAGE_SIZE}
              total={filteredLocations.length}
              onPageChange={(page) => updateQuery({ page })}
            />
          )}
        </section>
      )}

      <UbicacionFormModal
        key={
          formModal
            ? `${formModal.mode}-${formModal.ubicacion?.id ?? 'new'}`
            : 'closed'
        }
        open={canManageLocations && Boolean(formModal)}
        mode={formModal?.mode}
        ubicacion={formModal?.ubicacion}
        ubicaciones={ubicaciones}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => {
          if (!isSaving) setFormModal(null);
        }}
      />

      <UbicacionDetailModal
        open={Boolean(detailLocation)}
        ubicacion={detailLocation}
        onClose={() => setDetailLocation(null)}
      />

      <ConfirmDialog
        open={canManageLocations && Boolean(pendingDeactivate)}
        title="Desactivar ubicación"
        message={
          pendingDeactivate
            ? `${pendingDeactivate.nombre} dejará de estar disponible para nuevas operaciones.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Volver"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}

export default UbicacionesPage;
