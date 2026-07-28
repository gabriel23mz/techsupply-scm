import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  DateField,
} from '../../../shared/ui';

import {
  formatUser,
} from '../pedido.utils';

function NuevoPedidoForm({
  clientes,
  isSaving,
  onCancel,
  onSubmit,
  user,
}) {
  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha_entrega: '',
  });
  const [touched, setTouched] = useState({});

  const selectedClient = useMemo(
    () =>
      clientes.find(
        (cliente) => Number(cliente.id) === Number(formData.cliente_id),
      ) ?? null,
    [clientes, formData.cliente_id],
  );

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!formData.cliente_id) {
      nextErrors.cliente_id = 'Selecciona un cliente.';
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
    setTouched({ cliente_id: true, fecha_entrega: true });

    if (!isValid) return;

    onSubmit({
      cliente_id: Number(formData.cliente_id),
      fecha: new Date().toISOString(),
      fecha_entrega: formData.fecha_entrega || null,
    });
  };

  return (
    <section className="new-order-card">
      <form
        className="new-order-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <header className="new-order-section-heading">
          <div className="new-order-section-heading__icon">
            <i className="bi bi-receipt" aria-hidden="true" />
          </div>
          <div>
            <h3>Información inicial</h3>
            <p>
              El pedido se registrará como pendiente y los productos se
              agregarán después en el Workspace.
            </p>
          </div>
        </header>

        <div className="new-order-form-grid">
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

          <DateField
            label="Fecha estimada de entrega"
            optional
            description="Puede dejarse vacía y definirse posteriormente."
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
        </div>

        <section className="new-order-summary">
          <div>
            <i className="bi bi-person-check" aria-hidden="true" />
            <span>Cliente</span>
            <strong>{selectedClient?.nombre ?? 'No seleccionado'}</strong>
          </div>

          <div>
            <i className="bi bi-person-badge" aria-hidden="true" />
            <span>Responsable</span>
            <strong>{formatUser(user)}</strong>
          </div>

          <div>
            <i className="bi bi-calendar-check" aria-hidden="true" />
            <span>Fecha del pedido</span>
            <strong>
              {new Intl.DateTimeFormat('es-EC', {
                dateStyle: 'medium',
              }).format(new Date())}
            </strong>
          </div>
        </section>

        <footer className="new-order-actions">
          <Button
            tone="secondary"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            icon="bi bi-arrow-right-circle"
            loading={isSaving}
            loadingLabel="Registrando"
            disabled={!isValid}
          >
            Guardar y abrir Workspace
          </Button>
        </footer>
      </form>
    </section>
  );
}

export default NuevoPedidoForm;
