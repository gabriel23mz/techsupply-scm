function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatDespachoId(id) {
  return `DSP-${String(id).padStart(4, '0')}`;
}

function DespachoResumenModal({ open, despacho, onClose }) {
  if (!open || !despacho) return null;

const rutaDetalle = despacho.ruta_detalle || [];

  return (
    <div className="logistics-modal-overlay">
      <section className="logistics-modal">
        <div className="logistics-modal-icon">
          <i className="bi bi-check-circle" />
        </div>

        <h4>Despacho generado correctamente</h4>
        <p>El backend completó la planificación logística del pedido.</p>

        <div className="logistics-modal-summary">
          <div>
            <span>Despacho</span>
            <strong>{formatDespachoId(despacho.id)}</strong>
          </div>

          <div>
            <span>Pedido asociado</span>
            <strong>{formatPedidoId(despacho.pedido_id)}</strong>
          </div>

          <div>
            <span>Cliente</span>
            <strong>{despacho.Pedido?.Cliente?.nombre}</strong>
          </div>

          <div>
            <span>Estado inicial</span>
            <strong>{despacho.estado}</strong>
          </div>

          <div>
            <span>Distancia total</span>
            <strong>{despacho.distancia_total} km</strong>
          </div>

          <div>
            <span>Tiempo estimado</span>
            <strong>{despacho.tiempo_estimado} min</strong>
          </div>
        </div>

        <div className="logistics-route-preview">
          <span>Ruta generada</span>
          <strong>
            {rutaDetalle.length
              ? rutaDetalle.map((punto) => punto.nombre).join(' → ')
              : 'Ruta no disponible'}
          </strong>
        </div>

        <div className="logistics-modal-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </section>
    </div>
  );
}

export default DespachoResumenModal;

