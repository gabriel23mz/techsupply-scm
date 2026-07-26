import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';

import {
  Button,
  SearchField,
  SelectField,
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
import UbicacionesTabs from '../components/UbicacionesTabs';

import {
  actualizarUbicacion,
  crearUbicacion,
  desactivarUbicacion,
  obtenerUbicaciones,
} from '../services/ubicaciones.service';

import '../ubicaciones.css';

const PAGE_SIZE = 10;

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function UbicacionesPage() {
  const {
    can,
  } = usePermissions();

  const canManageLocations = can(
    PERMISSIONS.UBICACIONES_GESTIONAR,
  );

  const [activeTab, setActiveTab] =
    useState('catalogo');

  const [ubicaciones, setUbicaciones] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('TODOS');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [formModal, setFormModal] =
    useState(null);

  const [detailLocation, setDetailLocation] =
    useState(null);

  const [
    pendingDeactivate,
    setPendingDeactivate,
  ] = useState(null);

  const cargarUbicaciones = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);

        const data =
          await obtenerUbicaciones();

        setUbicaciones(
          Array.isArray(data) ? data : [],
        );

        if (notify) {
          showSuccess(
            'Ubicaciones actualizadas correctamente.',
          );
        }
      } catch (error) {
        console.error(
          'Error al cargar ubicaciones:',
          error,
        );

        showError(
          error.message ||
            'No fue posible cargar las ubicaciones.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarUbicaciones);

  const filteredLocations = useMemo(() => {
    const search = normalizeText(searchTerm);

    return ubicaciones.filter((ubicacion) => {
      const matchesSearch =
        !search ||
        [
          ubicacion.nombre,
          ubicacion.latitud,
          ubicacion.longitud,
        ].some((value) =>
          normalizeText(value).includes(search),
        );

      const matchesStatus =
        statusFilter === 'TODOS' ||
        (statusFilter === 'ACTIVA' &&
          ubicacion.estado !== false) ||
        (statusFilter === 'INACTIVA' &&
          ubicacion.estado === false);

      return matchesSearch && matchesStatus;
    });
  }, [
    searchTerm,
    statusFilter,
    ubicaciones,
  ]);

  const totalPages = Math.max(
    Math.ceil(
      filteredLocations.length / PAGE_SIZE,
    ),
    1,
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedLocations = useMemo(() => {
    const start =
      (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredLocations.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [
    safeCurrentPage,
    filteredLocations,
  ]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSave = async (payload) => {
    if (!canManageLocations) {
      return;
    }

    try {
      setIsSaving(true);

      if (formModal?.mode === 'edit') {
        await actualizarUbicacion(
          formModal.ubicacion.id,
          payload,
        );

        showSuccess(
          'Ubicación actualizada correctamente.',
        );
      } else {
        await crearUbicacion(payload);

        showSuccess(
          'Ubicación creada correctamente.',
        );
      }

      setFormModal(null);

      await cargarUbicaciones();
    } catch (error) {
      console.error(
        'Error al guardar ubicación:',
        error,
      );

      showError(
        error.message ||
          'No fue posible guardar la ubicación.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (
      !canManageLocations ||
      !pendingDeactivate?.id
    ) {
      return;
    }

    try {
      await desactivarUbicacion(
        pendingDeactivate.id,
      );

      showSuccess(
        `${pendingDeactivate.nombre} fue desactivada correctamente.`,
      );

      setPendingDeactivate(null);

      await cargarUbicaciones();
    } catch (error) {
      console.error(
        'Error al desactivar ubicación:',
        error,
      );

      showError(
        error.message ||
          'No fue posible desactivar la ubicación.',
      );
    }
  };

  return (
    <div className="locations-page">
      <section className="locations-banner">
        <div className="locations-banner__icon">
          <i className="bi bi-geo-alt" />
        </div>

        <div>
          <strong>
            Nodos geográficos de la red logística
          </strong>

          <span>
            Administra los puntos centrales utilizados por
            clientes, rutas, jornadas y despachos.
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          disabled={isLoading}
          onClick={() =>
            cargarUbicaciones({
              notify: true,
            })
          }
        >
          {isLoading ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : (
            <i className="bi bi-arrow-clockwise me-2" />
          )}

          Actualizar
        </button>
      </section>

      <UbicacionesMetrics
        ubicaciones={ubicaciones}
      />

      <section className="locations-workspace">
        <UbicacionesTabs
          activeTab={activeTab}
          total={ubicaciones.length}
          onChange={setActiveTab}
        />

        {activeTab === 'catalogo' ? (
          <>
            <div className="locations-toolbar">
              <SearchField
                className="locations-search"
                value={searchTerm}
                placeholder="Buscar ubicación..."
                aria-label="Buscar ubicaciones"
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                onClear={() => handleSearchChange('')}
              />

              <SelectField
                value={statusFilter}
                options={[
                  { value: 'TODOS', label: 'Todos los estados' },
                  { value: 'ACTIVA', label: 'Activas' },
                  { value: 'INACTIVA', label: 'Inactivas' },
                ]}
                ariaLabel="Filtrar ubicaciones por estado"
                onChange={handleStatusChange}
              />

              <Can permission={PERMISSIONS.UBICACIONES_GESTIONAR}>
                <Button
                  icon="bi bi-plus-lg"
                  onClick={() =>
                    setFormModal({
                      mode: 'create',
                      ubicacion: null,
                    })
                  }
                >
                  Nueva ubicación
                </Button>
              </Can>
            </div>

            {isLoading ? (
              <div className="locations-loading">
                <span className="spinner-border text-primary" />
                <h4>Cargando ubicaciones...</h4>
              </div>
            ) : (
              <>
                <UbicacionesTable
                  ubicaciones={paginatedLocations}
                  onView={setDetailLocation}
                  onEdit={(ubicacion) => {
                    if (canManageLocations) {
                      setFormModal({
                        mode: 'edit',
                        ubicacion,
                      });
                    }
                  }}
                  onDeactivate={(ubicacion) => {
                    if (canManageLocations) {
                      setPendingDeactivate(ubicacion);
                    }
                  }}
                />

                {filteredLocations.length > PAGE_SIZE && (
                  <footer className="locations-pagination">
                    <span>
                      Página {safeCurrentPage} de {totalPages}
                    </span>

                    <div>
                      <button
                        type="button"
                        disabled={safeCurrentPage === 1}
                        onClick={() =>
                          setCurrentPage(safeCurrentPage - 1)
                        }
                      >
                        <i className="bi bi-chevron-left" />
                      </button>

                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          type="button"
                          className={
                            page === safeCurrentPage
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            setCurrentPage(page)
                          }
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={
                          safeCurrentPage === totalPages
                        }
                        onClick={() =>
                          setCurrentPage(safeCurrentPage + 1)
                        }
                      >
                        <i className="bi bi-chevron-right" />
                      </button>
                    </div>
                  </footer>
                )}
              </>
            )}
          </>
        ) : (
          <UbicacionesMapaGeneral
            ubicaciones={ubicaciones}
            onView={setDetailLocation}
            onRefresh={() =>
              cargarUbicaciones({
                notify: true,
              })
            }
          />
        )}
      </section>

      <UbicacionFormModal
        key={
          formModal
            ? `${formModal.mode}-${formModal.ubicacion?.id ?? 'new'}`
            : 'closed'
        }
        open={canManageLocations && Boolean(formModal)}
        mode={
          formModal?.mode ??
          'create'
        }
        ubicacion={
          formModal?.ubicacion ??
          null
        }
        ubicaciones={ubicaciones}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => {
          if (!isSaving) {
            setFormModal(null);
          }
        }}
      />

      <UbicacionDetailModal
        open={Boolean(detailLocation)}
        ubicacion={detailLocation}
        onClose={() =>
          setDetailLocation(null)
        }
      />

      <ConfirmDialog
        open={canManageLocations && Boolean(pendingDeactivate)}
        title="Desactivar ubicación"
        message={
          pendingDeactivate
            ? `${pendingDeactivate.nombre} dejará de estar disponible para nuevas operaciones logísticas.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleDeactivate}
        onCancel={() =>
          setPendingDeactivate(null)
        }
      />
    </div>
  );
}

export default UbicacionesPage;
