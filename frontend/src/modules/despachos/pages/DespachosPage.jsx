import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  showError,
  showSuccess,
} from '../../../shared/utils/toast';

import DespachoDetailDrawer from '../components/DespachoDetailDrawer';
import DespachoMetrics from '../components/DespachoMetrics';
import DespachosPagination from '../components/DespachosPagination';
import DespachosTable from '../components/DespachosTable';
import DespachoToolbar from '../components/DespachoToolbar';

import {
  obtenerDespachoPorId,
  obtenerDespachos,
} from '../services/despacho.service';

import '../despachos.css';

const PAGE_SIZE = 10;

function getPedido(despacho) {
  return despacho?.Pedido ?? despacho?.pedido ?? null;
}

function getCliente(despacho) {
  const pedido = getPedido(despacho);

  return pedido?.Cliente ?? pedido?.cliente ?? null;
}

function getJornada(despacho) {
  return despacho?.jornada ?? despacho?.JornadaReparto ?? null;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function matchesDate(value, filter) {
  if (filter === 'TODAS') return true;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (filter === 'HOY') {
    return (
      date >= startToday &&
      date <
        new Date(startToday.getTime() + 86400000)
    );
  }

  if (filter === 'SEMANA') {
    const startWeek = new Date(startToday);

    startWeek.setDate(
      startToday.getDate() - startToday.getDay(),
    );

    return date >= startWeek;
  }

  if (filter === 'MES') {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
  }

  return true;
}

function DespachosPage() {
  const [despachos, setDespachos] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('TODOS');

  const [dateFilter, setDateFilter] =
    useState('TODAS');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedDespacho, setSelectedDespacho] =
    useState(null);

  const [drawerType, setDrawerType] =
    useState('summary');

  const [isDetailLoading, setIsDetailLoading] =
    useState(false);

  const cargarDespachos = useCallback(
    async ({ notify = false } = {}) => {
      try {
        setIsLoading(true);

        const data = await obtenerDespachos();

        setDespachos(data);

        if (notify) {
          showSuccess(
            'Despachos actualizados correctamente.',
          );
        }
      } catch (error) {
        console.error(
          'Error al cargar despachos:',
          error,
        );

        showError(
          error.message ||
            'No fue posible cargar los despachos.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    cargarDespachos();
  }, [cargarDespachos]);

  const filteredDespachos = useMemo(() => {
    const search = normalizeText(searchTerm);

    return despachos.filter((despacho) => {
      const pedido = getPedido(despacho);
      const cliente = getCliente(despacho);
      const jornada = getJornada(despacho);

      const matchesSearch =
        !search ||
        [
          despacho.id,
          despacho.pedido_id,
          `DSP-${String(despacho.id).padStart(5, '0')}`,
          `PED-${String(despacho.pedido_id).padStart(5, '0')}`,
          cliente?.nombre,
          pedido?.Usuario?.nombre,
          pedido?.Usuario?.apellido,
          jornada?.id,
          jornada?.id
            ? `JR-${String(jornada.id).padStart(5, '0')}`
            : null,
          despacho?.ruta_resumen?.destino,
        ].some((value) =>
          normalizeText(value).includes(search),
        );

      const matchesStatus =
        statusFilter === 'TODOS' ||
        despacho.estado === statusFilter;

      const matchesDateFilter = matchesDate(
        despacho.created_at ?? despacho.createdAt,
        dateFilter,
      );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateFilter
      );
    });
  }, [
    dateFilter,
    despachos,
    searchTerm,
    statusFilter,
  ]);

  const totalPages = Math.max(
    Math.ceil(
      filteredDespachos.length / PAGE_SIZE,
    ),
    1,
  );

  const paginatedDespachos = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredDespachos.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [currentPage, filteredDespachos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchTerm, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('TODOS');
    setDateFilter('TODAS');
  };

  const openDrawer = async (despacho, type) => {
    setDrawerType(type);
    setSelectedDespacho(despacho);
    setIsDetailLoading(true);

    try {
      const detail = await obtenerDespachoPorId(
        despacho.id,
      );

      setSelectedDespacho(
        detail ?? despacho,
      );
    } catch (error) {
      console.error(
        'Error al cargar detalle de despacho:',
        error,
      );

      showError(
        error.message ||
          'No fue posible cargar el detalle completo.',
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedDespacho(null);
    setIsDetailLoading(false);
  };

  const hasFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'TODOS' ||
    dateFilter !== 'TODAS';

  return (
    <div className="dispatch-page">
      <section className="dispatch-banner">
        <div className="dispatch-banner-icon">
          <i className="bi bi-truck" />
        </div>

        <div>
          <strong>
            Historial y seguimiento de despachos
          </strong>

          <span>
            Consulta los tramos individuales generados por
            las jornadas del Centro Logístico.
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          disabled={isLoading}
          onClick={() =>
            cargarDespachos({
              notify: true,
            })
          }
        >
          {isLoading ? (
            <span className="spinner-border spinner-border-sm me-2" />
          ) : (
            <i className="bi bi-arrow-clockwise me-2" />
          )}

          Actualizar
        </button>
      </section>

      <DespachoMetrics despachos={despachos} />

      <section className="dispatch-workspace">
        <DespachoToolbar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          isLoading={isLoading}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onDateChange={setDateFilter}
          onClear={clearFilters}
          onRefresh={() =>
            cargarDespachos({
              notify: true,
            })
          }
        />

        {isLoading ? (
          <div className="dispatch-loading">
            <span className="spinner-border text-primary" />

            <h4>Cargando despachos...</h4>

            <p>
              Consultando el historial logístico.
            </p>
          </div>
        ) : (
          <>
            <DespachosTable
              despachos={paginatedDespachos}
              hasFilters={hasFilters}
              onOpenSummary={(despacho) =>
                openDrawer(despacho, 'summary')
              }
              onOpenRoute={(despacho) =>
                openDrawer(despacho, 'route')
              }
              onClearFilters={clearFilters}
            />

            <DespachosPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDespachos.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      <DespachoDetailDrawer
        open={Boolean(selectedDespacho)}
        despacho={selectedDespacho}
        type={drawerType}
        isLoading={isDetailLoading}
        onClose={closeDrawer}
      />
    </div>
  );
}

export default DespachosPage;
