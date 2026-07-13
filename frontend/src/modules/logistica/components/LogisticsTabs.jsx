function LogisticsTabs({
  activeTab,
  pedidosCount = 0,
  jornadasCount = 0,
  onChange,
}) {
  return (
    <div
      className="logistics-tabs"
      role="tablist"
      aria-label="Secciones del centro logístico"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'pedidos'}
        className={activeTab === 'pedidos' ? 'active' : ''}
        onClick={() => onChange('pedidos')}
      >
        <i className="bi bi-box-seam me-2" />
        Pedidos disponibles

        <span className="logistics-tab-count">
          {pedidosCount}
        </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'jornadas'}
        className={activeTab === 'jornadas' ? 'active' : ''}
        onClick={() => onChange('jornadas')}
      >
        <i className="bi bi-signpost-split me-2" />
        Jornadas de reparto

        <span className="logistics-tab-count">
          {jornadasCount}
        </span>
      </button>
    </div>
  );
}

export default LogisticsTabs;

