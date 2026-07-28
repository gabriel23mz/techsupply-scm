import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  Modal,
  TextField,
} from '../../../shared/ui';

const INITIAL_FORM = {
  nombre: '',
  identificacion: '',
  telefono: '',
  correo: '',
  ubicacion_id: '',
  direccion: '',
};

const REQUIRED_FIELDS = [
  'nombre',
  'identificacion',
  'telefono',
  'correo',
  'ubicacion_id',
  'direccion',
];

const FIELD_SUCCESS = {
  nombre: 'Nombre válido.',
  identificacion: 'Identificación disponible.',
  telefono: 'Teléfono válido.',
  correo: 'Correo disponible.',
  ubicacion_id: 'Ubicación seleccionada.',
  direccion: 'Dirección válida.',
};

function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function buildInitialForm(mode, cliente) {
  if (mode !== 'edit' || !cliente) {
    return INITIAL_FORM;
  }

  const ubicacion = getLocation(cliente);

  return {
    nombre: String(cliente.nombre ?? ''),
    identificacion: String(cliente.identificacion ?? ''),
    telefono: String(cliente.telefono ?? ''),
    correo: String(cliente.correo ?? ''),
    ubicacion_id: String(
      cliente.ubicacion_id ?? ubicacion?.id ?? '',
    ),
    direccion: String(cliente.direccion ?? ''),
  };
}

function validateClientForm(
  formData,
  clientes,
  currentClient,
) {
  const errors = {};

  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.';
  }

  if (!/^\d{10}$/.test(formData.identificacion)) {
    errors.identificacion =
      'La identificación debe contener exactamente 10 dígitos.';
  } else {
    const duplicate = clientes.find(
      (item) =>
        Number(item.id) !== Number(currentClient?.id) &&
        String(item.identificacion) === formData.identificacion,
    );

    if (duplicate) {
      errors.identificacion =
        'La identificación ya se encuentra registrada.';
    }
  }

  if (!/^0\d{9}$/.test(formData.telefono)) {
    errors.telefono =
      'Ingresa un teléfono ecuatoriano de 10 dígitos.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
    errors.correo = 'Ingresa un correo electrónico válido.';
  } else {
    const duplicate = clientes.find(
      (item) =>
        Number(item.id) !== Number(currentClient?.id) &&
        String(item.correo ?? '')
          .trim()
          .toLowerCase() ===
          formData.correo.trim().toLowerCase(),
    );

    if (duplicate) {
      errors.correo =
        'El correo ya se encuentra registrado.';
    }
  }

  if (!formData.ubicacion_id) {
    errors.ubicacion_id = 'Selecciona una ubicación.';
  }

  if (!formData.direccion.trim()) {
    errors.direccion = 'La dirección es obligatoria.';
  }

  return errors;
}

function ClienteFormModal({
  cliente,
  clientes,
  isSaving,
  mode = 'create',
  onClose,
  onSave,
  open,
  ubicaciones,
}) {
  const [formData, setFormData] = useState(
    () => buildInitialForm(mode, cliente),
  );
  const [touched, setTouched] = useState({});

  const locationOptions = useMemo(
    () => ubicaciones.map((ubicacion) => ({
      value: ubicacion.id,
      label: ubicacion.nombre,
      description: ubicacion.descripcion,
      icon: 'bi bi-geo-alt',
    })),
    [ubicaciones],
  );

  const validationErrors = useMemo(
    () => validateClientForm(
      formData,
      clientes,
      cliente,
    ),
    [cliente, clientes, formData],
  );

  const isFormValid = REQUIRED_FIELDS.every(
    (field) => !validationErrors[field],
  );

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const markTouched = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const getValidationProps = (field) => ({
    error: touched[field]
      ? validationErrors[field]
      : undefined,
    success:
      touched[field] && !validationErrors[field]
        ? FIELD_SUCCESS[field]
        : undefined,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    setTouched(
      Object.fromEntries(
        REQUIRED_FIELDS.map((field) => [field, true]),
      ),
    );

    if (!isFormValid) {
      return;
    }

    onSave({
      nombre: formData.nombre.trim(),
      identificacion: formData.identificacion,
      telefono: formData.telefono,
      correo: formData.correo.trim().toLowerCase(),
      ubicacion_id: Number(formData.ubicacion_id),
      direccion: formData.direccion.trim(),
    });
  };

  const formId = 'client-form';

  return (
    <Modal
      open={open}
      size="lg"
      title={mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}
      description={
        mode === 'edit'
          ? 'Actualiza los datos comerciales, de contacto y entrega.'
          : 'Registra la información necesaria para crear pedidos y entregas.'
      }
      closeOnBackdrop={!isSaving}
      closeOnEscape={!isSaving}
      onClose={isSaving ? undefined : onClose}
      className="client-form-modal"
      footer={(
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
            form={formId}
            icon="bi bi-check-lg"
            disabled={!isFormValid}
            loading={isSaving}
            loadingLabel="Guardando..."
            title={
              !isFormValid
                ? 'Completa correctamente todos los campos obligatorios.'
                : undefined
            }
          >
            {mode === 'edit'
              ? 'Guardar cambios'
              : 'Registrar cliente'}
          </Button>
        </>
      )}
    >
      <form
        id={formId}
        className="client-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <section className="client-form-section">
          <header>
            <span className="client-form-section__icon">
              <i className="bi bi-person-vcard" aria-hidden="true" />
            </span>
            <div>
              <h3>Datos principales</h3>
              <p>Identificación comercial del cliente.</p>
            </div>
          </header>

          <div className="client-form-grid">
            <TextField
              id="client-name"
              label="Nombre completo o razón social"
              required
              value={formData.nombre}
              placeholder="Ej. Comercial Manabí S.A."
              {...getValidationProps('nombre')}
              autoComplete="organization"
              onBlur={() => markTouched('nombre')}
              onChange={(event) =>
                updateField('nombre', event.target.value)
              }
            />

            <TextField
              id="client-identification"
              label="Identificación"
              description="Cédula de 10 dígitos, sin espacios ni guiones."
              required
              value={formData.identificacion}
              placeholder="1312345678"
              inputMode="numeric"
              maxLength={10}
              {...getValidationProps('identificacion')}
              onBlur={() => markTouched('identificacion')}
              onChange={(event) =>
                updateField(
                  'identificacion',
                  event.target.value.replace(/\D/g, ''),
                )
              }
            />
          </div>
        </section>

        <section className="client-form-section">
          <header>
            <span className="client-form-section__icon">
              <i className="bi bi-chat-dots" aria-hidden="true" />
            </span>
            <div>
              <h3>Contacto</h3>
              <p>Canales utilizados durante la atención comercial.</p>
            </div>
          </header>

          <div className="client-form-grid">
            <TextField
              id="client-phone"
              label="Teléfono"
              required
              value={formData.telefono}
              placeholder="0987654321"
              inputMode="tel"
              maxLength={10}
              {...getValidationProps('telefono')}
              autoComplete="tel"
              onBlur={() => markTouched('telefono')}
              onChange={(event) =>
                updateField(
                  'telefono',
                  event.target.value.replace(/\D/g, ''),
                )
              }
            />

            <TextField
              id="client-email"
              label="Correo electrónico"
              type="email"
              required
              value={formData.correo}
              placeholder="cliente@empresa.com"
              {...getValidationProps('correo')}
              autoComplete="email"
              onBlur={() => markTouched('correo')}
              onChange={(event) =>
                updateField('correo', event.target.value)
              }
            />
          </div>
        </section>

        <section className="client-form-section">
          <header>
            <span className="client-form-section__icon">
              <i className="bi bi-geo-alt" aria-hidden="true" />
            </span>
            <div>
              <h3>Ubicación de entrega</h3>
              <p>Destino base utilizado en pedidos y planificación.</p>
            </div>
          </header>

          <div className="client-form-grid">
            <Combobox
              id="client-location"
              label="Ubicación"
              required
              value={formData.ubicacion_id}
              options={locationOptions}
              placeholder="Selecciona una ubicación"
              searchPlaceholder="Buscar ubicación..."
              emptyMessage="No hay ubicaciones activas disponibles."
              {...getValidationProps('ubicacion_id')}
              onChange={(value) => {
                updateField('ubicacion_id', value);
                markTouched('ubicacion_id');
              }}
            />

            <TextField
              id="client-address"
              label="Dirección de entrega"
              required
              value={formData.direccion}
              placeholder="Av. Principal y calle Bolívar"
              {...getValidationProps('direccion')}
              autoComplete="street-address"
              onBlur={() => markTouched('direccion')}
              onChange={(event) =>
                updateField('direccion', event.target.value)
              }
            />
          </div>
        </section>
      </form>
    </Modal>
  );
}

export default ClienteFormModal;
