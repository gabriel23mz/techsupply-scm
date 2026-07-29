import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function obtenerPerfilChofer() {
  const response = await api.get('/choferes/me');

  return unwrap(response);
}

export async function obtenerMisJornadas() {
  const response = await api.get('/jornadas-reparto/mis-jornadas');
  const data = unwrap(response);

  return Array.isArray(data) ? data : [];
}

export async function obtenerMiJornada(id) {
  const response = await api.get(`/jornadas-reparto/${id}`);

  return unwrap(response);
}

export async function iniciarMiJornada(id) {
  const response = await api.patch(`/jornadas-reparto/${id}/iniciar`);

  return unwrap(response);
}

export async function avanzarMiJornada(id) {
  const response = await api.patch(`/jornadas-reparto/${id}/avanzar`);

  return unwrap(response);
}

export async function finalizarMiJornada(id) {
  const response = await api.patch(`/jornadas-reparto/${id}/finalizar`);

  return unwrap(response);
}

export async function entregarMiDespacho(id) {
  const response = await api.patch(`/despachos/${id}/entregar`);

  return unwrap(response);
}

export async function marcarMiDespachoNoEntregado(id) {
  const response = await api.patch(`/despachos/${id}/no-entregado`);

  return unwrap(response);
}

const miJornadaService = {
  avanzarMiJornada,
  entregarMiDespacho,
  finalizarMiJornada,
  iniciarMiJornada,
  marcarMiDespachoNoEntregado,
  obtenerMiJornada,
  obtenerMisJornadas,
  obtenerPerfilChofer,
};

export default miJornadaService;
