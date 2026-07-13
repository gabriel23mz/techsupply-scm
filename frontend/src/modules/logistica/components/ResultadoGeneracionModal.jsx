function formatJourneyCode(jornada) {
  return (
    jornada.codigo ||
    `JR-${String(jornada.id).padStart(5, '0')}`
  );
}

function formatDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return '0,00 km';
  }

  return `${new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(distance)} km`;
}

function formatDuration(minutes) {
  const totalMinutes = Number(minutes);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0 min';
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
}

function ResultadoGeneracionModal({
  open,
  resultado,
  onClose,
  onViewJourneys,
}) {
  if (!open || !resultado) {
    return null;
  }

  const jornadas = Array.isArray(resultado.jornadas)
    ? resultado.jornadas
    : [];

  const hasUnassignedOrders =
    Number(resultado.total_pedidos_no_asignados) > 0;

  const handleViewJourneys = () => {
    onClose();

    if (onViewJourneys) {
      onViewJourneys();
    }
  };

  return (
    <div
      className="logistics-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-result-title"
    >

      <section
        className="logistics-modal logistics-result-modal"
        aria-labelledby="generation-result-title"
      >
        <header className="logistics-result-header">
          <div className="logistics-modal-icon">
            <i className="bi bi-check-lg" />
          </div>

          <div className="logistics-result-heading">
            <span className="logistics-result-label">
              Proceso completado
            </span>

            <h4 id="generation-result-title">
              Jornadas generadas correctamente
            </h4>

            <p>
              La planificación fue procesada y almacenada
              correctamente.
            </p>
          </div>
        </header>

        <div className="logistics-result-content">
          <div className="logistics-result-metrics">
            <article>
              <i className="bi bi-signpost-split" />

              <strong>
                {resultado.total_jornadas ?? 0}
              </strong>

              <span>Jornadas</span>
            </article>

            <article>
              <i className="bi bi-truck" />

              <strong>
                {resultado.total_camiones_utilizados ?? 0}
              </strong>

              <span>Camiones</span>
            </article>

            <article>
              <i className="bi bi-box-seam" />

              <strong>
                {resultado.total_pedidos_asignados ?? 0}
              </strong>

              <span>Asignados</span>
            </article>

            <article
              className={
                hasUnassignedOrders
                  ? 'has-warning'
                  : ''
              }
            >
              <i className="bi bi-exclamation-circle" />

              <strong>
                {resultado.total_pedidos_no_asignados ?? 0}
              </strong>

              <span>Sin asignar</span>
            </article>
          </div>

          <div className="logistics-result-table-wrapper">
            <table className="table logistics-result-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Jornada</th>
                  <th>Camión</th>
                  <th>Pedidos</th>
                  <th>Puntos</th>
                  <th>Distancia</th>
                  <th>Tiempo</th>
                </tr>
              </thead>

              <tbody>
                {jornadas.map((jornada) => (
                  <tr key={jornada.id}>
                    <td>
                      <strong>
                        {formatJourneyCode(jornada)}
                      </strong>
                    </td>

                    <td>
                      CAM-
                      {String(jornada.camion_id).padStart(
                        3,
                        '0',
                      )}
                    </td>

                    <td>
                      {jornada.total_despachos ?? 0}
                    </td>

                    <td>
                      {jornada.total_puntos ?? 0}
                    </td>

                    <td>
                      {formatDistance(
                        jornada.distancia_total,
                      )}
                    </td>

                    <td>
                      {formatDuration(
                        jornada.tiempo_estimado,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasUnassignedOrders && (
            <div className="logistics-result-warning">
              <i className="bi bi-exclamation-triangle" />

              <span>
                Algunos pedidos no pudieron asignarse por falta
                de capacidad o disponibilidad de camiones.
              </span>
            </div>
          )}
        </div>

        <footer className="logistics-modal-actions logistics-result-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleViewJourneys}
          >
            <i className="bi bi-signpost-split me-2" />
            Ver jornadas
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ResultadoGeneracionModal;

