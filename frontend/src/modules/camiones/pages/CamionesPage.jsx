import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
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
  Combobox,
  ConfirmDialog,
  Pagination,
  SearchField,
} from '../../../shared/ui';
import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import CamionDetailDrawer from '../components/CamionDetailDrawer';
import CamionFormModal from '../components/CamionFormModal';
import CamionesMetrics from '../components/CamionesMetrics';
import CamionesTable from '../components/CamionesTable';
import {
  actualizarCamion,
  crearCamion,
  desactivarCamion,
  obtenerCamion,
  obtenerCamiones,
} from '../services/camiones.service';

import '../camiones.css';

const PAGE_SIZE = 10;

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function CamionesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.CAMIONES_GESTIONAR);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [camiones, setCamiones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formModal, setFormModal] = useState(null);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const updateQuery = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const normalized = String(value ?? '').trim();
      const shouldDelete = !normalized ||
        (key === 'page' && normalized === '1') ||
        (key === 'estado' && normalized === 'TODOS');

      if (shouldDelete) next.delete(key);
      else next.set(key, normalized);
    });

    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadTrucks = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setCamiones(await obtenerCamiones());

      if (notify) showSuccess('Camiones actualizados correctamente.');
    } catch (error) {
      console.error('Error al cargar camiones:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar los camiones.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useInitialLoad(loadTrucks);

  const openCreate = useCallback(() => {
    if (canManage) setFormModal({ mode: 'create', camion: null });
  }, [canManage]);

  const pageActions = useMemo(() => (
    <>
      <Button
        className="topbar-page-action topbar-page-action--refresh"
        size="sm"
        tone="secondary"
        icon="bi bi-arrow-clockwise"
        loading={isLoading}
        loadingLabel="Actualizando"
        onClick={() => loadTrucks({ notify: true })}
      >
        Actualizar
      </Button>
      {canManage && (
        <Button
          className="topbar-page-action topbar-page-action--primary"
          size="sm"
          icon="bi bi-truck-front-fill"
          onClick={openCreate}
        >
          Nuevo camión
        </Button>
      )}
    </>
  ), [canManage, isLoading, loadTrucks, openCreate]);

  usePageHeader(useMemo(() => ({
    title: 'Camiones',
    description: canManage
      ? 'Gestión de la flota disponible para las jornadas de reparto.'
      : 'Consulta del estado y ocupación de la flota.',
    actions: pageActions,
  }), [canManage, pageActions]));

  const filteredTrucks = useMemo(() => {
    const search = normalizeText(searchTerm);

    return camiones.filter((camion) => {
      const matchesSearch = !search || [
        camion.codigo,
        camion.placa,
        camion.jornada?.codigo,
      ].some((value) => normalizeText(value).includes(search));
      const matchesStatus =
        statusFilter === 'TODOS' || camion.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [camiones, searchTerm, statusFilter]);

  const totalPages = Math.max(Math.ceil(filteredTrucks.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTrucks = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredTrucks.slice(start, start + PAGE_SIZE);
  }, [filteredTrucks, safeCurrentPage]);

  const hasFilters = Boolean(searchTerm.trim()) || statusFilter !== 'TODOS';

  const openDetail = async (camion) => {
    setSelectedTruck(camion);
    setIsDetailLoading(true);

    try {
      setSelectedTruck(await obtenerCamion(camion.id) ?? camion);
    } catch (error) {
      showError(error.message || 'No fue posible cargar el detalle del camión.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSave = async (payload) => {
    if (!canManage) return;

    try {
      setIsSaving(true);

      if (formModal?.mode === 'edit') {
        await actualizarCamion(formModal.camion.id, payload);
        showSuccess('Camión actualizado correctamente.');
      } else {
        await crearCamion(payload);
        showSuccess('Camión creado correctamente.');
      }

      setFormModal(null);
      await loadTrucks();
    } catch (error) {
      showError(error.message || 'No fue posible guardar el camión.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canManage || !pendingDeactivate?.id) return;

    try {
      await desactivarCamion(pendingDeactivate.id);
      showSuccess(`${pendingDeactivate.codigo} fue desactivado.`);
      setPendingDeactivate(null);
      await loadTrucks();
    } catch (error) {
      showError(error.message || 'No fue posible desactivar el camión.');
    }
  };

  const openJourney = (jornada) => {
    if (jornada?.id) navigate(`/jornadas/${jornada.id}`, { state: { from: '/camiones' } });
  };

  return (
    <div className="trucks-page">
      <CamionesMetrics
        camiones={camiones}
        loading={isLoading && camiones.length === 0}
      />

      <section className="trucks-directory" aria-label="Directorio de camiones">
        <div className="trucks-toolbar">
          <div className="trucks-toolbar__filters">
            <SearchField
              className="trucks-toolbar__search"
              value={searchTerm}
              placeholder="Buscar código, placa o jornada"
              aria-label="Buscar camiones"
              onChange={(event) => updateQuery({ q: event.target.value, page: 1 })}
              onClear={() => updateQuery({ q: '', page: 1 })}
            />
            <Combobox
              className="trucks-toolbar__status"
              value={statusFilter}
              options={[
                { value: 'TODOS', label: 'Todos los estados' },
                { value: 'EN_BODEGA', label: 'En bodega' },
                { value: 'EN_RUTA', label: 'En ruta' },
                { value: 'INACTIVO', label: 'Inactivo' },
              ]}
              searchable={false}
              ariaLabel="Filtrar camiones por estado"
              onChange={(value) => updateQuery({ estado: value, page: 1 })}
            />
          </div>

          <div className="trucks-toolbar__meta">
            {hasFilters && (
              <Button
                className="trucks-toolbar__clear"
                size="sm"
                tone="secondary"
                icon="bi bi-eraser"
                onClick={() => updateQuery({ q: '', estado: 'TODOS', page: 1 })}
              >
                Limpiar
              </Button>
            )}

            <p className="trucks-toolbar__summary">
              <strong>{filteredTrucks.length}</strong>{' '}
              {filteredTrucks.length === 1 ? 'camión' : 'camiones'}
            </p>
          </div>
        </div>

        <div className="trucks-directory__content">
          <CamionesTable
            camiones={paginatedTrucks}
            canManage={canManage}
            error={loadError}
            hasFilters={hasFilters}
            loading={isLoading && camiones.length === 0}
            onRetry={loadTrucks}
            onView={openDetail}
            onEdit={(camion) => setFormModal({ mode: 'edit', camion })}
            onDeactivate={setPendingDeactivate}
            onOpenJourney={openJourney}
          />
        </div>

        {!isLoading && filteredTrucks.length > 0 && (
          <Pagination
            page={safeCurrentPage}
            pageSize={PAGE_SIZE}
            total={filteredTrucks.length}
            onPageChange={(page) => updateQuery({ page })}
          />
        )}
      </section>

      <CamionFormModal
        key={formModal ? `${formModal.mode}-${formModal.camion?.id ?? 'new'}` : 'closed'}
        open={canManage && Boolean(formModal)}
        mode={formModal?.mode}
        camion={formModal?.camion}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => {
          if (!isSaving) setFormModal(null);
        }}
      />

      <CamionDetailDrawer
        open={Boolean(selectedTruck)}
        camion={selectedTruck}
        loading={isDetailLoading}
        onClose={() => setSelectedTruck(null)}
        onOpenJourney={openJourney}
      />

      <ConfirmDialog
        open={canManage && Boolean(pendingDeactivate)}
        title="Desactivar camión"
        message={pendingDeactivate
          ? `${pendingDeactivate.codigo} dejará de estar disponible para nuevas jornadas.`
          : ''}
        confirmText="Desactivar"
        cancelText="Volver"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}

export default CamionesPage;
