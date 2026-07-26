import { useState } from 'react';

import {
  Combobox,
} from '../../../shared/ui';


function buildInitialForm(pedido) {
  return {
    cliente_id: String(pedido?.cliente_id ?? ''),
    usuario_id: String(pedido?.usuario_id ?? ''),
    fecha_entrega: pedido?.fecha_entrega ?? '',
  };
}

function PedidoEditModal({
  open,
  pedido,
  clientes,
  usuarios,
  isSaving,
  onSave,
  onClose,
}) {
  const [formData, setFormData] =
    useState(() => buildInitialForm(pedido));

  const [errors, setErrors] =
    useState({});

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.cliente_id) {
      nextErrors.cliente_id =
        'Selecciona un cliente.';
    }

    if (!formData.usuario_id) {
      nextErrors.usuario_id =
        'Selecciona un responsable.';
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length
    ) {
      return;
    }

    onSave({
      cliente_id: Number(
        formData.cliente_id,
      ),
      usuario_id: Number(
        formData.usuario_id,
      ),
      fecha_entrega:
        formData.fecha_entrega ||
        null,
    });
  };

  if (!open || !pedido) {
    return null;
  }

  return (
    <div className="pedidos-modal-overlay">
      <section className="pedido-edit-modal">
        <header className="pedidos-modal-header">
          <div>
            <span>
              Información del pedido
            </span>

            <h4>
              Editar PED-
              {String(
                pedido.id,
              ).padStart(5, '0')}
            </h4>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="pedidos-modal-body">
            <Combobox
              className="mb-3"
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
              error={errors.cliente_id}
              onChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  cliente_id: value,
                }))
              }
            />

            <Combobox
              className="mb-3"
              label="Responsable"
              required
              value={formData.usuario_id}
              options={usuarios.map((usuario) => ({
                value: usuario.id,
                label: [usuario.nombre, usuario.apellido]
                  .filter(Boolean)
                  .join(' '),
                description: usuario.correo,
                icon: 'bi bi-person-badge',
              }))}
              placeholder="Selecciona un responsable"
              searchPlaceholder="Buscar responsable..."
              error={errors.usuario_id}
              onChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  usuario_id: value,
                }))
              }
            />

            <div>
              <label className="form-label">
                Fecha estimada de entrega
              </label>

              <input
                type="date"
                className="form-control"
                value={
                  formData.fecha_entrega
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      fecha_entrega:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </div>
          </div>

          <footer className="pedidos-modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving && (
                <span className="spinner-border spinner-border-sm me-2" />
              )}
              Guardar cambios
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default PedidoEditModal;
