function ClientesBanner({
  isLoading = false,
  onRefresh,
}) {
  return (
    <section className="clients-banner">
      <div className="clients-banner__icon">
        <i className="bi bi-people" />
      </div>

      <div className="clients-banner__content">
        <div className="clients-banner__title">
          <strong>Directorio de clientes</strong>

          <span className="clients-banner__badge">
            Maestro comercial
          </span>
        </div>

        <p>
          Administra la información comercial, de contacto
          y ubicación de los clientes del sistema.
        </p>
      </div>

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
    </section>
  );
}

export default ClientesBanner;
