import {
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
} from 'react-router-dom';

import {
  PERMISSIONS,
} from '../../../../shared/constants/permissions';
import {
  usePermissions,
} from '../../../../shared/hooks/usePermissions';
import {
  ConfirmDialog,
  Pagination,
} from '../../../../shared/ui';
import {
  showError,
  showSuccess,
} from '../../../../shared/utils/toast';

import RutasCatalogoToolbar from './RutasCatalogoToolbar';
import RutaDetailModal from './RutaDetailModal';
import RutaFormModal from './RutaFormModal';
import RutasTable from './RutasTable';
import {
  actualizarRuta,
  crearRuta,
  desactivarRuta,
} from '../../services/rutas.service';

const PAGE_SIZE = 10;

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function RutasCatalogo({
  createOpen,
  error,
  isLoading,
  onCreateClose,
  onRefresh,
  rutas,
  ubicaciones,
}) {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.RUTAS_GESTIONAR);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const originFilter = searchParams.get('origen') ?? 'TODOS';
  const destinationFilter = searchParams.get('destino') ?? 'TODOS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [formModal, setFormModal] = useState(null);
  const [detailRoute, setDetailRoute] = useState(null);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeFormModal = createOpen
    ? { mode: 'create', ruta: null }
    : formModal;

  const closeForm = () => {
    if (isSaving) return;

    if (createOpen) {
      onCreateClose();
      return;
    }

    setFormModal(null);
  };

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const normalized = String(value ?? '').trim();
      const shouldDelete = !normalized ||
        (key === 'page' && normalized === '1') ||
        (['origen', 'destino'].includes(key) && normalized === 'TODOS');

      if (shouldDelete) next.delete(key);
      else next.set(key, normalized);
    });

    setSearchParams(next, { replace: true });
  };

  const filteredRoutes = useMemo(() => {
    const search = normalizeText(searchTerm);

    return rutas.filter((ruta) => {
      const matchesSearch = !search || [
        ruta.id,
        ruta.origen?.nombre,
        ruta.destino?.nombre,
        ruta.distancia_km,
      ].some((value) => normalizeText(value).includes(search));
      const matchesOrigin =
        originFilter === 'TODOS' || Number(ruta.origen_id) === Number(originFilter);
      const matchesDestination =
        destinationFilter === 'TODOS' ||
        Number(ruta.destino_id) === Number(destinationFilter);

      return matchesSearch && matchesOrigin && matchesDestination;
    });
  }, [destinationFilter, originFilter, rutas, searchTerm]);

  const totalPages = Math.max(Math.ceil(filteredRoutes.length / PAGE_SIZE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRoutes = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredRoutes.slice(start, start + PAGE_SIZE);
  }, [filteredRoutes, safeCurrentPage]);

  const hasFilters = Boolean(searchTerm.trim()) ||
    originFilter !== 'TODOS' ||
    destinationFilter !== 'TODOS';



  const handleSave = async (payload) => {
    if (!canManage || !activeFormModal) return;

    try {
      setIsSaving(true);

      if (activeFormModal.mode === 'edit') {
        await actualizarRuta(activeFormModal.ruta.id, payload);
        showSuccess('Ruta actualizada correctamente.');
      } else {
        await crearRuta(payload);
        showSuccess('Ruta creada correctamente.');
      }

      if (createOpen) onCreateClose();
      else setFormModal(null);

      await onRefresh();
    } catch (saveError) {
      showError(saveError.message || 'No fue posible guardar la ruta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canManage || !pendingDeactivate?.id) return;

    try {
      await desactivarRuta(pendingDeactivate.id);
      showSuccess(`RUT-${String(pendingDeactivate.id).padStart(4, '0')} fue desactivada.`);
      setPendingDeactivate(null);
      await onRefresh();
    } catch (deactivateError) {
      showError(deactivateError.message || 'No fue posible desactivar la ruta.');
    }
  };

  return (
    <section className="routes-catalog" aria-label="Catálogo de rutas">
      <div className="routes-catalog__toolbar-row">
        <RutasCatalogoToolbar
          searchTerm={searchTerm}
          originFilter={originFilter}
          destinationFilter={destinationFilter}
          ubicaciones={ubicaciones}
          hasFilters={hasFilters}
          onSearchChange={(value) => updateQuery({ q: value, page: 1 })}
          onOriginChange={(value) => updateQuery({ origen: value, page: 1 })}
          onDestinationChange={(value) => updateQuery({ destino: value, page: 1 })}
          onClear={() => updateQuery({
            q: '',
            origen: 'TODOS',
            destino: 'TODOS',
            page: 1,
          })}
        />
        <p className="routes-catalog__summary">
          <strong>{filteredRoutes.length}</strong>{' '}
          {filteredRoutes.length === 1 ? 'ruta' : 'rutas'}
        </p>
      </div>

      <div className="routes-catalog__content">
        <RutasTable
          rutas={paginatedRoutes}
          canManage={canManage}
          loading={isLoading && rutas.length === 0}
          error={error}
          hasFilters={hasFilters}
          onRetry={onRefresh}
          onView={setDetailRoute}
          onEdit={(ruta) => setFormModal({ mode: 'edit', ruta })}
          onDeactivate={setPendingDeactivate}
        />
      </div>

      {!isLoading && filteredRoutes.length > 0 && (
        <Pagination
          page={safeCurrentPage}
          pageSize={PAGE_SIZE}
          total={filteredRoutes.length}
          onPageChange={(page) => updateQuery({ page })}
        />
      )}

      <RutaFormModal
        key={activeFormModal
          ? `${activeFormModal.mode}-${activeFormModal.ruta?.id ?? 'new'}`
          : 'closed'}
        open={canManage && Boolean(activeFormModal)}
        mode={activeFormModal?.mode}
        ruta={activeFormModal?.ruta}
        rutas={rutas}
        ubicaciones={ubicaciones}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={closeForm}
      />

      <RutaDetailModal
        open={Boolean(detailRoute)}
        ruta={detailRoute}
        onClose={() => setDetailRoute(null)}
      />

      <ConfirmDialog
        open={canManage && Boolean(pendingDeactivate)}
        title="Desactivar ruta"
        message={pendingDeactivate
          ? 'La conexión dejará de estar disponible para nuevas planificaciones.'
          : ''}
        confirmText="Desactivar"
        cancelText="Volver"
        variant="danger"
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </section>
  );
}

export default RutasCatalogo;
