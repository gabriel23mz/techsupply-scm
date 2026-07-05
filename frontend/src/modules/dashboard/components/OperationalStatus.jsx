const steps = [
  { label: 'Pedidos registrados', detail: '124 unid.', icon: 'bi-clipboard-check', active: true },
  { label: 'Preparación', detail: '32 en picking', icon: 'bi-box-seam', active: true },
  { label: 'Listos despacho', detail: '45 paquetes', icon: 'bi-box2-heart', active: true },
  { label: 'Despacho activo', detail: '12 rutas', icon: 'bi-truck', active: false },
  { label: 'Entregado', detail: '89 finales', icon: 'bi-check-circle', active: false },
];

function OperationalStatus() {
  return (
    <section className="dashboard-card operational-status">
      <div className="section-header">
        <h4>Estado operativo en tiempo real</h4>
        <span>Filtro: Hoy</span>
      </div>

      <div className="status-flow">
        <div className="status-line" />
        <div className="status-line-active" />

        {steps.map((step) => (
          <div className="status-step" key={step.label}>
            <div className={step.active ? 'status-icon active' : 'status-icon'}>
              <i className={`bi ${step.icon}`} />
            </div>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OperationalStatus;

