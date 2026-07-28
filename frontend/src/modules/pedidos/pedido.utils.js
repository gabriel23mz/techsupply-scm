export const ORDER_PAGE_SIZE = 10;

export const ORDER_STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PREPARANDO', label: 'En preparación' },
  { value: 'LISTO_PARA_DESPACHO', label: 'Listo para despacho' },
  { value: 'DESPACHADO', label: 'Despachado' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'REPROGRAMADO', label: 'Reprogramado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export const ORDER_DATE_OPTIONS = [
  { value: 'TODAS', label: 'Todas las fechas' },
  { value: 'HOY', label: 'Hoy' },
  { value: 'SEMANA', label: 'Esta semana' },
  { value: 'MES', label: 'Este mes' },
];

export function getOrderClient(pedido) {
  return pedido?.cliente ?? null;
}

export function getOrderUser(pedido) {
  return pedido?.usuario ?? null;
}

export function getOrderDetails(pedido) {
  const details = pedido?.detalles ?? [];
  return Array.isArray(details) ? details : [];
}

export function getDetailProduct(detalle) {
  return detalle?.producto ?? null;
}

export function formatOrderCode(id) {
  return `PED-${String(id ?? 0).padStart(5, '0')}`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value ?? 0));
}

export function formatDate(value, fallback = 'Sin fecha') {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
  }).format(date);
}

export function formatUser(usuario) {
  return [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(' ') || 'No disponible';
}

export function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

export function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function matchesOrderDate(value, filter) {
  if (filter === 'TODAS') return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const startToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (filter === 'HOY') {
    return (
      date >= startToday &&
      date < new Date(startToday.getTime() + 86400000)
    );
  }

  if (filter === 'SEMANA') {
    const startWeek = new Date(startToday);
    startWeek.setDate(startToday.getDate() - startToday.getDay());
    const endWeek = new Date(startWeek);
    endWeek.setDate(startWeek.getDate() + 7);
    return date >= startWeek && date < endWeek;
  }

  if (filter === 'MES') {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
  }

  return true;
}

export function buildReturnPath(location) {
  return `${location.pathname}${location.search}`;
}

export function getReturnPath(searchParams, fallback = '/pedidos') {
  const value = searchParams.get('returnTo');

  if (!value || !value.startsWith('/')) {
    return fallback;
  }

  return value;
}
