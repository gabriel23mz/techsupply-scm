import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function obtenerChoferes() {
  const response = await api.get('/choferes');
  const data = unwrap(response);

  return Array.isArray(data) ? data : [];
}

export async function obtenerChofer(id) {
  const response = await api.get(`/choferes/${id}`);

  return unwrap(response);
}

export async function obtenerChoferesDisponibles(fecha) {
  const response = await api.get('/choferes/disponibles', {
    params: fecha ? { fecha } : undefined,
  });
  const data = unwrap(response);

  return Array.isArray(data) ? data : [];
}

export async function crearChofer(payload) {
  const response = await api.post('/choferes', payload);

  return unwrap(response);
}

export async function actualizarChofer(id, payload) {
  const response = await api.put(`/choferes/${id}`, payload);

  return unwrap(response);
}

export async function desactivarChofer(id) {
  const response = await api.delete(`/choferes/${id}`);

  return unwrap(response);
}

export async function obtenerUsuarios() {
  const response = await api.get('/usuarios');
  const data = unwrap(response);

  return Array.isArray(data) ? data : [];
}

const choferesService = {
  actualizarChofer,
  crearChofer,
  desactivarChofer,
  obtenerChofer,
  obtenerChoferes,
  obtenerChoferesDisponibles,
  obtenerUsuarios,
};

export default choferesService;
