import {
  useMemo,
  useState,
} from 'react';

import {
  Combobox,
} from '../../../shared/ui';

const INITIAL_FORM = {
  nombre: '',
  identificacion: '',
  telefono: '',
  correo: '',
  ubicacion_id: '',
  direccion: '',
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

function ClienteFormModal({
  open,
  mode = 'create',
  cliente,
  clientes,
  ubicaciones,
  isSaving,
  onSave,
  onClose,
}) {
  const [formData, setFormData] =
    useState(() => buildInitialForm(mode, cliente));

  const [errors, setErrors] =
    useState({});

  const selectedLocation =
    useMemo(
      () =>
        ubicaciones.find(
          (ubicacion) =>
            Number(ubicacion.id) ===
            Number(
              formData.ubicacion_id,
            ),
        ) ?? null,
      [
        formData.ubicacion_id,
        ubicaciones,
      ],
    );

  const updateField = (
    field,
    value,
  ) => {
    setFormData(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setErrors(
      (current) => ({
        ...current,
        [field]: null,
      }),
    );
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.nombre.trim()) {
      nextErrors.nombre =
        'El nombre es obligatorio.';
    }

    if (
      !/^\d{10}$/.test(
        formData.identificacion,
      )
    ) {
      nextErrors.identificacion =
        'La identificación debe contener exactamente 10 dígitos.';
    } else {
      const duplicate =
        clientes.find(
          (item) =>
            Number(item.id) !==
              Number(cliente?.id) &&
            String(
              item.identificacion,
            ) ===
              formData.identificacion,
        );

      if (duplicate) {
        nextErrors.identificacion =
          'La identificación ya se encuentra registrada.';
      }
    }

    if (
      !/^0\d{9}$/.test(
        formData.telefono,
      )
    ) {
      nextErrors.telefono =
        'Ingresa un teléfono ecuatoriano de 10 dígitos.';
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.correo,
      )
    ) {
      nextErrors.correo =
        'Ingresa un correo electrónico válido.';
    } else {
      const duplicate =
        clientes.find(
          (item) =>
            Number(item.id) !==
              Number(cliente?.id) &&
            String(item.correo ?? '')
              .trim()
              .toLowerCase() ===
              formData.correo
                .trim()
                .toLowerCase(),
        );

      if (duplicate) {
        nextErrors.correo =
          'El correo ya se encuentra registrado.';
      }
    }

    if (!formData.ubicacion_id) {
      nextErrors.ubicacion_id =
        'Selecciona una ubicación.';
    }

    if (!formData.direccion.trim()) {
      nextErrors.direccion =
        'La dirección es obligatoria.';
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = (
    event,
  ) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSave({
      nombre: formData.nombre.trim(),
      identificacion:
        formData.identificacion,
      telefono: formData.telefono,
      correo:
        formData.correo
          .trim()
          .toLowerCase(),
      ubicacion_id: Number(
        formData.ubicacion_id,
      ),
      direccion:
        formData.direccion.trim(),
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="clients-modal-overlay">
      <section className="client-form-modal">
        <header className="clients-modal-header">
          <div className="clients-modal-header__icon">
            <i
              className={`bi ${
                mode === 'edit'
                  ? 'bi-person-gear'
                  : 'bi-person-plus'
              }`}
            />
          </div>

          <div className="clients-modal-header__content">
            <span>Directorio comercial</span>

            <h4>
              {mode === 'edit'
                ? 'Editar cliente'
                : 'Nuevo cliente'}
            </h4>

            <p>
              {mode === 'edit'
                ? 'Actualiza la información comercial y de entrega.'
                : 'Completa los datos para registrar un nuevo cliente.'}
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            disabled={isSaving}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <form
          className="client-form-modal__form"
          onSubmit={handleSubmit}
        >
          <div className="client-form-layout">
            <div className="client-form-content">
              <section className="client-form-section">
                <header>
                  <span>1</span>

                  <div>
                    <strong>
                      Identificación
                    </strong>

                    <small>
                      Datos principales del cliente
                    </small>
                  </div>
                </header>

                <div className="client-form-grid">
                  <div>
                    <label
                      htmlFor="client-name"
                      className="form-label"
                    >
                      Nombre completo o razón social
                    </label>

                    <input
                      id="client-name"
                      type="text"
                      className={`form-control ${
                        errors.nombre
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={formData.nombre}
                      placeholder="Ej. Comercial Manabí S.A."
                      onChange={(event) =>
                        updateField(
                          'nombre',
                          event.target.value,
                        )
                      }
                    />

                    {errors.nombre && (
                      <div className="invalid-feedback">
                        {errors.nombre}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="client-identification"
                      className="form-label"
                    >
                      Identificación
                    </label>

                    <input
                      id="client-identification"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      className={`form-control ${
                        errors.identificacion
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={
                        formData.identificacion
                      }
                      placeholder="1312345678"
                      onChange={(event) =>
                        updateField(
                          'identificacion',
                          event.target.value.replace(
                            /\D/g,
                            '',
                          ),
                        )
                      }
                    />

                    <small className="form-text">
                      Cédula sin espacios ni guiones.
                    </small>

                    {errors.identificacion && (
                      <div className="invalid-feedback">
                        {errors.identificacion}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="client-form-section">
                <header>
                  <span>2</span>

                  <div>
                    <strong>
                      Información de contacto
                    </strong>

                    <small>
                      Canales de comunicación
                    </small>
                  </div>
                </header>

                <div className="client-form-grid">
                  <div>
                    <label
                      htmlFor="client-phone"
                      className="form-label"
                    >
                      Teléfono
                    </label>

                    <input
                      id="client-phone"
                      type="text"
                      inputMode="tel"
                      maxLength={10}
                      className={`form-control ${
                        errors.telefono
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={formData.telefono}
                      placeholder="0987654321"
                      onChange={(event) =>
                        updateField(
                          'telefono',
                          event.target.value.replace(
                            /\D/g,
                            '',
                          ),
                        )
                      }
                    />

                    {errors.telefono && (
                      <div className="invalid-feedback">
                        {errors.telefono}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="client-email"
                      className="form-label"
                    >
                      Correo electrónico
                    </label>

                    <input
                      id="client-email"
                      type="email"
                      className={`form-control ${
                        errors.correo
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={formData.correo}
                      placeholder="cliente@empresa.com"
                      onChange={(event) =>
                        updateField(
                          'correo',
                          event.target.value,
                        )
                      }
                    />

                    {errors.correo && (
                      <div className="invalid-feedback">
                        {errors.correo}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="client-form-section">
                <header>
                  <span>3</span>

                  <div>
                    <strong>
                      Ubicación y entrega
                    </strong>

                    <small>
                      Destino base del cliente
                    </small>
                  </div>
                </header>

                <div className="client-form-grid">
                  <Combobox
                    id="client-location"
                    label="Ubicación"
                    required
                    value={formData.ubicacion_id}
                    options={ubicaciones.map((ubicacion) => ({
                      value: ubicacion.id,
                      label: ubicacion.nombre,
                      icon: 'bi bi-geo-alt',
                    }))}
                    placeholder="Selecciona una ubicación"
                    searchPlaceholder="Buscar ubicación..."
                    error={errors.ubicacion_id}
                    onChange={(value) =>
                      updateField('ubicacion_id', value)
                    }
                  />

                  <div>
                    <label
                      htmlFor="client-address"
                      className="form-label"
                    >
                      Dirección de entrega
                    </label>

                    <input
                      id="client-address"
                      type="text"
                      className={`form-control ${
                        errors.direccion
                          ? 'is-invalid'
                          : ''
                      }`}
                      value={formData.direccion}
                      placeholder="Av. Principal y calle Bolívar"
                      onChange={(event) =>
                        updateField(
                          'direccion',
                          event.target.value,
                        )
                      }
                    />

                    {errors.direccion && (
                      <div className="invalid-feedback">
                        {errors.direccion}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="client-form-summary">
              <span className="client-form-summary__eyebrow">
                Resumen del registro
              </span>

              <div className="client-form-summary__item">
                <i className="bi bi-person-badge" />

                <div>
                  <span>Cliente</span>

                  <strong>
                    {formData.nombre.trim() ||
                      'Sin nombre'}
                  </strong>

                  <small>
                    {formData.identificacion ||
                      'Sin identificación'}
                  </small>
                </div>
              </div>

              <div className="client-form-summary__item">
                <i className="bi bi-telephone" />

                <div>
                  <span>Contacto</span>

                  <strong>
                    {formData.telefono ||
                      'Sin teléfono'}
                  </strong>

                  <small>
                    {formData.correo ||
                      'Sin correo'}
                  </small>
                </div>
              </div>

              <div className="client-form-summary__item">
                <i className="bi bi-geo-alt" />

                <div>
                  <span>Ubicación</span>

                  <strong>
                    {selectedLocation?.nombre ??
                      'No definida'}
                  </strong>

                  <small>
                    {formData.direccion ||
                      'Sin dirección'}
                  </small>
                </div>
              </div>

              <div className="client-form-summary__note">
                <i className="bi bi-info-circle" />

                <span>
                  La ubicación seleccionada será usada
                  por pedidos, despachos y jornadas.
                </span>
              </div>
            </aside>
          </div>

          <footer className="clients-modal-footer">
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
              {isSaving ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-check-lg me-2" />
              )}

              {mode === 'edit'
                ? 'Guardar cambios'
                : 'Registrar cliente'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ClienteFormModal;
