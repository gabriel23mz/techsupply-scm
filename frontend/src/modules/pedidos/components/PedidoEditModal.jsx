import { useState } from 'react';


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
            <div className="mb-3">
              <label className="form-label">
                Cliente
              </label>

              <select
                className={`form-select ${
                  errors.cliente_id
                    ? 'is-invalid'
                    : ''
                }`}
                value={
                  formData.cliente_id
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      cliente_id:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                <option value="">
                  Selecciona un cliente
                </option>

                {clientes.map(
                  (cliente) => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.nombre}
                    </option>
                  ),
                )}
              </select>

              {errors.cliente_id && (
                <div className="invalid-feedback">
                  {errors.cliente_id}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                Responsable
              </label>

              <select
                className={`form-select ${
                  errors.usuario_id
                    ? 'is-invalid'
                    : ''
                }`}
                value={
                  formData.usuario_id
                }
                onChange={(event) =>
                  setFormData(
                    (current) => ({
                      ...current,
                      usuario_id:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                <option value="">
                  Selecciona un responsable
                </option>

                {usuarios.map(
                  (usuario) => (
                    <option
                      key={usuario.id}
                      value={usuario.id}
                    >
                      {[
                        usuario.nombre,
                        usuario.apellido,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </option>
                  ),
                )}
              </select>

              {errors.usuario_id && (
                <div className="invalid-feedback">
                  {errors.usuario_id}
                </div>
              )}
            </div>

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
