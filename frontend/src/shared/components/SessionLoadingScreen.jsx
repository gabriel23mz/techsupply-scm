function SessionLoadingScreen({ standalone = false }) {
  return (
    <main
      className={`session-loading-screen ${
        standalone ? 'standalone' : ''
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="spinner-border text-primary" />
      <h3>Validando sesión...</h3>
      <p>
        Comprobando usuario, rol y permisos vigentes.
      </p>
    </main>
  );
}

export default SessionLoadingScreen;
