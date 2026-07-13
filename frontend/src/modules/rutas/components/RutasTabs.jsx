const TABS = [
  {
    id: 'mapa',
    label: 'Mapa general',
    icon: 'bi-map',
    countKey: 'jornadas',
  },
  {
    id: 'catalogo',
    label: 'Catálogo de rutas',
    icon: 'bi-signpost-split',
    countKey: 'rutas',
  },
  {
    id: 'camiones',
    label: 'Camiones',
    icon: 'bi-truck',
    countKey: 'camiones',
  },
];

function RutasTabs({
  activeTab,
  counts,
  onChange,
}) {
  return (
    <nav
      className="routes-tabs"
      role="tablist"
      aria-label="Secciones del módulo de rutas"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={
            activeTab === tab.id
              ? 'active'
              : ''
          }
          onClick={() => onChange(tab.id)}
        >
          <i className={`bi ${tab.icon}`} />

          <span>{tab.label}</span>

          <b>
            {counts?.[tab.countKey] ?? 0}
          </b>
        </button>
      ))}
    </nav>
  );
}

export default RutasTabs;

