import { useState } from 'react';

import ConfirmDialog from '../../../shared/components/ConfirmDialog/ConfirmDialog';
import { showError, showSuccess } from '../../../shared/utils/toast';
import DespachoResumenModal from './DespachoResumenModal';
import {
  cancelarDespacho,
  entregarDespacho,
  iniciarDespacho,
} from '../services/logistica.service';

function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatDespachoId(id) {
  return `DSP-${String(id).padStart(4, '0')}`;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-EC').format(new Date(value));
}

function getClienteName(despacho) {
  return despacho.pedido?.cliente?.nombre || 'Cliente no disponible';
}

function DespachosGeneradosTable({ despachos, onRefresh }) {
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const openSummary = (despacho) => {
    setSelectedDespacho(despacho);
    setSummaryOpen(true);
  };

  const requestAction = (despacho, action) => {
    setSelectedDespacho(despacho);
    setConfirmAction(action);
  };

  const confirmCurrentAction = async () => {
    try {
      setIsProcessing(true);

      if (confirmAction === 'iniciar') {
        await iniciarDespacho(selectedDespacho.id);
        showSuccess('Despacho iniciado correctamente.');
      }

      if (confirmAction === 'entregar') {
        await entregarDespacho(selectedDespacho.id);
        showSuccess('Despacho marcado como entregado.');
      }

      if (confirmAction === 'cancelar') {
        await cancelarDespacho(selectedDespacho.id);
        showSuccess('Despacho cancelado correctamente.');
      }

      await onRefresh();
      setConfirmAction(null);
      setSelectedDespacho(null);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfirmTitle = () => {
    if (confirmAction === 'iniciar') return 'Iniciar ruta';
    if (confirmAction === 'entregar') return 'Marcar como entregado';
    return 'Cancelar despacho';
  };

  const getConfirmMessage = () => {
    if (!selectedDespacho) return '';

    if (confirmAction === 'iniciar') {
      return `¿Deseas iniciar la ruta del despacho ${formatDespachoId(selectedDespacho.id)}?`;
    }

    if (confirmAction === 'entregar') {
      return `¿Deseas marcar como entregado el despacho ${formatDespachoId(selectedDespacho.id)}?`;
    }

    return `¿Seguro que deseas cancelar el despacho ${formatDespachoId(selectedDespacho.id)}?`;
  };

  const renderActions = (despacho) => {
    if (despacho.estado === 'PENDIENTE') {
      return (
        <>
          <button type="button" title="Ver resumen" onClick={() => openSummary(despacho)}>
            <i className="bi bi-eye" />
          </button>

          <button type="button" title="Iniciar ruta" onClick={() => requestAction(despacho, 'iniciar')}>
            <i className="bi bi-play-circle" />
          </button>

          <button type="button" className="danger" title="Cancelar" onClick={() => requestAction(despacho, 'cancelar')}>
            <i className="bi bi-x-circle" />
          </button>
        </>
      );
    }

    if (despacho.estado === 'EN_TRANSITO') {
      return (
        <>
          <button
            type="button"
            title="Ver resumen"
            onClick={() => openSummary(despacho)}
          >
            <i className="bi bi-eye" />
          </button>

          <button
            type="button"
            title="Marcar entregado"
            onClick={() => requestAction(despacho, 'entregar')}
          >
            <i className="bi bi-check-circle" />
          </button>

          <button
            type="button"
            className="danger"
            title="Cancelar"
            onClick={() => requestAction(despacho, 'cancelar')}
          >
            <i className="bi bi-x-circle" />
          </button>
        </>
      );
    }

    return (
      <>
        <button type="button" title="Ver resumen" onClick={() => openSummary(despacho)}>
          <i className="bi bi-eye" />
        </button>

        <button type="button" className="disabled-action" disabled>
          <i className="bi bi-dash-lg" />
        </button>

        <button type="button" className="disabled-action" disabled>
          <i className="bi bi-dash-lg" />
        </button>
      </>
    );
  };

  if (!despachos.length) {
    return (
      <div className="logistics-empty-state">
        <i className="bi bi-truck" />
        <h4>No existen despachos generados</h4>
        <p>Los despachos creados aparecerán en esta sección.</p>
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
                    {renderActions(despacho)}
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

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={getConfirmTitle()}
        message={getConfirmMessage()}
        confirmText={isProcessing ? 'Procesando...' : 'Confirmar'}
        cancelText="Cancelar"
        variant={confirmAction === 'cancelar' ? 'danger' : 'info'}
        onConfirm={confirmCurrentAction}
        onCancel={() => {
          if (isProcessing) return;
          setConfirmAction(null);
          setSelectedDespacho(null);
        }}
      />
    </section>
  );
}

export default DespachosGeneradosTable;

