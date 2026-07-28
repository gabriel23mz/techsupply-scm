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
  Pagination,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import ClienteDetailDrawer from '../components/ClienteDetailDrawer';
import ClienteFormModal from '../components/ClienteFormModal';
import ClientesMetrics from '../components/ClientesMetrics';
import ClientesTable from '../components/ClientesTable';
import ClientesToolbar from '../components/ClientesToolbar';

import {
  actualizarCliente,
  crearCliente,
  desactivarCliente,
  obtenerClientes,
  obtenerUbicaciones,
} from '../services/clientes.service';

import '../clientes.css';

const PAGE_SIZE = 10;

function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function isSelectableClientLocation(ubicacion) {
  if (ubicacion?.estado === false) {
    return false;
  }

  const category = String(
    ubicacion?.tipo ?? ubicacion?.categoria ?? '',
  )
    .trim()
    .toUpperCase();

  return ubicacion?.es_bodega !== true && category !== 'BODEGA';
}

function ClientesPage() {
  const {
    can,
  } = usePermissions();

  const canManageClients = can(
    PERMISSIONS.CLIENTES_GESTIONAR,
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const locationFilter = searchParams.get('ubicacion') ?? 'TODAS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [clientes, setClientes] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formModal, setFormModal] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const updateQuery = useCallback(
    (updates, { replace = true } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const normalizedValue = String(value ?? '').trim();

        if (
          !normalizedValue ||
          (key === 'page' && normalizedValue === '1') ||
          (key === 'ubicacion' && normalizedValue === 'TODAS')
        ) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, normalizedValue);
        }
      });

      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams],
  );

  const cargarDatos = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [clientesData, ubicacionesData] = await Promise.all([
          obtenerClientes(),
          obtenerUbicaciones(),
        ]);

        setClientes(
          Array.isArray(clientesData) ? clientesData : [],
        );

        setUbicaciones(
          Array.isArray(ubicacionesData)
            ? ubicacionesData.filter(isSelectableClientLocation)
            : [],
        );

        if (notify) {
          showSuccess('Información de clientes actualizada.');
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message ||
              'No fue posible actualizar el directorio de clientes.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarDatos);

  const openCreateModal = useCallback(() => {
    if (!canManageClients) {
      return;
    }

    setFormModal({
      mode: 'create',
      cliente: null,
    });
  }, [canManageClients]);

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
          onClick={() => cargarDatos({ notify: true })}
        >
          Actualizar
        </Button>

        {canManageClients && (
          <Button
            className="topbar-page-action topbar-page-action--primary"
            size="sm"
            icon="bi bi-person-plus"
            onClick={openCreateModal}
          >
            Nuevo cliente
          </Button>
        )}
      </>
    ),
    [
      canManageClients,
      cargarDatos,
      isLoading,
      openCreateModal,
    ],
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Clientes',
      description:
        canManageClients
          ? 'Gestión comercial, contacto y ubicación de clientes.'
          : 'Consulta del directorio comercial y ubicaciones de entrega.',
      actions: pageActions,
    }),
    [canManageClients, pageActions],
  );

  usePageHeader(pageHeader);

  const filteredClients = useMemo(() => {
    const search = normalizeText(searchTerm);

    return clientes.filter((cliente) => {
      const ubicacion = getLocation(cliente);

      const matchesSearch =
        !search ||
        [
          cliente.nombre,
          cliente.identificacion,
          cliente.telefono,
          cliente.correo,
          cliente.direccion,
          ubicacion?.nombre,
        ].some((value) =>
          normalizeText(value).includes(search),
        );

      const matchesLocation =
        locationFilter === 'TODAS' ||
        Number(cliente.ubicacion_id ?? ubicacion?.id) ===
          Number(locationFilter);

      return matchesSearch && matchesLocation;
    });
  }, [clientes, locationFilter, searchTerm]);

  const totalPages = Math.max(
    Math.ceil(filteredClients.length / PAGE_SIZE),
    1,
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedClients = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredClients.slice(start, start + PAGE_SIZE);
  }, [filteredClients, safeCurrentPage]);

  const handleSearchChange = (value) => {
    updateQuery({
      q: value,
      page: 1,
    });
  };

  const handleLocationChange = (value) => {
    updateQuery({
      ubicacion: value,
      page: 1,
    });
  };

  const clearFilters = () => {
    updateQuery({
      q: '',
      ubicacion: 'TODAS',
      page: 1,
    });
  };

  const openEditModal = (cliente) => {
    if (!canManageClients) {
      return;
    }

    setSelectedClient(null);
    setFormModal({
      mode: 'edit',
      cliente,
    });
  };

  const handleSave = async (payload) => {
    if (!canManageClients) {
      return;
    }

    try {
      setIsSaving(true);

      if (formModal?.mode === 'edit') {
        await actualizarCliente(formModal.cliente.id, payload);
        showSuccess('Cliente actualizado correctamente.');
      } else {
        await crearCliente(payload);
        showSuccess('Cliente creado correctamente.');
      }

      setFormModal(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      showError(
        error.message || 'No fue posible guardar el cliente.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canManageClients || !pendingDeactivate?.id) {
      return;
    }

    try {
      await desactivarCliente(pendingDeactivate.id);

      showSuccess(
        `${pendingDeactivate.nombre} fue desactivado correctamente.`,
      );

      setPendingDeactivate(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error al desactivar cliente:', error);
      showError(
        error.message || 'No fue posible desactivar el cliente.',
      );
    }
  };

  const hasFilters =
    Boolean(searchTerm.trim()) || locationFilter !== 'TODAS';

  return (
    <div className="clients-page">
      <ClientesMetrics
        clientes={clientes}
        loading={isLoading && clientes.length === 0}
      />

      <section
        className="clients-directory"
        aria-label="Directorio de clientes"
      >
        <ClientesToolbar
          searchTerm={searchTerm}
          locationFilter={locationFilter}
          ubicaciones={ubicaciones}
          totalCount={clientes.length}
          filteredCount={filteredClients.length}
          hasFilters={hasFilters}
          onSearchChange={handleSearchChange}
          onLocationChange={handleLocationChange}
          onClearFilters={clearFilters}
        />

        <div className="clients-directory__content">
          <ClientesTable
            clientes={paginatedClients}
            canManage={canManageClients}
            isLoading={isLoading && clientes.length === 0}
            error={loadError}
            hasFilters={hasFilters}
            onView={setSelectedClient}
            onEdit={openEditModal}
            onDeactivate={setPendingDeactivate}
            onClearFilters={clearFilters}
            onCreate={openCreateModal}
            onRetry={() => cargarDatos({ notify: true })}
          />
        </div>

        {!loadError &&
          !isLoading &&
          filteredClients.length > PAGE_SIZE && (
            <Pagination
              page={safeCurrentPage}
              pageSize={PAGE_SIZE}
              total={filteredClients.length}
              onPageChange={(page) =>
                updateQuery(
                  { page },
                  { replace: false },
                )
              }
            />
          )}
      </section>

      <ClienteFormModal
        key={
          formModal
            ? `${formModal.mode}-${formModal.cliente?.id ?? 'new'}`
            : 'closed'
        }
        open={canManageClients && Boolean(formModal)}
        mode={formModal?.mode ?? 'create'}
        cliente={formModal?.cliente ?? null}
        clientes={clientes}
        ubicaciones={ubicaciones}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => {
          if (!isSaving) {
            setFormModal(null);
          }
        }}
      />

      <ClienteDetailDrawer
        open={Boolean(selectedClient)}
        cliente={selectedClient}
        canManage={canManageClients}
        onClose={() => setSelectedClient(null)}
        onEdit={openEditModal}
      />

      <ConfirmDialog
        open={
          canManageClients && Boolean(pendingDeactivate)
        }
        title="Desactivar cliente"
        message={
          pendingDeactivate
            ? `${pendingDeactivate.nombre} dejará de estar disponible para nuevos pedidos, pero su información permanecerá en el historial del sistema.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}

export default ClientesPage;
