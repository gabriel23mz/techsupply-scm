import {
  useState,
} from 'react';

import DespachoResumenModal from './DespachoResumenModal';

function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatDespachoId(id) {
  return `DSP-${String(id).padStart(4, '0')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC').format(
    new Date(value),
  );
}

function getClienteName(despacho) {
  return despacho.pedido?.cliente?.nombre ||
    'Cliente no disponible';
}

function DespachosGeneradosTable({
  despachos,
}) {
  const [
    selectedDespacho,
    setSelectedDespacho,
  ] = useState(null);

  const [
    summaryOpen,
    setSummaryOpen,
  ] = useState(false);

  const openSummary = (despacho) => {
    setSelectedDespacho(despacho);
    setSummaryOpen(true);
  };

  if (!despachos.length) {
    return (
      <div className="logistics-empty-state">
        <i className="bi bi-truck" />
        <h4>No existen despachos generados</h4>
        <p>Los despachos creados por jornadas aparecerán en esta sección.</p>
      </div>
    );
  }

  return (
    <section className="logistics-table-card">
      <div className="table-responsive">
        <table className="table logistics-table align-middle mb-0">
          <thead>
            <tr>
              <th>Despacho</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Ruta</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {despachos.map((despacho) => (
              <tr key={despacho.id}>
                <td className="fw-bold text-primary">
                  {formatDespachoId(despacho.id)}
                </td>
                <td>{formatPedidoId(despacho.pedido_id)}</td>
                <td>{getClienteName(despacho)}</td>
                <td>{formatDate(despacho.created_at)}</td>
                <td>{despacho.ruta || 'Ruta no disponible'}</td>
                <td>
                  <span className={`logistics-status ${despacho.estado.toLowerCase()}`}>
                    {despacho.estado.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div className="logistics-row-actions">
                    <button
                      type="button"
                      title="Ver resumen"
                      onClick={() =>
                        openSummary(despacho)
                      }
                    >
                      <i className="bi bi-eye" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DespachoResumenModal
        open={summaryOpen}
        despacho={selectedDespacho}
        onClose={() => {
          setSummaryOpen(false);
          setSelectedDespacho(null);
        }}
      />
    </section>
  );
}

export default DespachosGeneradosTable;
