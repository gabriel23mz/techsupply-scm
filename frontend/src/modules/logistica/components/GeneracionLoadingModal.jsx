import { useEffect, useState } from 'react';

const MENSAJES_PLANIFICACION = [
  'Consultando pedidos listos para despacho...',
  'Verificando camiones disponibles y capacidades...',
  'Agrupando entregas por ubicación...',
  'Evaluando combinaciones de rutas...',
  'Optimizando la distribución entre camiones...',
  'Calculando recorridos por carretera...',
  'Preparando geometrías para el mapa...',
  'Guardando jornadas y despachos...',
  'Finalizando la planificación logística...',
];

function GeneracionLoadingModal({ open }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setMessageIndex((currentIndex) =>
        Math.min(
          currentIndex + 1,
          MENSAJES_PLANIFICACION.length - 1,
        ),
      );
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="logistics-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-loading-title"
    >
      <section className="logistics-modal logistics-generation-loading">
        <div className="logistics-loading-spinner">
          <span
            className="spinner-border"
            role="status"
            aria-hidden="true"
          />
        </div>

        <span className="logistics-loading-label">
          Asistente logístico
        </span>

        <h4 id="generation-loading-title">
          Generando planificación logística
        </h4>

        <p className="logistics-loading-message">
          {MENSAJES_PLANIFICACION[messageIndex]}
        </p>

        <div className="logistics-loading-progress">
          <span />
        </div>

        <small>
          Este proceso puede tardar algunos segundos. No cierres esta
          ventana.
        </small>
      </section>
    </div>
  );
}

export default GeneracionLoadingModal;