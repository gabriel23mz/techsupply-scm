import {
  Button,
} from '../../../../shared/ui';

function PedidoWorkspaceActions({
  canCancel,
  canStart,
  showStart,
  isWorking,
  onCancel,
  onStart,
}) {
  return (
    <>
      <div className="order-workspace-actions__right">
        {canCancel && (
          <Button
            tone="danger"
            icon="bi bi-slash-circle"
            disabled={isWorking}
            onClick={onCancel}
          >
            Cancelar pedido
          </Button>
        )}

        {showStart && (
          <Button
            tone="outline"
            icon="bi bi-send"
            disabled={!canStart || isWorking}
            title={
              canStart
                ? 'Enviar pedido a preparación'
                : 'Agrega al menos un producto antes de continuar'
            }
            onClick={onStart}
          >
            Enviar a preparación
          </Button>
        )}
      </div>
    </>
  );
}

export default PedidoWorkspaceActions;
