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

import ChoferDetailDrawer from '../components/ChoferDetailDrawer';
import ChoferFormModal from '../components/ChoferFormModal';
import ChoferesMetrics from '../components/ChoferesMetrics';
import ChoferesTable from '../components/ChoferesTable';
import {
  getDriverStatus,
} from '../choferStatus.utils';
import {
  actualizarChofer,
  crearChofer,
  desactivarChofer,
  obtenerChofer,
  obtenerChoferes,
  obtenerUsuarios,
} from '../services/choferes.service';

import '../choferes.css';

const PAGE_SIZE = 10;

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function ChoferesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.CHOFERES_GESTIONAR);
  const canReadUsers = can(PERMISSIONS.USUARIOS_GESTIONAR);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const statusFilter = searchParams.get('estado') ?? 'TODOS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [choferes, setChoferes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formModal, setFormModal] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const loadDrivers = useCallback(async ({ notify = false } = {}) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [drivers, users] = await Promise.all([
        obtenerChoferes(),
        canManage && canReadUsers ? obtenerUsuarios() : Promise.resolve([]),
      ]);

      setChoferes(drivers);
      setUsuarios(users);

      if (notify) showSuccess('Choferes actualizados correctamente.');
    } catch (error) {
      console.error('Error al cargar choferes:', error);
      setLoadError(error);

      if (notify) {
        showError(error.message || 'No fue posible actualizar los choferes.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [canManage, canReadUsers]);

  useInitialLoad(loadDrivers);

  const pageActions = useMemo(() => (
    <>
      <Button
        className="topbar-page-action topbar-page-action--refresh"
        size="sm"
        tone="secondary"
        icon="bi bi-arrow-clockwise"
        loading={isLoading}
        loadingLabel="Actualizando"
        onClick={() => loadDrivers({ notify: true })}
      >
        Actualizar
      </Button>
      {canManage && (
        <Button
          className="topbar-page-action topbar-page-action--primary"
          size="sm"
          icon="bi bi-person-plus"
          onClick={() => setFormModal({ mode: 'create', chofer: null })}
        >
          Nuevo chofer
        </Button>
      )}
    </>
  ), [canManage, isLoading, loadDrivers]);

  usePageHeader(useMemo(() => ({
    title: 'Choferes',
    description: canManage
      ? 'Gestión de perfiles, licencias y disponibilidad para las jornadas.'
      : 'Consulta de perfiles y disponibilidad operativa de los choferes.',
    actions: pageActions,
  }), [canManage, pageActions]));

  const filteredDrivers = useMemo(() => {
    const search = normalizeText(searchTerm);

    return choferes.filter((chofer) => {
      const user = chofer.usuario ?? null;
      const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ');
      const matchesSearch = !search || [
        chofer.id,
        fullName,
        user?.correo,
        chofer.numero_licencia,
        chofer.categoria_licencia,
      ].some((value) => normalizeText(value).includes(search));
      const matchesStatus = statusFilter === 'TODOS' ||
        getDriverStatus(chofer) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [choferes, searchTerm, statusFilter]);

  const totalPages = Math.max(Math.ceil(filteredDrivers.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDrivers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredDrivers.slice(start, start + PAGE_SIZE);
  }, [filteredDrivers, safeCurrentPage]);
  const hasFilters = Boolean(searchTerm.trim()) || statusFilter !== 'TODOS';

  const openDetail = async (chofer) => {
    setSelectedDriver(chofer);
    setIsDetailLoading(true);

    try {
      setSelectedDriver(await obtenerChofer(chofer.id) ?? chofer);
    } catch (error) {
      showError(error.message || 'No fue posible cargar el perfil completo.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSave = async (payload) => {
    if (!canManage) return;

    try {
      setIsSaving(true);

      if (formModal?.mode === 'edit') {
        await actualizarChofer(formModal.chofer.id, payload);
        showSuccess('Chofer actualizado correctamente.');
      } else {
        await crearChofer(payload);
        showSuccess('Chofer registrado correctamente.');
      }

      setFormModal(null);
      await loadDrivers();
    } catch (error) {
      showError(error.message || 'No fue posible guardar el chofer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canManage || !pendingDeactivate?.id) return;

    try {
      await desactivarChofer(pendingDeactivate.id);
      showSuccess('Chofer desactivado correctamente.');
      setPendingDeactivate(null);
      await loadDrivers();
    } catch (error) {
      showError(error.message || 'No fue posible desactivar el chofer.');
    }
  };

  const openJourney = (jornada) => {
    if (!jornada?.id) return;

    navigate(`/jornadas/${jornada.id}`, {
      state: { from: '/choferes' },
    });
  };

  return (
    <div className="drivers-page">
      <ChoferesMetrics
        choferes={choferes}
        loading={isLoading && choferes.length === 0}
      />

      <section className="drivers-directory" aria-label="Directorio de choferes">
        <div className="drivers-toolbar">
          <div className="drivers-toolbar__filters">
            <SearchField
              className="drivers-toolbar__search"
              value={searchTerm}
              placeholder="Buscar chofer, correo o licencia"
              aria-label="Buscar choferes"
              onChange={(event) => updateQuery({ q: event.target.value, page: 1 })}
              onClear={() => updateQuery({ q: '', page: 1 })}
            />
            <Combobox
              className="drivers-toolbar__status"
              value={statusFilter}
              options={[
                { value: 'TODOS', label: 'Todos los estados' },
                { value: 'DISPONIBLE', label: 'Disponibles' },
                { value: 'EN_JORNADA', label: 'Con jornada' },
                { value: 'LICENCIA_VENCIDA', label: 'Licencia vencida' },
                { value: 'INACTIVO', label: 'Inactivos' },
              ]}
              searchable={false}
              ariaLabel="Filtrar choferes por estado"
              onChange={(value) => updateQuery({ estado: value, page: 1 })}
            />
          </div>

          <div className="drivers-toolbar__meta">
            {hasFilters && (
              <Button
                size="sm"
                tone="secondary"
                icon="bi bi-eraser"
                onClick={() => updateQuery({ q: '', estado: 'TODOS', page: 1 })}
              >
                Limpiar
              </Button>
            )}
            <p className="drivers-toolbar__summary">
              <strong>{filteredDrivers.length}</strong>{' '}
              {filteredDrivers.length === 1 ? 'chofer' : 'choferes'}
            </p>
          </div>
        </div>

        <div className="drivers-directory__content">
          <ChoferesTable
            choferes={paginatedDrivers}
            canManage={canManage}
            error={loadError}
            hasFilters={hasFilters}
            loading={isLoading && choferes.length === 0}
            onRetry={loadDrivers}
            onView={openDetail}
            onEdit={(chofer) => setFormModal({ mode: 'edit', chofer })}
            onDeactivate={setPendingDeactivate}
          />
        </div>

        {!isLoading && filteredDrivers.length > 0 && (
          <Pagination
            page={safeCurrentPage}
            pageSize={PAGE_SIZE}
            total={filteredDrivers.length}
            onPageChange={(page) => updateQuery({ page })}
          />
        )}
      </section>

      <ChoferFormModal
        key={formModal
          ? `${formModal.mode}-${formModal.chofer?.id ?? 'new'}`
          : 'closed'}
        open={canManage && Boolean(formModal)}
        mode={formModal?.mode}
        chofer={formModal?.chofer}
        choferes={choferes}
        usuarios={usuarios}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => {
          if (!isSaving) setFormModal(null);
        }}
      />

      <ChoferDetailDrawer
        open={Boolean(selectedDriver)}
        chofer={selectedDriver}
        loading={isDetailLoading}
        onClose={() => setSelectedDriver(null)}
        onOpenJourney={openJourney}
      />

      <ConfirmDialog
        open={canManage && Boolean(pendingDeactivate)}
        title="Desactivar chofer"
        message="El perfil dejará de estar disponible para nuevas jornadas."
        confirmText="Desactivar"
        cancelText="Volver"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}

export default ChoferesPage;
