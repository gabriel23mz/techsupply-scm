import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export async function obtenerCamiones() {
  const response = await api.get('/camiones');
  const data = unwrap(response);

  return Array.isArray(data) ? data : [];
}

export async function obtenerCamion(id) {
  const response = await api.get(`/camiones/${id}`);

  return unwrap(response);
}

export async function crearCamion(payload) {
  const response = await api.post('/camiones', payload);

  return unwrap(response);
}

export async function actualizarCamion(id, payload) {
  const response = await api.put(`/camiones/${id}`, payload);

  return unwrap(response);
}

export async function desactivarCamion(id) {
  const response = await api.delete(`/camiones/${id}`);

  return unwrap(response);
}

const camionesService = {
  actualizarCamion,
  crearCamion,
  desactivarCamion,
  obtenerCamion,
  obtenerCamiones,
};

export default camionesService;
