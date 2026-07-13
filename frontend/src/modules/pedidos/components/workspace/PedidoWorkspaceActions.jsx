function PedidoWorkspaceActions({
  pedido,
  isWorking,
  onBack,
  onStart,
  onFinish,
  onCancel,
}) {
  const canStart =
    pedido.estado === 'PENDIENTE';

  const canFinish =
    [
      'PENDIENTE',
      'PREPARANDO',
    ].includes(pedido.estado);

  const canCancel =
    [
      'PENDIENTE',
      'PREPARANDO',
      'LISTO_PARA_DESPACHO',
    ].includes(pedido.estado);

  return (
    <section className="pedido-workspace-actions">
      <button
        type="button"
        className="btn btn-link pedido-back-link"
        onClick={onBack}
      >
        <i className="bi bi-arrow-left" />
        Volver al listado
      </button>

      <div className="pedido-actions-right">
        <div>
          {canCancel && (
            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={isWorking}
              onClick={onCancel}
            >
              <i className="bi bi-x-circle me-2" />
              Cancelar pedido
            </button>
          )}

          {canStart && (
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={isWorking}
              onClick={onStart}
            >
              <i className="bi bi-play-circle me-2" />
              Iniciar preparación
            </button>
          )}

          {canFinish && (
            <button
              type="button"
              className="btn btn-primary pedido-finish-btn"
              disabled={isWorking}
              onClick={onFinish}
            >
              <i className="bi bi-check2-circle me-2" />
              Finalizar preparación
            </button>
          )}
        </div>

        {canFinish && (
          <small>
            El pedido quedará como{' '}
            <strong>
              LISTO PARA DESPACHO
            </strong>
            .
          </small>
        )}
      </div>
    </section>
  );
}

export default PedidoWorkspaceActions;
