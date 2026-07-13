import { useMemo, useState } from 'react';

import JornadaMapaCard from './JornadaMapaCard';

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getMap(jornada) {
  return jornada?.mapa ?? jornada?.mapa_jornada ?? jornada ?? {};
}

function JornadasMapaPanel({
  jornadas,
  selectedJourneyId,
  onSelectJourney,
  onViewJourney,
  onRefresh,
  isRefreshing = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVAS');

  const filteredJourneys = useMemo(() => {
    const search = normalizeText(searchTerm);

    return jornadas.filter((jornada) => {
      const mapa = getMap(jornada);
      const camion = jornada?.camion ?? mapa?.camion ?? null;

      const matchesSearch =
        !search ||
        [
          jornada?.codigo,
          jornada?.id,
          camion?.codigo,
          camion?.placa,
          jornada?.estado,
        ].some((value) =>
          normalizeText(value).includes(search),
        );

      const matchesStatus =
        statusFilter === 'TODAS' ||
        (statusFilter === 'ACTIVAS' &&
          ['PLANIFICADA', 'EN_RUTA'].includes(jornada?.estado)) ||
        jornada?.estado === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jornadas, searchTerm, statusFilter]);

  return (
    <aside className="routes-map-panel">
      <header className="routes-map-panel__header">
        <div>
          <span>Seguimiento operativo</span>
          <h4>Jornadas visibles</h4>
        </div>

        <button
          type="button"
          className="routes-map-refresh"
          title="Actualizar jornadas"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          {isRefreshing ? (
            <span className="spinner-border spinner-border-sm" />
          ) : (
            <i className="bi bi-arrow-clockwise" />
          )}
        </button>
      </header>

      <div className="routes-map-panel__filters">
        <div className="routes-map-search">
          <i className="bi bi-search" />

          <input
            type="search"
            className="form-control form-control-sm"
            value={searchTerm}
            placeholder="Buscar jornada o camión..."
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setSearchTerm('')}
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>

        <select
          className="form-select form-select-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ACTIVAS">Activas</option>
          <option value="TODAS">Todas</option>
          <option value="PLANIFICADA">Planificadas</option>
          <option value="EN_RUTA">En ruta</option>
          <option value="FINALIZADA">Finalizadas</option>
        </select>
      </div>

      <div className="routes-map-panel__list">
        {filteredJourneys.length > 0 ? (
          filteredJourneys.map((jornada) => (
            <JornadaMapaCard
              key={jornada.id}
              jornada={jornada}
              selected={
                Number(selectedJourneyId) === Number(jornada.id)
              }
              onSelect={onSelectJourney}
              onView={onViewJourney}
            />
          ))
        ) : (
          <div className="routes-map-panel__empty">
            <i className="bi bi-truck" />
            <strong>No existen jornadas visibles</strong>
            <span>
              Las jornadas planificadas o en ruta aparecerán aquí.
            </span>
          </div>
        )}
      </div>

      <footer className="routes-map-panel__footer">
        Mostrando {filteredJourneys.length} de {jornadas.length} jornadas
      </footer>
    </aside>
  );
}

export default JornadasMapaPanel;

