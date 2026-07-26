import {
  useMemo,
  useState,
} from 'react';

import {
  Combobox,
} from '../../../shared/ui';

function NuevoPedidoForm({
  clientes,
  user,
  isSaving,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] =
    useState({
      cliente_id: '',
      fecha_entrega: '',
    });

  const [errors, setErrors] =
    useState({});

  const selectedClient =
    useMemo(
      () =>
        clientes.find(
          (cliente) =>
            Number(cliente.id) ===
            Number(
              formData.cliente_id,
            ),
        ) ?? null,
      [
        clientes,
        formData.cliente_id,
      ],
    );

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.cliente_id) {
      nextErrors.cliente_id =
        'Selecciona un cliente.';
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length
    ) {
      return;
    }

    onSubmit({
      cliente_id: Number(
        formData.cliente_id,
      ),
      fecha: new Date().toISOString(),
      fecha_entrega:
        formData.fecha_entrega ||
        null,
    });
  };

  return (
    <section className="nuevo-pedido-card">
      <form
        className="nuevo-pedido-form"
        onSubmit={handleSubmit}
      >
        <div className="nuevo-pedido-card-title">
          <div>
            <i className="bi bi-receipt" />
          </div>

          <div>
            <span>Registro inicial</span>
            <h4>
              Información del pedido
            </h4>
          </div>
        </div>

        <div className="nuevo-pedido-form-grid">
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
            error={errors.cliente_id}
            onChange={(value) =>
              setFormData((current) => ({
                ...current,
                cliente_id: value,
              }))
            }
          />

          <div>
            <label className="form-label">
              Fecha del pedido
            </label>

            <div className="readonly-field">
              <i className="bi bi-calendar-event" />
              {new Intl.DateTimeFormat(
                'es-EC',
                {
                  dateStyle: 'long',
                },
              ).format(new Date())}
            </div>
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
              min={
                new Date()
                  .toISOString()
                  .split('T')[0]
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

        <div className="nuevo-pedido-preview">
          <div>
            <i className="bi bi-person-check" />
            <span>Cliente</span>
            <strong>
              {selectedClient?.nombre ??
                'No seleccionado'}
            </strong>
          </div>

          <div>
            <i className="bi bi-person-badge" />
            <span>Responsable</span>
            <strong>
              {[
                user?.nombre,
                user?.apellido,
              ]
                .filter(Boolean)
                .join(' ') ||
                'Usuario autenticado'}
            </strong>
          </div>

          <div>
            <i className="bi bi-box-seam" />
            <span>Productos</span>
            <strong>
              Se agregan en el Workspace
            </strong>
          </div>
        </div>

        <footer className="nuevo-pedido-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : (
              <i className="bi bi-arrow-right-circle me-2" />
            )}

            Guardar y abrir Workspace
          </button>
        </footer>
      </form>
    </section>
  );
}

export default NuevoPedidoForm;
