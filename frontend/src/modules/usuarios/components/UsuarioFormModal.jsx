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

import {
  USER_ROLE_OPTIONS,
} from '../usuario.utils';

const INITIAL_FORM = Object.freeze({
  nombre: '',
  apellido: '',
  correo: '',
  rol: '',
  password: '',
  password_confirmation: '',
});

const FIELD_DESCRIPTIONS = Object.freeze({
  nombre: 'Nombre utilizado para identificar a la persona.',
  apellido: 'Apellido mostrado en la sesión y registros operativos.',
  correo: 'Se utilizará como identificador para iniciar sesión.',
  rol: 'Define los módulos y acciones disponibles para la cuenta.',
  password: 'Debe contener al menos 6 caracteres.',
  password_confirmation: 'Repite exactamente la contraseña indicada.',
});

function buildInitialForm(mode, usuario) {
  if (mode !== 'edit' || !usuario) {
    return INITIAL_FORM;
  }

  return {
    nombre: String(usuario.nombre ?? ''),
    apellido: String(usuario.apellido ?? ''),
    correo: String(usuario.correo ?? ''),
    rol: String(usuario.rol ?? ''),
    password: '',
    password_confirmation: '',
  };
}

function validateUserForm({
  currentUser,
  formData,
  mode,
  usuarios,
}) {
  const errors = {};

  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio.';
  }

  if (!formData.apellido.trim()) {
    errors.apellido = 'El apellido es obligatorio.';
  }

  const normalizedEmail = formData.correo.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.correo = 'Ingresa un correo electrónico válido.';
  } else {
    const duplicate = usuarios.find(
      (usuario) =>
        Number(usuario.id) !== Number(currentUser?.id) &&
        String(usuario.correo ?? '').trim().toLowerCase() ===
          normalizedEmail,
    );

    if (duplicate) {
      errors.correo = 'El correo ya se encuentra registrado.';
    }
  }

  if (!USER_ROLE_OPTIONS.some(
    (option) => option.value === formData.rol,
  )) {
    errors.rol = 'Selecciona un rol válido.';
  }

  const passwordRequired = mode === 'create';
  const hasPassword = Boolean(formData.password);

  if (passwordRequired || hasPassword) {
    if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (formData.password_confirmation !== formData.password) {
      errors.password_confirmation = 'Las contraseñas no coinciden.';
    }
  } else if (formData.password_confirmation) {
    errors.password_confirmation = 'Ingresa primero una nueva contraseña.';
  }

  return errors;
}

function UsuarioFormModal({
  isSaving,
  mode = 'create',
  onClose,
  onSave,
  open,
  submitError,
  usuario,
  usuarios,
}) {
  const [formData, setFormData] = useState(
    () => buildInitialForm(mode, usuario),
  );
  const [touched, setTouched] = useState({});

  const validationErrors = useMemo(
    () => validateUserForm({
      currentUser: usuario,
      formData,
      mode,
      usuarios,
    }),
    [formData, mode, usuario, usuarios],
  );

  const requiredFields = mode === 'create'
    ? [
      'nombre',
      'apellido',
      'correo',
      'rol',
      'password',
      'password_confirmation',
    ]
    : [
      'nombre',
      'apellido',
      'correo',
      'rol',
    ];

  const isFormValid =
    requiredFields.every((field) => !validationErrors[field]) &&
    Object.keys(validationErrors).length === 0;

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
    description: FIELD_DESCRIPTIONS[field],
    error: touched[field]
      ? validationErrors[field]
      : undefined,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    setTouched({
      nombre: true,
      apellido: true,
      correo: true,
      rol: true,
      password: true,
      password_confirmation: true,
    });

    if (!isFormValid) return;

    const payload = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      correo: formData.correo.trim().toLowerCase(),
      rol: formData.rol,
    };

    if (mode === 'create' || formData.password) {
      payload.password = formData.password;
    }

    onSave(payload);
  };

  const formId = 'user-form';
  const passwordDescription = mode === 'edit'
    ? 'Opcional. Déjala vacía para conservar la contraseña actual.'
    : FIELD_DESCRIPTIONS.password;

  return (
    <Modal
      open={open}
      size="lg"
      title={mode === 'edit' ? 'Editar usuario' : 'Nuevo usuario'}
      description={
        mode === 'edit'
          ? 'Actualiza la identidad, el rol o la contraseña de la cuenta.'
          : 'Registra una cuenta y define el alcance operativo de su sesión.'
      }
      closeOnBackdrop={!isSaving}
      closeOnEscape={!isSaving}
      onClose={isSaving ? undefined : onClose}
      className="user-form-modal"
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
                ? 'Completa correctamente los campos obligatorios.'
                : undefined
            }
          >
            {mode === 'edit'
              ? 'Guardar cambios'
              : 'Registrar usuario'}
          </Button>
        </>
      )}
    >
      <form
        id={formId}
        className="user-form"
        noValidate
        onSubmit={handleSubmit}
      >
        {submitError && (
          <div className="user-form__submit-error" role="alert">
            <i className="bi bi-exclamation-circle" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <section className="user-form-section">
          <header>
            <span className="user-form-section__icon">
              <i className="bi bi-person-vcard" aria-hidden="true" />
            </span>
            <div>
              <h3>Identidad</h3>
              <p>Información visible en la sesión y la trazabilidad.</p>
            </div>
          </header>

          <div className="user-form-grid">
            <TextField
              id="user-name"
              label="Nombre"
              required
              value={formData.nombre}
              placeholder="Ej. Daniela"
              autoComplete="given-name"
              {...getValidationProps('nombre')}
              onBlur={() => markTouched('nombre')}
              onChange={(event) =>
                updateField('nombre', event.target.value)
              }
            />

            <TextField
              id="user-last-name"
              label="Apellido"
              required
              value={formData.apellido}
              placeholder="Ej. Moreira"
              autoComplete="family-name"
              {...getValidationProps('apellido')}
              onBlur={() => markTouched('apellido')}
              onChange={(event) =>
                updateField('apellido', event.target.value)
              }
            />
          </div>
        </section>

        <section className="user-form-section">
          <header>
            <span className="user-form-section__icon">
              <i className="bi bi-shield-lock" aria-hidden="true" />
            </span>
            <div>
              <h3>Acceso</h3>
              <p>Credencial de inicio de sesión y permisos asignados.</p>
            </div>
          </header>

          <div className="user-form-grid">
            <TextField
              id="user-email"
              label="Correo electrónico"
              type="email"
              required
              value={formData.correo}
              placeholder="usuario@techsupply.com"
              autoComplete="email"
              {...getValidationProps('correo')}
              onBlur={() => markTouched('correo')}
              onChange={(event) =>
                updateField('correo', event.target.value)
              }
            />

            <Combobox
              id="user-role"
              label="Rol"
              required
              value={formData.rol}
              options={USER_ROLE_OPTIONS}
              placeholder="Selecciona un rol"
              searchPlaceholder="Buscar rol..."
              {...getValidationProps('rol')}
              onChange={(value) => {
                updateField('rol', value);
                markTouched('rol');
              }}
            />

            {formData.rol === 'CHOFER' && (
              <div className="user-form-role-note">
                <i className="bi bi-info-circle" aria-hidden="true" />
                <p>
                  La cuenta permitirá iniciar sesión como chofer. El perfil
                  operativo y la licencia se registran después desde el módulo
                  Choferes.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="user-form-section">
          <header>
            <span className="user-form-section__icon">
              <i className="bi bi-key" aria-hidden="true" />
            </span>
            <div>
              <h3>Contraseña</h3>
              <p>
                {mode === 'edit'
                  ? 'Restablecimiento opcional administrado.'
                  : 'Credencial inicial para el primer acceso.'}
              </p>
            </div>
          </header>

          <div className="user-form-grid">
            <TextField
              id="user-password"
              label={mode === 'edit' ? 'Nueva contraseña' : 'Contraseña'}
              type="password"
              required={mode === 'create'}
              optional={mode === 'edit'}
              value={formData.password}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              description={passwordDescription}
              error={touched.password ? validationErrors.password : undefined}
              onBlur={() => markTouched('password')}
              onChange={(event) =>
                updateField('password', event.target.value)
              }
            />

            <TextField
              id="user-password-confirmation"
              label="Confirmar contraseña"
              type="password"
              required={mode === 'create'}
              optional={mode === 'edit'}
              value={formData.password_confirmation}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              {...getValidationProps('password_confirmation')}
              onBlur={() => markTouched('password_confirmation')}
              onChange={(event) =>
                updateField(
                  'password_confirmation',
                  event.target.value,
                )
              }
            />
          </div>
        </section>
      </form>
    </Modal>
  );
}

export default UsuarioFormModal;
