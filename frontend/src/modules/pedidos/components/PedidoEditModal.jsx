import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  DateField,
  Modal,
} from '../../../shared/ui';

import {
  formatOrderCode,
  formatUser,
} from '../pedido.utils';

function buildInitialForm(pedido, currentUser) {
  return {
    cliente_id: String(pedido?.cliente_id ?? ''),
    usuario_id: String(
      pedido?.usuario_id ?? currentUser?.id ?? '',
    ),
    fecha_entrega: pedido?.fecha_entrega
      ? String(pedido.fecha_entrega).slice(0, 10)
      : '',
  };
}

function PedidoEditModal({
  canAssignUser = false,
  clientes,
  currentUser,
  isSaving,
  onClose,
  onSave,
  open,
  pedido,
  usuarios,
}) {
  const [formData, setFormData] = useState(() =>
    buildInitialForm(pedido, currentUser),
  );
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!formData.cliente_id) {
      nextErrors.cliente_id = 'Selecciona un cliente.';
    }

    if (!formData.usuario_id) {
      nextErrors.usuario_id = 'Selecciona un responsable.';
    }

    if (formData.fecha_entrega) {
      const selectedDate = new Date(`${formData.fecha_entrega}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        nextErrors.fecha_entrega =
          'La fecha estimada no puede estar en el pasado.';
      }
    }

    return nextErrors;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({
      cliente_id: true,
      usuario_id: true,
      fecha_entrega: true,
    });

    if (!isValid) return;

    onSave({
      cliente_id: Number(formData.cliente_id),
      usuario_id: Number(formData.usuario_id),
      fecha_entrega: formData.fecha_entrega || null,
    });
  };

  if (!pedido) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar ${formatOrderCode(pedido.id)}`}
      description="Actualiza la información comercial mientras el pedido permanezca pendiente."
      size="md"
      className="order-edit-modal"
      footer={
        <>
          <Button
            tone="secondary"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="order-edit-form"
            loading={isSaving}
            loadingLabel="Guardando"
            disabled={!isValid}
            icon="bi bi-check-lg"
          >
            Guardar cambios
          </Button>
        </>
      }
    >
      <form
        id="order-edit-form"
        className="order-edit-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <Combobox
          label="Cliente"
          required
          value={formData.cliente_id}
          options={clientes.map((cliente) => ({
            value: cliente.id,
            label: cliente.nombre,
            description: cliente.identificacion,
            icon: 'bi bi-person',
          }))}
          placeholder="Selecciona un cliente"
          searchPlaceholder="Buscar cliente..."
          error={touched.cliente_id ? errors.cliente_id : undefined}
          success={
            touched.cliente_id && !errors.cliente_id
              ? 'Cliente seleccionado.'
              : undefined
          }
          onChange={(value) => {
            setFormData((current) => ({
              ...current,
              cliente_id: value,
            }));
            setTouched((current) => ({
              ...current,
              cliente_id: true,
            }));
          }}
        />

        {canAssignUser ? (
          <Combobox
            label="Responsable"
            required
            value={formData.usuario_id}
            options={usuarios.map((usuario) => ({
              value: usuario.id,
              label: formatUser(usuario),
              description: usuario.correo,
              icon: 'bi bi-person-badge',
            }))}
            placeholder="Selecciona un responsable"
            searchPlaceholder="Buscar responsable..."
            error={touched.usuario_id ? errors.usuario_id : undefined}
            success={
              touched.usuario_id && !errors.usuario_id
                ? 'Responsable seleccionado.'
                : undefined
            }
            onChange={(value) => {
              setFormData((current) => ({
                ...current,
                usuario_id: value,
              }));
              setTouched((current) => ({
                ...current,
                usuario_id: true,
              }));
            }}
          />
        ) : (
          <div className="order-edit-responsible">
            <span>Responsable</span>
            <strong>{formatUser(currentUser ?? pedido.usuario)}</strong>
            <small>
              Ventas conserva al usuario autenticado como responsable.
            </small>
          </div>
        )}

        <DateField
          className="order-edit-date"
          label="Fecha estimada de entrega"
          optional
          value={formData.fecha_entrega}
          min={new Date().toISOString().split('T')[0]}
          error={
            touched.fecha_entrega
              ? errors.fecha_entrega
              : undefined
          }
          onChange={(value) => {
            setFormData((current) => ({
              ...current,
              fecha_entrega: value,
            }));
            setTouched((current) => ({
              ...current,
              fecha_entrega: true,
            }));
          }}
        />
      </form>
    </Modal>
  );
}

export default PedidoEditModal;
