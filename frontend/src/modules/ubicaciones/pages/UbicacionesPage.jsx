import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

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

  useEffect(() => {
    cargarUbicaciones();
  }, [cargarUbicaciones]);

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

  const paginatedLocations = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredLocations.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [
    currentPage,
    filteredLocations,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const handleSave = async (payload) => {
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
    if (!pendingDeactivate?.id) {
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
              <div className="locations-search">
                <i className="bi bi-search" />

                <input
                  type="search"
                  className="form-control"
                  value={searchTerm}
                  placeholder="Buscar ubicación..."
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                />
              </div>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                <option value="TODOS">
                  Todos los estados
                </option>

                <option value="ACTIVA">
                  Activas
                </option>

                <option value="INACTIVA">
                  Inactivas
                </option>
              </select>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setFormModal({
                    mode: 'create',
                    ubicacion: null,
                  })
                }
              >
                <i className="bi bi-plus-lg me-2" />
                Nueva ubicación
              </button>
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
                  onEdit={(ubicacion) =>
                    setFormModal({
                      mode: 'edit',
                      ubicacion,
                    })
                  }
                  onDeactivate={
                    setPendingDeactivate
                  }
                />

                {filteredLocations.length > PAGE_SIZE && (
                  <footer className="locations-pagination">
                    <span>
                      Página {currentPage} de {totalPages}
                    </span>

                    <div>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage(
                            (page) => page - 1,
                          )
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
                            page === currentPage
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
                          currentPage === totalPages
                        }
                        onClick={() =>
                          setCurrentPage(
                            (page) => page + 1,
                          )
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
        open={Boolean(formModal)}
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
        open={Boolean(pendingDeactivate)}
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
