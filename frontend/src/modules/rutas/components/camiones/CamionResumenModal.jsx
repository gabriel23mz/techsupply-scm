function formatTruckCode(camion) {
  if (camion?.codigo) {
    return camion.codigo;
  }

  return `CAM-${String(
    camion?.id ?? 0,
  ).padStart(3, '0')}`;
}

function formatJourneyCode(jornada) {
  if (!jornada) {
    return 'Sin jornada';
  }

  if (jornada.codigo) {
    return jornada.codigo;
  }

  return `JR-${String(
    jornada.id ?? 0,
  ).padStart(5, '0')}`;
}

function formatStatus(status) {
  return String(status ?? '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /^\w/,
      (character) =>
        character.toUpperCase(),
    );
}

function formatDistance(value) {
  const distance = Number(value);

  if (!Number.isFinite(distance)) {
    return '0,00 km';
  }

  return `${new Intl.NumberFormat(
    'es-EC',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(distance)} km`;
}

function formatDuration(value) {
  const totalMinutes = Number(value);

  if (
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return '0 min';
  }

  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes =
    totalMinutes % 60;

  if (!hours) {
    return `${minutes} min`;
  }

  if (!minutes) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function CamionResumenModal({
  open,
  camion,
  onClose,
  onViewJourney,
  onCenterMap,
}) {
  if (!open || !camion) {
    return null;
  }

  const capacidad = Number(
    camion.capacidad ?? 0,
  );

  const asignados = Number(
    camion.pedidos_asignados ?? 0,
  );

  const disponibles = Number(
    camion.capacidad_disponible ?? 0,
  );

  const porcentaje = Number(
    camion.porcentaje_ocupacion ?? 0,
  );

  return (
    <div className="routes-modal-overlay">
      <section className="routes-truck-modal">
        <header className="routes-modal-header">
          <div>
            <span>
              Resumen de camión
            </span>

            <h4>
              {formatTruckCode(camion)}
            </h4>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="routes-modal-body">
          <section className="routes-truck-modal__hero">
            <div className="routes-truck-modal__icon">
              <i className="bi bi-truck" />
            </div>

            <div>
              <span>Placa</span>

              <strong>
                {camion.placa ??
                  'Sin placa registrada'}
              </strong>

              <small>
                Estado:{' '}
                {formatStatus(
                  camion.estado,
                )}
              </small>
            </div>
          </section>

          <section className="routes-truck-modal__capacity">
            <div>
              <span>
                Ocupación actual
              </span>

              <strong>
                {asignados} de{' '}
                {capacidad} pedidos
              </strong>
            </div>

            <b>{porcentaje}%</b>

            <div className="routes-truck-capacity__track">
              <span
                className={
                  camion.capacidad_completa
                    ? 'full'
                    : ''
                }
                style={{
                  width: `${Math.min(
                    porcentaje,
                    100,
                  )}%`,
                }}
              />
            </div>
          </section>

          <section className="routes-truck-modal__grid">
            <article>
              <span>
                Capacidad máxima
              </span>

              <strong>
                {capacidad}
              </strong>

              <small>pedidos</small>
            </article>

            <article>
              <span>
                Pedidos asignados
              </span>

              <strong>
                {asignados}
              </strong>

              <small>pedidos</small>
            </article>

            <article>
              <span>
                Capacidad disponible
              </span>

              <strong>
                {disponibles}
              </strong>

              <small>espacios</small>
            </article>

            <article>
              <span>
                Estado
              </span>

              <strong>
                {formatStatus(
                  camion.estado,
                )}
              </strong>

              <small>
                estado actual
              </small>
            </article>
          </section>

          {camion.jornada ? (
            <section className="routes-truck-modal__journey">
              <header>
                <div>
                  <span>
                    Jornada asociada
                  </span>

                  <strong>
                    {formatJourneyCode(
                      camion.jornada,
                    )}
                  </strong>
                </div>

                <span className="routes-truck-journey-badge">
                  {formatStatus(
                    camion.jornada.estado,
                  )}
                </span>
              </header>

              <div className="routes-truck-modal__journey-grid">
                <div>
                  <span>
                    Despachos
                  </span>

                  <strong>
                    {camion.jornada
                      .total_despachos ??
                      asignados}
                  </strong>
                </div>

                <div>
                  <span>
                    Punto actual
                  </span>

                  <strong>
                    {camion.jornada
                      .posicion_actual_orden ??
                      0}
                  </strong>
                </div>

                <div>
                  <span>
                    Distancia
                  </span>

                  <strong>
                    {formatDistance(
                      camion.jornada
                        .distancia_total,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Tiempo
                  </span>

                  <strong>
                    {formatDuration(
                      camion.jornada
                        .tiempo_estimado,
                    )}
                  </strong>
                </div>
              </div>
            </section>
          ) : (
            <section className="routes-truck-modal__no-journey">
              <i className="bi bi-calendar-x" />

              <div>
                <strong>
                  Sin jornada asociada
                </strong>

                <span>
                  Este camión no tiene una jornada
                  planificada o en ruta.
                </span>
              </div>
            </section>
          )}
        </div>

        <footer className="routes-modal-footer">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          {camion.jornada && (
            <>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() =>
                  onCenterMap(camion)
                }
              >
                <i className="bi bi-crosshair me-2" />
                Centrar en mapa
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  onViewJourney(camion)
                }
              >
                Ver jornada
                <i className="bi bi-arrow-right ms-2" />
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

export default CamionResumenModal;

