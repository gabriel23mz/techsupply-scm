const STEPS = [
  'Pedido',
  'Preparación',
  'Listo',
  'Despacho',
  'Entrega',
];

function PedidoFlowCard() {
  return (
    <article className="pedido-flow-card">
      <div>
        <span>Flujo operativo</span>
        <strong>
          Ciclo del pedido
        </strong>
      </div>

      <div className="pedido-flow">
        {STEPS.map(
          (step, index) => (
            <div
              className="pedido-flow-item"
              key={step}
            >
              <span
                className={
                  index <= 1
                    ? 'active'
                    : ''
                }
              >
                {step}
              </span>

              {index <
                STEPS.length - 1 && (
                <i className="bi bi-arrow-right-short" />
              )}
            </div>
          ),
        )}
      </div>
    </article>
  );
}

export default PedidoFlowCard;
