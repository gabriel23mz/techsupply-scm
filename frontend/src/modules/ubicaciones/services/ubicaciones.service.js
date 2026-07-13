import api from '../../../shared/services/api';

export const obtenerUbicaciones = async () => {
  const { data } = await api.get('/ubicaciones');
  return data.data;
};

export const crearUbicacion = async (payload) => {
  const { data } = await api.post('/ubicaciones', payload);
  return data.data;
};

export const actualizarUbicacion = async (id, payload) => {
  const { data } = await api.put(`/ubicaciones/${id}`, payload);
  return data.data;
};

export const desactivarUbicacion = async (id) => {
  const { data } = await api.delete(`/ubicaciones/${id}`);
  return data.data;
};
