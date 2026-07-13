import api from '../../../shared/services/api';

export const obtenerClientes = async () => {
  const { data } = await api.get('/clientes');
  return data.data;
};

export const obtenerCliente = async (id) => {
  const { data } = await api.get(`/clientes/${id}`);
  return data.data;
};

export const crearCliente = async (payload) => {
  const { data } = await api.post('/clientes', payload);
  return data.data;
};

export const actualizarCliente = async (id, payload) => {
  const { data } = await api.put(`/clientes/${id}`, payload);
  return data.data;
};

export const desactivarCliente = async (id) => {
  const { data } = await api.delete(`/clientes/${id}`);
  return data.data;
};

export const obtenerUbicaciones = async () => {
  const { data } = await api.get('/ubicaciones');
  return data.data;
};

const clientesService = {
  obtenerClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
  obtenerUbicaciones,
};

export default clientesService;
