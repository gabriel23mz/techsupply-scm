const TABS = [
  { id: 'catalogo', label: 'Catálogo', icon: 'bi-list-ul' },
  { id: 'mapa', label: 'Mapa general', icon: 'bi-map' },
];

function UbicacionesTabs({ activeTab, total, onChange }) {
  return (
    <nav className="locations-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          <i className={`bi ${tab.icon}`} />
          <span>{tab.label}</span>
          {tab.id === 'catalogo' && <b>{total}</b>}
        </button>
      ))}
    </nav>
  );
}

export default UbicacionesTabs;
