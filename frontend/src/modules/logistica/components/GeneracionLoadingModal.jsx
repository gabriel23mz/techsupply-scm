import {
  useEffect,
  useState,
} from 'react';

import {
  Modal,
} from '../../../shared/ui';

const MESSAGES = [
  'Consultando pedidos y capacidad disponible...',
  'Evaluando la distribución y el orden de entrega...',
  'Calculando recorridos para las jornadas...',
  'Persistiendo la planificación generada...',
];

function GeneracionLoadingModal() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => Math.min(current + 1, MESSAGES.length - 1));
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Modal
      open
      title="Generando jornadas"
      description="La ventana se cerrará cuando el backend responda."
      size="sm"
      closeOnBackdrop={false}
      closeOnEscape={false}
      onClose={undefined}
      className="journeys-generation-modal"
    >
      <div className="journeys-generation-state" aria-live="polite">
        <span className="journeys-generation-spinner" aria-hidden="true" />
        <strong>Planificación logística en proceso</strong>
        <p>{MESSAGES[messageIndex]}</p>
        <small>
          Los mensajes son orientativos; no representan un porcentaje ni un tiempo restante.
        </small>
      </div>
    </Modal>
  );
}

export default GeneracionLoadingModal;
