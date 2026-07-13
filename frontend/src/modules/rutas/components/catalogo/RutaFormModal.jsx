import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  calcularDistanciaVial,
} from '../../services/rutas.service';

const INITIAL_FORM = {
  origen_id: '',
  destino_id: '',
  distancia_km: '',
};

function hasValidCoordinates(ubicacion) {
  return (
    Number.isFinite(Number(ubicacion?.latitud)) &&
    Number.isFinite(Number(ubicacion?.longitud))
  );
}

function RutaFormModal({
  open,
  mode = 'create',
  ruta,
  rutas = [],
  ubicaciones,
  isSaving,
  onSave,
  onClose,
}) {
  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [errors, setErrors] =
    useState({});

  const [calculation, setCalculation] =
    useState({
      status: 'idle',
      message:
        'Selecciona origen y destino para calcular la distancia.',
      tiempo_estimado_min: null,
    });

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && ruta) {
      setFormData({
        origen_id:
          String(ruta.origen_id ?? ''),
        destino_id:
          String(ruta.destino_id ?? ''),
        distancia_km:
          String(ruta.distancia_km ?? ''),
      });
    } else {
      setFormData(INITIAL_FORM);
    }

    setErrors({});

    setCalculation({
      status: 'idle',
      message:
        'Selecciona origen y destino para calcular la distancia.',
      tiempo_estimado_min: null,
    });
  }, [
    mode,
    open,
    ruta,
  ]);

  const title =
    mode === 'edit'
      ? 'Editar ruta'
      : 'Nueva ruta';

  const submitText =
    mode === 'edit'
      ? 'Guardar cambios'
      : 'Guardar ruta';

  const selectedOrigin = useMemo(
    () =>
      ubicaciones.find(
        (ubicacion) =>
          Number(ubicacion.id) ===
          Number(formData.origen_id),
      ) ?? null,
    [
      formData.origen_id,
      ubicaciones,
    ],
  );

  const selectedDestination = useMemo(
    () =>
      ubicaciones.find(
        (ubicacion) =>
          Number(ubicacion.id) ===
          Number(formData.destino_id),
      ) ?? null,
    [
      formData.destino_id,
      ubicaciones,
    ],
  );

  const isSameLocation =
    Boolean(formData.origen_id) &&
    Boolean(formData.destino_id) &&
    Number(formData.origen_id) ===
      Number(formData.destino_id);

  const duplicateRoute = useMemo(() => {
    if (
      !formData.origen_id ||
      !formData.destino_id
    ) {
      return null;
    }

    return (
      rutas.find(
        (item) =>
          Number(item.id) !== Number(ruta?.id) &&
          Number(item.origen_id) ===
            Number(formData.origen_id) &&
          Number(item.destino_id) ===
            Number(formData.destino_id),
      ) ?? null
    );
  }, [
    formData.destino_id,
    formData.origen_id,
    ruta?.id,
    rutas,
  ]);

  const calculateDistance = useCallback(
    async ({
      origen,
      destino,
      signal,
    }) => {
      const currentRequestId =
        requestIdRef.current + 1;

      requestIdRef.current =
        currentRequestId;

      setFormData(
        (current) => ({
          ...current,
          distancia_km: '',
        }),
      );

      setCalculation({
        status: 'calculating',
        message:
          'Calculando recorrido por carretera...',
        tiempo_estimado_min: null,
      });

      setErrors(
        (current) => ({
          ...current,
          distancia_km: null,
        }),
      );

      try {
        const result =
          await calcularDistanciaVial({
            origen,
            destino,
            signal,
          });

        if (
          signal.aborted ||
          requestIdRef.current !== currentRequestId
        ) {
          return;
        }

        setFormData(
          (current) => ({
            ...current,
            distancia_km:
              String(result.distancia_km),
          }),
        );

        setCalculation({
          status: 'success',
          message:
            'Distancia vial calculada automáticamente.',
          tiempo_estimado_min:
            result.tiempo_estimado_min,
        });
      } catch (error) {
        if (
          signal.aborted ||
          error?.code === 'ERR_CANCELED'
        ) {
          return;
        }

        if (
          requestIdRef.current !== currentRequestId
        ) {
          return;
        }

        setCalculation({
          status: 'error',
          message:
            error.message ||
            'No fue posible calcular la distancia.',
          tiempo_estimado_min: null,
        });

        setErrors(
          (current) => ({
            ...current,
            distancia_km:
              error.message ||
              'No fue posible calcular la distancia.',
          }),
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    if (
      !selectedOrigin ||
      !selectedDestination
    ) {
      setFormData(
        (current) => ({
          ...current,
          distancia_km: '',
        }),
      );

      setCalculation({
        status: 'idle',
        message:
          'Selecciona origen y destino para calcular la distancia.',
        tiempo_estimado_min: null,
      });

      return undefined;
    }

    if (isSameLocation) {
      setFormData(
        (current) => ({
          ...current,
          distancia_km: '',
        }),
      );

      setCalculation({
        status: 'error',
        message:
          'El origen y el destino deben ser diferentes.',
        tiempo_estimado_min: null,
      });

      return undefined;
    }

    if (duplicateRoute) {
      setFormData(
        (current) => ({
          ...current,
          distancia_km: '',
        }),
      );

      setCalculation({
        status: 'error',
        message:
          'Esta conexión ya se encuentra registrada.',
        tiempo_estimado_min: null,
      });

      return undefined;
    }

    if (
      !hasValidCoordinates(selectedOrigin) ||
      !hasValidCoordinates(selectedDestination)
    ) {
      setFormData(
        (current) => ({
          ...current,
          distancia_km: '',
        }),
      );

      setCalculation({
        status: 'error',
        message:
          'Ambas ubicaciones deben tener latitud y longitud válidas.',
        tiempo_estimado_min: null,
      });

      return undefined;
    }

    const controller =
      new AbortController();

    const timeoutId = window.setTimeout(
      () => {
        calculateDistance({
          origen: selectedOrigin,
          destino: selectedDestination,
          signal: controller.signal,
        });
      },
      350,
    );

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    calculateDistance,
    duplicateRoute,
    isSameLocation,
    open,
    selectedDestination,
    selectedOrigin,
  ]);

  const updateLocation = (
    field,
    value,
  ) => {
    setFormData(
      (current) => ({
        ...current,
        [field]: value,
        distancia_km: '',
      }),
    );

    setErrors(
      (current) => ({
        ...current,
        [field]: null,
        distancia_km: null,
      }),
    );
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.origen_id) {
      nextErrors.origen_id =
        'Selecciona una ubicación de origen.';
    }

    if (!formData.destino_id) {
      nextErrors.destino_id =
        'Selecciona una ubicación de destino.';
    }

    if (isSameLocation) {
      nextErrors.destino_id =
        'El origen y el destino deben ser diferentes.';
    }

    if (duplicateRoute) {
      nextErrors.destino_id =
        'Esta ruta ya se encuentra registrada.';
    }

    const distance = Number(
      formData.distancia_km,
    );

    if (
      calculation.status !== 'success' ||
      !Number.isFinite(distance) ||
      distance <= 0
    ) {
      nextErrors.distancia_km =
        calculation.status === 'calculating'
          ? 'Espera a que termine el cálculo.'
          : calculation.message;
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSave({
      origen_id: Number(
        formData.origen_id,
      ),
      destino_id: Number(
        formData.destino_id,
      ),
      distancia_km: Number(
        formData.distancia_km,
      ),
      estado: true,
    });
  };

  const canSubmit =
    !isSaving &&
    calculation.status === 'success' &&
    Boolean(formData.origen_id) &&
    Boolean(formData.destino_id) &&
    !isSameLocation &&
    !duplicateRoute &&
    Number(formData.distancia_km) > 0;

  if (!open) {
    return null;
  }

  return (
    <div className="routes-modal-overlay">
      <section className="routes-form-modal">
        <header className="routes-modal-header">
          <div>
            <span>
              Catálogo de rutas
            </span>

            <h4>{title}</h4>

            <p>
              Elige los puntos y el sistema calculará
              automáticamente la distancia vial.
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

        <form onSubmit={handleSubmit}>
          <div className="routes-modal-body">
            <div className="routes-form-location-grid">
              <div>
                <label
                  htmlFor="ruta-origen"
                  className="form-label"
                >
                  Ubicación de origen
                </label>

                <select
                  id="ruta-origen"
                  className={`form-select ${
                    errors.origen_id
                      ? 'is-invalid'
                      : formData.origen_id
                        ? 'routes-field-valid'
                        : ''
                  }`}
                  value={formData.origen_id}
                  onChange={(event) =>
                    updateLocation(
                      'origen_id',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona un origen
                  </option>

                  {ubicaciones.map(
                    (ubicacion) => (
                      <option
                        key={ubicacion.id}
                        value={ubicacion.id}
                        disabled={
                          Number(ubicacion.id) ===
                          Number(
                            formData.destino_id,
                          )
                        }
                      >
                        {ubicacion.nombre}
                      </option>
                    ),
                  )}
                </select>

                {errors.origen_id && (
                  <div className="invalid-feedback">
                    {errors.origen_id}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="ruta-destino"
                  className="form-label"
                >
                  Ubicación de destino
                </label>

                <select
                  id="ruta-destino"
                  className={`form-select ${
                    errors.destino_id
                      ? 'is-invalid'
                      : formData.destino_id
                        ? 'routes-field-valid'
                        : ''
                  }`}
                  value={formData.destino_id}
                  onChange={(event) =>
                    updateLocation(
                      'destino_id',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona un destino
                  </option>

                  {ubicaciones.map(
                    (ubicacion) => (
                      <option
                        key={ubicacion.id}
                        value={ubicacion.id}
                        disabled={
                          Number(ubicacion.id) ===
                          Number(formData.origen_id)
                        }
                      >
                        {ubicacion.nombre}
                      </option>
                    ),
                  )}
                </select>

                {errors.destino_id && (
                  <div className="invalid-feedback">
                    {errors.destino_id}
                  </div>
                )}
              </div>
            </div>

            <div className="routes-auto-distance">
              <div className="routes-auto-distance__heading">
                <div>
                  <span>
                    Distancia por carretera
                  </span>

                  <strong>
                    Cálculo automático
                  </strong>
                </div>

                <span
                  className={`routes-calculation-status ${calculation.status}`}
                >
                  {calculation.status ===
                  'calculating' ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <i
                      className={`bi ${
                        calculation.status ===
                        'success'
                          ? 'bi-check-circle-fill'
                          : calculation.status ===
                              'error'
                            ? 'bi-exclamation-circle-fill'
                            : 'bi-stars'
                      }`}
                    />
                  )}

                  {calculation.status ===
                    'calculating'
                    ? 'Calculando'
                    : calculation.status ===
                        'success'
                      ? 'Calculada'
                      : calculation.status ===
                          'error'
                        ? 'Revisar'
                        : 'Pendiente'}
                </span>
              </div>

              <div className="routes-distance-readonly">
                <i className="bi bi-signpost-split" />

                <input
                  id="ruta-distancia"
                  type="text"
                  value={
                    formData.distancia_km
                      ? `${formData.distancia_km} km`
                      : ''
                  }
                  placeholder={
                    calculation.status ===
                    'calculating'
                      ? 'Calculando distancia...'
                      : 'Se completará automáticamente'
                  }
                  readOnly
                  aria-readonly="true"
                />

                {calculation.status ===
                  'success' && (
                  <i className="bi bi-check-lg routes-distance-check" />
                )}
              </div>

              <div
                className={`routes-calculation-message ${calculation.status}`}
              >
                <i
                  className={`bi ${
                    calculation.status ===
                    'success'
                      ? 'bi-check-circle'
                      : calculation.status ===
                          'error'
                        ? 'bi-exclamation-circle'
                        : 'bi-info-circle'
                  }`}
                />

                <span>
                  {calculation.message}

                  {calculation.status ===
                    'success' &&
                    calculation.tiempo_estimado_min && (
                      <>
                        {' '}
                        Tiempo de referencia:{' '}
                        <strong>
                          {
                            calculation.tiempo_estimado_min
                          }{' '}
                          min
                        </strong>
                        .
                      </>
                    )}
                </span>
              </div>

              {calculation.status ===
                'error' &&
                selectedOrigin &&
                selectedDestination &&
                !isSameLocation &&
                !duplicateRoute && (
                  <button
                    type="button"
                    className="btn btn-link routes-retry-calculation"
                    onClick={() => {
                      const controller =
                        new AbortController();

                      calculateDistance({
                        origen: selectedOrigin,
                        destino:
                          selectedDestination,
                        signal:
                          controller.signal,
                      });
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-1" />
                    Reintentar cálculo
                  </button>
                )}

              {errors.distancia_km &&
                calculation.status !==
                  'error' && (
                  <div className="routes-distance-error">
                    {errors.distancia_km}
                  </div>
                )}
            </div>

            {selectedOrigin &&
              selectedDestination &&
              !isSameLocation && (
                <div className="routes-form-preview">
                  <div>
                    <i className="bi bi-geo-alt-fill" />

                    <span>
                      {selectedOrigin.nombre}
                    </span>
                  </div>

                  <div className="routes-preview-connector">
                    <i className="bi bi-arrow-right" />

                    {formData.distancia_km && (
                      <small>
                        {formData.distancia_km} km
                      </small>
                    )}
                  </div>

                  <div>
                    <i className="bi bi-flag-fill" />

                    <span>
                      {selectedDestination.nombre}
                    </span>
                  </div>
                </div>
              )}
          </div>

          <footer className="routes-modal-footer">
            <span className="routes-modal-security-note">
              <i className="bi bi-shield-check" />
              La distancia no puede editarse manualmente.
            </span>

            <div>
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
                disabled={!canSubmit}
              >
                {isSaving ? (
                  <span className="spinner-border spinner-border-sm me-2" />
                ) : (
                  <i className="bi bi-check-lg me-2" />
                )}

                {submitText}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default RutaFormModal;
