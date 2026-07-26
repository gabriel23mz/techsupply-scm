import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

function formatJourneyCode(id) {
  return `JR-${String(id).padStart(5, '0')}`;
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

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatStatus(status) {
  return String(status || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (character) =>
      character.toUpperCase(),
    );
}

function getStatusClass(status) {
  const statusClasses = {
    PLANIFICADA: 'planned',
    EN_RUTA: 'in-route',
    FINALIZADA: 'finished',
    CANCELADA: 'cancelled',
  };

  return statusClasses[status] || 'neutral';
}

function getTruckLabel(camion) {
  if (!camion) {
    return 'Camión no disponible';
  }

  return camion.codigo || `CAM-${camion.id}`;
}

function JornadasTable({
  jornadas,
  onView,
  onRecalculate,
  recalculatingId,
}) {
  if (!jornadas.length) {
    return (
      <div className="logistics-empty-state">
        <i className="bi bi-signpost-split" />
        <h4>No existen jornadas de reparto</h4>
        <p>
          Genera una planificación para asignar pedidos y rutas a los
          camiones disponibles.
        </p>
      </div>
    );
  }

  return (
    <section className="logistics-table-card">
      <div className="table-responsive">
        <table className="table logistics-table align-middle mb-0">
          <thead>
            <tr>
              <th>Jornada</th>
              <th>Camión</th>
              <th>Fecha</th>
              <th>Pedidos</th>
              <th>Progreso</th>
              <th>Distancia</th>
              <th>Tiempo</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {jornadas.map((jornada) => {
              const summary = jornada.resumen || {};
              const totalDispatches =
                Number(summary.total_despachos) || 0;

              const delivered =
                Number(summary.entregados) || 0;

              const notDelivered =
                Number(summary.no_entregados) || 0;

              const closedDispatches =
                delivered + notDelivered;

              const progress =
                totalDispatches > 0
                  ? Math.round(
                    (closedDispatches /
                        totalDispatches) *
                        100,
                  )
                  : 0;

              const isRecalculating =
                recalculatingId === jornada.id;

              return (
                <tr key={jornada.id}>
                  <td>
                    <strong className="text-primary">
                      {jornada.codigo ||
                        formatJourneyCode(jornada.id)}
                    </strong>

                    <span>
                      Punto actual:{' '}
                      {jornada.posicion_actual_orden ?? 0}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {getTruckLabel(jornada.camion)}
                    </strong>

                    <span>
                      {jornada.camion?.placa ||
                        'Sin placa'}
                    </span>
                  </td>

                  <td>{formatDate(jornada.fecha)}</td>

                  <td>
                    <strong>{totalDispatches}</strong>

                    <span>
                      {summary.total_puntos ?? 0} puntos
                    </span>
                  </td>

                  <td>
                    <div className="logistics-progress-summary">
                      <div className="logistics-progress-track">
                        <span
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <small>
                        {closedDispatches}/{totalDispatches}
                      </small>
                    </div>
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

                  <td>
                    <span
                      className={`logistics-status ${getStatusClass(
                        jornada.estado,
                      )}`}
                    >
                      {formatStatus(jornada.estado)}
                    </span>
                  </td>

                  <td>
                    <div className="logistics-row-actions justify-content-center">
                      <button
                        type="button"
                        title="Ver jornada"
                        onClick={() => onView(jornada)}
                      >
                        <i className="bi bi-eye" />
                      </button>

                      {jornada.estado ===
                        'PLANIFICADA' && (
                        <Can permission={PERMISSIONS.JORNADAS_RECALCULAR}>
                          <button
                            type="button"
                            title="Recalcular jornada"
                            disabled={isRecalculating}
                            onClick={() =>
                              onRecalculate(jornada)
                            }
                          >
                            {isRecalculating ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : (
                              <i className="bi bi-arrow-repeat" />
                            )}
                          </button>
                        </Can>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="logistics-pagination">
        <span>
          Mostrando {jornadas.length} jornada
          {jornadas.length === 1 ? '' : 's'}
        </span>

        <div>
          <button type="button" disabled>
            <i className="bi bi-chevron-left" />
          </button>

          <button type="button" className="active">
            1
          </button>

          <button type="button" disabled>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default JornadasTable;
