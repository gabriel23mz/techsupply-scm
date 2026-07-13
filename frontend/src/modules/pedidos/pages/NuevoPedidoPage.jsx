import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import NuevoPedidoForm from '../components/NuevoPedidoForm';
import PedidoProcessStepper from '../components/PedidoProcessStepper';

import {
  crearPedido,
  obtenerClientes,
  obtenerUsuarios,
} from '../services/pedido.service';

import '../pedidos.css';

function NuevoPedidoPage() {
  const navigate = useNavigate();

  const [clientes, setClientes] =
    useState([]);

  const [usuarios, setUsuarios] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    showExitConfirm,
    setShowExitConfirm,
  ] = useState(false);

  const cargarCatalogos =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const [
          clientesData,
          usuariosData,
        ] = await Promise.all([
          obtenerClientes(),
          obtenerUsuarios(),
        ]);

        setClientes(
          Array.isArray(clientesData)
            ? clientesData.filter(
              (cliente) =>
                cliente.estado !==
                false,
            )
            : [],
        );

        setUsuarios(
          Array.isArray(usuariosData)
            ? usuariosData.filter(
              (usuario) =>
                usuario.estado !==
                false,
            )
            : [],
        );
      } catch (error) {
        console.error(
          'Error al cargar catálogos:',
          error,
        );

        showError(
          error.message ||
            'No fue posible preparar el formulario.',
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  const handleSubmit = async (
    payload,
  ) => {
    try {
      setIsSaving(true);

      const pedido =
        await crearPedido(payload);

      showSuccess(
        'Pedido creado correctamente. Abriendo Workspace...',
      );

      navigate(
        `/pedidos/${pedido.id}/workspace`,
      );
    } catch (error) {
      console.error(
        'Error al crear pedido:',
        error,
      );

      showError(
        error.message ||
          'No fue posible crear el pedido.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="nuevo-pedido-page">
      <section className="nuevo-pedido-heading">
        <div>
          <span>Nuevo pedido</span>

          <h3>
            Registro inicial
          </h3>

          <p>
            Selecciona cliente y responsable antes de agregar productos en el Workspace.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() =>
            setShowExitConfirm(true)
          }
        >
          <i className="bi bi-arrow-left me-2" />
          Volver
        </button>
      </section>

      {isLoading ? (
        <div className="pedidos-loading nuevo-pedido-loading">
          <span className="spinner-border text-primary" />
          <h4>
            Preparando formulario...
          </h4>
        </div>
      ) : (
        <div className="nuevo-pedido-grid">
          <NuevoPedidoForm
            clientes={clientes}
            usuarios={usuarios}
            isSaving={isSaving}
            onSubmit={handleSubmit}
            onCancel={() =>
              setShowExitConfirm(true)
            }
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
        onConfirm={() =>
          navigate('/pedidos')
        }
        onCancel={() =>
          setShowExitConfirm(false)
        }
      />
    </div>
  );
}

export default NuevoPedidoPage;
