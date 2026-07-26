import {
  useMemo,
  useState,
} from 'react';

import ConfirmDialog from '../../../../shared/components/ConfirmDialog/ConfirmDialog';

import {
  PERMISSIONS,
} from '../../../../shared/constants/permissions';

import {
  usePermissions,
} from '../../../../shared/hooks/usePermissions';

import {
  showError,
  showSuccess,
} from '../../../../shared/utils/toast';

import RutaDetailModal from './RutaDetailModal';
import RutaFormModal from './RutaFormModal';
import RutasCatalogoToolbar from './RutasCatalogoToolbar';
import RutasTable from './RutasTable';
import RoutesPagination from '../RoutesPagination';

import {
  actualizarRuta,
  crearRuta,
  desactivarRuta,
} from '../../services/rutas.service';

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function formatRouteCode(id) {
  return `RUT-${String(id).padStart(4, '0')}`;
}

function RutasCatalogo({
  rutas,
  ubicaciones,
  onRefresh,
}) {
  const {
    can,
  } = usePermissions();

  const canManageRoutes = can(
    PERMISSIONS.RUTAS_GESTIONAR,
  );

  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    originFilter,
    setOriginFilter,
  ] = useState('todos');

  const [
    destinationFilter,
    setDestinationFilter,
  ] = useState('todos');

  const [
    formModal,
    setFormModal,
  ] = useState(null);

  const [
    detailRoute,
    setDetailRoute,
  ] = useState(null);

  const [
    routePendingDeactivate,
    setRoutePendingDeactivate,
  ] = useState(null);

  const [isSaving, setIsSaving] =
    useState(false);

  const PAGE_SIZE = 10;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const filteredRoutes = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    return rutas.filter((ruta) => {
      const matchesSearch =
        !search ||
        [
          ruta.id,
          ruta.origen?.nombre,
          ruta.destino?.nombre,
          ruta.distancia_km,
        ].some((value) =>
          normalizeText(value).includes(
            search,
          ),
        );

      const matchesOrigin =
        originFilter === 'todos' ||
        Number(ruta.origen_id) ===
          Number(originFilter);

      const matchesDestination =
        destinationFilter ===
          'todos' ||
        Number(ruta.destino_id) ===
          Number(destinationFilter);

      return (
        matchesSearch &&
        matchesOrigin &&
        matchesDestination
      );
    });
  }, [
    destinationFilter,
    originFilter,
    rutas,
    searchTerm,
  ]);

  const totalPages = Math.max(
    Math.ceil(
      filteredRoutes.length / PAGE_SIZE,
    ),
    1,
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedRoutes = useMemo(() => {
    const start =
      (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredRoutes.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [
    safeCurrentPage,
    filteredRoutes,
  ]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleOriginChange = (value) => {
    setOriginFilter(value);
    setCurrentPage(1);
  };

  const handleDestinationChange = (value) => {
    setDestinationFilter(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    if (!canManageRoutes) {
      return;
    }

    setFormModal({
      mode: 'create',
      ruta: null,
    });
  };

  const handleEdit = (ruta) => {
    if (!canManageRoutes) {
      return;
    }

    setFormModal({
      mode: 'edit',
      ruta,
    });
  };

  const closeFormModal = () => {
    if (isSaving) {
      return;
    }

    setFormModal(null);
  };

  const handleSave = async (
    payload,
  ) => {
    if (!canManageRoutes) {
      return;
    }

    try {
      setIsSaving(true);

      if (
        formModal?.mode === 'edit'
      ) {
        await actualizarRuta(
          formModal.ruta.id,
          payload,
        );

        showSuccess(
          'Ruta actualizada correctamente.',
        );
      } else {
        await crearRuta(payload);

        showSuccess(
          'Ruta creada correctamente.',
        );
      }

      setFormModal(null);

      await onRefresh();
    } catch (error) {
      console.error(
        'Error al guardar la ruta:',
        error,
      );

      showError(
        error.message ||
          'No fue posible guardar la ruta.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeactivate =
    async () => {
      const ruta =
        routePendingDeactivate;

      if (!canManageRoutes || !ruta?.id) {
        setRoutePendingDeactivate(
          null,
        );

        return;
      }

      try {
        await desactivarRuta(
          ruta.id,
        );

        showSuccess(
          `${formatRouteCode(
            ruta.id,
          )} fue desactivada correctamente.`,
        );

        setRoutePendingDeactivate(
          null,
        );

        await onRefresh();
      } catch (error) {
        console.error(
          'Error al desactivar la ruta:',
          error,
        );

        showError(
          error.message ||
            'No fue posible desactivar la ruta.',
        );
      }
    };

  return (
    <section className="routes-catalog">
      <div className="routes-tab-summary">
        <span>
          {filteredRoutes.length} de {rutas.length} rutas visibles
        </span>
      </div>

      <RutasCatalogoToolbar
        searchTerm={searchTerm}
        originFilter={originFilter}
        destinationFilter={
          destinationFilter
        }
        ubicaciones={ubicaciones}
        onSearchChange={handleSearchChange}
        onOriginChange={
          handleOriginChange
        }
        onDestinationChange={
          handleDestinationChange
        }
        onClear={() => {
          setSearchTerm('');
          setOriginFilter('todos');
          setDestinationFilter('todos');
          setCurrentPage(1);
        }}
        onCreate={handleCreate}
      />

      <RutasTable
        rutas={paginatedRoutes}
        onView={setDetailRoute}
        onEdit={handleEdit}
        onDeactivate={
          setRoutePendingDeactivate
        }
      />

      <RoutesPagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalItems={filteredRoutes.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      <RutaFormModal
        open={canManageRoutes && Boolean(formModal)}
        mode={
          formModal?.mode ??
          'create'
        }
        ruta={formModal?.ruta ?? null}
        rutas={rutas}
        ubicaciones={ubicaciones}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={closeFormModal}
      />

      <RutaDetailModal
        open={Boolean(detailRoute)}
        ruta={detailRoute}
        onClose={() =>
          setDetailRoute(null)
        }
      />

      <ConfirmDialog
        open={canManageRoutes && Boolean(
          routePendingDeactivate,
        )}
        title="Desactivar ruta"
        message={
          routePendingDeactivate
            ? `La ruta ${formatRouteCode(
                routePendingDeactivate.id,
              )} dejará de estar disponible para nuevas planificaciones, pero permanecerá en el historial.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={
          handleConfirmDeactivate
        }
        onCancel={() =>
          setRoutePendingDeactivate(
            null,
          )
        }
      />
    </section>
  );
}

export default RutasCatalogo;
