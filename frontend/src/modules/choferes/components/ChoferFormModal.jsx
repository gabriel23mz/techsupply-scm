import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Checkbox,
  Combobox,
  DateField,
  Modal,
  TextField,
} from '../../../shared/ui';

const FIELD_SUCCESS = {
  usuario_id: 'Usuario disponible para asociar.',
  numero_licencia: 'Número de licencia válido.',
  categoria_licencia: 'Categoría válida.',
  fecha_vencimiento_licencia: 'Licencia vigente.',
};

function todayValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildInitialForm(mode, chofer) {
  if (mode !== 'edit' || !chofer) {
    return {
      usuario_id: '',
      numero_licencia: '',
      categoria_licencia: '',
      fecha_vencimiento_licencia: '',
      activo: true,
    };
  }

  return {
    usuario_id: String(chofer.usuario_id ?? chofer.usuario?.id ?? ''),
    numero_licencia: String(chofer.numero_licencia ?? ''),
    categoria_licencia: String(chofer.categoria_licencia ?? ''),
    fecha_vencimiento_licencia: String(
      chofer.fecha_vencimiento_licencia ?? '',
    ).slice(0, 10),
    activo: chofer.activo !== false,
  };
}

function validateForm({
  chofer,
  choferes,
  formData,
}) {
  const errors = {};

  if (!formData.usuario_id) {
    errors.usuario_id = 'Selecciona un usuario con rol CHOFER.';
  }

  if (!formData.numero_licencia.trim()) {
    errors.numero_licencia = 'El número de licencia es obligatorio.';
  } else if (formData.numero_licencia.trim().length > 50) {
    errors.numero_licencia = 'La licencia admite hasta 50 caracteres.';
  } else {
    const duplicate = choferes.find((item) =>
      Number(item.id) !== Number(chofer?.id) &&
      String(item.numero_licencia ?? '').trim().toLowerCase() ===
        formData.numero_licencia.trim().toLowerCase(),
    );

    if (duplicate) {
      errors.numero_licencia = 'La licencia ya se encuentra registrada.';
    }
  }

  if (!formData.categoria_licencia.trim()) {
    errors.categoria_licencia = 'La categoría de licencia es obligatoria.';
  } else if (formData.categoria_licencia.trim().length > 30) {
    errors.categoria_licencia = 'La categoría admite hasta 30 caracteres.';
  }

  if (!formData.fecha_vencimiento_licencia) {
    errors.fecha_vencimiento_licencia = 'Selecciona la fecha de vencimiento.';
  } else if (formData.fecha_vencimiento_licencia < todayValue()) {
    errors.fecha_vencimiento_licencia = 'La licencia debe encontrarse vigente.';
  }

  return errors;
}

function ChoferFormModal({
  chofer,
  choferes,
  isSaving,
  mode = 'create',
  onClose,
  onSave,
  open,
  usuarios,
}) {
  const [formData, setFormData] = useState(
    () => buildInitialForm(mode, chofer),
  );
  const [touched, setTouched] = useState({});

  const userOptions = useMemo(() => {
    const assignedUserIds = new Set(
      choferes
        .filter((item) => Number(item.id) !== Number(chofer?.id))
        .map((item) => Number(item.usuario_id ?? item.usuario?.id)),
    );

    return usuarios
      .filter((usuario) =>
        usuario.rol === 'CHOFER' &&
        usuario.estado !== false &&
        !assignedUserIds.has(Number(usuario.id)),
      )
      .map((usuario) => ({
        value: usuario.id,
        label: [usuario.nombre, usuario.apellido].filter(Boolean).join(' '),
        description: usuario.correo,
        icon: 'bi bi-person-badge',
      }));
  }, [chofer?.id, choferes, usuarios]);

  const errors = useMemo(() => validateForm({
    chofer,
    choferes,
    formData,
  }), [chofer, choferes, formData]);
  const isValid = Object.keys(errors).length === 0;
  const hasActiveJourney = Boolean(chofer?.jornadas?.length);
  const noAvailableUsers = mode === 'create' && userOptions.length === 0;

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const touchField = (field) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
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
      usuario_id: true,
      numero_licencia: true,
      categoria_licencia: true,
      fecha_vencimiento_licencia: true,
    });

    if (!isValid) return;

    onSave({
      usuario_id: Number(formData.usuario_id),
      numero_licencia: formData.numero_licencia.trim().toUpperCase(),
      categoria_licencia: formData.categoria_licencia.trim().toUpperCase(),
      fecha_vencimiento_licencia: formData.fecha_vencimiento_licencia,
      activo: Boolean(formData.activo),
    });
  };

  const formId = 'driver-form';

  return (
    <Modal
      open={open}
      title={mode === 'edit' ? 'Editar chofer' : 'Nuevo chofer'}
      description={mode === 'edit'
        ? 'Actualiza el perfil operativo y la licencia del conductor.'
        : 'Asocia un usuario CHOFER y registra su licencia vigente.'}
      size="lg"
      className="driver-form-modal"
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
            disabled={!isValid || noAvailableUsers}
            title={noAvailableUsers
              ? 'Crea o activa un usuario con rol CHOFER antes de registrar el perfil.'
              : !isValid
                ? 'Completa correctamente todos los campos obligatorios.'
                : undefined}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Registrar chofer'}
          </Button>
        </>
      )}
    >
      <form
        id={formId}
        className="drivers-form"
        noValidate
        onSubmit={submit}
      >
        <section className="drivers-form-section">
          <header>
            <span className="drivers-form-section__icon">
              <i className="bi bi-person-vcard" aria-hidden="true" />
            </span>
            <div>
              <h3>Perfil de acceso</h3>
              <p>Usuario que operará las jornadas asignadas.</p>
            </div>
          </header>

          <div className="drivers-form-grid drivers-form-grid--profile">
            {noAvailableUsers ? (
              <div className="drivers-user-empty" role="status">
                <span className="drivers-user-empty__icon">
                  <i className="bi bi-person-exclamation" aria-hidden="true" />
                </span>
                <div>
                  <strong>No hay usuarios CHOFER disponibles</strong>
                  <p>
                    Crea o activa un usuario con rol CHOFER antes de registrar
                    su perfil operativo.
                  </p>
                </div>
              </div>
            ) : (
              <Combobox
                id="driver-user"
                label="Usuario CHOFER"
                required
                value={formData.usuario_id}
                options={userOptions}
                placeholder="Selecciona un usuario"
                searchPlaceholder="Buscar usuario"
                description={hasActiveJourney
                  ? 'No puede cambiarse mientras exista una jornada activa.'
                  : 'Usuarios activos con rol CHOFER y sin otro perfil.'}
                disabled={mode === 'edit' && hasActiveJourney}
                {...validationProps('usuario_id')}
                onChange={(value) => {
                  updateField('usuario_id', value);
                  touchField('usuario_id');
                }}
              />
            )}

            <div className="drivers-active-card">
              <span className="drivers-active-card__icon">
                <i className="bi bi-check2-circle" aria-hidden="true" />
              </span>
              <Checkbox
                id="driver-active"
                label="Chofer activo"
                description="Disponible para nuevas asignaciones."
                checked={formData.activo}
                disabled={hasActiveJourney}
                onChange={(event) => updateField('activo', event.target.checked)}
              />
            </div>
          </div>
        </section>

        <section className="drivers-form-section">
          <header>
            <span className="drivers-form-section__icon">
              <i className="bi bi-card-heading" aria-hidden="true" />
            </span>
            <div>
              <h3>Licencia</h3>
              <p>Información habilitante del conductor.</p>
            </div>
          </header>

          <div className="drivers-form-grid">
            <TextField
              id="driver-license"
              label="Número de licencia"
              required
              value={formData.numero_licencia}
              placeholder="LIC-1300123456"
              maxLength={50}
              autoComplete="off"
              {...validationProps('numero_licencia')}
              onBlur={() => touchField('numero_licencia')}
              onChange={(event) => updateField('numero_licencia', event.target.value)}
            />

            <TextField
              id="driver-license-category"
              label="Categoría"
              required
              value={formData.categoria_licencia}
              placeholder="Tipo E"
              maxLength={30}
              autoComplete="off"
              {...validationProps('categoria_licencia')}
              onBlur={() => touchField('categoria_licencia')}
              onChange={(event) => updateField('categoria_licencia', event.target.value)}
            />

            <DateField
              className="drivers-form-field--wide"
              id="driver-license-expiration"
              label="Fecha de vencimiento"
              required
              min={todayValue()}
              value={formData.fecha_vencimiento_licencia}
              description="Debe ser igual o posterior a la fecha actual."
              {...validationProps('fecha_vencimiento_licencia')}
              onChange={(value) => {
                updateField('fecha_vencimiento_licencia', value);
                touchField('fecha_vencimiento_licencia');
              }}
            />
          </div>
        </section>
      </form>
    </Modal>
  );
}

export default ChoferFormModal;
