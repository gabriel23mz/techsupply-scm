import api from '../../../shared/services/api';

export const obtenerUsuarios = async () => {
  const { data } = await api.get('/usuarios');
  return data.data;
};

export const obtenerUsuario = async (id) => {
  const { data } = await api.get(`/usuarios/${id}`);
  return data.data;
};

export const crearUsuario = async (payload) => {
  const { data } = await api.post('/usuarios', payload);
  return data.data;
};

export const actualizarUsuario = async (id, payload) => {
  const { data } = await api.put(`/usuarios/${id}`, payload);
  return data.data;
};

export const desactivarUsuario = async (id) => {
  const { data } = await api.delete(`/usuarios/${id}`);
  return data.data;
};

const usuariosService = {
  obtenerUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  desactivarUsuario,
};

export default usuariosService;
