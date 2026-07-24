function PedidoWorkspaceActions({
  pedido,
  isWorking,
  onBack,
  onStart,
  onCancel,
}) {
  const canStart =
    pedido.estado === 'PENDIENTE';

  const canCancel =
    pedido.estado === 'PENDIENTE';

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
              Enviar a preparación
            </button>
          )}
        </div>

        {!canStart && (
          <small>
            El pedido está en modo solo lectura para Ventas.
          </small>
        )}
      </div>
    </section>
  );
}

export default PedidoWorkspaceActions;
