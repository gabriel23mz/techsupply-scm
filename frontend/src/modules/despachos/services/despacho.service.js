import api from '../../../shared/services/api';

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export const obtenerDespachos = async () => {
  const response = await api.get('/despachos');

  const data = unwrap(response);

  return Array.isArray(data) ? data : [];
};

export const obtenerDespachoPorId = async (id) => {
  const response = await api.get(`/despachos/${id}`);

  return unwrap(response);
};

const despachoService = {
  obtenerDespachos,
  obtenerDespachoPorId,
};

export default despachoService;
