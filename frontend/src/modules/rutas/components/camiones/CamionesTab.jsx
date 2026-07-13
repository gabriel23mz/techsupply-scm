import {
  useMemo,
  useState,
  useEffect,
} from 'react';

import CamionResumenModal from './CamionResumenModal';
import CamionesTable from './CamionesTable';
import CamionesToolbar from './CamionesToolbar';
import RoutesPagination from '../RoutesPagination';

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function CamionesTab({
  camiones,
  isLoading,
  onRefresh,
  onViewJourney,
  onCenterMap,
}) {
  const [searchTerm, setSearchTerm] =
    useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('TODOS');

  const [
    capacityFilter,
    setCapacityFilter,
  ] = useState('TODOS');

  const [
    selectedTruck,
    setSelectedTruck,
  ] = useState(null);

  const filteredTrucks = useMemo(() => {
    const search =
      normalizeText(searchTerm);

    return camiones.filter((camion) => {
      const matchesSearch =
        !search ||
        [
          camion.codigo,
          camion.id,
          camion.placa,
          camion.estado,
          camion.jornada?.codigo,
          camion.jornada?.id,
        ].some((value) =>
          normalizeText(value).includes(
            search,
          ),
        );

      const matchesStatus =
        statusFilter === 'TODOS' ||
        camion.estado === statusFilter;

      const matchesCapacity =
        capacityFilter === 'TODOS' ||
        (capacityFilter ===
          'DISPONIBLE' &&
          Number(
            camion.capacidad_disponible,
          ) > 0) ||
        (capacityFilter ===
          'COMPLETA' &&
          Boolean(
            camion.capacidad_completa,
          ));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCapacity
      );
    });
  }, [
    camiones,
    capacityFilter,
    searchTerm,
    statusFilter,
  ]);

  
  const PAGE_SIZE = 10;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const totalPages = Math.max(
    Math.ceil(
      filteredTrucks.length / PAGE_SIZE,
    ),
    1,
  );

  const paginatedTrucks = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredTrucks.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [
    currentPage,
    filteredTrucks,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    capacityFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const totalCapacity = useMemo(
    () =>
      camiones.reduce(
        (total, camion) =>
          total +
          Number(
            camion.capacidad ?? 0,
          ),
        0,
      ),
    [camiones],
  );

  const assignedOrders = useMemo(
    () =>
      camiones.reduce(
        (total, camion) =>
          total +
          Number(
            camion.pedidos_asignados ??
              0,
          ),
        0,
      ),
    [camiones],
  );

  const availableCapacity = useMemo(
    () =>
      camiones.reduce(
        (total, camion) =>
          total +
          Number(
            camion.capacidad_disponible ??
              0,
          ),
        0,
      ),
    [camiones],
  );

  const trucksInWarehouse = useMemo(
    () =>
      camiones.filter(
        (camion) =>
          camion.estado ===
          'EN_BODEGA',
      ).length,
    [camiones],
  );

  const trucksOnRoute = useMemo(
    () =>
      camiones.filter(
        (camion) =>
          camion.estado ===
          'EN_RUTA',
      ).length,
    [camiones],
  );

  const handleViewJourney = (
    camion,
  ) => {
    setSelectedTruck(null);
    onViewJourney(camion);
  };

  const handleCenterMap = (camion) => {
    setSelectedTruck(null);
    onCenterMap(camion);
  };

  return (
    <section className="routes-trucks-tab">
      <div className="routes-tab-summary">
        <span>
          {filteredTrucks.length} de {camiones.length} camiones visibles
        </span>
      </div>

      <section className="routes-trucks-metrics">
        <article>
          <div className="routes-trucks-metric-icon primary">
            <i className="bi bi-truck" />
          </div>

          <div>
            <span>
              Camiones registrados
            </span>

            <strong>
              {camiones.length}
            </strong>

            <small>
              Flota total
            </small>
          </div>
        </article>

        <article>
          <div className="routes-trucks-metric-icon success">
            <i className="bi bi-building" />
          </div>

          <div>
            <span>
              Disponibles en bodega
            </span>

            <strong>
              {trucksInWarehouse}
            </strong>

            <small>
              Camiones en bodega
            </small>
          </div>
        </article>

        <article>
          <div className="routes-trucks-metric-icon warning">
            <i className="bi bi-sign-turn-right" />
          </div>

          <div>
            <span>
              Camiones en ruta
            </span>

            <strong>
              {trucksOnRoute}
            </strong>

            <small>
              Operación activa
            </small>
          </div>
        </article>

        <article>
          <div className="routes-trucks-metric-icon info">
            <i className="bi bi-box-seam" />
          </div>

          <div>
            <span>
              Capacidad disponible
            </span>

            <strong>
              {availableCapacity}
            </strong>

            <small>
              {assignedOrders} de{' '}
              {totalCapacity} asignados
            </small>
          </div>
        </article>
      </section>

      <CamionesToolbar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        capacityFilter={
          capacityFilter
        }
        isLoading={isLoading}
        onSearchChange={setSearchTerm}
        onStatusChange={
          setStatusFilter
        }
        onCapacityChange={
          setCapacityFilter
        }
        onRefresh={onRefresh}
      />

      <CamionesTable
        camiones={paginatedTrucks}
        onView={setSelectedTruck}
        onViewJourney={
          handleViewJourney
        }
        onCenterMap={
          handleCenterMap
        }
      />

      <RoutesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredTrucks.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      <CamionResumenModal
        open={Boolean(selectedTruck)}
        camion={selectedTruck}
        onClose={() =>
          setSelectedTruck(null)
        }
        onViewJourney={
          handleViewJourney
        }
        onCenterMap={
          handleCenterMap
        }
      />
    </section>
  );
}

export default CamionesTab;

