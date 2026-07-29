import {
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Combobox,
  EmptyState,
  LoadingState,
  Modal,
} from '../../../shared/ui';

function getDriverName(chofer) {
  const usuario = chofer?.usuario ?? null;

  return [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(' ') || `Chofer ${chofer?.id ?? ''}`;
}

function AsignarChoferModal({
  choferActual,
  choferes,
  isLoading,
  isSaving,
  jornada,
  onClose,
  onSave,
  open,
}) {
  const [choferId, setChoferId] = useState(
    () => String(choferActual?.id ?? ''),
  );

  const options = useMemo(() => choferes.map((chofer) => ({
    value: chofer.id,
    label: getDriverName(chofer),
    description: `${chofer.numero_licencia ?? 'Sin licencia'} · ${chofer.categoria_licencia ?? 'Sin categoría'}`,
    icon: 'bi bi-person-badge',
  })), [choferes]);

  const selectedId = Number(choferId);
  const unchanged = Number.isFinite(selectedId) &&
    selectedId === Number(choferActual?.id);

  return (
    <Modal
      open={open}
      title={choferActual ? 'Reasignar chofer' : 'Asignar chofer'}
      description={`Selecciona un chofer disponible para ${jornada?.codigo ?? `JR-${String(jornada?.id ?? '').padStart(5, '0')}`}.`}
      size="md"
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
            icon="bi bi-person-check"
            loading={isSaving}
            loadingLabel="Asignando"
            disabled={!choferId || unchanged || isLoading}
            onClick={() => onSave(selectedId)}
          >
            {choferActual ? 'Guardar reasignación' : 'Asignar chofer'}
          </Button>
        </>
      )}
    >
      {isLoading ? (
        <LoadingState label="Consultando choferes disponibles..." />
      ) : options.length > 0 ? (
        <div className="journey-driver-assignment">
          <Combobox
            id="journey-driver"
            label="Chofer disponible"
            required
            value={choferId}
            options={options}
            placeholder="Selecciona un chofer"
            searchPlaceholder="Buscar por nombre o licencia"
            description="Solo se muestran perfiles activos, con licencia vigente y sin otra jornada en conflicto."
            onChange={(value) => setChoferId(String(value ?? ''))}
          />

          {choferActual && (
            <p className="journey-driver-assignment__current">
              <i className="bi bi-info-circle" aria-hidden="true" />
              Chofer actual: <strong>{getDriverName(choferActual)}</strong>
            </p>
          )}
        </div>
      ) : (
        <EmptyState
          icon="bi bi-person-x"
          title="No hay choferes disponibles"
        >
          No existen perfiles activos y disponibles para la fecha de esta jornada.
        </EmptyState>
      )}
    </Modal>
  );
}

export default AsignarChoferModal;
