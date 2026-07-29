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

import UsuarioDetailDrawer from '../components/UsuarioDetailDrawer';
import UsuarioFormModal from '../components/UsuarioFormModal';
import UsuariosMetrics from '../components/UsuariosMetrics';
import UsuariosTable from '../components/UsuariosTable';
import UsuariosToolbar from '../components/UsuariosToolbar';

import {
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  obtenerUsuario,
  obtenerUsuarios,
} from '../services/usuarios.service';

import {
  getUserFullName,
} from '../usuario.utils';

import '../usuarios.css';

const PAGE_SIZE = 10;

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function UsuariosPage() {
  const {
    can,
  } = usePermissions();

  const canManageUsers = can(
    PERMISSIONS.USUARIOS_GESTIONAR,
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') ?? '';
  const roleFilter = searchParams.get('rol') ?? 'TODOS';
  const currentPage = normalizePage(searchParams.get('page'));

  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [formModal, setFormModal] = useState(null);
  const [formSubmitError, setFormSubmitError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  const updateQuery = useCallback(
    (updates, { replace = true } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const normalizedValue = String(value ?? '').trim();

        if (
          !normalizedValue ||
          (key === 'page' && normalizedValue === '1') ||
          (key === 'rol' && normalizedValue === 'TODOS')
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

  const cargarUsuarios = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const data = await obtenerUsuarios();

        setUsuarios(Array.isArray(data) ? data : []);

        if (notify) {
          showSuccess('Información de usuarios actualizada.');
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setLoadError(error);

        if (notify) {
          showError(
            error.message ||
              'No fue posible actualizar el directorio de usuarios.',
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useInitialLoad(cargarUsuarios);

  const openCreateModal = useCallback(() => {
    if (!canManageUsers) return;

    setFormSubmitError('');
    setFormModal({
      mode: 'create',
      usuario: null,
    });
  }, [canManageUsers]);

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
          onClick={() => cargarUsuarios({ notify: true })}
        >
          Actualizar
        </Button>

        {canManageUsers && (
          <Button
            className="topbar-page-action topbar-page-action--primary"
            size="sm"
            icon="bi bi-person-plus"
            onClick={openCreateModal}
          >
            Nuevo usuario
          </Button>
        )}
      </>
    ),
    [
      canManageUsers,
      cargarUsuarios,
      isLoading,
      openCreateModal,
    ],
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Usuarios',
      description:
        'Administración de cuentas, roles y acceso a TechSupply SCM.',
      actions: pageActions,
    }),
    [pageActions],
  );

  usePageHeader(pageHeader);

  const filteredUsers = useMemo(() => {
    const search = normalizeText(searchTerm);

    return usuarios.filter((usuario) => {
      const matchesSearch =
        !search ||
        [
          usuario.nombre,
          usuario.apellido,
          getUserFullName(usuario),
          usuario.correo,
          usuario.rol,
        ].some((value) =>
          normalizeText(value).includes(search),
        );

      const matchesRole =
        roleFilter === 'TODOS' || usuario.rol === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchTerm, usuarios]);

  const totalPages = Math.max(
    Math.ceil(filteredUsers.length / PAGE_SIZE),
    1,
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safeCurrentPage]);

  const hasFilters =
    Boolean(searchTerm.trim()) || roleFilter !== 'TODOS';

  const clearFilters = () => {
    updateQuery({
      q: '',
      rol: 'TODOS',
      page: 1,
    });
  };

  const openDetail = async (usuario) => {
    setSelectedUser(usuario);
    setIsDetailLoading(true);

    try {
      const detail = await obtenerUsuario(usuario.id);
      setSelectedUser(detail ?? usuario);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      showError(
        error.message ||
          'No fue posible cargar la información completa del usuario.',
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openEditModal = (usuario) => {
    if (!canManageUsers) return;

    setSelectedUser(null);
    setFormSubmitError('');
    setFormModal({
      mode: 'edit',
      usuario,
    });
  };

  const handleSave = async (payload) => {
    if (!canManageUsers) return;

    try {
      setIsSaving(true);
      setFormSubmitError('');

      if (formModal?.mode === 'edit') {
        await actualizarUsuario(formModal.usuario.id, payload);
        showSuccess('Usuario actualizado correctamente.');
      } else {
        await crearUsuario(payload);
        showSuccess('Usuario registrado correctamente.');
      }

      setFormModal(null);
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);

      const message =
        error.message || 'No fue posible guardar el usuario.';

      setFormSubmitError(message);
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!canManageUsers || !pendingDeactivate?.id) return;

    try {
      setIsDeactivating(true);
      await desactivarUsuario(pendingDeactivate.id);

      showSuccess(
        `${getUserFullName(pendingDeactivate)} fue desactivado correctamente.`,
      );

      setPendingDeactivate(null);
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      showError(
        error.message || 'No fue posible desactivar el usuario.',
      );
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="users-page">
      <UsuariosMetrics
        usuarios={usuarios}
        loading={isLoading && usuarios.length === 0}
      />

      <section
        className="users-directory"
        aria-label="Directorio administrativo de usuarios"
      >
        <UsuariosToolbar
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          totalCount={usuarios.length}
          filteredCount={filteredUsers.length}
          hasFilters={hasFilters}
          onSearchChange={(value) =>
            updateQuery({ q: value, page: 1 })
          }
          onRoleChange={(value) =>
            updateQuery({ rol: value, page: 1 })
          }
          onClearFilters={clearFilters}
        />

        <div className="users-directory__content">
          <UsuariosTable
            usuarios={paginatedUsers}
            isLoading={isLoading && usuarios.length === 0}
            error={loadError}
            hasFilters={hasFilters}
            onView={openDetail}
            onEdit={openEditModal}
            onDeactivate={setPendingDeactivate}
            onClearFilters={clearFilters}
            onCreate={openCreateModal}
            onRetry={() => cargarUsuarios({ notify: true })}
          />
        </div>

        {!loadError &&
          !isLoading &&
          filteredUsers.length > PAGE_SIZE && (
            <Pagination
              page={safeCurrentPage}
              pageSize={PAGE_SIZE}
              total={filteredUsers.length}
              onPageChange={(page) =>
                updateQuery(
                  { page },
                  { replace: false },
                )
              }
            />
          )}
      </section>

      <UsuarioFormModal
        key={
          formModal
            ? `${formModal.mode}-${formModal.usuario?.id ?? 'new'}`
            : 'closed'
        }
        open={canManageUsers && Boolean(formModal)}
        mode={formModal?.mode ?? 'create'}
        usuario={formModal?.usuario ?? null}
        usuarios={usuarios}
        isSaving={isSaving}
        submitError={formSubmitError}
        onSave={handleSave}
        onClose={() => {
          if (!isSaving) {
            setFormModal(null);
            setFormSubmitError('');
          }
        }}
      />

      <UsuarioDetailDrawer
        open={Boolean(selectedUser)}
        usuario={selectedUser}
        isLoading={isDetailLoading}
        onClose={() => setSelectedUser(null)}
        onEdit={openEditModal}
      />

      <ConfirmDialog
        open={canManageUsers && Boolean(pendingDeactivate)}
        title="Desactivar usuario"
        message={
          pendingDeactivate
            ? `${getUserFullName(pendingDeactivate)} ya no podrá iniciar sesión ni realizar nuevas operaciones. Su información y el historial asociado permanecerán en el sistema.`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
        loading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => {
          if (!isDeactivating) {
            setPendingDeactivate(null);
          }
        }}
      />
    </div>
  );
}

export default UsuariosPage;
