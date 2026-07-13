function RutasBanner({
  isLoading = false,
  onRefresh,
}) {
  return (
    <section className="routes-banner">
      <div className="routes-banner__icon">
        <i className="bi bi-map" />
      </div>

      <div className="routes-banner__content">
        <strong>
          Monitoreo y red logística
        </strong>

        <span>
          Consulta recorridos, conexiones y
          disponibilidad de camiones dentro de la
          operación Outbound.
        </span>
      </div>

      <div className="routes-banner__actions">
        <span className="routes-banner__badge">
          <span />
          Operación Outbound
        </span>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          disabled={isLoading}
          onClick={onRefresh}
        >
          {isLoading ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : (
            <i className="bi bi-arrow-clockwise me-2" />
          )}

          Actualizar
        </button>
      </div>
    </section>
  );
}

export default RutasBanner;

