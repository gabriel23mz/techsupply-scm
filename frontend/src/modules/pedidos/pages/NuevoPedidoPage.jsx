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
  useAuth,
} from '../../../shared/hooks/useAuth';

import {
  useInitialLoad,
} from '../../../shared/hooks/useInitialLoad';

import {
  usePageHeader,
} from '../../../shared/hooks/usePageHeader';

import {
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
} from '../../../shared/ui';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import NuevoPedidoForm from '../components/NuevoPedidoForm';
import PedidoProcessStepper from '../components/PedidoProcessStepper';

import {
  crearPedido,
  obtenerClientes,
} from '../services/pedido.service';

import {
  getReturnPath,
} from '../pedido.utils';

import '../pedidos.css';

function NuevoPedidoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnPath(searchParams);
  const { user } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const cargarCatalogos = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const clientesData = await obtenerClientes();
      setClientes(
        Array.isArray(clientesData)
          ? clientesData.filter((cliente) => cliente.estado !== false)
          : [],
      );
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useInitialLoad(cargarCatalogos);

  const pageActions = useMemo(
    () => (
      <Button
        className="topbar-page-action"
        size="sm"
        tone="secondary"
        icon="bi bi-arrow-left"
        onClick={() => setShowExitConfirm(true)}
      >
        Volver
      </Button>
    ),
    [],
  );

  const pageHeader = useMemo(
    () => ({
      title: 'Nuevo pedido',
      description:
        'Registra la información inicial antes de agregar productos.',
      actions: pageActions,
    }),
    [pageActions],
  );

  usePageHeader(pageHeader);

  const handleSubmit = async (payload) => {
    try {
      setIsSaving(true);
      const pedido = await crearPedido(payload);
      showSuccess('Pedido creado correctamente. Abriendo Workspace...');
      const encodedReturn = encodeURIComponent(returnTo);
      navigate(
        `/pedidos/${pedido.id}/workspace?returnTo=${encodedReturn}`,
        { replace: true },
      );
    } catch (error) {
      console.error('Error al crear pedido:', error);
      showError(error.message || 'No fue posible crear el pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="new-order-page">
      {loadError ? (
        <ErrorState
          actionLabel="Reintentar"
          onAction={cargarCatalogos}
        >
          {loadError.message || 'No fue posible preparar el formulario.'}
        </ErrorState>
      ) : isLoading ? (
        <LoadingState label="Preparando formulario..." />
      ) : (
        <div className="new-order-layout">
          <NuevoPedidoForm
            clientes={clientes}
            user={user}
            isSaving={isSaving}
            onSubmit={handleSubmit}
            onCancel={() => setShowExitConfirm(true)}
          />

          <PedidoProcessStepper />
        </div>
      )}

      <ConfirmDialog
        open={showExitConfirm}
        title="Salir del registro"
        message="La información no guardada se perderá."
        confirmText="Salir"
        cancelText="Permanecer"
        variant="warning"
        onConfirm={() => navigate(returnTo)}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

export default NuevoPedidoPage;
