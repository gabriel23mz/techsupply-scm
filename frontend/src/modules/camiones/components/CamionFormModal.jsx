import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  FormField,
  Modal,
  TextField,
} from '../../../shared/ui';

const INITIAL_FORM = Object.freeze({
  codigo: '',
  placa: '',
  capacidad: '',
  estado: 'EN_BODEGA',
});

const EDITABLE_STATUS_OPTIONS = [
  { value: 'EN_BODEGA', label: 'En bodega' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const FIELD_SUCCESS = {
  codigo: 'Código válido.',
  placa: 'Placa válida.',
  capacidad: 'Capacidad válida.',
  estado: 'Disponibilidad seleccionada.',
};

function normalizeForm(camion) {
  return camion ? {
    codigo: String(camion.codigo ?? ''),
    placa: String(camion.placa ?? ''),
    capacidad: String(camion.capacidad ?? ''),
    estado: String(camion.estado ?? 'EN_BODEGA'),
  } : INITIAL_FORM;
}

function validateField(name, value, stateLocked = false) {
  const normalized = String(value ?? '').trim();

  if (name === 'codigo') {
    if (!normalized) return 'El código es obligatorio.';
    if (normalized.length > 20) return 'El código admite hasta 20 caracteres.';
  }

  if (name === 'placa') {
    if (!normalized) return 'La placa es obligatoria.';
    if (normalized.length > 20) return 'La placa admite hasta 20 caracteres.';
  }

  if (name === 'capacidad') {
    const capacity = Number(normalized);

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return 'La capacidad debe ser un número entero mayor a cero.';
    }
  }

  if (
    name === 'estado' &&
    !stateLocked &&
    !EDITABLE_STATUS_OPTIONS.some((option) => option.value === normalized)
  ) {
    return 'Selecciona un estado válido.';
  }

  return '';
}

function formatStatus(status) {
  return {
    EN_BODEGA: 'En bodega',
    EN_RUTA: 'En ruta',
    INACTIVO: 'Inactivo',
  }[status] ?? 'Estado operativo';
}

function CamionFormModal({
  camion,
  isSaving,
  mode = 'create',
  onClose,
  onSave,
  open,
}) {
  const [formData, setFormData] = useState(
    () => normalizeForm(camion),
  );
  const [touched, setTouched] = useState({});

  const stateLocked = mode === 'edit' && (
    Boolean(camion?.tiene_jornada) || formData.estado === 'EN_RUTA'
  );

  const errors = useMemo(() => ({
    codigo: validateField('codigo', formData.codigo),
    placa: validateField('placa', formData.placa),
    capacidad: validateField('capacidad', formData.capacidad),
    estado: validateField('estado', formData.estado, stateLocked),
  }), [formData, stateLocked]);

  const isValid = Object.values(errors).every((error) => !error);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const touchField = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const validationProps = (field) => ({
    error: touched[field] ? errors[field] : '',
    success: touched[field] && !errors[field]
      ? FIELD_SUCCESS[field]
      : '',
  });

  const submit = (event) => {
    event.preventDefault();
    setTouched({
      codigo: true,
      placa: true,
      capacidad: true,
      estado: true,
    });

    if (!isValid) return;

    onSave({
      codigo: formData.codigo.trim().toUpperCase(),
      placa: formData.placa.trim().toUpperCase(),
      capacidad: Number(formData.capacidad),
      estado: formData.estado,
    });
  };

  const formId = 'truck-form';

  return (
    <Modal
      open={open}
      title={mode === 'edit' ? 'Editar camión' : 'Nuevo camión'}
      description={mode === 'edit'
        ? 'Actualiza la identificación, capacidad y disponibilidad de la unidad.'
        : 'Registra una unidad disponible para la planificación logística.'}
      size="lg"
      className="truck-form-modal"
      closeOnBackdrop={!isSaving}
      closeOnEscape={!isSaving}
      onClose={isSaving ? undefined : onClose}
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
            loading={isSaving}
            loadingLabel="Guardando..."
            disabled={!isValid}
            title={!isValid
              ? 'Completa correctamente todos los campos obligatorios.'
              : undefined}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Crear camión'}
          </Button>
        </>
      )}
    >
      <form
        id={formId}
        className="trucks-form"
        noValidate
        onSubmit={submit}
      >
        <section className="trucks-form-section">
          <header>
            <span className="trucks-form-section__icon">
              <i className="bi bi-truck" aria-hidden="true" />
            </span>
            <div>
              <h3>Identificación</h3>
              <p>Datos utilizados para reconocer la unidad.</p>
            </div>
          </header>

          <div className="trucks-form-grid">
            <TextField
              id="truck-code"
              label="Código"
              required
              value={formData.codigo}
              placeholder="CAM-001"
              maxLength={20}
              autoComplete="off"
              {...validationProps('codigo')}
              onBlur={() => touchField('codigo')}
              onChange={(event) => updateField('codigo', event.target.value)}
            />
            <TextField
              id="truck-plate"
              label="Placa"
              required
              value={formData.placa}
              placeholder="ABC-1234"
              maxLength={20}
              autoComplete="off"
              {...validationProps('placa')}
              onBlur={() => touchField('placa')}
              onChange={(event) => updateField('placa', event.target.value)}
            />
          </div>
        </section>

        <section className="trucks-form-section">
          <header>
            <span className="trucks-form-section__icon">
              <i className="bi bi-box-seam" aria-hidden="true" />
            </span>
            <div>
              <h3>Operación</h3>
              <p>Capacidad y disponibilidad para nuevas jornadas.</p>
            </div>
          </header>

          <div className="trucks-form-grid">
            <TextField
              id="truck-capacity"
              label="Capacidad de pedidos"
              required
              type="number"
              min="1"
              step="1"
              value={formData.capacidad}
              description="Cantidad máxima de pedidos que puede transportar."
              {...validationProps('capacidad')}
              onBlur={() => touchField('capacidad')}
              onChange={(event) => updateField('capacidad', event.target.value)}
            />

            {stateLocked ? (
              <FormField
                id="truck-status"
                label="Estado operativo"
                description="Se actualiza automáticamente durante la jornada activa."
              >
                <div id="truck-status" className="trucks-status-readonly" aria-readonly="true">
                  <i className="bi bi-truck" aria-hidden="true" />
                  <strong>{formatStatus(formData.estado)}</strong>
                </div>
              </FormField>
            ) : (
              <Combobox
                id="truck-status"
                label="Disponibilidad"
                required
                value={formData.estado}
                options={EDITABLE_STATUS_OPTIONS}
                searchable={false}
                description="Una unidad nueva inicia en bodega o inactiva."
                {...validationProps('estado')}
                onChange={(value) => {
                  updateField('estado', value);
                  touchField('estado');
                }}
              />
            )}
          </div>
        </section>
      </form>
    </Modal>
  );
}

export default CamionFormModal;
