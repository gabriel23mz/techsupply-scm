function RouteLoadingScreen() {
  return (
    <section
      className="route-loading-screen"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="route-loading-icon" aria-hidden="true">
        <i className="bi bi-boxes" />
      </span>

      <div>
        <span className="skeleton-line route-loading-line" />
        <span className="skeleton-line route-loading-line short" />
      </div>
    </section>
  );
}

export default RouteLoadingScreen;
