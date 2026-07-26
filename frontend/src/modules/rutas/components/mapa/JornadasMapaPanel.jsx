import { useMemo, useState } from 'react';

import {
  IconButton,
  SelectField,
  SearchField,
} from '../../../../shared/ui';

import JornadaMapaCard from './JornadaMapaCard';

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function getMap(jornada) {
  return jornada?.mapa ?? jornada?.mapa_jornada ?? jornada ?? {};
}

const STATUS_OPTIONS = [
  { value: 'ACTIVAS', label: 'Activas' },
  { value: 'TODAS', label: 'Todas' },
  { value: 'PLANIFICADA', label: 'Planificadas' },
  { value: 'EN_RUTA', label: 'En ruta' },
  { value: 'FINALIZADA', label: 'Finalizadas' },
];

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

        <IconButton
          className="routes-map-refresh"
          tone="ghost"
          icon="bi bi-arrow-clockwise"
          label="Actualizar jornadas"
          loading={isRefreshing}
          onClick={onRefresh}
        />
      </header>

      <div className="routes-map-panel__filters">
        <SearchField
          className="routes-map-search"
          value={searchTerm}
          placeholder="Buscar jornada o camión..."
          aria-label="Buscar jornadas"
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          onClear={() => setSearchTerm('')}
        />

        <SelectField
          value={statusFilter}
          options={STATUS_OPTIONS}
          ariaLabel="Filtrar jornadas visibles"
          onChange={setStatusFilter}
        />
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

