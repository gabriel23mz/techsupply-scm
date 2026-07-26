import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  usePermissions,
} from '../../../shared/hooks/usePermissions';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import ClienteDetailDrawer from '../components/ClienteDetailDrawer';
import ClienteFormModal from '../components/ClienteFormModal';
import ClientesBanner from '../components/ClientesBanner';
import ClientesMetrics from '../components/ClientesMetrics';
import ClientesPagination from '../components/ClientesPagination';
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
const BODEGA_CENTRAL_ID = 1;

function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function ClientesPage() {
  const {
    can,
  } = usePermissions();

  const canManageClients = can(
    PERMISSIONS.CLIENTES_GESTIONAR,
  );

  const [clientes, setClientes] =
    useState([]);

  const [ubicaciones, setUbicaciones] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    locationFilter,
    setLocationFilter,
  ] = useState('TODAS');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [formModal, setFormModal] =
    useState(null);

  const [
    selectedClient,
    setSelectedClient,
  ] = useState(null);

  const [
    pendingDeactivate,
    setPendingDeactivate,
  ] = useState(null);

  const cargarDatos = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);

        const [
          clientesData,
          ubicacionesData,
        ] = await Promise.all([
          obtenerClientes(),
          obtenerUbicaciones(),
        ]);

        setClientes(
          Array.isArray(clientesData)
            ? clientesData
            : [],
        );

        setUbicaciones(
          Array.isArray(ubicacionesData)
            ? ubicacionesData.filter(
              (ubicacion) =>
                ubicacion.estado !== false &&
                Number(ubicacion.id) !==
                  BODEGA_CENTRAL_ID,
            )
            : [],
        );

        if (notify) {
          showSuccess(
            'Información de clientes actualizada.',
          );
        }
      } catch (error) {
        console.error(
          'Error al cargar clientes:',
          error,
        );

        showError(
          error.message ||
            'No fue posible cargar el módulo de clientes.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarDatos);

  const filteredClients = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    return clientes.filter((cliente) => {
      const ubicacion =
        getLocation(cliente);

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
        Number(
          cliente.ubicacion_id ??
            ubicacion?.id,
        ) === Number(locationFilter);

      return (
        matchesSearch &&
        matchesLocation
      );
    });
  }, [
    clientes,
    locationFilter,
    searchTerm,
  ]);

  const totalPages = Math.max(
    Math.ceil(
      filteredClients.length /
        PAGE_SIZE,
    ),
    1,
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedClients =
    useMemo(() => {
      const start =
        (safeCurrentPage - 1) *
        PAGE_SIZE;

      return filteredClients.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      safeCurrentPage,
      filteredClients,
    ]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleLocationChange = (value) => {
    setLocationFilter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('TODAS');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    if (!canManageClients) {
      return;
    }

    setFormModal({
      mode: 'create',
      cliente: null,
    });
  };

  const openEditModal = (
    cliente,
  ) => {
    if (!canManageClients) {
      return;
    }

    setSelectedClient(null);

    setFormModal({
      mode: 'edit',
      cliente,
    });
  };

  const handleSave = async (
    payload,
  ) => {
    if (!canManageClients) {
      return;
    }

    try {
      setIsSaving(true);

      if (
        formModal?.mode ===
        'edit'
      ) {
        await actualizarCliente(
          formModal.cliente.id,
          payload,
        );

        showSuccess(
          'Cliente actualizado correctamente.',
        );
      } else {
        await crearCliente(payload);

        showSuccess(
          'Cliente creado correctamente.',
        );
      }

      setFormModal(null);

      await cargarDatos();
    } catch (error) {
      console.error(
        'Error al guardar cliente:',
        error,
      );

      showError(
        error.message ||
          'No fue posible guardar el cliente.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate =
    async () => {
      if (
        !canManageClients ||
        !pendingDeactivate?.id
      ) {
        return;
      }

      try {
        await desactivarCliente(
          pendingDeactivate.id,
        );

        showSuccess(
          `${pendingDeactivate.nombre} fue desactivado correctamente.`,
        );

        setPendingDeactivate(null);

        await cargarDatos();
      } catch (error) {
        console.error(
          'Error al desactivar cliente:',
          error,
        );

        showError(
          error.message ||
            'No fue posible desactivar el cliente.',
        );
      }
    };

  const hasFilters =
    Boolean(searchTerm.trim()) ||
    locationFilter !== 'TODAS';

  return (
    <div className="clients-page">
      <ClientesBanner
        isLoading={isLoading}
        onRefresh={() =>
          cargarDatos({
            notify: true,
          })
        }
      />

      <ClientesMetrics
        clientes={clientes}
      />

      <section className="clients-workspace">
        <ClientesToolbar
          searchTerm={searchTerm}
          locationFilter={
            locationFilter
          }
          ubicaciones={ubicaciones}
          onSearchChange={
            handleSearchChange
          }
          onLocationChange={
            handleLocationChange
          }
          onCreate={
            openCreateModal
          }
        />

        {isLoading ? (
          <div className="clients-loading">
            <span className="spinner-border text-primary" />

            <h4>
              Cargando clientes...
            </h4>

            <p>
              Consultando el directorio comercial.
            </p>
          </div>
        ) : (
          <>
            <ClientesTable
              clientes={
                paginatedClients
              }
              hasFilters={
                hasFilters
              }
              onView={
                setSelectedClient
              }
              onEdit={
                openEditModal
              }
              onDeactivate={
                setPendingDeactivate
              }
              onClearFilters={
                clearFilters
              }
              onCreate={
                openCreateModal
              }
            />

            <ClientesPagination
              currentPage={
                safeCurrentPage
              }
              totalPages={
                totalPages
              }
              totalItems={
                filteredClients.length
              }
              pageSize={
                PAGE_SIZE
              }
              onPageChange={
                setCurrentPage
              }
            />
          </>
        )}
      </section>

      <ClienteFormModal
        key={
          formModal
            ? `${formModal.mode}-${formModal.cliente?.id ?? 'new'}`
            : 'closed'
        }
        open={canManageClients && Boolean(formModal)}
        mode={
          formModal?.mode ??
          'create'
        }
        cliente={
          formModal?.cliente ??
          null
        }
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
        open={Boolean(
          selectedClient,
        )}
        cliente={
          selectedClient
        }
        onClose={() =>
          setSelectedClient(null)
        }
        onEdit={
          openEditModal
        }
      />

      <ConfirmDialog
        open={canManageClients && Boolean(
          pendingDeactivate,
        )}
        title="Desactivar cliente"
        message={
          pendingDeactivate
            ? `${pendingDeactivate.nombre} dejará de estar disponible para nuevos pedidos, pero su información permanecerá en el historial del sistema.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={
          handleDeactivate
        }
        onCancel={() =>
          setPendingDeactivate(
            null,
          )
        }
      />
    </div>
  );
}

export default ClientesPage;
