import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  FormField,
  Modal,
} from '../../../../shared/ui';

import {
  hasValidRouteCoordinates,
} from '../../rutaForm.utils';

import {
  calcularDistanciaVial,
} from '../../services/rutas.service';

const INITIAL_FORM = Object.freeze({
  origen_id: '',
  destino_id: '',
  distancia_km: '',
});

const IDLE_CALCULATION = Object.freeze({
  status: 'idle',
  message: 'Selecciona origen y destino para calcular la distancia.',
  tiempo_estimado_min: null,
});

const MANUAL_CALCULATION = Object.freeze({
  status: 'manual',
  message: 'Ingresa la distancia por carretera en kilómetros.',
  tiempo_estimado_min: null,
});

function buildInitialForm(mode, ruta) {
  if (mode !== 'edit' || !ruta) return INITIAL_FORM;

  return {
    origen_id: String(ruta.origen_id ?? ''),
    destino_id: String(ruta.destino_id ?? ''),
    distancia_km: String(ruta.distancia_km ?? ''),
  };
}

function buildInitialCalculation(mode, ruta) {
  const distance = Number(ruta?.distancia_km);

  if (mode === 'edit' && Number.isFinite(distance) && distance > 0) {
    return {
      status: 'success',
      message: 'Distancia vial registrada.',
      tiempo_estimado_min: null,
    };
  }

  return IDLE_CALCULATION;
}

function findLocation(ubicaciones, id) {
  return ubicaciones.find(
    (ubicacion) => Number(ubicacion.id) === Number(id),
  ) ?? null;
}

function findDuplicateRoute({
  destinoId,
  origenId,
  rutaId,
  rutas,
}) {
  return rutas.find((item) =>
    Number(item.id) !== Number(rutaId) &&
    Number(item.origen_id) === Number(origenId) &&
    Number(item.destino_id) === Number(destinoId),
  ) ?? null;
}

function RutaFormModal({
  isSaving,
  mode = 'create',
  onClose,
  onSave,
  open,
  ruta,
  rutas = [],
  ubicaciones = [],
}) {
  const [formData, setFormData] = useState(
    () => buildInitialForm(mode, ruta),
  );
  const [errors, setErrors] = useState({});
  const [automaticCalculation, setAutomaticCalculation] = useState(true);
  const [calculation, setCalculation] = useState(
    () => buildInitialCalculation(mode, ruta),
  );
  const controllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => {
    controllerRef.current?.abort();
    window.clearTimeout(timeoutRef.current);
  }, []);

  const selectedOrigin = useMemo(
    () => findLocation(ubicaciones, formData.origen_id),
    [formData.origen_id, ubicaciones],
  );

  const selectedDestination = useMemo(
    () => findLocation(ubicaciones, formData.destino_id),
    [formData.destino_id, ubicaciones],
  );

  const isSameLocation = Boolean(formData.origen_id) &&
    Boolean(formData.destino_id) &&
    Number(formData.origen_id) === Number(formData.destino_id);

  const duplicateRoute = useMemo(() => findDuplicateRoute({
    destinoId: formData.destino_id,
    origenId: formData.origen_id,
    rutaId: ruta?.id,
    rutas,
  }), [formData.destino_id, formData.origen_id, ruta?.id, rutas]);

  const selectionError = isSameLocation
    ? 'El origen y el destino deben ser diferentes.'
    : duplicateRoute
      ? 'Esta conexión ya se encuentra registrada.'
      : '';

  const cancelPendingCalculation = useCallback(() => {
    controllerRef.current?.abort();
    window.clearTimeout(timeoutRef.current);
    requestIdRef.current += 1;
  }, []);

  const performCalculation = useCallback(async ({
    destino,
    origen,
    requestId,
  }) => {
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const result = await calcularDistanciaVial({
        origen,
        destino,
        signal: controller.signal,
      });
      const distance = Number(result.distancia_km);

      if (
        controller.signal.aborted ||
        requestIdRef.current !== requestId
      ) {
        return;
      }

      if (!Number.isFinite(distance) || distance <= 0) {
        throw new Error('El servicio vial devolvió una distancia inválida.');
      }

      setFormData((current) => ({
        ...current,
        distancia_km: String(distance),
      }));
      setErrors((current) => ({
        ...current,
        distancia_km: '',
      }));
      setCalculation({
        status: 'success',
        message: 'Distancia vial calculada automáticamente.',
        tiempo_estimado_min: result.tiempo_estimado_min,
      });
    } catch (error) {
      if (
        controller.signal.aborted ||
        error?.code === 'ERR_CANCELED' ||
        requestIdRef.current !== requestId
      ) {
        return;
      }

      const message = error.message || 'No fue posible calcular la distancia.';
      setCalculation({
        status: 'error',
        message,
        tiempo_estimado_min: null,
      });
      setErrors((current) => ({
        ...current,
        distancia_km: message,
      }));
    }
  }, []);

  const prepareCalculation = useCallback((nextForm, delay = 350) => {
    cancelPendingCalculation();

    const origin = findLocation(ubicaciones, nextForm.origen_id);
    const destination = findLocation(ubicaciones, nextForm.destino_id);
    const sameLocation = Boolean(nextForm.origen_id) &&
      Boolean(nextForm.destino_id) &&
      Number(nextForm.origen_id) === Number(nextForm.destino_id);
    const duplicate = findDuplicateRoute({
      destinoId: nextForm.destino_id,
      origenId: nextForm.origen_id,
      rutaId: ruta?.id,
      rutas,
    });

    if (!origin || !destination) {
      setCalculation(IDLE_CALCULATION);
      return;
    }

    let validationMessage = '';

    if (sameLocation) {
      validationMessage = 'El origen y el destino deben ser diferentes.';
    } else if (duplicate) {
      validationMessage = 'Esta conexión ya se encuentra registrada.';
    } else if (
      !hasValidRouteCoordinates(origin) ||
      !hasValidRouteCoordinates(destination)
    ) {
      validationMessage =
        'Ambas ubicaciones deben tener latitud y longitud válidas.';
    }

    if (validationMessage) {
      setCalculation({
        status: 'error',
        message: validationMessage,
        tiempo_estimado_min: null,
      });
      setErrors((current) => ({
        ...current,
        distancia_km: validationMessage,
      }));
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setCalculation({
      status: 'calculating',
      message: 'Calculando recorrido por carretera...',
      tiempo_estimado_min: null,
    });

    timeoutRef.current = window.setTimeout(() => {
      void performCalculation({
        destino: destination,
        origen: origin,
        requestId,
      });
    }, delay);
  }, [cancelPendingCalculation, performCalculation, ruta?.id, rutas, ubicaciones]);

  const validateManualDistance = (value) => {
    const distance = Number(value);

    if (!Number.isFinite(distance) || distance <= 0) {
      return 'Ingresa una distancia mayor a cero.';
    }

    return '';
  };

  const updateLocation = (field, value) => {
    const nextForm = {
      ...formData,
      [field]: value,
      distancia_km: '',
    };

    setFormData(nextForm);
    setErrors((current) => ({
      ...current,
      [field]: '',
      distancia_km: '',
    }));

    if (automaticCalculation) {
      prepareCalculation(nextForm);
    } else {
      cancelPendingCalculation();
      setCalculation(MANUAL_CALCULATION);
    }
  };

  const updateManualDistance = (value) => {
    const sanitizedValue = value.replace(',', '.');
    const validationMessage = sanitizedValue
      ? validateManualDistance(sanitizedValue)
      : '';

    setFormData((current) => ({
      ...current,
      distancia_km: sanitizedValue,
    }));
    setErrors((current) => ({
      ...current,
      distancia_km: validationMessage,
    }));
    setCalculation({
      ...MANUAL_CALCULATION,
      message: validationMessage || MANUAL_CALCULATION.message,
    });
  };

  const runCalculation = () => {
    const nextForm = {
      ...formData,
      distancia_km: '',
    };

    setFormData(nextForm);
    setErrors((current) => ({
      ...current,
      distancia_km: '',
    }));
    prepareCalculation(nextForm, 0);
  };

  const changeCalculationMode = () => {
    const nextAutomaticValue = !automaticCalculation;
    setAutomaticCalculation(nextAutomaticValue);
    cancelPendingCalculation();
    setErrors((current) => ({
      ...current,
      distancia_km: '',
    }));

    if (nextAutomaticValue) {
      const nextForm = {
        ...formData,
        distancia_km: '',
      };

      setFormData(nextForm);
      prepareCalculation(nextForm, 0);
      return;
    }

    setCalculation(MANUAL_CALCULATION);
  };

  const distance = Number(formData.distancia_km);
  const validDistance = Number.isFinite(distance) && distance > 0;
  const validCalculation = automaticCalculation
    ? calculation.status === 'success'
    : validDistance;
  const canSubmit = !isSaving &&
    validCalculation &&
    Boolean(formData.origen_id) &&
    Boolean(formData.destino_id) &&
    !isSameLocation &&
    !duplicateRoute &&
    validDistance;

  const submit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      setErrors((current) => ({
        ...current,
        origen_id: formData.origen_id ? '' : 'Selecciona un origen.',
        destino_id: formData.destino_id ? '' : 'Selecciona un destino.',
        distancia_km: selectionError || (
          automaticCalculation
            ? calculation.message
            : validateManualDistance(formData.distancia_km)
        ),
      }));
      return;
    }

    onSave({
      origen_id: Number(formData.origen_id),
      destino_id: Number(formData.destino_id),
      distancia_km: distance,
    });
  };

  const locationOptions = ubicaciones.map((ubicacion) => ({
    value: ubicacion.id,
    label: ubicacion.nombre,
    icon: 'bi bi-geo-alt',
  }));

  const distanceError = selectionError || (
    automaticCalculation
      ? calculation.status === 'error' ? errors.distancia_km : ''
      : errors.distancia_km
  );
  const distanceSuccess = automaticCalculation && calculation.status === 'success'
    ? calculation.message
    : '';
  const distanceDescription = automaticCalculation
    ? ['idle', 'calculating'].includes(calculation.status)
      ? calculation.message
      : ''
    : !distanceError ? MANUAL_CALCULATION.message : '';

  return (
    <Modal
      open={open}
      title={mode === 'edit' ? 'Editar ruta' : 'Nueva ruta'}
      description="Define la conexión y calcula o registra su distancia por carretera."
      size="lg"
      closeOnBackdrop={!isSaving}
      closeOnEscape={!isSaving}
      onClose={isSaving ? undefined : onClose}
      footer={(
        <>
          <Button tone="secondary" disabled={isSaving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="route-form"
            icon="bi bi-check-lg"
            loading={isSaving}
            loadingLabel="Guardando"
            disabled={!canSubmit}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Crear ruta'}
          </Button>
        </>
      )}
    >
      <form id="route-form" className="routes-form" noValidate onSubmit={submit}>
        <button
          type="button"
          className="routes-calculation-mode"
          role="switch"
          aria-checked={automaticCalculation}
          onClick={changeCalculationMode}
        >
          <span
            className={[
              'routes-calculation-mode__switch',
              automaticCalculation ? 'is-active' : '',
            ].filter(Boolean).join(' ')}
            aria-hidden="true"
          >
            <span />
          </span>
          <span className="routes-calculation-mode__content">
            <strong>Cálculo automático</strong>
            <small>
              {automaticCalculation
                ? 'Activo: consulta el servicio vial al seleccionar las ubicaciones.'
                : 'Desactivado: puedes ingresar manualmente la distancia.'}
            </small>
          </span>
          <span className="routes-calculation-mode__state">
            {automaticCalculation ? 'Activo' : 'Manual'}
          </span>
        </button>

        <div className="routes-form-location-grid">
          <Combobox
            id="route-origin"
            label="Ubicación de origen"
            required
            value={formData.origen_id}
            options={locationOptions.map((option) => ({
              ...option,
              disabled: Number(option.value) === Number(formData.destino_id),
            }))}
            placeholder="Selecciona un origen"
            searchPlaceholder="Buscar origen"
            error={errors.origen_id}
            onChange={(value) => updateLocation('origen_id', value)}
          />
          <Combobox
            id="route-destination"
            label="Ubicación de destino"
            required
            value={formData.destino_id}
            options={locationOptions.map((option) => ({
              ...option,
              disabled: Number(option.value) === Number(formData.origen_id),
            }))}
            placeholder="Selecciona un destino"
            searchPlaceholder="Buscar destino"
            error={errors.destino_id}
            onChange={(value) => updateLocation('destino_id', value)}
          />
        </div>

        <FormField
          id="route-distance"
          label="Distancia por carretera"
          required
          error={distanceError}
          success={distanceSuccess}
          description={distanceDescription}
        >
          {({ id: fieldId, describedBy, invalid }) => (
            <div
              className={[
                'routes-distance-control',
                automaticCalculation ? 'is-automatic' : 'is-manual',
                invalid ? 'is-invalid' : '',
              ].filter(Boolean).join(' ')}
            >
              <i className="bi bi-signpost-split" aria-hidden="true" />
              <input
                id={fieldId}
                type={automaticCalculation ? 'text' : 'number'}
                min={automaticCalculation ? undefined : '0.01'}
                step={automaticCalculation ? undefined : '0.01'}
                inputMode={automaticCalculation ? undefined : 'decimal'}
                value={automaticCalculation && formData.distancia_km
                  ? `${formData.distancia_km} km`
                  : formData.distancia_km}
                placeholder={automaticCalculation
                  ? calculation.status === 'calculating'
                    ? 'Calculando distancia...'
                    : 'Se completará automáticamente'
                  : 'Ej. 24.50'}
                readOnly={automaticCalculation}
                aria-readonly={automaticCalculation}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={automaticCalculation
                  ? undefined
                  : (event) => updateManualDistance(event.target.value)}
              />
              {calculation.status === 'calculating' && (
                <span className="routes-distance-spinner" aria-hidden="true" />
              )}
              {!automaticCalculation && (
                <span className="routes-distance-unit" aria-hidden="true">km</span>
              )}
            </div>
          )}
        </FormField>

        {automaticCalculation &&
          calculation.status === 'success' &&
          calculation.tiempo_estimado_min && (
          <p className="routes-calculation-reference">
            <i className="bi bi-clock" aria-hidden="true" />
            Tiempo vial de referencia: {calculation.tiempo_estimado_min} min.
          </p>
        )}

        {automaticCalculation &&
          calculation.status === 'error' &&
          selectedOrigin &&
          selectedDestination &&
          !isSameLocation &&
          !duplicateRoute &&
          hasValidRouteCoordinates(selectedOrigin) &&
          hasValidRouteCoordinates(selectedDestination) && (
          <Button
            size="sm"
            tone="secondary"
            icon="bi bi-arrow-clockwise"
            onClick={runCalculation}
          >
            Reintentar cálculo
          </Button>
        )}
      </form>
    </Modal>
  );
}

export default RutaFormModal;
