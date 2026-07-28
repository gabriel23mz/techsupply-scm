const STEPS = [
  {
    title: 'Crear pedido',
    description:
      'Selecciona el cliente; la sesión define al responsable.',
    icon: 'bi-pencil-square',
  },
  {
    title: 'Abrir Workspace',
    description:
      'El pedido se crea como pendiente.',
    icon: 'bi-layout-text-window-reverse',
  },
  {
    title: 'Agregar productos',
    description:
      'El stock y total se actualizan automáticamente.',
    icon: 'bi-cart-plus',
  },
  {
    title: 'Enviar a preparación',
    description:
      'Bodega recibe el pedido y continúa el flujo operativo.',
    icon: 'bi-send-check',
  },
];

function PedidoProcessStepper() {
  return (
    <aside className="pedido-stepper-card">
      <header>
        <span>
          Continuidad del proceso
        </span>
        <h4>
          ¿Qué sucede después?
        </h4>
      </header>

      <div className="pedido-stepper">
        {STEPS.map(
          (step, index) => (
            <div
              className="pedido-step"
              key={step.title}
            >
              <div className="pedido-step-icon-wrapper">
                <div
                  className={`pedido-step-icon ${
                    index === 0
                      ? 'active'
                      : ''
                  }`}
                >
                  <i
                    className={`bi ${step.icon}`}
                  />
                </div>

                {index <
                  STEPS.length - 1 && (
                  <div className="pedido-step-line" />
                )}
              </div>

              <div>
                <strong
                  className={
                    index === 0
                      ? 'active'
                      : ''
                  }
                >
                  {step.title}
                </strong>

                <span>
                  {step.description}
                </span>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="pedido-stepper-note">
        <i className="bi bi-info-circle" />

        <span>
          El total no se escribe manualmente: se recalcula con
          cada producto del pedido.
        </span>
      </div>
    </aside>
  );
}

export default PedidoProcessStepper;
