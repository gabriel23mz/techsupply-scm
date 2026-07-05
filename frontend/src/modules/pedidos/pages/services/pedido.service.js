import api from '@/shared/services/api';

export const getPedidos = () => api.get('/pedidos');

export const createPedido = (data) => api.post('/pedidos', data);


